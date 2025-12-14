import React from 'react';
import { X, Calendar, User } from 'lucide-react';
import { SelectedItem } from '../types';
import { format } from 'date-fns';

interface LightboxProps {
  item: SelectedItem | null;
  onClose: () => void;
}

const parseDateKey = (key: string): Date => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const Lightbox: React.FC<LightboxProps> = ({ item, onClose }) => {
  if (!item) return null;

  const dateLabel = format(parseDateKey(item.day), 'MMMM do, yyyy');
  const uploadDate = item.createdAt ? format(new Date(item.createdAt), 'MMM d, h:mm a') : 'Unknown';

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
        <h3 className="text-white font-medium text-lg drop-shadow-md">{dateLabel}</h3>
        <button 
          onClick={onClose}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-md"
        >
          <X size={24} />
        </button>
      </div>

      {/* Image Container */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-8 touch-none">
        <img 
          src={item.imageUrl} 
          alt={dateLabel}
          className="max-w-full max-h-full object-contain shadow-2xl"
        />
      </div>
      
      {/* Metadata Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 pb-8 text-white">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border border-white/20 bg-slate-800`}>
                    {item.addedByName ? item.addedByName[0].toUpperCase() : '?'}
                </div>
                <div>
                    <div className="text-sm font-semibold flex items-center gap-2">
                        {item.addedByName || 'Unknown User'}
                    </div>
                    <div className="text-xs text-white/70 flex items-center gap-1">
                        <Calendar size={10} /> Uploaded {uploadDate}
                    </div>
                </div>
            </div>
            <div className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded">
                {item.mimeType.split('/')[1].toUpperCase()}
            </div>
        </div>
      </div>
    </div>
  );
};