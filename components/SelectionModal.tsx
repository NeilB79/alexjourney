import React, { useState, useEffect } from 'react';
import { X, Smartphone, Image as ImageIcon, UploadCloud, Search, CheckCircle, AlertTriangle } from 'lucide-react';
import { DayKey } from '../types';
import { format } from 'date-fns';
import { openGooglePicker } from '../services/googlePhotos';

interface SelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayKey: DayKey | null;
  onSelect: (file: File) => void;
  onGoogleSelect: (files: { url: string; id: string }[]) => void;
}

const MOCK_GOOGLE_PHOTOS = [
  "https://images.unsplash.com/photo-1707343843437-caacff5cfa74?w=400&q=80",
  "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400&q=80",
  "https://images.unsplash.com/photo-1707345512638-997d31a10eaa?w=400&q=80",
  "https://images.unsplash.com/photo-1707327956851-30a531b70cda?w=400&q=80",
  "https://images.unsplash.com/photo-1706049379414-437ec3a54e93?w=400&q=80",
];

const parseDateKey = (key: DayKey): Date => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const SelectionModal: React.FC<SelectionModalProps> = ({ 
  isOpen, onClose, dayKey, onSelect, onGoogleSelect 
}) => {
  // Default to Google Photos
  const [activeTab, setActiveTab] = useState<'device' | 'google'>('google');
  const [dragActive, setDragActive] = useState(false);
  
  // Google Picker State
  const [isPickerMockOpen, setIsPickerMockOpen] = useState(false);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [selectedMockPhotos, setSelectedMockPhotos] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
        // Reset to Google when reopening
        setActiveTab('google');
        setIsPickerMockOpen(false);
        setSelectedMockPhotos([]);
        setApiError(null);
        setPickerLoading(false);
    }
  }, [isOpen]);

  if (!isOpen || !dayKey) return null;

  const dateLabel = format(parseDateKey(dayKey), 'MMMM do, yyyy');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onSelect(e.target.files[0]);
      onClose();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onSelect(e.dataTransfer.files[0]);
      onClose();
    }
  };

  const handleGooglePicker = async () => {
    setPickerLoading(true);
    setApiError(null);
    try {
      // Pre-fill query with the selected date (YYYY-MM-DD) or just date string
      const query = dayKey; 
      
      await openGooglePicker(
        query,
        (files) => {
          onGoogleSelect(files);
          onClose();
        },
        () => setPickerLoading(false)
      );
    } catch (err: any) {
      console.warn("Google Picker interaction ended:", err);
      
      const msg = err?.message || '';

      // Force Demo mode activated
      if (msg === 'FORCE_DEMO_MODE') {
          setIsPickerMockOpen(true);
          setPickerLoading(false);
          return;
      }
      
      // Check if it was a user cancellation (popup closed)
      if (msg.includes('popup_closed') || msg.includes('cancel')) {
        setPickerLoading(false);
        return;
      }

      setApiError("Connection failed or blocked. Using demo mode.");
      setIsPickerMockOpen(true);
    } finally {
      setPickerLoading(false);
    }
  };

  const toggleMockSelection = (url: string) => {
    if (selectedMockPhotos.includes(url)) {
      setSelectedMockPhotos(prev => prev.filter(p => p !== url));
    } else {
      setSelectedMockPhotos(prev => [...prev, url]);
    }
  };

  const confirmMockSelection = () => {
      if (selectedMockPhotos.length > 0) {
          // Convert string[] to expected object format for mock
          onGoogleSelect(selectedMockPhotos.map(url => ({ url, id: 'mock-' + Math.random() })));
          onClose();
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 transition-all">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">{isPickerMockOpen ? 'Google Photos (Demo)' : 'Select Photo'}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{isPickerMockOpen ? 'Select mock items' : dateLabel}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X size={24} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        {isPickerMockOpen ? (
            <div className="flex flex-col h-full overflow-hidden">
                {apiError && (
                  <div className="bg-amber-50 dark:bg-amber-900/30 p-2 text-xs text-amber-700 dark:text-amber-400 flex items-center justify-center gap-2">
                    <AlertTriangle size={12} /> {apiError}
                  </div>
                )}
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex gap-2">
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center px-3 h-10">
                        <Search size={18} className="text-slate-400 mr-2" />
                        <span className="text-slate-500 text-sm">Photos from {dateLabel}</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-950">
                    <div className="grid grid-cols-3 gap-1">
                        {MOCK_GOOGLE_PHOTOS.map((url, idx) => {
                            const isSelected = selectedMockPhotos.includes(url);
                            return (
                                <div 
                                    key={idx} 
                                    onClick={() => toggleMockSelection(url)}
                                    className={`relative aspect-square cursor-pointer overflow-hidden group ${isSelected ? 'ring-4 ring-blue-500 z-10' : ''}`}
                                >
                                    <img src={url} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Mock" />
                                    {isSelected && (
                                        <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-0.5">
                                            <CheckCircle size={16} fill="white" className="text-blue-500" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                    <button onClick={() => setIsPickerMockOpen(false)} className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">Back</button>
                    <button 
                        disabled={selectedMockPhotos.length === 0}
                        onClick={confirmMockSelection}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl font-medium transition-colors text-sm"
                    >
                        Add {selectedMockPhotos.length || ''} Photo{selectedMockPhotos.length !== 1 ? 's' : ''}
                    </button>
                </div>
            </div>
        ) : (
            <>
                <div className="flex border-b border-slate-200 dark:border-slate-800">
                <button 
                    className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 touch-manipulation ${activeTab === 'google' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    onClick={() => setActiveTab('google')}
                >
                    <ImageIcon size={20} /> Google Photos
                </button>
                <button 
                    className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 touch-manipulation ${activeTab === 'device' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    onClick={() => setActiveTab('device')}
                >
                    <Smartphone size={20} /> My Device
                </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                {activeTab === 'device' ? (
                    <div 
                    className={`border-2 border-dashed rounded-xl h-64 flex flex-col items-center justify-center transition-colors ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    >
                    <UploadCloud size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
                    <p className="text-slate-600 dark:text-slate-300 font-medium mb-2">Drag & Drop photo here</p>
                    <p className="text-xs text-slate-400 mb-6">Supports JPG, PNG, WEBP</p>
                    
                    <label className="w-full max-w-xs sm:w-auto text-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium cursor-pointer transition-colors shadow-sm active:scale-95 transform">
                        Browse Files
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Connect Google Photos</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xs">
                        We'll search for photos from <b>{dateLabel}</b>.
                    </p>
                    <button 
                        onClick={handleGooglePicker}
                        disabled={pickerLoading}
                        className="w-full max-w-xs sm:w-auto px-6 py-3 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors active:bg-slate-100"
                    >
                        {pickerLoading ? <span className="animate-pulse">Loading...</span> : <><ImageIcon size={20} /> Open Picker</>}
                    </button>
                    </div>
                )}
                </div>
            </>
        )}
      </div>
    </div>
  );
};