// The battle keys its statuses and moves by const-enum members, which
// Object.keys hands back as strings; the assertions below put the enum
// type back on them
// oxlint-disable typescript/no-unsafe-type-assertion
import { For, Index, type JSX, Show, createMemo } from 'solid-js';
import type { ProgressData } from '../battle/events';
import type Unit from '../battle/unit';
import { Stats } from '../data/constants/stats';
import { Statuses } from '../data/ids/status';
import { getMoveData } from '../data/moves';
import { getSpeciesData } from '../data/species';

/**
 * One of the player's own pokemon, as a card under the field.
 *
 * A real-time battle asks two things of a player at once: watch what
 * is happening, and know when their own side can act again. The field
 * answers the first — sprites, flying moves, who is still standing —
 * and cannot answer the second, because a cooldown is a number and a
 * picture of a Pikachu is not.
 *
 * So this is the second answer, and only the second: what the pokemon
 * is, how much of it is left, which of its four moves are ready, and
 * what is stuck to it. It is a column rather than a row because six of
 * them stand side by side along the bottom of the screen, and the
 * screen is wider than it is tall.
 */

/**
 * How a status is shown: as a colour, for now.
 *
 * They are drawn as plain squares because that is honest about what
 * the game can currently say — there are no status icons drawn yet,
 * and a row of words at this size is unreadable. The colours are the
 * ones the series has always used for the ones the series names, and
 * a family resemblance for the rest: fire is what burns, water is
 * what drowses, poison is purple wherever it comes from
 */
const STATUS_COLORS: Record<Statuses, string> = {
  [Statuses.Burned]: '#e2703a',
  [Statuses.Frozen]: '#79c6e8',
  [Statuses.Paralyzed]: '#e8c33a',
  [Statuses.Poisoned]: '#a05aa8',
  [Statuses.BadlyPoisoned]: '#7a3c85',
  [Statuses.Sleeping]: '#8c93a8',
  [Statuses.Confused]: '#d98cc0',
  [Statuses.Infatuated]: '#e88fb0',
  [Statuses.Flinched]: '#b0b6c4',
  [Statuses.Trapped]: '#8a6a4a',
  [Statuses.Seeding]: '#5ea45e',
  [Statuses.Raging]: '#c2402f',
  [Statuses.Biding]: '#c98a2f',
  [Statuses.Recharging]: '#7d8ba0',
  [Statuses.Substituted]: '#9a9a6a',
  [Statuses.Minimized]: '#6aa0b8',
  [Statuses.Invulnerable]: '#4f7fa8',
  [Statuses.FocusEnergy]: '#d4a02f',
  [Statuses.Grounded]: '#8a7a5a',
  [Statuses.Floating]: '#9fc4dd',
  [Statuses.Submerged]: '#3f7fa0',
  [Statuses.Dormant]: '#6f6f6f',
};

const STATUS_NAMES: Record<Statuses, string> = {
  [Statuses.Seeding]: 'Seeded',
  [Statuses.Poisoned]: 'Poisoned',
  [Statuses.Sleeping]: 'Asleep',
  [Statuses.BadlyPoisoned]: 'Badly poisoned',
  [Statuses.Paralyzed]: 'Paralyzed',
  [Statuses.Minimized]: 'Minimized',
  [Statuses.Invulnerable]: 'Invulnerable',
  [Statuses.Raging]: 'Raging',
  [Statuses.Biding]: 'Biding',
  [Statuses.Confused]: 'Confused',
  [Statuses.Recharging]: 'Recharging',
  [Statuses.Substituted]: 'Substitute',
  [Statuses.Burned]: 'Burned',
  [Statuses.Trapped]: 'Trapped',
  [Statuses.Flinched]: 'Flinched',
  [Statuses.Frozen]: 'Frozen',
  [Statuses.FocusEnergy]: 'Focused',
  [Statuses.Infatuated]: 'Infatuated',
  [Statuses.Grounded]: 'Grounded',
  [Statuses.Floating]: 'Floating',
  [Statuses.Submerged]: 'Submerged',
  [Statuses.Dormant]: 'Dormant',
};

/**
 * How many move boxes the grid holds. Four, in two rows of two: it is
 * what a pokemon carries, and a fixed grid keeps the card the same
 * height whether it knows one move or four
 */
const MOVE_SLOTS = 4;

/**
 * How far along a timed thing is, as a fraction of itself. Everything
 * the engine times — a cooldown coming back, a move being wound up —
 * counts up to its own duration, so they are all read the same way.
 * Nothing timed at all is finished by definition: a move that is not
 * cooling is a move that can be thrown now
 */
function fractionOf(progress: ProgressData | undefined): number {
  if (progress == null) {
    return 1;
  }
  return progress.duration <= 0
    ? 1
    : Math.min(1, Math.max(0, progress.progress / progress.duration));
}

export interface UnitCardProps {
  unit: Unit;
  /**
   * A counter the owner bumps when the battle says this unit moved.
   * Reading it is what subscribes the card to its own unit and nobody
   * else's — the engine mutates units in place, so there is nothing
   * here to observe directly
   */
  revision: () => number;
}

