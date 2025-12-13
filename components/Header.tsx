import React from 'react';
import { Video, ChevronDown, User as UserIcon } from 'lucide-react';
import { UserProfile } from '../types';
import { USERS } from '../constants';

interface HeaderProps {
  currentUser: UserProfile;
  onSwitchUser: (user: UserProfile) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onSwitchUser }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
            <Video size={18} />
          </div>
          <h1 className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">PhotoDay</h1>
        </div>
        
        <div className="relative">
           <button 
             onClick={() => setIsMenuOpen(!isMenuOpen)}
             className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
           >
             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${currentUser.color === 'blue' ? 'bg-blue-500' : 'bg-pink-500'}`}>
               {currentUser.avatar}
             </div>
             <ChevronDown size={14} className="text-slate-400 mr-1" />
           </button>

           {isMenuOpen && (
             <>
               <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
               <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-100">
                 <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                   <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Switch Profile</p>
                 </div>
                 {USERS.map(user => (
                   <button
                     key={user.id}
                     onClick={() => { onSwitchUser(user); setIsMenuOpen(false); }}
                     className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
                   >
                     <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${user.color === 'blue' ? 'bg-blue-500' : 'bg-pink-500'}`}>
                        {user.avatar}
                     </div>
                     <span className={`text-sm font-medium ${currentUser.id === user.id ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                       {user.name} {currentUser.id === user.id && '(You)'}
                     </span>
                   </button>
                 ))}
               </div>
             </>
           )}
        </div>
      </div>
    </header>
  );
};