import { type Accessor, type JSX, Show } from 'solid-js';
import type { AuraKind } from '../../canvas/effects/auras';
import { Species } from '../../data/ids/species';
import { LockIcon, MoonIcon, SparklesIcon, StarIcon, SunIcon } from '../icons';
import AnimatedSprite from '../sprites/AnimatedSprite';
import { m } from '../../i18n/paraglide/messages.js';

/**
 * What stands in one square of a box: the pokemon, what its walk has
 * come to, the marks in its corners and whether the caller has it.
 * The square itself (a button, a picture, a drop target) is the box's.
 */

/**
 * How fast an egg's idle plays, by how far along it is. A fresh egg
 * barely stirs and one about to open is shaking: it is the only thing an
 * egg has to say, so it says it with the only thing it has
 */
const EGG_SPEED = [0.6, 2.4] as const;

/**
 * One square of the box: what stands in it, and what the caller needs
 * back when it is pressed
 */
export interface BoxEntry {
  id: string;
  species: Species;
  shiny: boolean;
  /** Drawn from the female sheet where the species has one */
  female: boolean;
  /**
   * An egg is drawn as an egg (what is inside is not the owner's to
   * see) with how far along its walk is
   */
  egg: boolean;
  progress: number;
  fainted: boolean;
  /**
   * The light it stands in, where it stands in one: a shadow's haze or
   * a purified one's glow. The square is too small for the aura the
   * portrait paints, so it says the same thing with a mark
   */
  aura?: AuraKind;
  /**
   * The two marks a player puts on one themselves: put away, and kept.
   * Left out by a caller drawing something that is nobody's yet (a gift
   * on the shelf, a lot on the block)
   */
  locked?: boolean;
  favorite?: boolean;
  /**
   * Whether the caller has taken this one, or refuses to. A picked
   * square is lit and carries a tick; a refused one is greyed and
   * carries a cross
   */
  mark?: 'picked' | 'refused';
  /**
   * Why a refused square is refused, said on the square where its
   * level would be: "in a raid", "fainted", "locked"
   */
  reason?: string;
  /**
   * Its level and the share of its HP it has left, drawn as a line and
   * a bar along the bottom. Left out for an egg, and by a caller drawing
   * something that is nobody's yet
   */
  level?: number;
  health?: number;
  /**
   * The box it is filed in, for a square shown among other boxes'
   * squares: a search across every box says where each one lives
   */
  place?: { name: string; tone: string };
  /**
   * Its square in a box that keeps gaps, so something dropped on it
   * knows where it landed
   */
  slot?: number;
  /** What a screen reader is told about this square */
  label: string;
}

/** The bar's colour, by how much is left, the way a battle draws it */
function pickHealthTone(health: number): string {
  if (health > 0.5) {
    return 'bg-leaf';
  }
  return health > 0.2 ? 'bg-gold' : 'bg-ember';
}

/** A share kept between none and all of it, as a width */
function asWidth(share: number): string {
  return `${Math.min(1, Math.max(0, share)) * 100}%`;
}

export interface SquareFaceProps {
  entry: Accessor<BoxEntry>;
  /** A team's square: the pokemon fills it, and the level is left to the card */
  compact: boolean;
  /** What stands over the square, a hover card usually */
  cell?: (entry: Accessor<BoxEntry>) => JSX.Element;
}

/**
 * Everything inside a pokemon's square. The square is what names the
 * pokemon, so nothing in here is read out
 */
