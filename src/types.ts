export type DayKey = string; // 'YYYY-MM-DD'

export type MediaSource = 'device' | 'google-photos' | 'server';

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  color: string;
  role?: 'admin' | 'user';
}

export interface SmartCropData {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface SelectedItem {
  id: string;
  source: MediaSource;
  day: DayKey;
  file?: File; 
  imageUrl: string;
  mimeType: string;
  addedBy?: string;
  smartCrop?: SmartCropData;
  caption?: string;
}

export type AspectRatio = '16:9' | '1:1' | '9:16';
export type TransitionType = 'none' | 'crossfade';

export interface RenderSettings {
  aspectRatio: AspectRatio;
  durationPerSlide: number; // seconds
  transition: TransitionType;
  showDateOverlay: boolean;
  smartCrop: boolean;
  backgroundColor: string;
}

export interface Project {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isOngoing?: boolean;
  selections: Record<DayKey, SelectedItem>;
  settings?: RenderSettings;
}

export interface DateCell {
  date: Date;
  key: DayKey;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export type AppTab = 'home' | 'calendar' | 'photos' | 'video' | 'settings';