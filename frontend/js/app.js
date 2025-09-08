import * as api from './api.js';
import * as ui from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    
    const state = {
        tasks: [],
        taskToDelete: null,
    };

    let newTaskDatepicker;

    const refreshData = async () => {
        try {
            state.tasks = await api.fetchTasks();
            ui.updateDashboard(state.tasks);
            ui.updateAllViews(state.tasks);
        } catch (error) {
            ui.showToast('Falha ao carregar as tarefas. Verifique se o servidor backend está a correr.', 'danger');
        }
    };

    // --- CORREÇÃO 1: NAVEGAÇÃO INTELIGENTE PÓS-CRIAÇÃO ---
    const handleCreateTask = async (event) => {
        event.preventDefault();
        const titleInput = document.getElementById('new-task-title');
        const descriptionInput = document.getElementById('new-task-description');
        
        const title = titleInput.value.trim();
        if (!title) return;

        const description = descriptionInput.value.trim();
        const selectedDate = newTaskDatepicker.selectedDates[0];
        const due_date = selectedDate ? selectedDate.toISOString() : null;

        try {
            // A API agora retorna a tarefa criada para não precisarmos recarregar
            const newTask = await api.createTask({ title, description, due_date });
            
            titleInput.value = '';
            descriptionInput.value = '';
            newTaskDatepicker.clear();

            // Adiciona a nova tarefa ao estado local (muito mais rápido que refreshData)
            state.tasks.unshift(newTask);
            ui.updateDashboard(state.tasks);
            ui.updateAllViews(state.tasks);
            
            ui.showToast('Tarefa criada com sucesso!', 'success');
            
            // Leva o usuário para a tela onde a nova tarefa está
            ui.switchView('view-pending');

        } catch (error) {
            ui.showToast('Erro ao criar a tarefa.', 'danger');
        }
    };

    const handleToggleTask = async (id) => {
        const task = state.tasks.find(t => t.id === id);
        if (!task) return;
        const newStatus = task.status === 'pendente' ? 'concluída' 'pendente';
        try {
            await api.updateTask(id, { status: newStatus });
            task.status = newStatus; 
            ui.updateAllViews(state.tasks);
            ui.updateDashboard(state.tasks);

            const message = newStatus === 'concluída' ? 'Tarefa concluída! 🎉' : 'Tarefa marcada como pendente.';
            ui.showToast(message, 'success');

        } catch (error) {
            ui.showToast('Erro ao atualizar o status.', 'danger');
        }
    };

    // --- CORREÇÃO 2: NAVEGAÇÃO INTELIGENTE PÓS-LIMPEZA ---
    const handleDeleteTask = async () => {
        if (!state.taskToDelete) return;
        try {
            if (state.taskToDelete === 'completed') {
                await api.deleteCompletedTasks();
                state.tasks = state.tasks.filter(task => task.status !== 'concluída');
                ui.showToast('Tarefas concluídas foram limpas!', 'success');
                ui.showConfetti();
                
                // Leva o usuário de volta para a tela principal, já que a atual está vazia
                ui.switchView('view-main');
            } else {
                const idToDelete = state.taskToDelete;
                await api.deleteTask(idToDelete);
                state.tasks = state.tasks.filter(task => task.id !== idToDelete);
                ui.showToast('Tarefa excluída.', 'info');
            }
            ui.updateDashboard(state.tasks);
            ui.updateAllViews(state.tasks);

        } catch (error) {
            ui.showToast('Erro ao excluir.', 'danger');
            await refreshData();
        } finally {
            ui.hideModal();
            state.taskToDelete = null;
        }
    };

    const handleEditTask = (id, element, field) => {
        const task = state.tasks.find(t => t.id === id);
        const originalValue = task[field] || '';

        if (field === 'due_date') {
            const fp = flatpickr(element, {
                locale: 'pt',
                enableTime: true,
                dateFormat: "Z",
                defaultDate: task.due_date,
                onClose: async (selectedDates) => {
                    const newValue = selectedDates[0] ? selectedDates[0].toISOString() : null;
                    if (newValue !== originalValue) {
                        try {
                           await api.updateTask(id, { due_date: newValue });
                           ui.showToast('Data da tarefa atualizada!', 'warning');
                           await refreshData();
                        } catch(error) {
                           ui.showToast('Erro ao salvar a data.', 'danger');
                        }
                    }
                }
            });
            fp.open();
            return;
        }

        const input = document.createElement(field === 'description' ? 'textarea' : 'input');
        input.value = originalValue;
        element.replaceWith(input);
        input.focus();

        const save = async () => {
            const newValue = input.value.trim();
            if (newValue !== originalValue) {
                try {
                    await api.updateTask(id, { [field]: newValue });
                    ui.showToast('Tarefa atualizada com sucesso!', 'warning');
                } catch(error) {
                    ui.showToast('Erro ao salvar alteração.', 'danger');
                }
            }
            await refreshData();
        };
        
        input.addEventListener('blur', save);
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter' && field !== 'description') input.blur();
            if (e.key === 'Escape') refreshData();
        });
    };

    const init = () => {
        ui.registerEventListeners({
            onToggleTask: handleToggleTask,
            onDeleteTask: (id) => {
                state.taskToDelete = id;
                ui.showModal({ title: 'Confirmar Exclusão', message: 'Tem a certeza que deseja excluir esta tarefa?' });
            },
            onEditTask: handleEditTask,
        });

        // O calendário já estava correto, mantivemos a configuração
        newTaskDatepicker = flatpickr("#new-task-date", {
            locale: 'pt',
            enableTime: true,
            altInput: true,
            altFormat: "d/m/Y H:i",
            dateFormat: "Z",
        });

        document.getElementById('task-form').addEventListener('submit', handleCreateTask);
        document.getElementById('confirm-delete-btn').addEventListener('click', handleDeleteTask);
        document.getElementById('cancel-delete-btn').addEventListener('click', ui.hideModal);
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => ui.switchView(`view-${item.dataset.view}`));
        });
        
        const clearBtn = document.getElementById('clear-completed-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                state.taskToDelete = 'completed';
                ui.showModal({ title: 'Limpar Concluídas', message: 'Tem a certeza que deseja excluir todas as tarefas concluídas?' });
            });
        }

        refreshData();
        setInterval(refreshData, 60000);
    };

    init();
});