export default function UnitCard(props: UnitCardProps): JSX.Element {
  /**
   * One reading of the unit, recomputed only when that unit moved
   */
  const view = createMemo(() => {
    const unit = props.unit;
    // The one thing being cast or channelled, read as a picture of
    // this instant rather than as the engine's own object: the state
    // is mutated in place and swapped out under us, and a card holding
    // the object would be showing a cast that finished a second ago
    const acting = unit.casting ?? unit.channeling;

    return {
      at: props.revision(),
      unit,
      maxHealth: unit.checkStat(Stats.HP, 0),
      statuses: (Object.keys(unit.status) as unknown as Statuses[]).filter(
        (status) => unit.status[status] != null,
      ),
      /**
       * The four boxes, each already reduced to what it draws.
       *
       * Reduced **here**, in the memo, rather than read out of the
       * move state in the markup. That is what was wrong with the
       * cooldown bars: a `For` hands its callback the item as a plain
       * value, so `move.cooldown` inside the row was read exactly once
       * — the row had nothing reactive in it to re-run, and every bar
       * sat at whatever width it had the moment the card was built.
       * The numbers underneath were moving the whole time
       */
      moves: Object.values(unit.moves)
        .slice(0, MOVE_SLOTS)
        .map((move) => ({
          name: getMoveData(move.move).name,
          disabled: move.disabled,
          ready: fractionOf(move.cooldown),
        })),
      /**
       * What it is in the middle of doing, if anything. A move being
       * wound up is the one thing on a card that says what is about
       * to happen rather than what has already happened
       */
      acting:
        acting == null
          ? null
          : {
              name: getMoveData(acting.move).name,
              channelling: unit.channeling != null,
              done: fractionOf(acting.time),
            },
    };
  });

  const unit = (): Unit => view().unit;

  const health = (): number => {
    const max = view().maxHealth;

    return max <= 0 ? 0 : Math.max(0, Math.min(1, unit().health / max));
  };

  return (
    <li
      class={`flex w-32 shrink-0 flex-col gap-1 rounded-lg border border-line bg-paper/95 px-2 py-1.5
        text-left text-xs shadow-sm shadow-ink/10 ${unit().alive ? '' : 'opacity-50 grayscale'}`}
    >
      {/* What it is. The level comes first because in a raid the
          difference between a party member and the thing killing it is
          usually the level */}
      <div class="flex items-baseline gap-1 truncate">
        <span class="text-muted">Lv. {unit().level}</span>
        <strong class="truncate">{getSpeciesData(unit().species).name}</strong>
      </div>

      <div class="flex items-center gap-1">
        <div class="h-1.5 grow overflow-hidden rounded-full bg-line-soft">
          <div
            class={`h-full rounded-full ${unit().alive ? 'bg-leaf' : 'bg-muted'}`}
            style={{ width: `${health() * 100}%` }}
          />
        </div>
        {/* Rounded, and it has to be: health is carried as a real
            number — a berry heals a sixteenth of a maximum that is
            rarely divisible by sixteen — and printed raw it is
            seventeen digits wide, which pushes the bar beside it out
            of the card entirely */}
        <span class="shrink-0 tabular-nums text-muted">
          {Math.max(0, Math.round(unit().health))}
        </span>
      </div>

      {/* What it is doing right now, which is the one line on the card
          about the next second rather than the last one. The room is
          held whether or not anything is being wound up: a card that
          grew a line every time its pokemon threw a move would push
          the whole party up and down the screen all fight */}
      <div class="flex h-4 flex-col justify-center">
        <Show when={view().acting}>
          {(acting) => (
            <div
              class="relative overflow-hidden rounded-full border border-line-soft bg-line-soft"
              title={`${acting().channelling ? 'Channelling' : 'Casting'} ${acting().name}`}
            >
              <div
                class={`absolute inset-y-0 left-0 ${
                  acting().channelling ? 'bg-leaf/40' : 'bg-gold/50'
                }`}
                style={{ width: `${acting().done * 100}%` }}
              />
              <span class="relative block truncate px-1 text-[0.625rem] leading-4">
                {acting().name}
              </span>
            </div>
          )}
        </Show>
      </div>

      {/* The four moves, each box a bar of its own cooldown. A full
          box is a move that can be thrown now.

          `Index` rather than `For`: the boxes are four slots that go
          on saying different things, not a list of things that come
          and go. `For` keys on the item, and an item reduced to what
          it draws is a new object on every tick — which would rebuild
          all four rows sixty times a second. `Index` keys on the slot
          and hands the row a signal, so a tick moves four widths and
          touches nothing else */}
      <ul class="m-0 grid list-none grid-cols-2 gap-1 p-0">
        <Index each={view().moves}>
          {(move) => (
            <li
              class="relative overflow-hidden rounded border border-line-soft bg-line-soft px-1
                py-0.5"
              title={`${move().name}${move().disabled ? ' — disabled' : ''}`}
            >
              <div
                class={`absolute inset-y-0 left-0 ${move().disabled ? 'bg-muted/30' : 'bg-tide/30'}`}
                style={{ width: `${move().ready * 100}%` }}
              />
              <span class={`relative block truncate ${move().disabled ? 'text-muted' : ''}`}>
                {move().name}
              </span>
            </li>
          )}
        </Index>
      </ul>

      {/* And whatever is stuck to it, as colours. There is a name on
          each for anyone hovering or listening, since a colour on its
          own says nothing to somebody who cannot see it */}
      <Show when={view().statuses.length}>
        <div class="flex flex-wrap gap-0.5">
          <For each={view().statuses}>
            {(status) => (
              <span
                class="size-2.5 rounded-[2px]"
                style={{ 'background-color': STATUS_COLORS[status] }}
                title={STATUS_NAMES[status]}
                aria-label={STATUS_NAMES[status]}
                role="img"
              />
            )}
          </For>
        </div>
      </Show>
    </li>
  );
}
