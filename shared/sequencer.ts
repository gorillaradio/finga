import type { Finger } from "./patterns";

export type SequenceEvent = {
  string: number; // 6 = mi basso … 1 = mi cantino
  fret: number;
  finger: Finger;
  midi: number;
};

export const OPEN_STRING_MIDI: Record<number, number> = {
  6: 40, 5: 45, 4: 50, 3: 55, 2: 59, 1: 64,
};

// 6ª → 1ª e ritorno; il cantino non si ripete, il mi basso chiude il blocco.
const STRING_ORDER = [6, 5, 4, 3, 2, 1, 2, 3, 4, 5, 6];

export function buildSequence(pattern: Finger[], maxPosition: number): SequenceEvent[] {
  const positions: number[] = [];
  for (let p = 1; p <= maxPosition; p++) positions.push(p);
  for (let p = maxPosition - 1; p >= 1; p--) positions.push(p);

  const events: SequenceEvent[] = [];
  for (const position of positions) {
    for (const string of STRING_ORDER) {
      for (const finger of pattern) {
        const fret = position + finger - 1;
        events.push({ string, fret, finger, midi: OPEN_STRING_MIDI[string] + fret });
      }
    }
  }
  return events;
}

export function positionOf(e: SequenceEvent): number {
  return e.fret - e.finger + 1;
}

// Primo evento del blocco di posizione che contiene `index`.
// I blocchi sono contigui e blocchi adiacenti hanno posizioni diverse.
export function resumeIndexFor(events: SequenceEvent[], index: number): number {
  const pos = positionOf(events[index]);
  let i = index;
  while (i > 0 && positionOf(events[i - 1]) === pos) i--;
  return i;
}
