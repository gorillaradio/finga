export type Finger = 1 | 2 | 3 | 4;

export function parsePattern(s: string): Finger[] {
  const parts = s.split("-").map((p) => Number(p));
  if (parts.length === 0 || parts.some((n) => ![1, 2, 3, 4].includes(n))) {
    throw new Error(`Pattern non valido: "${s}"`);
  }
  return parts as Finger[];
}

export function formatPattern(p: Finger[]): string {
  return p.join("-");
}

export function startingFinger(p: Finger[]): Finger {
  return p[0];
}

export function fingerFrequency(p: Finger[]): Record<Finger, number> {
  const freq: Record<Finger, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const f of p) freq[f] += 1;
  return freq;
}

// Peso euristico: frequenza relativa + bonus 0.25 al dito iniziale
// (guida il cambio di corda), poi normalizzato a somma 1.
const STARTING_BONUS = 0.25;

export function patternFingerProfile(p: Finger[]): Record<Finger, number> {
  const freq = fingerFrequency(p);
  const raw: Record<Finger, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const f of [1, 2, 3, 4] as Finger[]) raw[f] = freq[f] / p.length;
  raw[startingFinger(p)] += STARTING_BONUS;
  const sum = raw[1] + raw[2] + raw[3] + raw[4];
  return { 1: raw[1] / sum, 2: raw[2] / sum, 3: raw[3] / sum, 4: raw[4] / sum };
}

export type PatternLength = 4 | 6;

const FINGERS: Finger[] = [1, 2, 3, 4];

// Tutte le sequenze lunghe `length` senza lo stesso dito due volte di fila.
function sequences(length: number): Finger[][] {
  if (length === 1) return FINGERS.map((f) => [f]);
  return sequences(length - 1).flatMap((seq) =>
    FINGERS.filter((f) => f !== seq[seq.length - 1]).map((f) => [...seq, f])
  );
}

const cache = new Map<number, string[]>();

// Pattern validi: tutte e quattro le dita, mai lo stesso dito due volte di fila.
export function patternsOfLength(length: PatternLength): string[] {
  let all = cache.get(length);
  if (!all) {
    all = sequences(length).filter((s) => new Set(s).size === 4).map(formatPattern);
    cache.set(length, all);
  }
  return all;
}

export function randomPattern(length: PatternLength, exclude?: string): string {
  const pool = patternsOfLength(length).filter((p) => p !== exclude);
  return pool[Math.floor(Math.random() * pool.length)];
}
