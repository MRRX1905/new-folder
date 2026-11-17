import { describe, expect, it } from "vitest";
import { detectMotionTier } from "./motion-tier";

describe("detectMotionTier", () => {
  it("uses the full tier on capable devices", () => {
    expect(detectMotionTier({ deviceMemory: 8, hardwareConcurrency: 8 })).toBe("full");
  });

  it("falls back to lite on low memory", () => {
    expect(detectMotionTier({ deviceMemory: 4, hardwareConcurrency: 8 })).toBe("lite");
  });

  it("falls back to lite on few cores", () => {
    expect(detectMotionTier({ deviceMemory: 8, hardwareConcurrency: 4 })).toBe("lite");
  });

  it("respects save data and reduced motion", () => {
    expect(detectMotionTier({ saveData: true })).toBe("lite");
    expect(detectMotionTier({ reducedMotion: true })).toBe("lite");
  });
});
