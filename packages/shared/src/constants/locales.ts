export const LOCALES = ["id", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "id";

export const COLLECTION_TYPES = ["ai", "tools", "websites"] as const;
export type CollectionTypeParam = (typeof COLLECTION_TYPES)[number];
