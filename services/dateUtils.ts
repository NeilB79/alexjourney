import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  parseISO,
  isValid
} from 'date-fns';
import { DayKey, DateCell } from '../types';

export const formatDateKey = (date: Date): DayKey => format(date, 'yyyy-MM-dd');

export const parseDateKey = (key: DayKey): Date => parseISO(key);

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