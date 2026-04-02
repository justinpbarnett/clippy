export const FPS = 30;

// Scene start frames
export const SCENE = {
  INTRO: 0,           // 0s  - 2s  (60f)
  COPY: 60,           // 2s  - 8s  (180f)
  HISTORY: 240,       // 8s  - 14s (180f)
  SEARCH: 420,        // 14s - 19s (150f)
  FAVORITES: 570,     // 19s - 24s (150f)
  SNIPPETS: 720,      // 24s - 31s (210f)
  SHORTCUT: 930,      // 31s - 34s (90f)
  OUTRO: 1020,        // 34s - 36s (60f) -- but we allow up to 36s
} as const;

export const SCENE_DURATION = {
  INTRO: 60,
  COPY: 180,
  HISTORY: 180,
  SEARCH: 150,
  FAVORITES: 150,
  SNIPPETS: 210,
  SHORTCUT: 90,
  OUTRO: 60,
} as const;

// Colors
export const COLORS = {
  bg1: '#0a0a1a',
  bg2: '#1a1040',
  bg3: '#0f0620',
  accent: '#6d28d9',
  accentLight: '#a78bfa',
  white: '#ffffff',
  gray: 'rgba(255,255,255,0.6)',
  calloutBg: 'rgba(10,10,30,0.85)',
};

// Popup dimensions (matches extension at 380px wide, up to 500px tall)
export const POPUP_W = 380;
export const POPUP_H = 500;

// Scale factor to display popup nicely in 1080p frame
export const POPUP_SCALE = 2.2;
