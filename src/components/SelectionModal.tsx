import React, { useState } from 'react';
import { X, Smartphone, Loader2 } from 'lucide-react';
import { DayKey } from '../types';
import { format } from 'date-fns';
import { openGooglePicker } from '../services/googlePhotos';

interface SelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayKey: DayKey | null;
  onSelect: (file: File) => void;
  onGoogleSelect: (files: { url: string; id: string }[]) => void;
}

const parseDateKey = (key: DayKey): Date => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// Google Photos Pinwheel SVG
const GooglePhotosIcon = () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5.5 12C5.5 8.41015 8.41015 5.5 12 5.5V12H5.5Z" fill="#FBBC04"/>
        <path d="M12 5.5C15.5899 5.5 18.5 8.41015 18.5 12H12V5.5Z" fill="#EA4335"/>
        <path d="M12 18.5C8.41015 18.5 5.5 15.5899 5.5 12H12V18.5Z" fill="#34A853"/>
        <path d="M18.5 12C18.5 15.5899 15.5899 18.5 12 18.5V12H18.5Z" fill="#4285F4"/>
    </svg>
);

export const SelectionModal: React.FC<SelectionModalProps> = ({ 
  isOpen, onClose, dayKey, onSelect, onGoogleSelect 
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !dayKey) return null;

  const dateLabel = format(parseDateKey(dayKey), 'MMMM do, yyyy');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onSelect(e.target.files[0]);
      onClose();
    }
  };

  const handleGooglePhotos = async () => {
    setLoading(true);
    try {
        await openGooglePicker(
            undefined, 
            (files) => {
                onGoogleSelect(files);
                onClose();
            },
            () => setLoading(false)
        );
    } catch (e: any) {
        setLoading(false);
        if (e.message !== 'popup_closed') {
             alert(e.message === 'FORCE_DEMO_MODE' 
                ? 'Google Photos is disabled in Demo Mode.' 
                : 'Failed to open Google Photos. Check console logs.');
             console.error(e);
        }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Add Photo</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{dateLabel}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X size={24} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
             <label className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all active:scale-[0.98]">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Smartphone size={24} />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Upload from Device</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Choose from library or take photo</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
             </label>

             <button 
                onClick={handleGooglePhotos}
                disabled={loading}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait"
             >
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    {loading ? <Loader2 size={24} className="animate-spin text-slate-500" /> : <GooglePhotosIcon />}
                </div>
                <div className="flex-1 text-left">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Google Photos</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Select from your cloud library</p>
                </div>
             </button>
        </div>
      </div>
    </div>
  );
};