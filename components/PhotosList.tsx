import React, { useMemo } from 'react';
import { DateCell, SelectedItem, DayKey } from '../types';
import { format } from 'date-fns';
import { Plus, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface PhotosListProps {
  days: DateCell[];
  selections: Record<DayKey, SelectedItem>;
  sortOrder: 'asc' | 'desc';
  onDayClick: (day: DateCell) => void;
  onPreview: (item: SelectedItem) => void;
  onLongPress: (item: SelectedItem) => void;
}

export const PhotosList: React.FC<PhotosListProps> = ({
  days,
  selections,
  sortOrder,
  onDayClick,
  onPreview,
  onLongPress,
}) => {
  const today = new Date();
  today.setHours(0,0,0,0);

  // Filter out non-current month padding days unless they have selections
  // Also strictly filter out ANY date in the future
  const listDays = useMemo(() => {
    const filtered = days.filter(d => {
        // Must not be in future
        if (d.date > today) return false;
        // Must be current month OR have a selection (for boundary cases)
        return d.isCurrentMonth || selections[d.key];
    });
    
    return sortOrder === 'asc' ? filtered : [...filtered].reverse();
  }, [days, selections, sortOrder, today]);

  if (listDays.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <ImageIcon size={48} className="mb-4 opacity-50" />
              <p>No days to display for this month.</p>
          </div>
      );
  }

  return (
    <div className="space-y-3 pb-24">
      {listDays.map((day) => {
        const selection = selections[day.key];
        // Double check future for styling safety, though logic above handles it
        const isFuture = day.date > today;
        const isMissing = !selection && !day.isToday && !isFuture;
        const dateLabel = format(day.date, 'EEE, MMM d');
        
        // Compact mode for empty states
        const isCompact = !selection;

        return (
          <div key={day.key} className={clsx("flex gap-3 sm:gap-4 items-stretch", isFuture && "hidden")}>
            {/* Left: Date Column */}
            <div className="w-14 sm:w-16 flex flex-col items-center justify-start pt-3 flex-shrink-0">
              <span className={clsx(
                "text-[10px] sm:text-xs font-bold uppercase",
                day.isToday ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
              )}>
                {format(day.date, 'EEE')}
              </span>
              <div className={clsx(
                "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mt-1 text-xs sm:text-sm font-bold",
                day.isToday ? "bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              )}>
                {format(day.date, 'd')}
              </div>
              {isMissing && (
                 <div className="mt-2 w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
              )}
            </div>

            {/* Right: Photo Card */}
            <div 
              className={clsx(
                "flex-1 relative rounded-xl overflow-hidden shadow-sm border transition-all active:scale-[0.99] flex items-center justify-center",
                // Conditional Aspect Ratio: Video aspect if image exists, fixed compact height if empty
                !isCompact ? "aspect-video sm:aspect-[16/9]" : "h-20 sm:h-24",
                
                selection ? "border-slate-200 dark:border-slate-800 bg-black" : "border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900",
                isMissing && !selection && "border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-900/10"
              )}
              onClick={() => {
                   selection ? onPreview(selection) : onDayClick(day);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                if (selection) onLongPress(selection);
              }}
            >
              {selection ? (
                <img 
                  src={selection.imageUrl} 
                  alt={dateLabel} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={clsx(
                    "w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600 px-4",
                    // Horizontal layout for compact mode
                    "flex-row gap-3"
                )}>
                  {isMissing ? (
                    <>
                      <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/20 text-red-500 flex items-center justify-center animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)] flex-shrink-0">
                        <AlertCircle size={16} />
                      </div>
                      <span className="text-xs font-medium text-red-400">Missing Photo</span>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center flex-shrink-0">
                        <Plus size={16} />
                      </div>
                      <span className="text-xs font-medium">Add Photo</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};