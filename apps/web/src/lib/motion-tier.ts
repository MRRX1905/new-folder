export type MotionTier = "full" | "lite";

export interface MotionSignals {
  deviceMemory?: number;
  hardwareConcurrency?: number;
  saveData?: boolean;
  reducedMotion?: boolean;
}

/**
 * `lite` on low-memory/low-core devices, data saver, or reduced motion (TD-10).
 * Reduce motion never disables animation entirely — the tier only sheds the
 * expensive effects.
 */
export const detectMotionTier = (signals: MotionSignals): MotionTier => {
  if (signals.reducedMotion || signals.saveData) return "lite";
  if (signals.deviceMemory !== undefined && signals.deviceMemory <= 4) return "lite";
  if (signals.hardwareConcurrency !== undefined && signals.hardwareConcurrency <= 4) return "lite";
  return "full";
};

interface NavigatorWithHints extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

export const readMotionSignals = (): MotionSignals => {
  if (typeof window === "undefined") return { reducedMotion: true };

  const nav = navigator as NavigatorWithHints;
  return {
    deviceMemory: nav.deviceMemory,
    hardwareConcurrency: nav.hardwareConcurrency,
    saveData: nav.connection?.saveData,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  };
};

export const bootMotionTier = (): MotionTier => detectMotionTier(readMotionSignals());
