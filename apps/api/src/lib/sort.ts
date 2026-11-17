/**
 * Sort key: lowercase, diacritics stripped, trimmed (TD-07).
 * Must stay identical to the seed writer and every CMS create/update path.
 */
export const sortKey = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
