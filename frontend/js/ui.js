let listeners = {};

export const registerEventListeners = (eventListeners) => {
    listeners = eventListeners;
};

const formatTimeAgo = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;

    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffTime < 0) {
        if (Math.abs(diffDays) < 1) return 'Venceu hoje';
        if (Math.abs(diffDays) === 1) return 'Venceu ontem';
        return `Venceu há ${Math.abs(diffDays)} dias`;
    } else {
        if (diffDays < 1) return 'Vence hoje';
        if (diffDays === 1) return 'Vence amanhã';
        return `Vence em ${diffDays} dias`;
    }
};

const createTaskElement = (task) => {
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';
    if (task.status === 'concluída') {
        taskItem.classList.add('completed');
    }

    const countdownText = formatTimeAgo(task.due_date);
    const isOverdue = countdownText && countdownText.startsWith('Venceu');
    let dateDisplay = 'Adicionar data';

    if (task.due_date) {
        const date = new Date(task.due_date);
        if (!isNaN(date)) {
            dateDisplay = date.toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        }
    }

    taskItem.innerHTML = `
        <div class="checkbox" title="Marcar como ${task.status === 'pendente' ? 'concluída' : 'pendente'}">
            <i class="fa-solid fa-check"></i>
        </div>
        <div class="task-info">
            <h3 data-field="title">${task.title}</h3>
            <p data-field="description">${task.description || 'Adicionar descrição'}</p>
            <div class="date-info">
                <small data-field="due_date">${dateDisplay}</small>
                ${countdownText ? `<small class="${isOverdue ? 'overdue-text' : ''}">${countdownText}</small>` : ''}
            </div>
        </div>
        <button class="delete-btn" title="Excluir tarefa"><i class="fa-solid fa-trash-can"></i></button>
    `;

    taskItem.querySelector('.checkbox').addEventListener('click', () => listeners.onToggleTask(task.id));
    taskItem.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        listeners.onDeleteTask(task.id);
    });
    
    ['title', 'description', 'due_date'].forEach(field => {
        const element = taskItem.querySelector(`[data-field="${field}"]`);
        element.addEventListener('click', () => listeners.onEditTask(task.id, element, field));
    });

    return taskItem;
};

const renderTaskList = (container, tasks) => {
    container.innerHTML = '';
    if (tasks.length === 0) {
        container.innerHTML = `<div class="empty-state">Nenhuma tarefa aqui.</div>`;
        return;
    }
    tasks.forEach(task => container.appendChild(createTaskElement(task)));
};

// Dentro do arquivo ui.js, substitua a função updateAllViews por esta:
export const updateAllViews = (tasks) => {
    const allPending = tasks.filter(t => t.status === 'pendente');
    const completed = tasks.filter(t => t.status === 'concluída');
    
    // 1. Primeiro, separamos as tarefas vencidas das pendentes.
    const overdue = allPending.filter(t => t.due_date && new Date(t.due_date) < new Date());

    // 2. Agora, a lista de pendentes é composta por todas as pendentes MENOS as que já estão vencidas.
    const pending = allPending.filter(t => !overdue.some(overdueTask => overdueTask.id === t.id));

    // Renderiza cada lista no seu respectivo container
    renderTaskList(document.getElementById('pending-tasks-container'), pending);
    renderTaskList(document.getElementById('completed-tasks-container'), completed);
    renderTaskList(document.getElementById('overdue-tasks-container'), overdue);

    const badge = document.getElementById('overdue-count-badge');
    badge.textContent = overdue.length;
    badge.style.display = overdue.length > 0 ? 'inline-block' : 'none';
};

export const updateDashboard = (tasks) => {
    const pendingCount = tasks.filter(t => t.status === 'pendente').length;
    const completedCount = tasks.filter(t => t.status === 'concluída').length;
    document.getElementById('dashboard').innerHTML = `
        <div class="stat-card">
            <div class="icon"><i class="fa-solid fa-list-check"></i></div>
            <div class="stat-info">
                <span class="stat-number">${pendingCount}</span>
                <span class="stat-label">Pendentes</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="icon"><i class="fa-solid fa-check-double"></i></div>
            <div class="stat-info">
                <span class="stat-number">${completedCount}</span>
                <span class="stat-label">Concluídas</span>
            </div>
        </div>
    `;
};

export const switchView = (viewId) => {
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');

    const mainHeader = document.getElementById('main-header-title');
    const navItem = document.querySelector(`.nav-item[data-view="${viewId.replace('view-', '')}"]`);
    if (mainHeader && navItem) {
        mainHeader.textContent = navItem.querySelector('span').textContent;
    }

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.view === viewId.replace('view-', ''));
    });
};

export const showModal = (options) => {
    document.getElementById('modal-title').textContent = options.title;
    document.getElementById('modal-message').textContent = options.message;
    document.getElementById('delete-modal').classList.add('visible');
};

export const hideModal = () => {
    document.getElementById('delete-modal').classList.remove('visible');
};

export const showToast = (message, type = 'success') => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};

export const showConfetti = () => {
    const confettiContainer = document.body;
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.left = `${Math.random() * 100}vw`;
        confetti.style.top = `${Math.random() * -100}vh`;
        confetti.style.width = `${Math.random() * 10 + 5}px`;
        confetti.style.height = confetti.style.width;
        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 70%)`;
        confetti.style.opacity = '1';
        confetti.style.borderRadius = '50%';
        confetti.style.transition = 'all 2s ease-out';
        confetti.style.zIndex = '9999';
        confettiContainer.appendChild(confetti);

        setTimeout(() => {
            confetti.style.transform = `translateY(${window.innerHeight + 100}px) rotateZ(${Math.random() * 360}deg)`;
            confetti.style.opacity = '0';
        }, 50);

        setTimeout(() => {
            confetti.remove();
        }, 2050);
    }
};