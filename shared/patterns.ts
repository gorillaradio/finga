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

function permutations(items: Finger[]): Finger[][] {
  if (items.length <= 1) return [items];
  return items.flatMap((item, i) =>
    permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest])
  );
}

const LONG_PATTERNS = ["1-2-1-3-1-4", "3-2-4-2-1-2"];

export const PATTERN_CATALOG: string[] = [
  ...permutations([1, 2, 3, 4]).map((p) => formatPattern(p)),
  ...LONG_PATTERNS,
];

export function randomPattern(exclude?: string): string {
  const pool = PATTERN_CATALOG.filter((p) => p !== exclude);
  return pool[Math.floor(Math.random() * pool.length)];
}
