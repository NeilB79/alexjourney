import { Project, RenderSettings, SelectedItem, UserProfile } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

const API_BASE = '/api';

export const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Helper for timeout
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 3000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
};

// MOCK DATA STORE (In-Memory for session)
let MOCK_PROJECT: Project = {
    id: 'p_mock',
    name: 'Family Memories (Demo)',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    isOngoing: false,
    selections: {},
    settings: DEFAULT_SETTINGS
};

const isMock = () => localStorage.getItem('token') === 'mock-token';

export const api = {
    login: async (username, password, forceMock = false) => {
        // Force Mock or Fallback Logic
        const useMock = async () => {
             // Simulate network delay
             await new Promise(r => setTimeout(r, 600));
             
             if (username === 'neil' && password === 'neil') {
                return {
                    token: 'mock-token',
                    user: { 
                        id: 'u_admin', 
                        name: 'neil', 
                        role: 'admin', 
                        avatar: 'N', 
                        color: 'blue' 
                    },
                    settings: {
                        startDate: '2025-01-01',
                        endDate: '2025-12-31',
                        isOngoing: false,
                        themePref: 'dark',
                        videoSettings: DEFAULT_SETTINGS
                    }
                };
            }
            throw new Error('Invalid credentials (Demo: try neil/neil)');
        };

        if (forceMock) {
            console.log("Debug: Forcing Mock Login");
            return useMock();
        }

        try {
            // Try real backend first
            const res = await fetchWithTimeout(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            }, 3000); 

            if (res.ok) return res.json();
            if (res.status === 401) throw new Error('Invalid credentials');
            
            throw new Error('Server error');
        } catch (e) {
            console.warn("Backend unreachable or error, falling back to mock.", e);
            return useMock();
        }
    },

    getUsers: async () => {
        if (isMock()) {
            return [
                { id: 'u_admin', name: 'neil', role: 'admin', avatar: 'N', color: 'blue' },
                { id: 'u_wife', name: 'wife', role: 'user', avatar: 'W', color: 'pink' }
            ];
        }
        try {
            const res = await fetch(`${API_BASE}/users`, { headers: getAuthHeader() });
            if (res.ok) return res.json();
        } catch (e) { console.error(e); }
        return [];
    },

    createUser: async (username, password) => {
        if (isMock()) {
            return { success: true, id: 'u_' + Date.now() };
        }
        const res = await fetch(`${API_BASE}/users`, {
            method: 'POST',
            headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!res.ok) throw new Error('Failed to create user');
        return res.json();
    },

    updateUser: async (id: string, username: string, password?: string) => {
        if (isMock()) {
            return { success: true };
        }
        const res = await fetch(`${API_BASE}/users/${id}`, {
            method: 'PUT',
            headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!res.ok) throw new Error('Failed to update user');
        return res.json();
    },

    getProject: async () => {
        if (isMock()) return MOCK_PROJECT;
        
        try {
            const res = await fetchWithTimeout(`${API_BASE}/project`, { headers: getAuthHeader() }, 5000);
            if (!res.ok) throw new Error('Failed');
            return res.json();
        } catch (e) {
            console.warn("Using mock project due to error");
            return MOCK_PROJECT;
        }
    },

    updateProjectName: async (name: string) => {
        if (isMock()) {
            MOCK_PROJECT.name = name;
            return { success: true };
        }
        const res = await fetch(`${API_BASE}/project/name`, {
            method: 'POST',
            headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        return res.json();
    },

    updateSettings: async (startDate: string, endDate: string, isOngoing: boolean, settings: RenderSettings) => {
        if (isMock()) {
            MOCK_PROJECT.startDate = startDate;
            MOCK_PROJECT.endDate = endDate;
            MOCK_PROJECT.isOngoing = isOngoing;
            MOCK_PROJECT.settings = settings;
            return { success: true };
        }
        const res = await fetch(`${API_BASE}/project/settings`, {
            method: 'POST',
            headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ startDate, endDate, isOngoing, settings })
        });
        return res.json();
    },

    uploadPhoto: async (projectId: string, dayKey: string, file: File) => {
        if (isMock()) {
            // Fake upload delay
            await new Promise(r => setTimeout(r, 800));
            
            // Create a fake object URL for preview
            const fakeUrl = URL.createObjectURL(file);
            const newItem: SelectedItem = {
                id: 'mock_ph_' + Date.now(),
                source: 'device', // In mock mode, we treat as local/device mostly
                day: dayKey,
                imageUrl: fakeUrl,
                mimeType: file.type,
                addedBy: 'u_admin',
                addedByName: 'neil',
                createdAt: new Date().toISOString(),
                smartCrop: { x: 0, y: 0, width: 100, height: 100 } // Dummy
            };
            
            MOCK_PROJECT.selections[dayKey] = newItem;
            return newItem;
        }

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
        if (isMock()) {
            const key = Object.keys(MOCK_PROJECT.selections).find(k => MOCK_PROJECT.selections[k].id === id);
            if (key) delete MOCK_PROJECT.selections[key];
            return;
        }
        await fetch(`${API_BASE}/photo/${id}`, {
            method: 'DELETE',
            headers: getAuthHeader()
        });
    },
    
    renderVideo: async (payload: any) => {
        if (isMock()) {
            // In mock mode, we can't do server-side ffmpeg.
            await new Promise(r => setTimeout(r, 2000));
            throw new Error("Server-side rendering is unavailable in Demo Mode. Please ensure the backend is running for video generation.");
        }
        const res = await fetch(`${API_BASE}/render`, {
            method: 'POST',
            headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Render failed');
        return res.json();
    }
};