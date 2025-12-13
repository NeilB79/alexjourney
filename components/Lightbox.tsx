import React from 'react';
import { X } from 'lucide-react';
import { SelectedItem } from '../types';
import { format, parseISO } from 'date-fns';

interface LightboxProps {
  item: SelectedItem | null;
  onClose: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({ item, onClose }) => {
  if (!item) return null;

  const dateLabel = format(parseISO(item.day), 'MMMM do, yyyy');

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 absolute top-0 left-0 right-0 z-10 backdrop-blur-sm">
        <h3 className="text-white font-medium text-lg shadow-black/50 drop-shadow-md">{dateLabel}</h3>
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
      
      {/* Simple caption area if needed later */}
      {item.caption && (
        <div className="absolute bottom-8 left-0 right-0 text-center p-4">
          <span className="bg-black/60 text-white px-4 py-2 rounded-full text-sm backdrop-blur-md">
            {item.caption}
          </span>
        </div>
      )}
    </div>
  );
};
