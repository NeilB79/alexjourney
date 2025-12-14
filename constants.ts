import { RenderSettings, UserProfile } from "./types";

export const APP_VERSION = "v1.1.4";
export const BUILD_DATE = new Date().toDateString();

export const CHANGELOG = [
  {
    version: "v1.1.4",
    date: "2025-01-27",
    changes: [
      "Fixed version synchronization issue.",
      "Applied Admin User Editing and Google Photos features to main build.",
      "Added Docker and Nginx configurations."
    ]
  },
  {
    version: "v1.1.3",
    date: "2025-01-27",
    changes: [
      "Enabled Admin User Editing (Rename/Password Reset).",
      "Integrated Google Photos Picker.",
      "Fixed Header to lock to current session."
    ]
  },
  {
    version: "v1.1.2",
    date: "2025-01-27",
    changes: [
      "Added Offline Demo Mode for testing without backend.",
      "Implemented resilient API client with auto-fallback.",
      "Added Debug Console and Logging System.",
      "Added Changelog view."
    ]
  },
  {
    version: "v1.1.0",
    date: "2025-01-26",
    changes: [
      "Added Multi-user Authentication (Admin/User roles).",
      "Implemented Server Synchronization.",
      "Added Admin User Management panel.",
      "Added Smart Crop (Face Focus) for video generation.",
      "Added Persistent Video Settings."
    ]
  },
  {
    version: "v1.0.2",
    date: "2025-01-25",
    changes: [
      "Improved Dark Mode support.",
      "UI Polish and transitions.",
      "Fixed aspect ratio selection bugs."
    ]
  },
  {
    version: "v1.0.0",
    date: "2025-01-01",
    changes: [
      "Initial Release.",
      "Basic Photo Upload and Calendar View.",
      "Client-side Video Generation."
    ]
  }
];

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