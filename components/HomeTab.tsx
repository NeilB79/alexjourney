import React, { useState } from 'react';
import { Project, UserProfile, DayKey, SelectedItem } from '../types';
import { format, differenceInDays } from 'date-fns';
import { Image as ImageIcon, CheckCircle2, CalendarClock, Infinity, Edit2, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';

interface HomeTabProps {
  project: Project;
  selections: Record<DayKey, SelectedItem>;
  currentUser: UserProfile;
  onUpdateProjectName: (name: string) => void;
  onUpdateProjectDates: (start: string, end: string, isOngoing: boolean) => void;
  onNavigate: (tab: any) => void;
}

const parseDateKey = (key: string): Date => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const HomeTab: React.FC<HomeTabProps> = ({ 
  project, selections, currentUser, onUpdateProjectName, onUpdateProjectDates, onNavigate 
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const selectionCount = Object.keys(selections).length;
  const start = parseDateKey(project.startDate);
  // If ongoing, end date effectively moves with today
  const end = project.isOngoing ? new Date() : parseDateKey(project.endDate);
  
  const totalDays = Math.max(1, differenceInDays(end, start) + 1);
  const progress = Math.min(100, Math.round((selectionCount / totalDays) * 100));

  // Recent activity
  const lastSelectionKey = Object.keys(selections).sort().pop();
  const lastSelection = lastSelectionKey ? selections[lastSelectionKey] : null;

  const handleOngoingToggle = (checked: boolean) => {
    onUpdateProjectDates(
        project.startDate, 
        checked ? format(new Date(), 'yyyy-MM-dd') : project.endDate, 
        checked
    );
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Project Card (Collapsible) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
        
        {/* Header / Summary View */}
        <div className="p-6 flex items-start justify-between">
           <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Current Project</div>
              {isEditing ? (
                 <input 
                    type="text" 
                    value={project.name}
                    onChange={(e) => onUpdateProjectName(e.target.value)}
                    className="w-full text-2xl font-bold text-slate-900 dark:text-white bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none p-0 pb-1 rounded-none placeholder-slate-300"
                    placeholder="Project Name"
                    autoFocus
                 />
              ) : (
                 <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{project.name}</h2>
              )}
              
              {!isEditing && (
                 <div className="flex items-center gap-2 mt-2 text-sm text-slate-500 dark:text-slate-400">
                    <CalendarClock size={14} />
                    <span>
                       {format(start, 'MMM d, yyyy')} - {project.isOngoing ? 'Present' : format(end, 'MMM d, yyyy')}
                    </span>
                 </div>
              )}
           </div>
           
           <button 
             onClick={() => setIsEditing(!isEditing)}
             className="p-2 -mr-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors"
           >
             {isEditing ? <Check size={20} /> : <Edit2 size={18} />}
           </button>
        </div>

        {/* Expanded Settings */}
        {isEditing && (
           <div className="px-6 pb-6 pt-0 space-y-4 animate-in slide-in-from-top-2 duration-200">
               <div className="h-px bg-slate-100 dark:bg-slate-800 mb-4" />
               
               {/* Date Range Editors */}
               <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Start Date</label>
                      <input 
                        type="date" 
                        value={project.startDate}
                        onChange={(e) => onUpdateProjectDates(e.target.value, project.endDate, !!project.isOngoing)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">End Date</label>
                      <input 
                        type="date" 
                        value={project.isOngoing ? format(new Date(), 'yyyy-MM-dd') : project.endDate}
                        disabled={project.isOngoing}
                        onChange={(e) => onUpdateProjectDates(project.startDate, e.target.value, !!project.isOngoing)}
                        className={clsx(
                            "w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500",
                            project.isOngoing && "opacity-50 cursor-not-allowed"
                        )}
                      />
                  </div>
               </div>
    
               {/* Ongoing Toggle */}
               <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <div className={`p-2 rounded-full ${project.isOngoing ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                     <Infinity size={20} />
                  </div>
                  <div className="flex-1">
                     <div className="text-sm font-semibold text-slate-900 dark:text-white">Ongoing Project</div>
                     <div className="text-xs text-slate-500">End date always updates to today</div>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={!!project.isOngoing} 
                        onChange={e => handleOngoingToggle(e.target.checked)} 
                        className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </div>
               </label>

               <div className="pt-2 text-center">
                  <button onClick={() => setIsEditing(false)} className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center justify-center gap-1 w-full">
                     <ChevronUp size={14} /> Close Settings
                  </button>
               </div>
           </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
         <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex flex-col justify-between">
            <div className="text-blue-600 dark:text-blue-400 mb-2"><Image size={24} /></div>
            <div>
               <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{selectionCount}</div>
               <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">Photos Collected</div>
            </div>
         </div>
         <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-xl p-4 flex flex-col justify-between">
            <div className="text-purple-600 dark:text-purple-400 mb-2"><CheckCircle2 size={24} /></div>
            <div>
               <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{progress}%</div>
               <div className="text-xs text-purple-700 dark:text-purple-300 font-medium">Completion</div>
            </div>
         </div>
      </div>

      {/* Missing Days Action */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-800 dark:to-black rounded-xl p-6 text-white shadow-lg relative overflow-hidden group cursor-pointer" onClick={() => onNavigate('calendar')}>
         <div className="relative z-10">
            <h3 className="text-lg font-bold mb-1">Missing {Math.max(0, totalDays - selectionCount)} days</h3>
            <p className="text-slate-300 text-sm mb-4">Complete your timeline to generate the perfect video.</p>
            <button 
               className="px-4 py-2 bg-white text-slate-900 rounded-lg text-sm font-bold hover:bg-slate-100 transition-colors"
            >
               Go to Calendar
            </button>
         </div>
         <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4 group-hover:scale-110 transition-transform">
            <CalendarClock size={120} />
         </div>
      </div>

      {/* Recent Activity */}
      {lastSelection && (
         <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wide">Latest Addition</h4>
            <div className="flex items-center gap-3">
               <img src={lastSelection.imageUrl} className="w-12 h-12 rounded-lg object-cover bg-slate-100" />
               <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white">{format(parseDateKey(lastSelection.day), 'MMMM do')}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                     <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white font-bold ${
                        lastSelection.addedBy === 'u1' ? 'bg-blue-500' : 'bg-pink-500'
                     }`}>
                        {lastSelection.addedBy === 'u1' ? 'M' : 'W'}
                     </div>
                     <span className="text-xs text-slate-500 dark:text-slate-400">Added by {lastSelection.addedBy === currentUser.id ? 'You' : (lastSelection.addedBy === 'u1' ? 'Me' : 'Wife')}</span>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

// Lucide icon fix
const Image = ImageIcon;