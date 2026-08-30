import { describe, expect, it } from "vitest";
import {
  PATTERN_CATALOG,
  fingerFrequency,
  formatPattern,
  parsePattern,
  patternFingerProfile,
  randomPattern,
  startingFinger,
} from "../shared/patterns";

describe("parsePattern / formatPattern", () => {
  it("parses a dash-separated sequence", () => {
    expect(parsePattern("3-2-4-2-1-2")).toEqual([3, 2, 4, 2, 1, 2]);
  });

  it("round-trips", () => {
    expect(formatPattern(parsePattern("1-2-3-4"))).toBe("1-2-3-4");
  });

  it("rejects invalid fingers", () => {
    expect(() => parsePattern("1-2-5")).toThrow();
    expect(() => parsePattern("")).toThrow();
  });
});

describe("caratteristiche", () => {
  it("computes starting finger", () => {
    expect(startingFinger(parsePattern("3-2-4-2-1-2"))).toBe(3);
  });

  it("computes finger frequency", () => {
    expect(fingerFrequency(parsePattern("3-2-4-2-1-2"))).toEqual({
      1: 1,
      2: 3,
      3: 1,
      4: 1,
    });
  });

  it("profile: frequenza domina, il dito iniziale ha un bonus", () => {
    const prof = patternFingerProfile(parsePattern("3-2-4-2-1-2"));
    // il medio (3 occorrenze) pesa più dell'anulare (1 occorrenza + bonus iniziale)
    expect(prof[2]).toBeGreaterThan(prof[3]);
    // l'anulare col bonus pesa più di indice e mignolo
    expect(prof[3]).toBeGreaterThan(prof[1]);
    expect(prof[1]).toBeCloseTo(prof[4], 10);
    const sum = prof[1] + prof[2] + prof[3] + prof[4];
    expect(sum).toBeCloseTo(1, 10);
  });
});

describe("catalogo", () => {
  it("contains all 24 permutations plus curated long patterns", () => {
    expect(PATTERN_CATALOG.length).toBeGreaterThanOrEqual(26);
    const perms = PATTERN_CATALOG.filter((p) => p.length === 7); // "1-2-3-4"
    expect(new Set(perms).size).toBe(24);
  });

  it("every entry parses", () => {
    for (const p of PATTERN_CATALOG) expect(() => parsePattern(p)).not.toThrow();
  });

  it("randomPattern avoids the excluded pattern", () => {
    for (let i = 0; i < 50; i++) {
      expect(randomPattern("1-2-3-4")).not.toBe("1-2-3-4");
    }
  });
});
