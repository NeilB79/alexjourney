import React from 'react';
import { Video, User as UserIcon } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  currentUser: UserProfile;
  onSwitchUser: (user: UserProfile) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser }) => {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
            <Video size={18} />
          </div>
          <h1 className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">Alex's Journey</h1>
        </div>
        
        <div className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
           <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${currentUser.color === 'blue' ? 'bg-blue-500' : 'bg-pink-500'}`}>
             {currentUser.avatar}
           </div>
           <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 pr-2">
             {currentUser.name}
           </span>
        </div>
      </div>
    </header>
  );
};