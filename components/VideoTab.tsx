import React, { useState, useEffect } from 'react';
import { RenderSettingsPanel } from './RenderSettings';
import { RenderSettings, SelectedItem, DayKey } from '../types';
import { generateVideo } from '../services/videoGenerator';
import { Loader2, PlayCircle, Download, CalendarRange } from 'lucide-react';
import { format, parseISO, isAfter, isBefore } from 'date-fns';

interface VideoTabProps {
  selections: Record<DayKey, SelectedItem>;
  calendarDays: { key: DayKey }[];
  settings: RenderSettings;
  onSettingsChange: (s: RenderSettings) => void;
  currentDate: Date;
  projectStartDate: string;
  projectEndDate: string;
}

export const VideoTab: React.FC<VideoTabProps> = ({
  selections,
  settings,
  onSettingsChange,
  currentDate,
  projectStartDate,
  projectEndDate
}) => {
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStatus, setRenderStatus] = useState('');
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);

  // Range State
  const [rangeStart, setRangeStart] = useState(projectStartDate);
  const [rangeEnd, setRangeEnd] = useState(projectEndDate);

  useEffect(() => {
     // Ensure range stays valid if project dates change
     if (!rangeStart) setRangeStart(projectStartDate);
     if (!rangeEnd) setRangeEnd(projectEndDate);
  }, [projectStartDate, projectEndDate]);

  const handleRender = async () => {
    setIsRendering(true);
    setRenderProgress(0);
    setVideoBlob(null);

    // Filter selections based on range
    const sortedKeys = Object.keys(selections)
        .filter(key => {
            return key >= rangeStart && key <= rangeEnd;
        })
        .sort();

    if (sortedKeys.length === 0) {
        alert("No photos selected in this date range.");
        setIsRendering(false);
        return;
    }

    try {
        const blob = await generateVideo(selections, sortedKeys, settings, (prog, status) => {
            setRenderProgress(prog);
            setRenderStatus(status);
        });
        setVideoBlob(blob);
    } catch (e) {
        console.error(e);
        alert("Error rendering video");
    } finally {
        setIsRendering(false);
    }
  };

  const totalSelectionCount = Object.keys(selections).length;
  // Calculate count within range
  const countInRange = Object.keys(selections).filter(k => k >= rangeStart && k <= rangeEnd).length;

  return (
    <div className="space-y-6 pb-24">
      {/* Range Selection Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
         <div className="flex items-center gap-2 mb-3">
            <CalendarRange size={18} className="text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Video Date Range</h3>
         </div>
         <div className="grid grid-cols-2 gap-3">
             <div>
                 <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Start</label>
                 <input 
                    type="date" 
                    value={rangeStart}
                    onChange={(e) => setRangeStart(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-2 text-sm text-slate-800 dark:text-white"
                 />
             </div>
             <div>
                 <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">End</label>
                 <input 
                    type="date" 
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-2 text-sm text-slate-800 dark:text-white"
                 />
             </div>
         </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 text-center">
        <h2 className="text-blue-900 dark:text-blue-100 font-bold text-lg">{countInRange} Photos in Range</h2>
        <p className="text-blue-600 dark:text-blue-300 text-sm">Ready to generate your montage</p>
      </div>

      <RenderSettingsPanel settings={settings} onChange={onSettingsChange} />

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800 dark:text-white">Preview & Export</h3>
        </div>

        {isRendering && (
          <div className="mb-6 space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
              <span>{renderStatus}</span>
              <span>{Math.round(renderProgress)}%</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${renderProgress}%` }}
              />
            </div>
          </div>
        )}

        {videoBlob && !isRendering && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-lg text-center animate-in fade-in">
            <p className="text-green-800 dark:text-green-300 font-medium mb-3">Video Ready!</p>
            <video 
              controls 
              className="w-full rounded-lg mb-4 bg-black shadow-md max-h-64 mx-auto" 
              src={URL.createObjectURL(videoBlob)} 
            />
            <a 
              href={URL.createObjectURL(videoBlob)} 
              download={`PhotoDay-${format(currentDate, 'yyyy-MM')}.mp4`}
              className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
            >
              <Download size={20} /> Save to Device
            </a>
          </div>
        )}

        <button
          onClick={handleRender}
          disabled={isRendering || countInRange === 0}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
        >
          {isRendering ? (
            <><Loader2 className="animate-spin" /> Processing...</>
          ) : (
            <><PlayCircle /> Generate Video</>
          )}
        </button>
      </div>
    </div>
  );
};