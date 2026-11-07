import { Index, type JSX, Show } from 'solid-js';
import { m } from '../../../i18n/paraglide/messages.js';
import { BALL_ITEMS } from '../../../data/ids/items';
import ItemSprite from '../../items/ItemSprite';
import type { BallPip } from './standing';

/**
 * The pieces every battle plate is built from: the glass the plates
 * stand on, a health track with the gold damage trail, and the ball
 * pips that count who is still standing. The lobbies can draw a party
 * with the same three.
 */

/**
 * A plate standing over the field, the same glass the overworld HUD
 * uses: it takes no presses of its own unless a child asks for them
 */
export const GLASS = 'border-2 border-line bg-paper/95 shadow-float backdrop-blur-sm';

/** Small capitals over a group of rows, the Field Kit's label */
export const LABEL = 'text-[10px] font-extrabold tracking-[0.12em] text-muted uppercase';

/** What a track's fill is drawn in, by whose health it is */
export type TrackTone = 'leaf' | 'ember' | 'muted';

const FILLS: Record<TrackTone, string> = {
  leaf: 'bg-leaf',
  ember: 'bg-ember',
  muted: 'bg-muted',
};

export interface HealthTrackProps {
  /** Health left, from 0 to 1 */
  value: number;
  tone: TrackTone;
  /** Drains towards the left edge rather than the right, for the foe's plate */
  mirrored?: boolean;
  /** The track's height and anything else about where it sits */
  class?: string;
  /** Marks across the track, each a share of it from 0 to 1 */
  ticks?: readonly number[];
  /** The screen reader's text; without one the track is decoration */
  label?: string;
}

/**
 * A health track. When the fill drops, a gold ghost holds the old width
 * for a beat and then drains to the new one, so a hit reads as a hit.
 *
 * Both are plain CSS transitions on a width. Health changes many times
 * a second, and each change restarts the ghost's delay, so it waits
 * until the hits stop and then drains in one move. A heal grows the
 * ghost behind the fill, where it cannot be seen. Under reduce motion
 * the delay goes and both widths take the 120ms fade's time
 */
export function HealthTrack(props: HealthTrackProps): JSX.Element {
  const width = (): string => `${Math.max(0, Math.min(1, props.value)) * 100}%`;
  const side = (): string => (props.mirrored === true ? 'right-0' : 'left-0');

  return (
    <div
      class={`relative overflow-hidden rounded-full bg-line-soft ${props.class ?? 'h-3.5'}`}
      role={props.label == null ? undefined : 'img'}
      aria-label={props.label}
      aria-hidden={props.label == null ? 'true' : undefined}
    >
      <span
        class={`motion-crossfade absolute inset-y-0 ${side()} bg-gold transition-[width]
          delay-300 duration-(--motion-scene) ease-settle in-[.reduce-motion]:delay-0`}
        style={{ width: width() }}
      />
      <span
        class={`motion-crossfade absolute inset-y-0 ${side()} transition-[width]
          duration-(--motion-quick) ease-settle ${FILLS[props.tone]}`}
        style={{ width: width() }}
      />
      <Index each={props.ticks ?? []}>
        {(tick) => (
          <span
            class={`absolute inset-y-0 -ml-px w-[3px] ${
              props.value < tick() ? 'bg-white' : 'bg-shade'
            }`}
            style={{ left: `${tick() * 100}%` }}
          />
        )}
      </Index>
    </div>
  );
}

/** Past this many a side is counted in words, since pips would not fit */
export const MOST_PIPS = 8;

/**
 * How large a ball's square is on a plate. The ball fills about half
 * of its item square, so the square is drawn larger and pulled in by
 * a negative margin to keep the plate's row its old height
 */
const PIP_SIZE = 28;

/**
 * One ball a pokemon, the one it sits in, greyed once it is out. The
 * count is said to a screen reader in words
 */
export function BallPips(props: {
  balls: BallPip[];
  standing: number;
  total: number;
  class?: string;
}): JSX.Element {
  return (
    <span
      class={`flex shrink-0 items-center gap-1 ${props.class ?? ''}`}
      role="img"
      aria-label={m.battle_standing({ standing: props.standing, total: props.total })}
    >
      <Index each={props.balls}>
        {(pip) => (
          <ItemSprite
            item={BALL_ITEMS[pip().ball]}
            size={PIP_SIZE}
            label=""
            class={`-m-1.5 transition-[opacity,filter] duration-(--motion-move) ${
              pip().up ? '' : 'opacity-45 grayscale'
            }`}
          />
        )}
      </Index>
    </span>
  );
}

/** A side's count, as pips where they fit and in words where they do not */
export function StandingCount(props: {
  balls: BallPip[];
  standing: number;
  total: number;
}): JSX.Element {
  return (
    <Show
      when={props.total <= MOST_PIPS}
      fallback={
        <span class="shrink-0 text-xs font-extrabold text-muted tabular-nums">
          {m.battle_standing({ standing: props.standing, total: props.total })}
        </span>
      }
    >
      <BallPips balls={props.balls} standing={props.standing} total={props.total} />
    </Show>
  );
}
