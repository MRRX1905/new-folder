import { create } from "zustand";
import { DEFAULT_THEME, isThemeId, type ThemeId } from "./themes";

const STORAGE_KEY = "rf.theme";

export const applyTheme = (theme: ThemeId): void => {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
};

const readStoredTheme = (): ThemeId => {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const stored = window.sessionStorage.getItem(STORAGE_KEY);
  return isThemeId(stored) ? stored : DEFAULT_THEME;
};

interface ThemeState {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

/** Session storage only: reopening the site returns to the default theme. */
export const useTheme = create<ThemeState>((set) => ({
  theme: readStoredTheme(),
  setTheme: (theme) => {
    applyTheme(theme);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage can be unavailable in private modes; the theme still applies.
    }
    set({ theme });
  },
}));

export const initTheme = (): void => {
  applyTheme(useTheme.getState().theme);
};
