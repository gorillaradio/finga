import { describe, expect, it } from "vitest";
import { parseRun, serializeRun, type Run } from "../shared/runs";

const run: Run = {
  pattern: "3-2-4-2-1-2",
  bpm: 90,
  notesPerBeat: 2,
  feedback: 3,
  createdAt: "2026-08-30T10:00:00.000Z",
};

describe("serializeRun / parseRun", () => {
  it("round-trips", () => {
    expect(parseRun(serializeRun(run))).toEqual(run);
  });

  it("serializes numbers as strings (Lakebed alpha DB)", () => {
    const db = serializeRun(run);
    expect(db.bpm).toBe("90");
    expect(db.notesPerBeat).toBe("2");
    expect(db.feedback).toBe("3");
  });

  it("returns null on malformed records instead of throwing", () => {
    expect(parseRun({ ...serializeRun(run), bpm: "abc" })).toBeNull();
    expect(parseRun({ ...serializeRun(run), feedback: "7" })).toBeNull();
    expect(parseRun({ ...serializeRun(run), notesPerBeat: "3" })).toBeNull();
    expect(parseRun({ ...serializeRun(run), pattern: "1-9" })).toBeNull();
  });
});
