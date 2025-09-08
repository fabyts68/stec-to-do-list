Desafio To-Do List - Stec Inteligência Artificial
Aplicação web de "To-Do List" desenvolvida como parte do Desafio de Desenvolvimento proposto pela Stec Inteligência Artificial.

Visão Geral do Projeto
Este projeto consiste em uma aplicação "To-Do List" full-stack, com um backend em Node.js que serve uma API RESTful e um frontend em JavaScript puro (Vanilla JS) que consome essa API. O objetivo foi criar um gerenciador de tarefas completo, seguindo todos os requisitos funcionais e técnicos especificados no desafio.

Tecnologias Utilizadas
Backend:

Node.js com Express: Para a criação do servidor e da API RESTful.

SQLite: Como banco de dados SQL para a persistência das tarefas.

CORS: Para permitir a comunicação entre o frontend e o backend.

express-validator: Para validação e sanitização dos dados recebidos pela API.

Frontend:

HTML5, CSS3 e JavaScript (Vanilla JS): Para a construção da interface e da lógica do cliente, sem a utilização de frameworks.

Flatpickr: Uma biblioteca leve para a seleção de datas e horários.

Font Awesome: Para os ícones da interface.

Funcionalidades Implementadas (CRUD)
A aplicação cumpre todos os requisitos de um CRUD (Create, Read, Update, Delete) de tarefas:

Create: Permite a criação de novas tarefas com Título (obrigatório), Descrição (opcional) e Data de Vencimento (opcional).

Read: Lista todas as tarefas, com uma distinção visual clara entre tarefas pendentes e concluídas, além de uma seção para tarefas vencidas.

Update:

Permite a edição do Título e da Descrição diretamente na interface do usuário.

Permite a alteração do Status da tarefa (pendente/concluída) com um clique.

Delete: Permite a remoção individual de tarefas e a exclusão de todas as tarefas concluídas de uma só vez.

Como Executar o Projeto Localmente
Pré-requisitos:

Node.js e npm instalados.

Passos:

Clone o repositório:

Bash

git clone https://github.com/fabyts68/stec-to-do-list.git
cd stec-to-do-list
Instale as dependências e inicie o backend:

Bash

cd backend
npm install
npm start
O servidor estará rodando em http://localhost:3000.

Abra o frontend:
Navegue até a pasta frontend e abra o arquivo index.html em seu navegador de preferência.