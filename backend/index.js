const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { body, validationResult } = require('express-validator');

// --- 1. CONFIGURAÇÃO INICIAL ---
const app = express();
const PORT = 3000;

// --- 2. BANCO DE DADOS ---
const db = new sqlite3.Database('./tasks.db', (err) => {
    if (err) {
        console.error("ERRO FATAL: Não foi possível conectar ao banco de dados.", err.message);
        throw err;
    }
    console.log('Backend > Banco de dados conectado com sucesso.');
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'pendente',
        due_date TEXT
    )`, (err) => {
        if (err) console.error("Backend > Erro ao criar tabela:", err.message);
        else console.log("Backend > Tabela 'tasks' verificada e pronta.");
    });
});

// --- 3. REPOSITÓRIO (LÓGICA DO BANCO DE DADOS) ---
const repository = {
    findAll: () => new Promise((resolve, reject) => {
        db.all('SELECT * FROM tasks ORDER BY id DESC', [], (err, rows) => err ? reject(err) : resolve(rows));
    }),
    findById: (id) => new Promise((resolve, reject) => {
        db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => err ? reject(err) : resolve(row));
    }),
    // ATUALIZADO: Agora aceita descrição e data de vencimento na criação.
    create: (task) => new Promise((resolve, reject) => {
        const sql = 'INSERT INTO tasks (title, description, due_date) VALUES (?, ?, ?)';
        const params = [task.title, task.description || null, task.due_date || null];
        db.run(sql, params, function (err) {
            err ? reject(err) : resolve({ id: this.lastID });
        });
    }),
    update: (id, task) => new Promise((resolve, reject) => {
        const fields = Object.keys(task).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(task), id];
        db.run(`UPDATE tasks SET ${fields} WHERE id = ?`, values, function (err) {
            err ? reject(err) : resolve({ changes: this.changes });
        });
    }),
    delete: (id) => new Promise((resolve, reject) => {
        db.run('DELETE FROM tasks WHERE id = ?', [id], function (err) {
            err ? reject(err) : resolve({ changes: this.changes });
        });
    }),
    deleteCompleted: () => new Promise((resolve, reject) => {
        db.run("DELETE FROM tasks WHERE status = 'concluída'", [], function (err) {
            err ? reject(err) : resolve({ changes: this.changes });
        });
    })
};

// --- 4. VALIDADORES (REGRAS) ---
const rules = {
    // ATUALIZADO: Adiciona validação opcional para os novos campos.
    create: [ 
        body('title').trim().notEmpty().withMessage('O título é obrigatório.'),
        body('description').optional({ nullable: true }).isString(),
        body('due_date').optional({ nullable: true }).isISO8601()
    ],
    update: [
        body('title').optional().trim().notEmpty().withMessage('O título não pode ser vazio.'),
        body('status').optional().isIn(['pendente', 'concluída']),
        body('due_date').optional({ nullable: true }).isISO8601()
    ]
};

// --- 5. CONTROLADORES (AÇÕES DA API) ---
const controller = {
    getAll: async (req, res) => {
        try {
            const tasks = await repository.findAll();
            res.status(200).json(tasks);
        } catch (e) { res.status(500).json({ message: "Erro ao buscar tarefas." }); }
    },
    create: async (req, res) => {
        if (!validationResult(req).isEmpty()) return res.status(400).json({ message: "Dados inválidos." });
        try {
            const { id } = await repository.create(req.body);
            const newTask = await repository.findById(id);
            res.status(201).json(newTask);
        } catch (e) { res.status(500).json({ message: "Erro ao criar tarefa." }); }
    },
    update: async (req, res) => {
        if (!validationResult(req).isEmpty()) return res.status(400).json({ message: "Dados inválidos." });
        try {
            const { changes } = await repository.update(req.params.id, req.body);
            if (changes === 0) return res.status(404).json({ message: 'Tarefa não encontrada.' });
            const updatedTask = await repository.findById(req.params.id);
            res.status(200).json(updatedTask);
        } catch (e) { res.status(500).json({ message: "Erro ao atualizar tarefa." }); }
    },
    delete: async (req, res) => {
        try {
            const { changes } = await repository.delete(req.params.id);
            if (changes === 0) return res.status(404).json({ message: 'Tarefa não encontrada.' });
            res.status(204).send();
        } catch (e) { res.status(500).json({ message: "Erro ao apagar tarefa." }); }
    },
    deleteCompleted: async (req, res) => {
        try {
            await repository.deleteCompleted();
            res.status(204).send();
        } catch (e) { res.status(500).json({ message: "Erro ao apagar tarefas concluídas." }); }
    }
};

// --- 6. ROTAS (ENDEREÇOS DA API) ---
const router = express.Router();
router.get('/', controller.getAll);
router.post('/', rules.create, controller.create);
router.put('/:id', rules.update, controller.update);
router.delete('/:id', controller.delete);
router.delete('/status/completed', controller.deleteCompleted);

// --- 7. SERVIDOR ---
app.use(cors());
app.use(express.json());
app.use('/api/tasks', router);

app.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`  🚀 SERVIDOR NO AR E A OUVIR NA PORTA ${PORT} 🚀`);
    console.log(`=================================================\n`);
});