import { parsePattern, patternFingerProfile, type Finger } from "./patterns";
import type { Run } from "./runs";

const REFERENCE_NOTES_PER_MINUTE = 120;

export function computeUserProfile(runs: Run[]): Record<Finger, number> {
  const totals: Record<Finger, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  if (runs.length === 0) return totals;

  for (const run of runs) {
    const speed = (run.bpm * run.notesPerBeat) / REFERENCE_NOTES_PER_MINUTE;
    const difficulty = (6 - run.feedback) / speed;
    const profile = patternFingerProfile(parsePattern(run.pattern));
    for (const f of [1, 2, 3, 4] as Finger[]) {
      totals[f] += profile[f] * difficulty;
    }
  }
  for (const f of [1, 2, 3, 4] as Finger[]) totals[f] /= runs.length;
  return totals;
}
