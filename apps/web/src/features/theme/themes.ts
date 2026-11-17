export const THEMES = [
  { id: "void", label: "VOID" },
  { id: "ember", label: "EMBER" },
  { id: "ion", label: "ION" },
  { id: "chrome", label: "CHROME" },
  { id: "signal", label: "SIGNAL" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const DEFAULT_THEME: ThemeId = "void";

export const isThemeId = (value: string | null): value is ThemeId =>
  THEMES.some((theme) => theme.id === value);
