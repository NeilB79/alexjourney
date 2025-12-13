export type DayKey = string; // 'YYYY-MM-DD'

export type MediaSource = 'device' | 'google-photos';

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  color: string; // Tailwinc color class prefix, e.g. 'blue'
}

export interface SelectedItem {
  id: string;
  source: MediaSource;
  day: DayKey;
  file?: File; // For device files
  imageUrl: string; // Blob URL or Remote URL
  mimeType: string;
  width?: number;
  height?: number;
  caption?: string;
  addedBy?: string; // User ID
}

export type AspectRatio = '16:9' | '1:1' | '9:16';
export type TransitionType = 'none' | 'crossfade';

export interface RenderSettings {
  aspectRatio: AspectRatio;
  durationPerSlide: number; // seconds
  transition: TransitionType;
  showDateOverlay: boolean;
  smartCrop: boolean; // Face focus / Top weighted
  backgroundColor: string;
}

export interface Project {
  id: string;
  name: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  isOngoing?: boolean;
  selections: Record<DayKey, SelectedItem>;
}

export interface ProjectState {
  project: Project;
  settings: RenderSettings;
  darkMode: boolean;
  currentUser: UserProfile;
}

export interface DateCell {
  date: Date;
  key: DayKey;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export type AppTab = 'home' | 'calendar' | 'photos' | 'video' | 'settings';