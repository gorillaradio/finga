import type { Finger } from "../shared/patterns";
import type { SequenceEvent } from "../shared/sequencer";

const FRETS_SHOWN = 6;

export function Fretboard(props: {
  current: SequenceEvent | null;
  position: number;
  pattern: Finger[];
  previewString?: number;
  vertical?: boolean;
}) {
  const vertical = props.vertical ?? false;
  const W = vertical ? 260 : 600;
  const H = vertical ? 600 : 220;
  const MARGIN = vertical
    ? { top: 20, right: 20, bottom: 20, left: 40 }
    : { top: 20, right: 20, bottom: 30, left: 20 };

  // asse dei tasti (lungo le corde) e asse delle corde (di traverso)
  const fretSpan = vertical
    ? H - MARGIN.top - MARGIN.bottom
    : W - MARGIN.left - MARGIN.right;
  const stringSpan = vertical
    ? W - MARGIN.left - MARGIN.right
    : H - MARGIN.top - MARGIN.bottom;
  const fretSize = fretSpan / FRETS_SHOWN;
  const stringGap = stringSpan / 5;
  const fretStart = vertical ? MARGIN.top : MARGIN.left;
  const stringStart = vertical ? MARGIN.left : MARGIN.top;
  const stringEnd = stringStart + 5 * stringGap;

  // orizzontale: convenzione tab, corda 1 (cantino) in alto.
  // verticale: convenzione diagrammi di accordi, corda 6 (mi basso) a sinistra.
  const stringPos = (s: number) =>
    stringStart + (vertical ? 6 - s : s - 1) * stringGap;
  // il pallino sta al centro della casella del tasto
  const fretPos = (fret: number) =>
    fretStart + (fret - props.position + 0.5) * fretSize;
  const fretLine = (i: number) => fretStart + i * fretSize;
  const dot = (fret: number, string: number) =>
    vertical
      ? { x: stringPos(string), y: fretPos(fret) }
      : { x: fretPos(fret), y: stringPos(string) };

  // sagoma dell'intero pattern sulla corda in gioco (o su quella che sta per suonare)
  const ghostString = props.current ? props.current.string : props.previewString;
  const ghostFingers =
    ghostString === undefined ? [] : [...new Set(props.pattern)];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      class={
        vertical
          ? "absolute inset-0 h-full w-full select-none"
          : "w-full select-none"
      }
    >
      {/* corde */}
      {[1, 2, 3, 4, 5, 6].map((s) =>
        vertical ? (
          <line
            key={s}
            x1={stringPos(s)}
            x2={stringPos(s)}
            y1={fretLine(0)}
            y2={fretLine(FRETS_SHOWN)}
            stroke="#71717a"
            stroke-width={0.6 + s * 0.35}
          />
        ) : (
          <line
            key={s}
            x1={fretLine(0)}
            x2={fretLine(FRETS_SHOWN)}
            y1={stringPos(s)}
            y2={stringPos(s)}
            stroke="#71717a"
            stroke-width={0.6 + s * 0.35}
          />
        ),
      )}
      {/* barrette dei tasti */}
      {Array.from({ length: FRETS_SHOWN + 1 }, (_, i) =>
        vertical ? (
          <line
            key={i}
            x1={stringStart}
            x2={stringEnd}
            y1={fretLine(i)}
            y2={fretLine(i)}
            stroke="#3f3f46"
            stroke-width="2"
          />
        ) : (
          <line
            key={i}
            x1={fretLine(i)}
            x2={fretLine(i)}
            y1={stringStart}
            y2={stringEnd}
            stroke="#3f3f46"
            stroke-width="2"
          />
        ),
      )}
      {/* capotasto: visibile solo quando la finestra parte dal tasto 1 */}
      {props.position === 1 &&
        (vertical ? (
          <line
            x1={stringStart}
            x2={stringEnd}
            y1={fretLine(0)}
            y2={fretLine(0)}
            stroke="#d4d4d8"
            stroke-width="8"
          />
        ) : (
          <line
            x1={fretLine(0)}
            x2={fretLine(0)}
            y1={stringStart}
            y2={stringEnd}
            stroke="#d4d4d8"
            stroke-width="8"
          />
        ))}
      {/* numeri di tasto */}
      {Array.from({ length: FRETS_SHOWN }, (_, i) =>
        vertical ? (
          <text
            key={i}
            x={18}
            y={fretLine(i) + fretSize / 2 + 5}
            text-anchor="middle"
            fill="#a1a1aa"
            font-size="14"
          >
            {props.position + i}
          </text>
        ) : (
          <text
            key={i}
            x={fretLine(i) + fretSize / 2}
            y={H - 8}
            text-anchor="middle"
            fill="#a1a1aa"
            font-size="14"
          >
            {props.position + i}
          </text>
        ),
      )}
      {/* sagoma del pattern (ghost) */}
      {ghostFingers.map((f) => {
        const p = dot(props.position + f - 1, ghostString!);
        return (
          <g key={f}>
            <circle cx={p.x} cy={p.y} r="13" fill="#3f3f46" />
            <text
              x={p.x}
              y={p.y + 4}
              text-anchor="middle"
              fill="#a1a1aa"
              font-size="13"
            >
              {f}
            </text>
          </g>
        );
      })}
      {/* nota corrente */}
      {props.current &&
        (() => {
          const p = dot(props.current.fret, props.current.string);
          return (
            <g>
              <circle cx={p.x} cy={p.y} r="16" fill="#10b981" />
              <text
                x={p.x}
                y={p.y + 5}
                text-anchor="middle"
                fill="#022c22"
                font-size="16"
                font-weight="bold"
              >
                {props.current.finger}
              </text>
            </g>
          );
        })()}
    </svg>
  );
}
