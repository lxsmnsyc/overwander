import { For, type JSX } from 'solid-js';

/**
 * Six numbers drawn as a hexagon: each one is a corner's distance from
 * the middle, measured against the largest of the six. The corners run
 * clockwise from the top, in the order they are given.
 */
export interface HexagonStat {
  name: string;
  value: number;
  /** The class the corner's label is written in, such as a nature's colour */
  tone?: string;
}

export interface StatHexagonProps {
  /** Six of them, clockwise from the top */
  stats: readonly HexagonStat[];
  /** What the picture says, for a screen reader */
  label: string;
  class?: string;
}

/** The drawing's own units: the box, the middle and the outer corner's reach */
const WIDTH = 240;
const HEIGHT = 180;
const MIDDLE_X = WIDTH / 2;
const MIDDLE_Y = HEIGHT / 2;
const REACH = 54;

/** How far past the outer ring a corner's label sits */
const LABEL_GAP = 14;

/** Where the corner at this place stands, at this share of the reach */
function corner(at: number, share: number): [number, number] {
  const angle = (Math.PI / 3) * at - Math.PI / 2;

  return [MIDDLE_X + Math.cos(angle) * REACH * share, MIDDLE_Y + Math.sin(angle) * REACH * share];
}

/** A ring through all six corners at one share of the reach */
function ring(share: number): string {
  const points: string[] = [];

  for (let at = 0; at < 6; at += 1) {
    points.push(corner(at, share).join(','));
  }
  return points.join(' ');
}

/**
 * How far each label is raised off its corner: the top one sits above
 * it, the bottom one under it, and the sides level with it
 */
const LIFTS = [-10, -4, -4, 6, -4, -4] as const;

/** Which way a label is anchored: out from the side it stands on */
function anchor(at: number): 'start' | 'middle' | 'end' {
  if (at === 0 || at === 3) {
    return 'middle';
  }
  return at < 3 ? 'start' : 'end';
}

export default function StatHexagon(props: StatHexagonProps): JSX.Element {
  /** The largest of the six, which the shape is measured against */
  const best = (): number => {
    let most = 1;

    for (const stat of props.stats) {
      most = Math.max(most, stat.value);
    }
    return most;
  };

  /** The values' own outline */
  const shape = (): string => {
    const points: string[] = [];

    for (const [at, stat] of props.stats.entries()) {
      points.push(corner(at, Math.max(0.08, stat.value / best())).join(','));
    }
    return points.join(' ');
  };

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={props.label}
      class={`block max-w-full overflow-visible ${props.class ?? ''}`}
    >
      <polygon
        points={ring(1)}
        class="fill-line-soft/60 stroke-line-soft"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <polygon
        points={ring(0.5)}
        class="fill-none stroke-line-soft"
        stroke-width="2"
        stroke-linejoin="round"
      />
      {/* Grows out of the middle once the card has risen */}
      <polygon
        points={shape()}
        class="motion-crossfade origin-center fill-tide/20 stroke-tide [transform-box:view-box]
          animate-[grow-in_var(--motion-scene)_var(--ease-spring)_200ms_backwards]"
        stroke-width="3"
        stroke-linejoin="round"
      />
      <For each={props.stats}>
        {(stat, at) => {
          const [x, y] = corner(at(), 1 + LABEL_GAP / REACH);
          const lift = LIFTS[at()];

          return (
            <text
              x={x}
              y={y + lift}
              text-anchor={anchor(at())}
              class={`text-[11px] font-extrabold ${stat.tone == null || stat.tone === '' ? 'fill-muted' : stat.tone}`}
            >
              <tspan x={x}>{stat.name}</tspan>
              <tspan x={x} dy="13" class="font-display text-[13px] font-semibold tabular-nums">
                {stat.value}
              </tspan>
            </text>
          );
        }}
      </For>
    </svg>
  );
}
