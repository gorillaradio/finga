import { AudioEngine } from "./audio";
import { parsePattern } from "../shared/patterns";
import { buildSequence } from "../shared/sequencer";

const engine = new AudioEngine();

export function App() {
  return (
    <main class="min-h-screen bg-zinc-950 p-6 text-zinc-100">
      <h1 class="text-2xl font-bold">Finga</h1>
      <button
        class="mt-4 rounded bg-emerald-600 px-4 py-2"
        onClick={() => {
          engine.unlock();
          engine.start({
            events: buildSequence(parsePattern("1-2-3-4"), 1).slice(0, 44),
            bpm: 100,
            notesPerBeat: 1,
            startIndex: 0,
          });
        }}
      >
        Smoke test audio
      </button>
    </main>
  );
}
