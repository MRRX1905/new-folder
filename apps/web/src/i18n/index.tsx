import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Locale } from "@rf/shared";
import { en } from "./en";
import { id } from "./id";

const dictionaries = { id, en } as const;

type DotPaths<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : DotPaths<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type TranslationKey = DotPaths<typeof id>;

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

const resolve = (dictionary: unknown, key: string): string => {
  const value = key.split(".").reduce<unknown>((current, part) => {
    if (current && typeof current === "object") {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, dictionary);

  return typeof value === "string" ? value : key;
};

/** UI strings only (TD-15): content translation goes through the API later. */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("id");
  const dictionary = dictionaries[locale];

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    document.documentElement.lang = next;
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key) => resolve(dictionary, key),
    }),
    [dictionary, locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export const useLocale = (): LocaleContextValue => {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside LocaleProvider");
  return context;
};
