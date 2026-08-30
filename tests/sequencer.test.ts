import { describe, expect, it } from "vitest";
import { parsePattern } from "../shared/patterns";
import {
  buildSequence,
  positionOf,
  resumeIndexFor,
} from "../shared/sequencer";

const P = parsePattern("1-2-3-4");

describe("buildSequence", () => {
  it("maxPosition 2 → posizioni 1,2,1 → 3 blocchi × 11 corde × 4 note", () => {
    expect(buildSequence(P, 2)).toHaveLength(3 * 11 * 4);
  });

  it("default use: maxPosition 12 → 23 blocchi", () => {
    expect(buildSequence(P, 12)).toHaveLength(23 * 11 * 4);
  });

  it("starts on low E, position 1, index finger, fret 1, midi 41", () => {
    const [e] = buildSequence(P, 2);
    expect(e).toEqual({ string: 6, fret: 1, finger: 1, midi: 41 });
  });

  it("second repetition moves to the 5th string", () => {
    const events = buildSequence(P, 2);
    expect(events[4].string).toBe(5);
    expect(events[4].midi).toBe(46); // A2(45) + tasto 1
  });

  it("turnaround: 6ª ripetizione sul cantino, 7ª torna alla 2ª corda", () => {
    const events = buildSequence(P, 2);
    expect(events[5 * 4].string).toBe(1);
    expect(events[6 * 4].string).toBe(2);
  });

  it("last event closes on the low E at position 1", () => {
    const events = buildSequence(P, 2);
    const last = events[events.length - 1];
    expect(last).toEqual({ string: 6, fret: 4, finger: 4, midi: 44 });
  });

  it("position 2 shifts frets: finger n → fret n+1", () => {
    const events = buildSequence(P, 2);
    const blockStart = 11 * 4; // inizio blocco posizione 2
    expect(events[blockStart]).toEqual({ string: 6, fret: 2, finger: 1, midi: 42 });
  });

  it("fingering: dito n → tasto posizione + n − 1", () => {
    const events = buildSequence(parsePattern("3-1-4-2"), 3);
    for (const e of events) {
      expect(e.fret).toBe(positionOf(e) + e.finger - 1);
      expect(positionOf(e)).toBeGreaterThanOrEqual(1);
      expect(positionOf(e)).toBeLessThanOrEqual(3);
    }
  });
});

describe("resumeIndexFor", () => {
  it("returns block start within the first block", () => {
    const events = buildSequence(P, 2);
    expect(resumeIndexFor(events, 10)).toBe(0);
  });

  it("returns block start within the second block", () => {
    const events = buildSequence(P, 2);
    expect(resumeIndexFor(events, 44 + 7)).toBe(44);
  });

  it("distinguishes the descending pass at the same position", () => {
    const events = buildSequence(P, 2);
    // terzo blocco: di nuovo posizione 1, in discesa
    expect(resumeIndexFor(events, 2 * 44 + 3)).toBe(2 * 44);
  });
});
