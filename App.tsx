import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { CalendarGrid } from './components/CalendarGrid';
import { PhotosList } from './components/PhotosList';
import { SelectionModal } from './components/SelectionModal';
import { Lightbox } from './components/Lightbox';
import { ActionMenu } from './components/ActionMenu';
import { BottomNav } from './components/BottomNav';
import { VideoTab } from './components/VideoTab';
import { HomeTab } from './components/HomeTab';
import { RenderSettingsPanel } from './components/RenderSettings';
import { MonthPicker } from './components/MonthPicker';
import { generateCalendarDays, formatDateKey } from './services/dateUtils';
import { SelectedItem, DayKey, RenderSettings, DateCell, AppTab, Project, UserProfile } from './types';
import { DEFAULT_SETTINGS, USERS } from './constants';
import { addMonths, subMonths, format, addDays, startOfToday, isSameMonth, startOfMonth, parseISO, endOfMonth, eachDayOfInterval, isAfter, isBefore } from 'date-fns';
import { ChevronLeft, ChevronRight, AlertTriangle, ArrowUpDown, Calendar as CalendarIcon, CheckCircle2, CircleDashed } from 'lucide-react';
import { clsx } from 'clsx';

function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<AppTab>('home');

  // User State
  const [currentUser, setCurrentUser] = useState<UserProfile>(USERS[0]);
  const [darkMode, setDarkMode] = useState(true);
  const [weekStartsOn, setWeekStartsOn] = useState<0 | 1>(0); // 0 = Sunday, 1 = Monday

  // Data State
  const [project, setProject] = useState<Project>({
      id: 'p1',
      name: '2025 Memories',
      startDate: format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'),
      endDate: format(new Date(new Date().getFullYear(), 11, 31), 'yyyy-MM-dd'),
      isOngoing: false,
      selections: {}
  });

  const [currentDate, setCurrentDate] = useState(new Date());
  const [renderSettings, setRenderSettings] = useState<RenderSettings>(DEFAULT_SETTINGS);
  const [photosSortOrder, setPhotosSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Interaction State
  const [selectedDayKey, setSelectedDayKey] = useState<DayKey | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<SelectedItem | null>(null);
  const [actionMenuItem, setActionMenuItem] = useState<SelectedItem | null>(null);
  
  // Effects
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Derived Data
  const calendarDays = useMemo(() => generateCalendarDays(currentDate, weekStartsOn), [currentDate, weekStartsOn]);
  const monthLabel = format(currentDate, 'MMMM yyyy');
  const today = startOfToday();
  const isCurrentMonthTheRealCurrentMonth = isSameMonth(currentDate, today);

  // Missing Count for the CURRENT VIEW
  const missingCount = useMemo(() => {
    return calendarDays.filter(d => 
      !d.isToday && 
      d.date < new Date() && 
      d.isCurrentMonth && 
      !project.selections[d.key]
    ).length;
  }, [calendarDays, project.selections]);

  // Calculate Missing Months (Global)
  const missingMonths = useMemo(() => {
    const start = parseISO(project.startDate);
    const end = today; // We only care about missing photos up to today
    const months: { date: Date, missing: number }[] = [];
    
    let iter = startOfMonth(start);
    const currentMonthStart = startOfMonth(end);

    // Iterate month by month
    while (iter <= currentMonthStart) {
        // Don't go beyond project bounds if project ended in past
        if (!project.isOngoing && isAfter(iter, parseISO(project.endDate))) break;

        const monthEnd = endOfMonth(iter);
        const daysInMonth = eachDayOfInterval({ start: iter, end: monthEnd });
        
        let count = 0;
        daysInMonth.forEach(d => {
            // Only count if day is in the past (or today) AND within project bounds
            if (isBefore(d, today) || d.getTime() === today.getTime()) {
                if (!project.selections[formatDateKey(d)]) {
                    count++;
                }
            }
        });

        if (count > 0) {
            months.push({ date: iter, missing: count });
        }

        iter = addMonths(iter, 1);
    }

    return months.reverse(); // Newest first
  }, [project.selections, project.startDate, project.endDate, project.isOngoing, today]);

  // Handlers
  const updateProjectName = (name: string) => {
      setProject(p => ({ ...p, name }));
  };

  const updateProjectDates = (startDate: string, endDate: string, isOngoing: boolean) => {
      setProject(p => ({ ...p, startDate, endDate, isOngoing }));
  };

  const handleDayClick = (day: DateCell) => {
    if (day.date > startOfToday()) return; // Prevent future dates
    setSelectedDayKey(day.key);
    setIsModalOpen(true);
  };

  const handlePreview = (item: SelectedItem) => {
    setPreviewItem(item);
  };

  const handleLongPress = (item: SelectedItem) => {
    setActionMenuItem(item);
  };

  const handleDelete = (item: SelectedItem) => {
    setProject(prev => {
      const next = { ...prev.selections };
      delete next[item.day];
      return { ...prev, selections: next };
    });
  };

  const handleReplace = (item: SelectedItem) => {
    setSelectedDayKey(item.day);
    setIsModalOpen(true);
  };

  const handlePhotoSelect = (file: File) => {
    if (!selectedDayKey) return;
    
    const imageUrl = URL.createObjectURL(file);
    const newItem: SelectedItem = {
      id: crypto.randomUUID(),
      source: 'device',
      day: selectedDayKey,
      file,
      imageUrl,
      mimeType: file.type,
      addedBy: currentUser.id
    };

    setProject(prev => ({ 
        ...prev, 
        selections: { ...prev.selections, [selectedDayKey]: newItem } 
    }));
    setIsModalOpen(false);
  };

  const handleGoogleSelect = (files: { url: string, id: string }[]) => {
      if(!selectedDayKey || files.length === 0) return;
      
      const newSelections = { ...project.selections };
      let currentDay = new Date(selectedDayKey);
      const today = startOfToday();

      // Chronological assignment
      files.forEach((file) => {
          // Stop if we hit future
          if (currentDay > today) return;

          const key = format(currentDay, 'yyyy-MM-dd');
          
          const newItem: SelectedItem = {
            id: crypto.randomUUID(),
            source: 'google-photos',
            day: key,
            imageUrl: file.url,
            mimeType: 'image/jpeg',
            addedBy: currentUser.id
          };
          
          newSelections[key] = newItem;
          
          // Advance to next day
          currentDay = addDays(currentDay, 1);
      });

      setProject(prev => ({ ...prev, selections: newSelections }));
      setIsModalOpen(false);
  };

  const handleDropOnDay = (day: DateCell, files: FileList) => {
    const file = files[0];
    if (file && file.type.startsWith('image/') && day.date <= startOfToday()) {
        const imageUrl = URL.createObjectURL(file);
        const newItem: SelectedItem = {
            id: crypto.randomUUID(),
            source: 'device',
            day: day.key,
            file,
            imageUrl,
            mimeType: file.type,
            addedBy: currentUser.id
        };
        setProject(prev => ({ 
            ...prev, 
            selections: { ...prev.selections, [day.key]: newItem } 
        }));
    }
  };

  const handleResetProject = () => {
      setProject(p => ({ ...p, selections: {} }));
      setRenderSettings(DEFAULT_SETTINGS);
  };

  // Helper Component for Status Icon
  const StatusIndicator = ({ missing }: { missing: number }) => {
    if (missing === 0) {
        return (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 shadow-sm relative">
                <div className="absolute inset-0 rounded-full bg-green-400/20 animate-ping"></div>
                <CheckCircle2 size={18} className="relative z-10" />
            </div>
        );
    }
    return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 shadow-sm relative">
             <div className="absolute inset-0 rounded-full bg-yellow-400/20 animate-ping"></div>
             <CircleDashed size={18} className="relative z-10 animate-spin-slow" style={{ animationDuration: '3s' }} />
        </div>
    );
  };

  // Render Page Content based on Tab
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeTab 
             project={project}
             selections={project.selections}
             currentUser={currentUser}
             onUpdateProjectName={updateProjectName}
             onUpdateProjectDates={updateProjectDates}
             onNavigate={setActiveTab}
          />
        );

      case 'calendar':
        return (
          <div className="space-y-4 pb-24">
            {/* Calendar Controls */}
            <div className="flex flex-col gap-3">
               <div className="flex items-center justify-between">
                  <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 active:bg-slate-100 dark:active:bg-slate-600">
                        <ChevronLeft size={20}/>
                    </button>
                    
                    <button 
                        onClick={() => setIsMonthPickerOpen(true)}
                        className="px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 active:bg-slate-100 dark:active:bg-slate-600"
                    >
                        <CalendarIcon size={16} className="text-blue-600" />
                        {monthLabel}
                    </button>
                    
                    <button 
                        onClick={() => setCurrentDate(addMonths(currentDate, 1))} 
                        disabled={isCurrentMonthTheRealCurrentMonth}
                        className={`p-2 border-l border-slate-200 dark:border-slate-700 ${isCurrentMonthTheRealCurrentMonth ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-600'}`}
                    >
                        <ChevronRight size={20}/>
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <StatusIndicator missing={missingCount} />
                    {missingCount > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs font-bold rounded-lg border border-red-200 dark:border-red-900 shadow-sm animate-pulse">
                        <AlertTriangle size={14} />
                        {missingCount}
                        </div>
                    )}
                  </div>
               </div>
            </div>

            <CalendarGrid 
              days={calendarDays}
              selections={project.selections}
              weekStartsOn={weekStartsOn}
              onDayClick={handleDayClick}
              onPreview={handlePreview}
              onLongPress={handleLongPress}
              onDropOnDay={handleDropOnDay}
            />

            <div className="text-center text-xs text-slate-400 dark:text-slate-500 px-4">
               Tap to view. Long-press to edit.
            </div>

            {/* Missing Months List */}
            {missingMonths.length > 0 && (
               <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Incomplete Months</h4>
                  <div className="grid grid-cols-3 gap-2">
                     {missingMonths.map((m) => (
                        <button
                           key={m.date.toISOString()}
                           onClick={() => {
                               setCurrentDate(m.date);
                               window.scrollTo({ top: 0, behavior: 'smooth' });
                           }}
                           className="flex flex-col items-center justify-center p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                           <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                               {format(m.date, 'MMM yy')}
                           </span>
                           <span className="text-xs text-red-500 font-medium bg-red-50 dark:bg-red-900/20 px-1.5 rounded mt-1">
                               {m.missing} missing
                           </span>
                        </button>
                     ))}
                  </div>
               </div>
            )}
          </div>
        );

      case 'photos':
        return (
          <div className="pb-24">
             {/* Sticky Header for Photos Tab */}
             <div className="sticky top-16 z-30 bg-slate-50/95 dark:bg-slate-950/95 pt-2 pb-4 -mx-4 px-4 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md transition-colors">
               <div className="flex items-center justify-between gap-2">
                    {/* Month Picker Control */}
                    <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex-shrink-0">
                        <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700"><ChevronLeft size={18}/></button>
                        <span className="px-2 sm:px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 min-w-[80px] sm:min-w-[90px] text-center uppercase tracking-wide truncate">{format(currentDate, 'MMM yyyy')}</span>
                        <button 
                            onClick={() => setCurrentDate(addMonths(currentDate, 1))} 
                            disabled={isCurrentMonthTheRealCurrentMonth}
                            className={`p-2 border-l border-slate-200 dark:border-slate-700 ${isCurrentMonthTheRealCurrentMonth ? 'text-slate-300 dark:text-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                        >
                            <ChevronRight size={18}/>
                        </button>
                    </div>

                    {/* Status & Sort Controls */}
                    <div className="flex items-center gap-2">
                        <StatusIndicator missing={missingCount} />

                        <button 
                            onClick={() => setPhotosSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-colors"
                        >
                            <ArrowUpDown size={14} />
                            <span className="hidden sm:inline">{photosSortOrder === 'asc' ? 'Oldest' : 'Newest'}</span>
                        </button>
                    </div>
               </div>
             </div>
             
             <div className="mt-4">
                <PhotosList 
                    days={calendarDays}
                    selections={project.selections}
                    sortOrder={photosSortOrder}
                    onDayClick={handleDayClick}
                    onPreview={handlePreview}
                    onLongPress={handleLongPress}
                />
             </div>
          </div>
        );

      case 'video':
        return (
          <VideoTab 
            selections={project.selections}
            calendarDays={calendarDays}
            settings={renderSettings}
            onSettingsChange={setRenderSettings}
            currentDate={currentDate}
            projectStartDate={project.startDate}
            projectEndDate={project.isOngoing ? format(new Date(), 'yyyy-MM-dd') : project.endDate}
          />
        );

      case 'settings':
        return (
           <div className="space-y-6 pb-24">
             <RenderSettingsPanel 
                settings={renderSettings} 
                onChange={setRenderSettings} 
                darkMode={darkMode}
                onToggleDarkMode={() => setDarkMode(!darkMode)}
                weekStartsOn={weekStartsOn}
                onToggleWeekStart={() => setWeekStartsOn(prev => prev === 0 ? 1 : 0)}
                onResetProject={handleResetProject}
             />
           </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <Header currentUser={currentUser} onSwitchUser={setCurrentUser} />
      
      <main className="max-w-xl mx-auto px-4 py-4">
        {renderContent()}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Modals & Overlays */}
      <SelectionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dayKey={selectedDayKey}
        onSelect={handlePhotoSelect}
        onGoogleSelect={handleGoogleSelect}
      />

      <MonthPicker 
        isOpen={isMonthPickerOpen}
        onClose={() => setIsMonthPickerOpen(false)}
        currentDate={currentDate}
        onSelectDate={setCurrentDate}
      />
      
      <Lightbox 
        item={previewItem} 
        onClose={() => setPreviewItem(null)} 
      />

      <ActionMenu 
        item={actionMenuItem}
        onClose={() => setActionMenuItem(null)}
        onDelete={handleDelete}
        onReplace={handleReplace}
      />
    </div>
  );
}

export default App;