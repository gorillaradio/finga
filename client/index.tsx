import { createClient } from "lakebed/client";
import { useMemo, useState } from "preact/hooks";
import type app from "../server/index";
import { parsePattern, randomPattern } from "../shared/patterns";
import { computeUserProfile } from "../shared/profile";
import { parseRun, serializeRun, type Run } from "../shared/runs";
import { buildSequence } from "../shared/sequencer";
import { AudioEngine } from "./audio";
import { Exercise } from "./exercise";

const client = createClient<typeof app>();
const engine = new AudioEngine();

type Screen = "setup" | "exercise" | "feedback" | "history";

const FINGER_NAMES: Record<number, string> = {
  1: "Indice", 2: "Medio", 3: "Anulare", 4: "Mignolo",
};

export function App() {
  const [screen, setScreen] = useState<Screen>("setup");
  const [pattern, setPattern] = useState(() => randomPattern());
  const [bpm, setBpm] = useState(60);
  const [notesPerBeat, setNotesPerBeat] = useState<1 | 2>(1);
  const [maxPosition, setMaxPosition] = useState(12);
  const [pendingRun, setPendingRun] = useState<Run | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [saving, setSaving] = useState(false);

  const saveRun = client.useMutation("saveRun");
  const dbRuns = client.useQuery("myRuns");

  const events = useMemo(
    () => buildSequence(parsePattern(pattern), maxPosition),
    [pattern, maxPosition]
  );

  const trySave = async (run: Run) => {
    if (saving) return; // niente doppi salvataggi da tocchi ripetuti
    setSaving(true);
    setPendingRun(run);
    setSaveError(false);
    try {
      await saveRun(serializeRun(run));
      setPendingRun(null);
      setPattern(randomPattern(run.pattern));
      setScreen("setup");
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  const giveFeedback = (feedback: Run["feedback"]) =>
    void trySave({
      pattern, bpm, notesPerBeat, feedback,
      createdAt: new Date().toISOString(),
    });

  if (screen === "exercise") {
    return (
      <main class="min-h-screen bg-zinc-950 text-zinc-100">
        <Exercise
          engine={engine}
          events={events}
          pattern={pattern}
          bpm={bpm}
          notesPerBeat={notesPerBeat}
          onDone={() => setScreen("feedback")}
        />
      </main>
    );
  }

  if (screen === "feedback") {
    return (
      <main class="flex min-h-screen flex-col justify-center gap-6 bg-zinc-950 p-6 text-zinc-100">
        <h2 class="text-center text-xl">Com'è andata con {pattern}?</h2>
        <div class="grid grid-cols-5 gap-2">
          {([1, 2, 3, 4, 5] as const).map((n) => (
            <button
              key={n}
              class="rounded-xl bg-zinc-800 py-6 text-2xl font-bold active:bg-emerald-600 disabled:opacity-50"
              disabled={saving}
              onClick={() => giveFeedback(n)}
            >
              {n}
            </button>
          ))}
        </div>
        <p class="text-center text-sm text-zinc-400">1 = difficile · 5 = comodo</p>
        <button
          class="text-sm text-zinc-400 disabled:opacity-50"
          disabled={saving}
          onClick={() => {
            setPendingRun(null);
            setSaveError(false);
            setPattern(randomPattern(pattern));
            setScreen("setup");
          }}
        >
          Scarta esecuzione
        </button>
        {saveError && pendingRun && (
          <div class="rounded-lg bg-rose-900/50 p-4 text-center">
            <p>Salvataggio non riuscito. L'esecuzione non è persa.</p>
            <button
              class="mt-2 rounded bg-rose-700 px-4 py-2 font-bold"
              onClick={() => void trySave(pendingRun)}
            >
              Riprova
            </button>
          </div>
        )}
      </main>
    );
  }

  if (screen === "history") {
    const runs = (dbRuns ?? []).map(parseRun).filter((r): r is Run => r !== null);
    const profile = computeUserProfile(runs);
    const max = Math.max(profile[1], profile[2], profile[3], profile[4], 0.001);
    return (
      <main class="min-h-screen bg-zinc-950 p-6 text-zinc-100">
        <button class="text-sm text-zinc-400" onClick={() => setScreen("setup")}>
          ← Indietro
        </button>
        <h2 class="mt-4 text-xl font-bold">Profilo difficoltà</h2>
        <div class="mt-3 flex flex-col gap-2">
          {([1, 2, 3, 4] as const).map((f) => (
            <div key={f} class="flex items-center gap-2 text-sm">
              <span class="w-20 text-zinc-400">{FINGER_NAMES[f]}</span>
              <div class="h-4 flex-1 rounded bg-zinc-800">
                <div
                  class="h-4 rounded bg-emerald-600"
                  style={{ width: `${(profile[f] / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <h2 class="mt-6 text-xl font-bold">Esecuzioni ({runs.length})</h2>
        <ul class="mt-3 flex flex-col gap-1 text-sm">
          {runs.map((r) => (
            <li key={r.createdAt} class="flex justify-between border-b border-zinc-800 py-1">
              <span class="font-mono">{r.pattern}</span>
              <span class="text-zinc-400">
                {r.bpm} BPM · {r.notesPerBeat}n/b · {r.feedback}/5
              </span>
            </li>
          ))}
        </ul>
      </main>
    );
  }

  // setup
  return (
    <main class="flex min-h-screen flex-col gap-6 bg-zinc-950 p-6 text-zinc-100">
      <header class="flex items-baseline justify-between">
        <h1 class="text-2xl font-bold">Finga</h1>
        <button class="text-sm text-zinc-400" onClick={() => setScreen("history")}>
          Storico
        </button>
      </header>

      <section class="rounded-xl bg-zinc-900 p-4">
        <p class="text-sm text-zinc-400">Pattern proposto</p>
        <div class="flex items-center justify-between">
          <span class="font-mono text-3xl">{pattern}</span>
          <button
            class="rounded bg-zinc-700 px-3 py-2 text-sm"
            onClick={() => setPattern(randomPattern(pattern))}
          >
            Un altro
          </button>
        </div>
      </section>

      <section class="flex flex-col gap-4">
        <label class="flex items-center justify-between">
          <span>BPM</span>
          <div class="flex items-center gap-2">
            <button class="rounded bg-zinc-700 px-3 py-2" onClick={() => setBpm((b) => Math.max(30, b - 5))}>−5</button>
            <input
              type="number"
              class="w-20 rounded bg-zinc-800 p-2 text-center"
              value={bpm}
              onInput={(e) => {
                const v = Number((e.target as HTMLInputElement).value);
                if (Number.isFinite(v)) setBpm(Math.min(240, Math.max(30, v)));
              }}
            />
            <button class="rounded bg-zinc-700 px-3 py-2" onClick={() => setBpm((b) => Math.min(240, b + 5))}>+5</button>
          </div>
        </label>

        <label class="flex items-center justify-between">
          <span>Note per beat</span>
          <div class="flex gap-2">
            {([1, 2] as const).map((n) => (
              <button
                key={n}
                class={`rounded px-4 py-2 ${notesPerBeat === n ? "bg-emerald-600" : "bg-zinc-700"}`}
                onClick={() => setNotesPerBeat(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </label>

        <label class="flex items-center justify-between">
          <span>Posizione massima</span>
          <input
            type="number"
            class="w-20 rounded bg-zinc-800 p-2 text-center"
            value={maxPosition}
            onInput={(e) => {
              const v = Number((e.target as HTMLInputElement).value);
              if (Number.isFinite(v)) setMaxPosition(Math.min(12, Math.max(1, Math.round(v))));
            }}
          />
        </label>
      </section>

      <button
        class="mt-auto rounded-xl bg-emerald-600 py-6 text-2xl font-bold"
        onClick={() => {
          engine.unlock();
          setScreen("exercise");
        }}
      >
        Inizia
      </button>
    </main>
  );
}
