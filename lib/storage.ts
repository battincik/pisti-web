import type { GameMode } from "./game";

export type Stats = {
  games: number;
  wins: number;
  losses: number;
  draws: number;
  pistis: number;
  bestScore: number;
  totalCaptured: number;
};

export type Preferences = {
  sound: boolean;
  reducedMotion: boolean;
  mode: GameMode;
};

export type HistoryItem = {
  id: string;
  at: string;
  mode: GameMode;
  human: number;
  bot: number;
  result: "win" | "loss" | "draw";
};

const KEYS = {
  stats: "pisti.stats.v1",
  preferences: "pisti.preferences.v1",
  history: "pisti.history.v1",
};

export const defaultStats: Stats = {
  games: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  pistis: 0,
  bestScore: 0,
  totalCaptured: 0,
};

export const defaultPreferences: Preferences = {
  sound: true,
  reducedMotion: false,
  mode: "single",
};

export function loadLocal<T>(key: keyof typeof KEYS, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(KEYS[key]);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveLocal<T>(key: keyof typeof KEYS, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS[key], JSON.stringify(value));
}

export function clearAllLocal() {
  if (typeof window === "undefined") return;
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
}
