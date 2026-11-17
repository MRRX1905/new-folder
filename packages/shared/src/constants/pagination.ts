/** Pagination steps from TD-08. */
export const PAGINATION = {
  collections: { initial: 12, step: 12, max: 48 },
  projects: { initial: 12, step: 12, max: 48 },
  timeline: { initial: 20, step: 20, max: 100 },
  media: { initial: 24, step: 48, max: 96 },
  adminList: { initial: 24, step: 24, max: 100 },
  search: { perGroup: 5, total: 20 },
} as const;
