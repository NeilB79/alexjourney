import { RenderSettings, UserProfile } from "./types";

export const DEFAULT_SETTINGS: RenderSettings = {
  aspectRatio: '16:9',
  durationPerSlide: 2.0,
  transition: 'none',
  showDateOverlay: true,
  smartCrop: false,
  backgroundColor: '#000000',
};

export const ASPECT_RATIOS = {
  '16:9': { width: 1920, height: 1080, label: 'Landscape (16:9)' },
  '1:1': { width: 1080, height: 1080, label: 'Square (1:1)' },
  '9:16': { width: 1080, height: 1920, label: 'Portrait (9:16)' },
};

export const USERS: UserProfile[] = [
  { id: 'u1', name: 'Me', avatar: 'M', color: 'blue' },
  { id: 'u2', name: 'Wife', avatar: 'W', color: 'pink' },
];

export const GOOGLE_PHOTOS_SCOPE = 'https://www.googleapis.com/auth/photospicker.mediaitems.readonly';