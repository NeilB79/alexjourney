import { 
  format, 
  endOfMonth, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  isValid
} from 'date-fns';
import { DayKey, DateCell } from '../types';

export const formatDateKey = (date: Date): DayKey => format(date, 'yyyy-MM-dd');

export const parseDateKey = (key: DayKey): Date => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const startOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const startOfWeek = (date: Date, options?: { weekStartsOn?: 0 | 1 }): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day < (options?.weekStartsOn || 0) ? 7 : 0) + day - (options?.weekStartsOn || 0);
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const generateCalendarDays = (currentDate: Date, weekStartsOn: 0 | 1 = 0): DateCell[] => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn });
  const endDate = endOfWeek(monthEnd, { weekStartsOn });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return days.map((date) => ({
    date,
    key: formatDateKey(date),
    isCurrentMonth: isSameMonth(date, currentDate),
    isToday: isToday(date),
  }));
};

export const getDaysInRange = (start: Date, end: Date): DayKey[] => {
  if (!isValid(start) || !isValid(end)) return [];
  return eachDayOfInterval({ start, end }).map(formatDateKey);
};