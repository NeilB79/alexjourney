const API_BASE = '/api';

export const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const api = {
    login: async (username, password) => {
        const res = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!res.ok) throw new Error('Login failed');
        return res.json();
    },

    getUsers: async () => {
        const res = await fetch(`${API_BASE}/users`, { headers: getAuthHeader() });
        return res.json();
    },

    createUser: async (username, password) => {
        const res = await fetch(`${API_BASE}/users`, {
            method: 'POST',
            headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!res.ok) throw new Error('Failed to create user');
        return res.json();
    },

    getProject: async () => {
        const res = await fetch(`${API_BASE}/project`, { headers: getAuthHeader() });
        if (!res.ok) throw new Error('Failed to fetch project');
        return res.json();
    },

    updateProject: async (data: any) => {
        const res = await fetch(`${API_BASE}/project`, {
            method: 'POST',
            headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    uploadPhoto: async (projectId: string, dayKey: string, file: File) => {
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('projectId', projectId);
        formData.append('dayKey', dayKey);

        const res = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            headers: getAuthHeader(),
            body: formData
        });
        if (!res.ok) throw new Error('Upload failed');
        return res.json();
    },

    deletePhoto: async (id: string) => {
        await fetch(`${API_BASE}/photo/${id}`, {
            method: 'DELETE',
            headers: getAuthHeader()
        });
    },
    
    renderVideo: async (payload: any) => {
        const res = await fetch(`${API_BASE}/render`, {
            method: 'POST',
            headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Render failed');
        return res.json();
    }
};