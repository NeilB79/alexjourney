import React, { useRef, useState } from 'react';
import { DateCell, SelectedItem } from '../types';
import { format, startOfToday } from 'date-fns';
import { Plus, Lock } from 'lucide-react';
import { clsx } from 'clsx';
import { USERS } from '../constants';

interface DayCellProps {
  day: DateCell;
  selection?: SelectedItem;
  onClick: () => void;
  onPreview: () => void;
  onLongPress: () => void;
  onDrop: (files: FileList) => void;
}

export const DayCell: React.FC<DayCellProps> = ({ 
  day, selection, onClick, onPreview, onLongPress, onDrop 
}) => {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);
  const [isPressing, setIsPressing] = useState(false);

  // Future check: strictly after today
  const today = startOfToday();
  const isFuture = day.date > today;
  const isMissing = !selection && !day.isToday && !isFuture;
  const isTodayEmpty = day.isToday && !selection;

  const handleStart = () => {
    if (isFuture) return;
    setIsPressing(true);
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      if (selection) {
        onLongPress();
      }
      setIsPressing(false);
    }, 500);
  };

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (isFuture) return;
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    setIsPressing(false);
    
    if (isLongPress.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (selection) {
      onPreview();
    } else {
      onClick();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (isFuture) {
        e.dataTransfer.dropEffect = 'none';
        return;
    }
    e.currentTarget.classList.add('bg-blue-50', 'ring-2', 'ring-blue-400');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-blue-50', 'ring-2', 'ring-blue-400');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-blue-50', 'ring-2', 'ring-blue-400');
    if (isFuture) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDrop(e.dataTransfer.files);
    }
  };

  // Find who added it
  const addedByUser = selection?.addedBy ? USERS.find(u => u.id === selection.addedBy) : null;

  return (
    <div
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={() => {
        if(longPressTimer.current) clearTimeout(longPressTimer.current);
        setIsPressing(false);
      }}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={clsx(
        "relative aspect-square border-r border-b border-slate-200 dark:border-slate-800 transition-all select-none touch-manipulation",
        // Base styling for dates
        isFuture 
            ? "bg-slate-100 dark:bg-slate-900 opacity-60 cursor-not-allowed bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPHBhdGggZD0iTTAgNEw0IDAiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')]" 
            : "cursor-pointer",
            
        // Default Backgrounds
        !day.isCurrentMonth && !isFuture && !day.isToday && "bg-slate-50/50 dark:bg-slate-900/50",
        day.isCurrentMonth && !selection && !isFuture && !day.isToday && "bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900",
        
        // Missing (Past with no photo)
        isMissing && "bg-red-50/10 dark:bg-red-900/10 shadow-[inset_0_0_8px_rgba(248,113,113,0.1)]",
        
        // TODAY STYLING (The Giant Green Square)
        isTodayEmpty && "bg-emerald-500 dark:bg-emerald-600 shadow-[0_0_20px_rgba(250,204,21,0.6)] z-10",
        
        isPressing && "scale-[0.98]"
      )}
    >
      {/* Today Pulse Ring (Only visible if Today is Empty) */}
      {isTodayEmpty && (
         <div className="absolute inset-0 border-4 border-yellow-300 dark:border-yellow-400 opacity-50 animate-pulse pointer-events-none"></div>
      )}

      {/* Date Number */}
      <span className={clsx(
        "absolute top-1 left-1 sm:top-2 sm:left-2 text-[10px] sm:text-xs font-medium z-10 px-1.5 py-0.5 rounded shadow-sm",
        // Logic for Badge Colors
        selection 
          ? "bg-emerald-600 text-white" // Green if Done
          : day.isToday 
            ? "bg-white/20 text-white border border-white/40 backdrop-blur-sm" // Transparent/White if Today (on Green BG)
            : "text-slate-700 dark:text-slate-200 bg-white/90 dark:bg-slate-800/90" // Default
      )}>
        {format(day.date, 'd')}
      </span>

      {/* User Indicator (Dot) */}
      {addedByUser && (
        <div className={clsx(
            "absolute top-1 right-1 z-10 w-2 h-2 rounded-full ring-1 ring-white dark:ring-slate-900",
            addedByUser.color === 'blue' ? 'bg-blue-500' : 'bg-pink-500'
        )} title={`Added by ${addedByUser.name}`}></div>
      )}

      {/* Content */}
      <div className="w-full h-full flex items-center justify-center overflow-hidden">
        {selection ? (
          <img 
            src={selection.imageUrl} 
            alt={format(day.date, 'yyyy-MM-dd')} 
            className="w-full h-full object-cover pointer-events-none"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 transition-colors">
            {isMissing ? (
               <div className="flex flex-col items-center justify-center">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-red-400 rounded-full opacity-75 animate-ping"></div>
                    <div className="relative w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                  </div>
               </div>
            ) : isFuture ? (
               <Lock className="w-4 h-4 opacity-20" />
            ) : day.isToday ? (
               // White Plus for Green Background
               <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-white/90 drop-shadow-md" strokeWidth={3} />
            ) : (
               <Plus className="w-5 h-5 sm:w-6 sm:h-6 opacity-50" />
            )}
          </div>
        )}
      </div>
      
      {/* Overlay for feedback */}
      <div className={clsx(
        "absolute inset-0 transition-opacity pointer-events-none",
        isPressing ? "bg-black/10 dark:bg-white/10" : "bg-transparent"
      )} />
    </div>
  );
};