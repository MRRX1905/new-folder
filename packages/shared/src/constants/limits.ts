/** Payload limits from docs/api-spec.md §Batas payload dan timeout. */
export const LIMITS = {
  jsonBodyBytes: 1024 * 1024,
  mediaRasterBytes: 5 * 1024 * 1024,
  mediaSvgBytes: 512 * 1024,
  resumeBytes: 10 * 1024 * 1024,
  restoreMultipartBytes: 100 * 1024 * 1024,
  restoreWebBytes: 80 * 1024 * 1024,
  backupDumpBytes: 100 * 1024 * 1024,
} as const;
