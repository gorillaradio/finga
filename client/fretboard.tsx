import type { Finger } from "../shared/patterns";
import type { SequenceEvent } from "../shared/sequencer";

const W = 600;
const H = 220;
const MARGIN = { top: 20, right: 20, bottom: 30, left: 20 };
const FRETS_SHOWN = 6;

export function Fretboard(props: {
  current: SequenceEvent | null;
  position: number;
  pattern: Finger[];
  previewString?: number;
}) {
  const innerW = W - MARGIN.left - MARGIN.right;
  const innerH = H - MARGIN.top - MARGIN.bottom;
  const fretW = innerW / FRETS_SHOWN;
  const stringGap = innerH / 5;

  // convenzione tab: corda 1 (cantino) in alto, corda 6 in basso
  const stringY = (string: number) => MARGIN.top + (string - 1) * stringGap;
  // il pallino sta al centro della casella del tasto
  const fretX = (fret: number) =>
    MARGIN.left + (fret - props.position + 0.5) * fretW;

  // sagoma dell'intero pattern sulla corda in gioco (o su quella che sta per suonare)
  const ghostString = props.current ? props.current.string : props.previewString;
  const ghostFingers =
    ghostString === undefined ? [] : [...new Set(props.pattern)];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} class="w-full select-none">
      {/* corde */}
      {[1, 2, 3, 4, 5, 6].map((s) => (
        <line
          key={s}
          x1={MARGIN.left}
          x2={W - MARGIN.right}
          y1={stringY(s)}
          y2={stringY(s)}
          stroke="#71717a"
          stroke-width={0.6 + s * 0.35}
        />
      ))}
      {/* barrette dei tasti */}
      {Array.from({ length: FRETS_SHOWN + 1 }, (_, i) => (
        <line
          key={i}
          x1={MARGIN.left + i * fretW}
          x2={MARGIN.left + i * fretW}
          y1={MARGIN.top}
          y2={H - MARGIN.bottom}
          stroke="#3f3f46"
          stroke-width="2"
        />
      ))}
      {/* numeri di tasto */}
      {Array.from({ length: FRETS_SHOWN }, (_, i) => (
        <text
          key={i}
          x={MARGIN.left + (i + 0.5) * fretW}
          y={H - 8}
          text-anchor="middle"
          fill="#a1a1aa"
          font-size="14"
        >
          {props.position + i}
        </text>
      ))}
      {/* sagoma del pattern (ghost) */}
      {ghostFingers.map((f) => (
        <g key={f}>
          <circle
            cx={fretX(props.position + f - 1)}
            cy={stringY(ghostString!)}
            r="13"
            fill="#3f3f46"
          />
          <text
            x={fretX(props.position + f - 1)}
            y={stringY(ghostString!) + 4}
            text-anchor="middle"
            fill="#a1a1aa"
            font-size="13"
          >
            {f}
          </text>
        </g>
      ))}
      {/* nota corrente */}
      {props.current && (
        <g>
          <circle
            cx={fretX(props.current.fret)}
            cy={stringY(props.current.string)}
            r="16"
            fill="#10b981"
          />
          <text
            x={fretX(props.current.fret)}
            y={stringY(props.current.string) + 5}
            text-anchor="middle"
            fill="#022c22"
            font-size="16"
            font-weight="bold"
          >
            {props.current.finger}
          </text>
        </g>
      )}
    </svg>
  );
}
