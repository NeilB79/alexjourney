import React from 'react';
import { X, GitCommit } from 'lucide-react';
import { CHANGELOG, APP_VERSION } from '../constants';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <GitCommit size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">What's New</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Current Version {APP_VERSION}</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
                <X size={20} />
            </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-8">
            {CHANGELOG.map((log, index) => (
                <div key={log.version} className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-800">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-50 dark:bg-slate-900 border-2 border-blue-500"></div>
                    
                    <div className="flex items-baseline justify-between mb-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{log.version}</h3>
                        <span className="text-xs font-mono text-slate-400">{log.date}</span>
                    </div>
                    
                    <ul className="space-y-2">
                        {log.changes.map((change, i) => (
                            <li key={i} className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                • {change}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
        
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl">
            <button onClick={onClose} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm">
                Awesome!
            </button>
        </div>
      </div>
    </div>
  );
};