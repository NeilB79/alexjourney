import React, { useState, useEffect } from 'react';
import { UserPlus, User as UserIcon, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { UserProfile } from '../types';

export const AdminUsers: React.FC = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [newUser, setNewUser] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        const u = await api.getUsers();
        setUsers(u);
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.createUser(newUser.username, newUser.password);
            setNewUser({ username: '', password: '' });
            loadUsers();
        } catch (e) {
            setError('Could not create user. Username might exist.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <UserIcon size={18} /> Manage Users
            </h3>

            <div className="space-y-2 mb-6">
                {users.map(u => (
                    <div key={u.id} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${u.color === 'blue' ? 'bg-blue-500' : 'bg-pink-500'}`}>
                            {u.avatar}
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{u.name}</span>
                    </div>
                ))}
            </div>

            <form onSubmit={handleAddUser} className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-500 uppercase">Add New User</p>
                <div className="grid grid-cols-2 gap-2">
                    <input 
                        type="text" 
                        placeholder="Username" 
                        value={newUser.username}
                        onChange={e => setNewUser({...newUser, username: e.target.value})}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm text-slate-900 dark:text-white"
                        required
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={newUser.password}
                        onChange={e => setNewUser({...newUser, password: e.target.value})}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm text-slate-900 dark:text-white"
                        required
                    />
                </div>
                {error && <p className="text-red-500 text-xs">{error}</p>}
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <><UserPlus size={16} /> Add User</>}
                </button>
            </form>
        </div>
    );
};