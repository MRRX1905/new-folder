import { describe, expect, it } from "vitest";
import { sortKey } from "./sort.js";

describe("sortKey", () => {
  it("lowercases and trims", () => {
    expect(sortKey("  ChatGPT  ")).toBe("chatgpt");
  });

  it("strips diacritics", () => {
    expect(sortKey("Café Déjà vu")).toBe("cafe deja vu");
  });

  it("keeps ordering-friendly plain characters", () => {
    expect(sortKey("Media & Content Tools")).toBe("media & content tools");
  });
});
