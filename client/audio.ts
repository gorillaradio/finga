import type { SequenceEvent } from "../shared/sequencer";

const LOOKAHEAD_MS = 25;
const SCHEDULE_HORIZON_S = 0.1;
const COUNT_IN_BEATS = 4;

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer: number | null = null;
  private scheduled: { index: number; time: number }[] = [];
  private startTime = 0;
  private opts: {
    events: SequenceEvent[];
    bpm: number;
    notesPerBeat: 1 | 2;
    startIndex: number;
  } | null = null;
  private nextNote = 0; // prossimo indice nota da programmare
  private nextBeat = 0; // prossimo beat di click da programmare

  unlock(): void {
    if (!this.ctx) {
      // iOS usa la sessione "ambient" di default: muta il Web Audio quando
      // l'interruttore silenzioso è attivo. "playback" lo fa suonare comunque.
      if ("audioSession" in navigator) {
        try {
          (navigator as { audioSession: { type: string } }).audioSession.type = "playback";
        } catch {}
      }
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  now(): number {
    return this.ctx?.currentTime ?? 0;
  }

  start(opts: { events: SequenceEvent[]; bpm: number; notesPerBeat: 1 | 2; startIndex: number }): void {
    this.unlock();
    this.stop();
    // annulla il ramp a zero lasciato da stop(), altrimenti azzererebbe il volume
    this.master!.gain.cancelScheduledValues(this.ctx!.currentTime);
    this.master!.gain.setValueAtTime(1, this.ctx!.currentTime);
    this.opts = opts;
    this.scheduled = [];
    this.nextNote = opts.startIndex;
    this.nextBeat = 0;
    this.startTime = this.ctx!.currentTime + 0.05;
    this.timer = window.setInterval(() => this.schedule(), LOOKAHEAD_MS);
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.ctx && this.master) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setValueAtTime(this.master.gain.value, this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.02);
    }
    this.opts = null;
  }

  currentIndex(): number {
    const t = this.now();
    let index = -1;
    for (const s of this.scheduled) {
      if (s.time <= t) index = s.index;
      else break;
    }
    return index;
  }

  private schedule(): void {
    if (!this.opts || !this.ctx) return;
    const { events, bpm, notesPerBeat, startIndex } = this.opts;
    const spb = 60 / bpm; // secondi per beat
    const spn = spb / notesPerBeat; // secondi per nota
    const horizon = this.ctx.currentTime + SCHEDULE_HORIZON_S;
    const firstNoteTime = this.startTime + COUNT_IN_BEATS * spb;

    // click del metronomo, dal count-in alla fine
    const totalBeats =
      COUNT_IN_BEATS + Math.ceil(((events.length - startIndex) * spn) / spb);
    while (this.nextBeat < totalBeats) {
      const t = this.startTime + this.nextBeat * spb;
      if (t > horizon) break;
      this.playClick(t, this.nextBeat < COUNT_IN_BEATS);
      this.nextBeat++;
    }

    // note del pattern
    while (this.nextNote < events.length) {
      const t = firstNoteTime + (this.nextNote - startIndex) * spn;
      if (t > horizon) break;
      this.playNote(t, midiToFreq(events[this.nextNote].midi), spn);
      this.scheduled.push({ index: this.nextNote, time: t });
      this.nextNote++;
    }

    // fine esercizio: segnala "oltre l'ultimo evento"
    if (this.nextNote >= events.length) {
      const lastTime = firstNoteTime + (events.length - startIndex) * spn;
      if (this.ctx.currentTime > lastTime) {
        this.scheduled.push({ index: events.length, time: lastTime });
        this.stop();
      }
    }
  }

  private playClick(time: number, isCountIn: boolean): void {
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.frequency.value = isCountIn ? 1400 : 1000;
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
    osc.connect(gain).connect(this.master!);
    osc.start(time);
    osc.stop(time + 0.03);
  }

  private playNote(time: number, freq: number, duration: number): void {
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.5, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, time + Math.max(duration, 0.25));
    osc.connect(gain).connect(this.master!);
    osc.start(time);
    osc.stop(time + Math.max(duration, 0.25) + 0.05);
  }
}
