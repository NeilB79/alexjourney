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
import { AdminUsers } from './components/AdminUsers';
import { DebugConsole } from './components/DebugConsole';
import { ChangelogModal } from './components/ChangelogModal';
import { generateCalendarDays, formatDateKey } from './services/dateUtils';
import { SelectedItem, DayKey, RenderSettings, DateCell, AppTab, Project, UserProfile } from './types';
import { DEFAULT_SETTINGS, APP_VERSION, BUILD_DATE } from './constants';
import { addMonths, format, addDays, isSameMonth, endOfMonth, eachDayOfInterval, isAfter, isBefore } from 'date-fns';
import { ChevronLeft, ChevronRight, AlertTriangle, ArrowUpDown, Calendar as CalendarIcon, CheckCircle2, CircleDashed, LogIn, WifiOff, ToggleLeft, ToggleRight, Info } from 'lucide-react';
import { clsx } from 'clsx';
import { api } from './services/api';
// Initialize logger early
import './services/logger';

function App() {
  // Auth State
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [authLoading, setAuthLoading] = useState(false);
  const [loginCreds, setLoginCreds] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [debugMode, setDebugMode] = useState(false);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<AppTab>('home');

  // User State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [weekStartsOn, setWeekStartsOn] = useState<0 | 1>(0);

  // Data State
  const [project, setProject] = useState<Project | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [renderSettings, setRenderSettings] = useState<RenderSettings>(DEFAULT_SETTINGS);
  const [photosSortOrder, setPhotosSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Interaction State
  const [selectedDayKey, setSelectedDayKey] = useState<DayKey | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<SelectedItem | null>(null);
  const [actionMenuItem, setActionMenuItem] = useState<SelectedItem | null>(null);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  
  // --- INITIALIZATION & AUTH ---

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
        setCurrentUser(JSON.parse(storedUser));
        loadData();
    }
  }, [token]);

  const loadData = async () => {
      try {
          const proj = await api.getProject();
          setProject(proj);
          if (proj.settings) setRenderSettings(proj.settings);
      } catch (e) {
          console.error(e);
          // If project load fails, maybe token invalid
          if (!project) handleLogout();
      }
  };

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthLoading(true);
      setLoginError('');
      try {
          // Pass debugMode to force mock if enabled
          const data = await api.login(loginCreds.username, loginCreds.password, debugMode);
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          setToken(data.token);
          setCurrentUser(data.user);
          setProject(null); // Clear old state
          // Settings from login response
          if (data.settings) {
              if (data.settings.videoSettings) setRenderSettings(data.settings.videoSettings);
          }
      } catch (err: any) {
          setLoginError(err.message || 'Login failed');
      } finally {
          setAuthLoading(false);
      }
  };

  const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setCurrentUser(null);
      setProject(null);
  };

  const isDemoMode = token === 'mock-token';

  // --- DATA LOGIC ---
  
  const calendarDays = useMemo(() => generateCalendarDays(currentDate, weekStartsOn), [currentDate, weekStartsOn]);
  const monthLabel = format(currentDate, 'MMMM yyyy');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const isCurrentMonthTheRealCurrentMonth = isSameMonth(currentDate, today);

  const selections = project?.selections || {};

  const missingCount = useMemo(() => {
    if (!project) return 0;
    return calendarDays.filter(d => 
      !d.isToday && 
      d.date < new Date() && 
      d.isCurrentMonth && 
      !selections[d.key]
    ).length;
  }, [calendarDays, selections]);

  // Update Settings Wrapper
  const updateSettings = async (updates: any) => {
      if (!project) return;
      const newSettings = { ...renderSettings, ...updates };
      setRenderSettings(newSettings);
      
      await api.updateSettings(
          project.startDate, 
          project.endDate, 
          !!project.isOngoing, 
          newSettings
      );
  };

  // Update Project Wrapper
  const updateProjectDetails = async (name: string) => {
      if (!project) return;
      setProject({ ...project, name });
      await api.updateProjectName(name);
  };

  const updateProjectDates = async (s: string, e: string, o: boolean) => {
      if (!project) return;
      setProject({ ...project, startDate: s, endDate: e, isOngoing: o });
      await api.updateSettings(s, e, o, renderSettings);
  };

  const handlePhotoSelect = async (file: File) => {
    if (!selectedDayKey || !project) return;
    
    try {
        const result = await api.uploadPhoto(project.id, selectedDayKey, file);
        
        // Optimistic / Result update
        const newItem: SelectedItem = {
          id: result.id,
          source: 'server',
          day: selectedDayKey,
          imageUrl: result.imageUrl,
          mimeType: file.type,
          addedBy: currentUser?.id,
          addedByName: currentUser?.name,
          createdAt: result.createdAt,
          smartCrop: result.smartCrop
        };

        setProject(prev => prev ? ({ 
            ...prev, 
            selections: { ...prev.selections, [selectedDayKey]: newItem } 
        }) : null);
        
        setIsModalOpen(false);
    } catch (e) {
        alert("Failed to upload photo");
    }
  };

  const handleDelete = async (item: SelectedItem) => {
    if (!project) return;
    try {
        await api.deletePhoto(item.id);
        setProject(prev => {
          if (!prev) return null;
          const next = { ...prev.selections };
          delete next[item.day];
          return { ...prev, selections: next };
        });
    } catch (e) {
        alert("Failed to delete");
    }
  };

  // --- RENDER ---
  
  // Common elements to render regardless of login state
  const debugUI = (
      <>
          <DebugConsole />
          <ChangelogModal isOpen={isChangelogOpen} onClose={() => setIsChangelogOpen(false)} />
      </>
  );

  if (!token || !currentUser || !project) {
      return (
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative">
              {/* Top Right Debug Toggle */}
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-full shadow-md border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-4">
                  <span className="text-[10px] font-bold uppercase text-slate-500 pl-2">Debug</span>
                  <button 
                    onClick={() => setDebugMode(!debugMode)}
                    className={clsx(
                        "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                        debugMode ? "bg-amber-100 text-amber-700" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    )}
                  >
                     {debugMode ? <ToggleRight size={18} className="text-amber-600"/> : <ToggleLeft size={18}/>}
                     {debugMode ? "Mock ON" : "Off"}
                  </button>
              </div>

              <div className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                  <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-500/30">
                          <LogIn size={32} />
                      </div>
                      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Alex's Journey</h1>
                      <p className="text-slate-500 mt-2">Sign in to your private timeline.</p>
                  </div>
                  
                  <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username</label>
                          <input 
                            type="text" 
                            value={loginCreds.username}
                            onChange={e => setLoginCreds({...loginCreds, username: e.target.value})}
                            className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Enter username"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                          <input 
                            type="password" 
                            value={loginCreds.password}
                            onChange={e => setLoginCreds({...loginCreds, password: e.target.value})}
                            className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Enter password"
                          />
                      </div>
                      
                      {loginError && <p className="text-red-500 text-sm text-center animate-pulse">{loginError}</p>}
                      
                      <button 
                        type="submit" 
                        disabled={authLoading}
                        className={clsx(
                            "w-full py-3 text-white font-bold rounded-lg transition-all flex items-center justify-center shadow-lg",
                            debugMode ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20" : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
                        )}
                      >
                          {authLoading ? <CircleDashed className="animate-spin" /> : (debugMode ? 'Sign In (Mock)' : 'Sign In')}
                      </button>
                  </form>
                  <div className="mt-6 text-center">
                    <p className="text-xs text-slate-400">Default Admin: neil / neil</p>
                  </div>
                  
                  {debugMode && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
                  )}
              </div>

              {/* Version Footer */}
              <div className="mt-8 text-center opacity-40 hover:opacity-100 transition-opacity">
                  <button 
                     onClick={() => setIsChangelogOpen(true)}
                     className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:text-blue-500 hover:underline cursor-pointer"
                  >
                     {APP_VERSION} • {BUILD_DATE}
                  </button>
              </div>
              
              {debugUI}
          </div>
      );
  }

  const StatusIndicator = ({ missing }: { missing: number }) => (
    missing === 0 
    ? <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 shadow-sm relative"><div className="absolute inset-0 rounded-full bg-green-400/20 animate-ping"></div><CheckCircle2 size={18} className="relative z-10" /></div>
    : <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 shadow-sm relative"><div className="absolute inset-0 rounded-full bg-yellow-400/20 animate-ping"></div><CircleDashed size={18} className="relative z-10 animate-spin-slow" style={{ animationDuration: '3s' }} /></div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab project={project} selections={selections} currentUser={currentUser} onUpdateProjectName={updateProjectDetails} onUpdateProjectDates={updateProjectDates} onNavigate={setActiveTab} />;
      case 'calendar':
        return (
          <div className="space-y-4 pb-24">
            <div className="flex flex-col gap-3">
               <div className="flex items-center justify-between">
                  <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    <button onClick={() => setCurrentDate(addMonths(currentDate, -1))} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 active:bg-slate-100 dark:active:bg-slate-600"><ChevronLeft size={20}/></button>
                    <button onClick={() => setIsMonthPickerOpen(true)} className="px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 active:bg-slate-100 dark:active:bg-slate-600"><CalendarIcon size={16} className="text-blue-600" />{monthLabel}</button>
                    <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} disabled={isCurrentMonthTheRealCurrentMonth} className={`p-2 border-l border-slate-200 dark:border-slate-700 ${isCurrentMonthTheRealCurrentMonth ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-600'}`}><ChevronRight size={20}/></button>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIndicator missing={missingCount} />
                    {missingCount > 0 && <div className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs font-bold rounded-lg border border-red-200 dark:border-red-900 shadow-sm animate-pulse"><AlertTriangle size={14} />{missingCount}</div>}
                  </div>
               </div>
            </div>
            <CalendarGrid days={calendarDays} selections={selections} weekStartsOn={weekStartsOn} onDayClick={d => { if(d.date<=new Date()){setSelectedDayKey(d.key); setIsModalOpen(true);} }} onPreview={setPreviewItem} onLongPress={setActionMenuItem} onDropOnDay={(d, f) => { setSelectedDayKey(d.key); handlePhotoSelect(f[0]); }} />
          </div>
        );
      case 'photos':
        return (
             <div className="pb-24">
                 <div className="sticky top-16 z-30 bg-slate-50/95 dark:bg-slate-950/95 pt-2 pb-4 -mx-4 px-4 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md transition-colors">
                   <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex-shrink-0">
                            <button onClick={() => setCurrentDate(addMonths(currentDate, -1))} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700"><ChevronLeft size={18}/></button>
                            <span className="px-2 sm:px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 min-w-[80px] sm:min-w-[90px] text-center uppercase tracking-wide truncate">{format(currentDate, 'MMM yyyy')}</span>
                            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} disabled={isCurrentMonthTheRealCurrentMonth} className={`p-2 border-l border-slate-200 dark:border-slate-700 ${isCurrentMonthTheRealCurrentMonth ? 'text-slate-300 dark:text-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`}><ChevronRight size={18}/></button>
                        </div>
                        <div className="flex items-center gap-2">
                            <StatusIndicator missing={missingCount} />
                            <button onClick={() => setPhotosSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-colors">
                                <ArrowUpDown size={14} /><span className="hidden sm:inline">{photosSortOrder === 'asc' ? 'Oldest' : 'Newest'}</span>
                            </button>
                        </div>
                   </div>
                 </div>
                 <div className="mt-4">
                    <PhotosList days={calendarDays} selections={selections} sortOrder={photosSortOrder} onDayClick={d => {setSelectedDayKey(d.key); setIsModalOpen(true);}} onPreview={setPreviewItem} onLongPress={setActionMenuItem} />
                 </div>
             </div>
        );
      case 'video':
        return <VideoTab selections={selections} calendarDays={calendarDays} settings={renderSettings} onSettingsChange={updateSettings} currentDate={currentDate} projectStartDate={project.startDate} projectEndDate={project.isOngoing ? format(new Date(), 'yyyy-MM-dd') : project.endDate} onVersionClick={() => setIsChangelogOpen(true)} />;
      case 'settings':
        return (
           <div className="space-y-6 pb-24">
             <RenderSettingsPanel settings={renderSettings} onChange={updateSettings} darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} weekStartsOn={weekStartsOn} onToggleWeekStart={() => setWeekStartsOn(prev => prev === 0 ? 1 : 0)} onVersionClick={() => setIsChangelogOpen(true)} />
             {currentUser.role === 'admin' && (
                 <AdminUsers />
             )}
             <div className="pt-4 text-center"><button onClick={handleLogout} className="text-red-500 text-sm font-medium">Log Out</button></div>
           </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <Header currentUser={currentUser} onSwitchUser={() => {}} />
      
      {/* Demo Mode Indicator */}
      {isDemoMode && (
         <div className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-4 py-1 text-center text-xs font-semibold flex items-center justify-center gap-2">
            <WifiOff size={12} />
            <span>Offline Demo Mode Active</span>
         </div>
      )}

      <main className="max-w-xl mx-auto px-4 py-4">{renderContent()}</main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <SelectionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} dayKey={selectedDayKey} onSelect={handlePhotoSelect} onGoogleSelect={() => {}} />
      <MonthPicker isOpen={isMonthPickerOpen} onClose={() => setIsMonthPickerOpen(false)} currentDate={currentDate} onSelectDate={setCurrentDate} />
      <Lightbox item={previewItem} onClose={() => setPreviewItem(null)} />
      <ActionMenu item={actionMenuItem} onClose={() => setActionMenuItem(null)} onDelete={handleDelete} onReplace={i => {setSelectedDayKey(i.day); setIsModalOpen(true);}} />
      
      {/* Global Elements */}
      {debugUI}
    </div>
  );
}

export default App;