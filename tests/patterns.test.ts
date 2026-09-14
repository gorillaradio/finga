import { describe, expect, it } from "vitest";
import {
  fingerFrequency,
  formatPattern,
  parsePattern,
  patternFingerProfile,
  patternsOfLength,
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

describe("generazione", () => {
  it("4 note: esattamente le 24 permutazioni", () => {
    const all = patternsOfLength(4);
    expect(all.length).toBe(24);
    expect(new Set(all).size).toBe(24);
    for (const p of all) expect([...parsePattern(p)].sort()).toEqual([1, 2, 3, 4]);
  });

  it("6 note: 600 pattern, inclusi quelli scritti a mano in passato", () => {
    const all = patternsOfLength(6);
    expect(all.length).toBe(600);
    expect(new Set(all).size).toBe(600);
    expect(all).toContain("1-2-1-3-1-4");
    expect(all).toContain("3-2-4-2-1-2");
  });

  it("ogni pattern usa tutte le dita e non ripete un dito di fila", () => {
    for (const length of [4, 6] as const) {
      for (const p of patternsOfLength(length)) {
        const f = parsePattern(p);
        expect(f.length).toBe(length);
        expect(new Set(f).size).toBe(4);
        for (let i = 1; i < f.length; i++) expect(f[i]).not.toBe(f[i - 1]);
      }
    }
  });

  it("randomPattern rispetta la lunghezza ed evita il pattern escluso", () => {
    for (let i = 0; i < 50; i++) {
      const p4 = randomPattern(4, "1-2-3-4");
      expect(p4).not.toBe("1-2-3-4");
      expect(parsePattern(p4).length).toBe(4);
      expect(parsePattern(randomPattern(6)).length).toBe(6);
    }
  });
});
