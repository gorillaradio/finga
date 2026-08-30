import { parsePattern } from "./patterns";

export type Run = {
  pattern: string;
  bpm: number;
  notesPerBeat: 1 | 2;
  feedback: 1 | 2 | 3 | 4 | 5;
  createdAt: string; // ISO
};

// Forma su disco: il DB Lakebed alpha ha solo string/boolean/id.
export type DbRun = {
  pattern: string;
  bpm: string;
  notesPerBeat: string;
  feedback: string;
  createdAt: string; // il server ignora il valore del client e scrive il proprio (metadata Lakebed)
};

export function serializeRun(run: Run): DbRun {
  return {
    pattern: run.pattern,
    bpm: String(run.bpm),
    notesPerBeat: String(run.notesPerBeat),
    feedback: String(run.feedback),
    createdAt: run.createdAt,
  };
}

export function parseRun(db: DbRun): Run | null {
  const bpm = Number(db.bpm);
  const notesPerBeat = Number(db.notesPerBeat);
  const feedback = Number(db.feedback);
  if (!Number.isFinite(bpm) || bpm <= 0) return null;
  if (notesPerBeat !== 1 && notesPerBeat !== 2) return null;
  if (![1, 2, 3, 4, 5].includes(feedback)) return null;
  try {
    parsePattern(db.pattern);
  } catch {
    return null;
  }
  return {
    pattern: db.pattern,
    bpm,
    notesPerBeat: notesPerBeat as 1 | 2,
    feedback: feedback as Run["feedback"],
    createdAt: db.createdAt,
  };
}
