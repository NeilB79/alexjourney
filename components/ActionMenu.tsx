import React from 'react';
import { Trash2, RefreshCw, X } from 'lucide-react';
import { SelectedItem } from '../types';
import { format, parseISO } from 'date-fns';

interface ActionMenuProps {
  item: SelectedItem | null;
  onClose: () => void;
  onDelete: (item: SelectedItem) => void;
  onReplace: (item: SelectedItem) => void;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({ item, onClose, onDelete, onReplace }) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-md rounded-t-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <span className="text-sm font-medium text-slate-500">
            {format(parseISO(item.day), 'MMMM do')}
          </span>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <button 
            onClick={() => { onReplace(item); onClose(); }}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <RefreshCw size={20} />
            </div>
            <div className="text-left">
              <div className="text-slate-900 font-semibold">Replace Photo</div>
              <div className="text-xs text-slate-500">Choose a new image for this day</div>
            </div>
          </button>

          <button 
            onClick={() => { onDelete(item); onClose(); }}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-medium transition-colors active:scale-[0.98]"
          >
             <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <Trash2 size={20} />
            </div>
            <div className="text-left">
              <div className="text-red-900 font-semibold">Remove Photo</div>
              <div className="text-xs text-red-800/70">Clear selection for this day</div>
            </div>
          </button>
        </div>
        
        <div className="p-4 pt-0">
          <button onClick={onClose} className="w-full py-3 text-slate-500 font-medium text-sm hover:text-slate-800">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
