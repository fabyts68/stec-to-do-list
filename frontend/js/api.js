const API_URL = 'http://localhost:3000/api/tasks';

const request = async (endpoint = '', options = {}) => {
    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
        ...options,
    };

    try {
        const response = await fetch(API_URL + endpoint, config);
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ message: 'Erro desconhecido na API' }));
            throw new Error(errorBody.message || `Erro HTTP: ${response.status}`);
        }
        if (response.status === 204) {
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error(`Falha na requisição para a API: ${error.message}`);
        throw error;
    }
};

export const fetchTasks = () => request();

export const createTask = (taskData) => request('', {
    method: 'POST',
    body: JSON.stringify(taskData),
});

export const updateTask = (id, updateData) => request(`/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
});

export const deleteTask = (id) => request(`/${id}`, {
    method: 'DELETE',
});

export const deleteCompletedTasks = () => request('/status/completed', {
    method: 'DELETE',
});