import { describe, expect, it } from "vitest";
import { computeUserProfile } from "../shared/profile";
import type { Run } from "../shared/runs";

function run(partial: Partial<Run>): Run {
  return {
    pattern: "1-2-3-4",
    bpm: 120,
    notesPerBeat: 1,
    feedback: 3,
    createdAt: "2026-08-30T10:00:00.000Z",
    ...partial,
  };
}

describe("computeUserProfile", () => {
  it("returns zeros with no runs", () => {
    expect(computeUserProfile([])).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0 });
  });

  it("all-index pattern with worst feedback loads only finger 1", () => {
    const prof = computeUserProfile([run({ pattern: "1-1-1-1", feedback: 1 })]);
    // speed = 1, difficoltà = 5, tutto il peso sul dito 1
    expect(prof[1]).toBeCloseTo(5, 10);
    expect(prof[2]).toBe(0);
    expect(prof[3]).toBe(0);
    expect(prof[4]).toBe(0);
  });

  it("same feedback at lower speed weighs more", () => {
    const slow = computeUserProfile([run({ pattern: "2-2-2-2", feedback: 2, bpm: 60 })]);
    const fast = computeUserProfile([run({ pattern: "2-2-2-2", feedback: 2, bpm: 120 })]);
    expect(slow[2]).toBeGreaterThan(fast[2]);
  });

  it("notesPerBeat doubles the effective speed", () => {
    const oneNote = computeUserProfile([run({ pattern: "2-2-2-2", feedback: 2, bpm: 60, notesPerBeat: 1 })]);
    const twoNotes = computeUserProfile([run({ pattern: "2-2-2-2", feedback: 2, bpm: 60, notesPerBeat: 2 })]);
    expect(oneNote[2]).toBeCloseTo(twoNotes[2] * 2, 10);
  });

  it("averages across runs", () => {
    const prof = computeUserProfile([
      run({ pattern: "1-1-1-1", feedback: 1 }),
      run({ pattern: "1-1-1-1", feedback: 5 }),
    ]);
    // (5 + 1) / 2 run = 3
    expect(prof[1]).toBeCloseTo(3, 10);
  });
});
