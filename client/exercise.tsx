import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { parsePattern } from "../shared/patterns";
import { positionOf, resumeIndexFor, type SequenceEvent } from "../shared/sequencer";
import { AudioEngine } from "./audio";
import { Fretboard } from "./fretboard";

type Phase = "countIn" | "playing" | "paused" | "finished";

export function Exercise(props: {
  engine: AudioEngine;
  events: SequenceEvent[];
  pattern: string;
  bpm: number;
  notesPerBeat: 1 | 2;
  onDone: () => void; // fine naturale o Stop → feedback
}) {
  const { engine, events, bpm, notesPerBeat } = props;
  const [phase, setPhase] = useState<Phase>("countIn");
  const [index, setIndex] = useState(-1);
  const pausedIndex = useRef(0);

  // avvio + loop di sync UI
  useEffect(() => {
    engine.start({ events, bpm, notesPerBeat, startIndex: 0 });
    let raf = 0;
    const tick = () => {
      const i = engine.currentIndex();
      setIndex(i);
      setPhase((prev) => {
        if (prev === "paused") return prev;
        if (i >= events.length) return "finished";
        return i < 0 ? "countIn" : "playing";
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      engine.stop();
    };
  }, []);

  useEffect(() => {
    if (phase === "finished") props.onDone();
  }, [phase]);

  const patternFingers = useMemo(() => parsePattern(props.pattern), [props.pattern]);

  const current = index >= 0 && index < events.length ? events[index] : null;
  // evento di ripresa: dà posizione e corda da mostrare durante count-in e pausa.
  // Deve essere lo stesso indice da cui riparte resume(), non il punto di pausa:
  // la ripresa torna all'inizio del blocco di posizione (sempre corda 6).
  const resumeEvent =
    events[resumeIndexFor(events, Math.min(pausedIndex.current, events.length - 1))];
  const position = current ? positionOf(current) : positionOf(resumeEvent);

  const pause = () => {
    // durante il count-in index è -1: non sovrascrivere il punto di ripresa
    if (index >= 0) pausedIndex.current = Math.min(index, events.length - 1);
    engine.stop();
    setPhase("paused");
  };

  const resume = () => {
    engine.start({
      events,
      bpm,
      notesPerBeat,
      startIndex: resumeIndexFor(events, pausedIndex.current),
    });
    setPhase("countIn");
  };

  return (
    <div class="flex min-h-screen flex-col gap-4 p-4">
      <div class="flex items-baseline justify-between text-sm text-zinc-400">
        <span class="text-lg font-bold text-zinc-100">{props.pattern}</span>
        <span>{bpm} BPM · {notesPerBeat} note/beat · pos. {position}</span>
      </div>

      {phase === "countIn" && (
        <p class="text-center text-emerald-400">Preparati…</p>
      )}
      {phase === "paused" && <p class="text-center text-amber-400">In pausa</p>}

      <Fretboard
        current={phase === "playing" ? current : null}
        position={position}
        pattern={patternFingers}
        previewString={resumeEvent.string}
      />

      <div class="mt-auto grid grid-cols-2 gap-3">
        {phase === "paused" ? (
          <button class="rounded-xl bg-emerald-600 py-5 text-xl font-bold" onClick={resume}>
            Riprendi
          </button>
        ) : (
          <button class="rounded-xl bg-amber-600 py-5 text-xl font-bold" onClick={pause}>
            Pausa
          </button>
        )}
        <button class="rounded-xl bg-rose-700 py-5 text-xl font-bold" onClick={props.onDone}>
          Stop
        </button>
      </div>
    </div>
  );
}