export default function SquareFace(props: SquareFaceProps): JSX.Element {
  const entry = props.entry;

  return (
    <>
      {/* The sprite stands over the line along the bottom, square and
          centred, so a wide cell does not stretch it */}
      <span
        class={`pointer-events-none absolute flex items-center justify-center ${
          props.compact ? 'inset-0.5' : 'inset-x-1.5 top-1 bottom-4'
        }`}
      >
        <span class="absolute inset-y-0 left-1/2 aspect-square h-full max-w-full -translate-x-1/2">
          <AnimatedSprite
            species={entry().egg ? Species.Egg : entry().species}
            female={!entry().egg && entry().female}
            shiny={entry().shiny}
            direction="DownLeft"
            // An egg's clock runs at the speed of its own walk; everything
            // else breathes at the speed it was drawn at
            speed={
              entry().egg ? EGG_SPEED[0] + (EGG_SPEED[1] - EGG_SPEED[0]) * entry().progress : 1
            }
            fill
            shadow
          />
        </span>
      </span>

      {/* What is left of an egg's walk, under it. An egg has no species
          to recognise, so how far along it is is the only thing that
          tells one from another */}
      <Show when={entry().egg}>
        <span
          class="pointer-events-none absolute inset-x-1.5 bottom-1.5 h-1 overflow-hidden rounded-full
            bg-line-soft"
        >
          <span class="block h-full bg-leaf" style={{ width: asWidth(entry().progress) }} />
        </span>
      </Show>

      {/* Its level and its HP along the bottom, or, on a square the
          caller refuses, why: a player counting their party wants the
          reason more than the level */}
      <Show
        when={entry().reason}
        fallback={
          <>
            <Show when={!props.compact && entry().level}>
              {(level) => (
                <span
                  class="pointer-events-none absolute bottom-3 left-1.5 font-display text-[11px]
                    leading-none font-semibold text-muted tabular-nums"
                >
                  {m.catch_level({ level: level() })}
                </span>
              )}
            </Show>
            {/* Not keyed on the number: a fainted one has none left,
                and an empty bar is still the bar */}
            <Show when={entry().health !== undefined}>
              <span
                class={`pointer-events-none absolute overflow-hidden rounded-full bg-line-soft ${
                  props.compact ? 'inset-x-1 bottom-0.5 h-0.5' : 'inset-x-1.5 bottom-1.5 h-1'
                }`}
              >
                <span
                  class={`block h-full ${pickHealthTone(entry().health ?? 0)}`}
                  style={{ width: asWidth(entry().health ?? 0) }}
                />
              </span>
            </Show>
          </>
        }
      >
        {(reason) => (
          <span
            class="pointer-events-none absolute inset-x-1 bottom-1 truncate rounded-chip border
              border-ember bg-ember-soft text-center text-[10px] leading-[15px] font-black
              text-ember-dark"
          >
            {reason()}
          </span>
        )}
      </Show>

      {/* Which box it lives in, on a search across all of them */}
      <Show when={entry().place}>
        {(place) => (
          <span
            class="pointer-events-none absolute inset-x-1 top-1 z-10 flex items-center
              justify-center gap-1 truncate rounded-chip bg-paper/90 px-1 text-[10px] leading-tight
              font-black text-ink"
          >
            <span class="size-2 shrink-0 rounded-sm" style={{ background: place().tone }} />
            <span class="truncate">{place().name}</span>
          </span>
        )}
      </Show>

      {/* What the player has said about it, in the corner away from
          everything the game says. Both are quiet marks: neither
          changes what the square does, and both are worth seeing
          before pressing something irreversible */}
      <span class="pointer-events-none absolute top-1 left-1 flex flex-col items-start gap-0.5">
        <Show when={entry().favorite === true}>
          <StarIcon aria-hidden="true" class="size-3.5 text-gold" />
        </Show>
        <Show when={entry().locked === true}>
          <LockIcon aria-hidden="true" class="size-3.5 text-muted" />
        </Show>
      </span>

      {/* A shiny says so on the square as well as in the sprite: the
          recolour is the whole of the difference. Rare things wear the
          arcane colour, as a shadow does; a purified one keeps the gold
          of having been put right */}
      <span class="pointer-events-none absolute top-1 right-1 flex flex-col items-end gap-0.5">
        <Show when={entry().shiny}>
          <SparklesIcon aria-hidden="true" class="size-3.5 text-arcane" />
        </Show>
        <Show when={entry().aura === 'shadow'}>
          <MoonIcon aria-hidden="true" class="size-3.5 text-arcane" />
        </Show>
        <Show when={entry().aura === 'purified'}>
          <SunIcon aria-hidden="true" class="size-3.5 text-gold" />
        </Show>
      </span>

      {/* Whether the caller has it: a green tick over the bar, or a red cross */}
      <Show when={entry().reason == null && entry().mark} keyed>
        {(mark) => (
          <span
            class={`pointer-events-none absolute right-1 flex size-[18px] items-center
              justify-center rounded-full text-[11px] leading-none font-black text-on-accent ${
                props.compact ? 'bottom-1' : 'bottom-3'
              } ${mark === 'picked' ? 'bg-leaf' : 'bg-ember'}`}
          >
            {mark === 'picked' ? '✓' : '✕'}
          </span>
        )}
      </Show>

      <Show when={props.cell}>
        {(over) => <span class="absolute inset-0 block">{over()(entry)}</span>}
      </Show>
    </>
  );
}
