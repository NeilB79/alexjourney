import React from 'react';
import { DateCell } from '../types';
import { DayCell } from './DayCell';
import { SelectedItem, DayKey } from '../types';

interface CalendarGridProps {
  days: DateCell[];
  selections: Record<DayKey, SelectedItem>;
  weekStartsOn: 0 | 1;
  onDayClick: (day: DateCell) => void;
  onPreview: (item: SelectedItem) => void;
  onLongPress: (item: SelectedItem) => void;
  onDropOnDay: (day: DateCell, files: FileList) => void;
}

const WEEKDAYS_SUN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_MON = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const CalendarGrid: React.FC<CalendarGridProps> = ({ 
  days, selections, weekStartsOn, onDayClick, onPreview, onLongPress, onDropOnDay 
}) => {
  const weekDays = weekStartsOn === 1 ? WEEKDAYS_MON : WEEKDAYS_SUN;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
      {/* Weekday Header */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
        {weekDays.map(day => (
          <div key={day} className="py-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            {day}
          </div>
        ))}
      </div>
      
      {/* Days Grid */}
      <div className="grid grid-cols-7 bg-slate-200 dark:bg-slate-800 gap-px border-b border-slate-200 dark:border-slate-800">
        {days.map((day) => {
          const selection = selections[day.key];
          return (
            <div key={day.key} className="bg-white dark:bg-slate-950">
              <DayCell 
                day={day} 
                selection={selection}
                onClick={() => onDayClick(day)}
                onPreview={() => selection && onPreview(selection)}
                onLongPress={() => selection && onLongPress(selection)}
                onDrop={(files) => onDropOnDay(day, files)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};