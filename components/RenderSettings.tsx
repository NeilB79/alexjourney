import React, { useState, useEffect } from 'react';
import { RenderSettings, AspectRatio } from '../types';
import { ASPECT_RATIOS } from '../constants';
import { Settings, Film, Clock, Layers, Crop, Moon, Calendar, AlertOctagon, Trash2, X, Globe, Clipboard, Check, Key, Save, RefreshCw } from 'lucide-react';
import { getCredentials, setCredentials } from '../services/googlePhotos';

interface RenderSettingsProps {
  settings: RenderSettings;
  onChange: (settings: RenderSettings) => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  weekStartsOn?: 0 | 1;
  onToggleWeekStart?: () => void;
  onResetProject?: () => void;
}

export const RenderSettingsPanel: React.FC<RenderSettingsProps> = ({ 
  settings, onChange, darkMode, onToggleDarkMode, weekStartsOn, onToggleWeekStart, onResetProject 
}) => {
  const [resetSliderValue, setResetSliderValue] = useState(0);
  const [resetUnlocked, setResetUnlocked] = useState(false);
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Custom Credentials State
  const [customClientId, setCustomClientId] = useState('');
  const [customApiKey, setCustomApiKey] = useState('');
  const [credsSaved, setCredsSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setOrigin(window.location.origin);
        const creds = getCredentials();
        setCustomClientId(creds.clientId);
        setCustomApiKey(creds.apiKey);
    }
  }, []);

  const update = (key: keyof RenderSettings, value: any) => {
    onChange({ ...settings, [key]: value });
  };

  const handleResetSlide = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setResetSliderValue(val);
    if (val === 100) {
      setResetUnlocked(true);
    }
  };

  const cancelReset = () => {
    setResetUnlocked(false);
    setResetSliderValue(0);
  };

  const confirmReset = () => {
    if (onResetProject) {
        onResetProject();
        cancelReset();
    }
  };

  const copyOrigin = () => {
    navigator.clipboard.writeText(origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveCredentials = () => {
      setCredentials(customClientId, customApiKey);
      setCredsSaved(true);
      setTimeout(() => setCredsSaved(false), 2000);
  };

  const Toggle = ({ checked, onChange, label, icon: Icon }: any) => (
    <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
       <div className="flex items-center gap-3">
         {Icon && <Icon size={18} className="text-slate-500 dark:text-slate-400" />}
         <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
       </div>
       <div className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
          <div className="w-11 h-6 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
       </div>
    </label>
  );

  const showPreferences = onToggleDarkMode || (onToggleWeekStart && weekStartsOn !== undefined);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm transition-colors">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
        <Settings className="text-slate-400" size={20} />
        <h3 className="font-semibold text-slate-800 dark:text-white">Settings</h3>
      </div>

      <div className="space-y-6">
        {/* App Preferences Section */}
        {showPreferences && (
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Preferences
          </label>
          <div className="grid grid-cols-1 gap-3">
            {onToggleDarkMode && (
               <Toggle 
                  checked={!!darkMode} 
                  onChange={onToggleDarkMode} 
                  label="Dark Mode" 
                  icon={Moon}
               />
            )}
            {onToggleWeekStart && weekStartsOn !== undefined && (
            <Toggle 
               checked={weekStartsOn === 1} 
               onChange={onToggleWeekStart} 
               label="Start Week on Monday" 
               icon={Calendar}
            />
            )}
          </div>
        </div>
        )}

        {showPreferences && <div className="h-px bg-slate-100 dark:bg-slate-800" />}

        {/* Video Settings Section */}
        <div>
           <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
             <Film size={14} /> Video Configuration
           </label>
           
           {/* Aspect Ratio */}
           <div className="mb-4">
             <div className="grid grid-cols-3 gap-2 sm:gap-3">
               {(Object.keys(ASPECT_RATIOS) as AspectRatio[]).map((ratio) => (
                 <button
                   key={ratio}
                   onClick={() => update('aspectRatio', ratio)}
                   className={`px-2 sm:px-3 py-3 rounded-xl text-xs sm:text-sm font-medium border transition-all touch-manipulation ${
                     settings.aspectRatio === ratio
                       ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                       : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 active:bg-slate-50'
                   }`}
                 >
                   {ASPECT_RATIOS[ratio].label.split(' ')[0]} <span className="hidden sm:inline">({ratio})</span>
                 </button>
               ))}
             </div>
           </div>

           {/* Duration Slider */}
           <div className="mb-4">
             <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1"><Clock size={12}/> Duration per slide</span>
                <span className="text-slate-900 dark:text-white">{settings.durationPerSlide}s</span>
             </label>
             <input
               type="range"
               min="0.5"
               max="5"
               step="0.5"
               value={settings.durationPerSlide}
               onChange={(e) => update('durationPerSlide', parseFloat(e.target.value))}
               className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 dark:[&::-webkit-slider-thumb]:bg-blue-500"
             />
           </div>

           {/* Other Video Toggles */}
           <div className="grid grid-cols-1 gap-3">
              <Toggle 
                 checked={settings.transition === 'crossfade'} 
                 onChange={(v: boolean) => update('transition', v ? 'crossfade' : 'none')} 
                 label="Crossfade Transition"
                 icon={Layers}
              />
              <Toggle 
                 checked={settings.showDateOverlay} 
                 onChange={(v: boolean) => update('showDateOverlay', v)} 
                 label="Show Date Overlay" 
              />
              <Toggle 
                 checked={settings.smartCrop} 
                 onChange={(v: boolean) => update('smartCrop', v)} 
                 label="Smart Crop (Face Focus)" 
                 icon={Crop}
              />
           </div>
        </div>

        {/* OAuth Helper Section */}
        <div className="h-px bg-slate-100 dark:bg-slate-800" />
        <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Globe size={14} /> OAuth Configuration
            </label>
            
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-lg p-3 mb-4">
                <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                   <b>Seeing "storagerelay" or "redirect_uri" errors?</b><br/>
                   This happens when the Authorized Origin in Google Cloud Console doesn't match your app's current URL.
                   <br/><br/>
                   1. Copy the <b>Current Origin</b> below.<br/>
                   2. Add it to "Authorized JavaScript origins" in your Google Cloud Console.<br/>
                   3. Enter your own Client ID and API Key below.
                </p>
            </div>

            <div className="space-y-3">
                <div>
                    <label className="text-xs text-slate-500 mb-1 block">Current Origin (Add to GCP)</label>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 bg-slate-100 dark:bg-slate-950 p-2.5 rounded-lg text-[10px] sm:text-xs font-mono text-slate-700 dark:text-slate-300 break-all border border-slate-200 dark:border-slate-800">
                            {origin}
                        </code>
                        <button 
                            onClick={copyOrigin}
                            className="p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors flex-shrink-0"
                            title="Copy to clipboard"
                        >
                            {copied ? <Check size={16} className="text-green-500" /> : <Clipboard size={16} />}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="text-xs text-slate-500 mb-1 block">Google Client ID</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={customClientId}
                            onChange={(e) => setCustomClientId(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 pl-9 text-xs font-mono text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Example: 123456789-abc...apps.googleusercontent.com"
                        />
                        <Key size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    </div>
                </div>

                <div>
                    <label className="text-xs text-slate-500 mb-1 block">Google API Key</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={customApiKey}
                            onChange={(e) => setCustomApiKey(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 pl-9 text-xs font-mono text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Example: AIzaSy..."
                        />
                        <Key size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    </div>
                </div>

                <button 
                    onClick={handleSaveCredentials}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                    {credsSaved ? <><Check size={16} /> Saved</> : <><Save size={16} /> Save Credentials</>}
                </button>
            </div>
        </div>

        {onResetProject && <div className="h-px bg-slate-100 dark:bg-slate-800" />}

        {/* Danger Zone: Two-Step Reset */}
        {onResetProject && (
        <div className="pt-2">
           <label className="block text-xs font-semibold text-red-500 uppercase tracking-wider mb-3 flex items-center gap-2">
             <AlertOctagon size={14} /> Danger Zone
           </label>
           
           <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl p-4">
              <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Reset Project Data</p>
              <p className="text-xs text-red-600 dark:text-red-400 mb-4">Permanently remove all photos and settings.</p>

              {!resetUnlocked ? (
                <div className="relative h-12 bg-white dark:bg-slate-800 rounded-full border border-red-200 dark:border-red-900/50 overflow-hidden select-none">
                   {/* Background Text */}
                   <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-red-300 dark:text-red-900 uppercase tracking-widest pointer-events-none">
                      Slide to Unlock Reset
                   </div>
                   
                   {/* Slider Progress */}
                   <div 
                      className="absolute inset-y-0 left-0 bg-red-100 dark:bg-red-900/30 transition-all duration-75 ease-out pointer-events-none"
                      style={{ width: `${resetSliderValue}%` }}
                   />
                   
                   {/* Input Range */}
                   <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={resetSliderValue}
                      onChange={handleResetSlide}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize touch-pan-x"
                   />

                   {/* Thumb visual */}
                   <div 
                      className="absolute top-1 bottom-1 w-10 bg-red-500 rounded-full shadow-md flex items-center justify-center pointer-events-none transition-all ease-out"
                      style={{ left: `calc(${resetSliderValue}% - ${resetSliderValue * 0.4}px)` }} // simple clamp approximation
                   >
                      <Trash2 size={16} className="text-white" />
                   </div>
                </div>
              ) : (
                <div className="flex gap-2 animate-in fade-in zoom-in-95 duration-200">
                    <button 
                        onClick={confirmReset}
                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors"
                    >
                        <Trash2 size={16} /> Confirm Delete
                    </button>
                    <button 
                        onClick={cancelReset}
                        className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
              )}
           </div>
        </div>
        )}
      </div>
    </div>
  );
};