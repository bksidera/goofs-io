export const GAME_WIDTH = 360;
export const GAME_HEIGHT = 640;
export const FONT = "'Courier New', monospace";

export const COLORS = {
  INK: '#16201F',
  PAPER: '#F4F7F3',
  PAPER_DARK: '#DCE5DF',
  TEAL: '#4DE1C1',
  TEAL_DARK: '#177C70',
  RED: '#FF3B4F',
  RED_DARK: '#8F1726',
  GOLD: '#FFD166',
  BLUE: '#2557D6',
  WIN98: '#C0C0C0',
  BG: '#07100F',
  MUTED: '#6C7B77',
  WHITE: '#FFFFFF',
};

export const BUTTON_W = 128;
export const BUTTON_H = 38;
export const MODAL_W = 238;
export const MODAL_H = 132;
export const HEADER_H = 74;
export const FOOTER_H = 62;

export const CURSOR_RADIUS = 10;
export const REJECTION_SCORE = 180;
export const CLEAN_REJECTION_BONUS = 70;
export const BOSS_REQUIRED_HITS = 3;

export const clampBox = (v, min, max) => Math.max(min, Math.min(max, v));
