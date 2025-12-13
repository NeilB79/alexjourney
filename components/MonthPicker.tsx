import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

interface MonthPickerProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  onSelectDate: (date: Date) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MonthPicker: React.FC<MonthPickerProps> = ({ isOpen, onClose, currentDate, onSelectDate }) => {
  const [year, setYearState] = useState(currentDate.getFullYear());
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const currentRealYear = today.getFullYear();
  const currentRealMonth = today.getMonth();

  if (!isOpen) return null;

  const handleSelect = (monthIndex: number) => {
      // Prevent selecting future months
      if (year > currentRealYear || (year === currentRealYear && monthIndex > currentRealMonth)) {
          return;
      }
      const newDate = new Date(currentDate);
      newDate.setFullYear(year);
      newDate.setMonth(monthIndex);
      onSelectDate(newDate);
      onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
           <h3 className="font-bold text-lg text-slate-900 dark:text-white">Select Month</h3>
           <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
             <X size={20} />
           </button>
        </div>

        {/* Year Selector */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/50">
            <button 
                onClick={() => setYearState(y => y - 1)}
                className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full shadow-sm text-slate-600 dark:text-slate-300"
            >
                <ChevronLeft size={20} />
            </button>
            <span className="text-xl font-bold text-slate-800 dark:text-white font-mono">{year}</span>
            <button 
                onClick={() => setYearState(y => y + 1)}
                disabled={year >= currentRealYear}
                className={clsx(
                    "p-2 rounded-full shadow-sm",
                    year >= currentRealYear 
                        ? "text-slate-300 dark:text-slate-700 cursor-not-allowed" 
                        : "hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                )}
            >
                <ChevronRight size={20} />
            </button>
        </div>

        {/* Months Grid */}
        <div className="grid grid-cols-3 gap-2 p-4">
            {MONTHS.map((m, idx) => {
                const isFuture = year > currentRealYear || (year === currentRealYear && idx > currentRealMonth);
                const isSelected = currentDate.getMonth() === idx && currentDate.getFullYear() === year;

                return (
                    <button
                        key={m}
                        onClick={() => handleSelect(idx)}
                        disabled={isFuture}
                        className={clsx(
                            "py-3 rounded-lg text-sm font-medium transition-colors",
                            isSelected 
                                ? "bg-blue-600 text-white shadow-md" 
                                : isFuture 
                                    ? "text-slate-300 dark:text-slate-700 cursor-not-allowed bg-slate-50/50 dark:bg-slate-900/50" 
                                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                    >
                        {m.substring(0, 3)}
                    </button>
                );
            })}
        </div>
      </div>
    </div>
  );
};