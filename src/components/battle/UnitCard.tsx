// The battle keys its statuses and moves by const-enum members, which
// Object.keys hands back as strings; the assertions below put the enum
// type back on them
// oxlint-disable typescript/no-unsafe-type-assertion
import { For, Index, type JSX, Show, createMemo } from 'solid-js';
import type { ProgressData } from '../../battle/events';
import type Unit from '../../battle/unit';
import { Stats } from '../../data/constants/stats';
import type Abilities from '../../data/ids/abilities';
import type { Items } from '../../data/ids/items';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import { detailAbility, detailItem } from '../details';
import { getMoveData } from '../../data/moves';
import { getSpeciesData } from '../../data/species';
import { Meta, TooltipHost } from '../styled';

/**
 * One pokemon in a fight, read in full: what it is, how much of it is
 * left, what it can throw, what it carries and what is stuck to it.
 *
 * A real-time battle asks two things of a player at once: watch what
 * is happening, and know the numbers underneath it. The field answers
 * the first — sprites, flying moves, who is still standing — and
 * cannot answer the second, because a cooldown is a number and a
 * picture of a Pikachu is not.
 *
 * It is shown over the pokemon it is about rather than parked along an
 * edge, so the two answers are in the same place and none of the field
 * is spent on a row of cards.
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
  [Statuses.Switching]: '#7fa8c9',
  [Statuses.Protected]: '#6fa8c9',
  [Statuses.Enduring]: '#b98a4a',
  [Statuses.Cornered]: '#6a5a7a',
  [Statuses.Nightmared]: '#4a3f6a',
  [Statuses.Perishing]: '#8a4a6a',
  [Statuses.Bonded]: '#5a4a7a',
  [Statuses.Cursed]: '#6a2f5a',
  [Statuses.Encored]: '#c98ab0',
  [Statuses.Identified]: '#a8a8a8',
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
  [Statuses.Switching]: 'Switching',
  [Statuses.Protected]: 'Protected',
  [Statuses.Enduring]: 'Enduring',
  [Statuses.Cornered]: 'Cornered',
  [Statuses.Nightmared]: 'Nightmare',
  [Statuses.Perishing]: 'Perishing',
  [Statuses.Bonded]: 'Bonded',
  [Statuses.Cursed]: 'Cursed',
  [Statuses.Encored]: 'Encored',
  [Statuses.Identified]: 'Identified',
};

/**
 * How many move boxes the column holds: what a pokemon carries
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
        // The plain swing every unit is fielded with is left off. It
        // is not one of the pokemon's four — it is what it does with
        // its hands between them — and it is added before them, so
        // listing it would push the fourth real move off the card
        .filter((move) => move.move !== Moves.Attack)
        .slice(0, MOVE_SLOTS)
        .map((move) => ({
          name: getMoveData(move.move).name,
          disabled: move.disabled,
          ready: fractionOf(move.cooldown),
        })),
      /**
       * What it knows besides its moves. Both are read as the enabled
       * half of what the engine is holding: an ability suppressed by
       * Neutralizing Gas, or an item already eaten, is one the pokemon
       * no longer has
       */
      abilities: (Object.keys(unit.abilities).map(Number) as Abilities[])
        .filter((ability) => unit.abilities[ability] === true)
        .map(detailAbility),
      items: (Object.keys(unit.items).map(Number) as Items[])
        .filter((item) => unit.items[item] === true)
        .map(detailItem),
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
      class={`flex w-64 shrink-0 flex-col gap-1.5 rounded-xl border-2 border-line bg-paper/95 px-2
        py-1.5 text-left text-xs shadow-pop-sm ${unit().alive ? '' : 'opacity-50 grayscale'}`}
    >
      {/* What it is. The level comes first because in a raid the
          difference between a party member and the thing killing it is
          usually the level */}
      <div class="flex items-baseline gap-1 truncate">
        <span class="text-muted">Lv. {unit().level}</span>
        <strong class="truncate">{getSpeciesData(unit().species).name}</strong>
      </div>

      {/* One bar cut in two: what it has left on top, what it is
          winding up underneath. They were two bars in two places, which
          asked a player watching a boss to read one thing in two —
          and the answer to "will it get the move off" is both halves
          at once */}
      <div class="flex items-center gap-1">
        <div class="grow overflow-hidden rounded-full border border-line-soft bg-line-soft">
          <div class="h-1.5">
            <div
              class={`h-full ${unit().alive ? 'bg-leaf' : 'bg-muted'}`}
              style={{ width: `${health() * 100}%` }}
            />
          </div>
          {/* The lower half is empty while nothing is being wound up,
              rather than absent: a bar that changed height every time
              its pokemon threw a move would push the card about */}
          <div class="h-1.5">
            <Show when={view().acting}>
              {(acting) => (
                <div
                  class={`h-full ${acting().channelling ? 'bg-arcane' : 'bg-gold'}`}
                  style={{ width: `${acting().done * 100}%` }}
                  title={`${acting().channelling ? 'Channelling' : 'Casting'} ${acting().name}`}
                />
              )}
            </Show>
          </div>
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

      {/* What it is winding up, said in words under the bar it is
          moving */}
      <Show when={view().acting}>
        {(acting) => (
          <Meta class="truncate">
            {acting().channelling ? 'Channelling' : 'Casting'} {acting().name}
          </Meta>
        )}
      </Show>

      {/* What it can do, what it is, and what it carries — three
          columns, because they answer three different questions and a
          single stack of pills reads as one long list of words */}
      <div class="grid grid-cols-3 gap-1">
        {/* The moves, each box a bar of its own cooldown. A full box is
            a move that can be thrown now.

            `Index` rather than `For`: the boxes are four slots that go
            on saying different things, not a list of things that come
            and go. `For` keys on the item, and an item reduced to what
            it draws is a new object on every tick — which would rebuild
            all four rows sixty times a second. `Index` keys on the slot
            and hands the row a signal, so a tick moves four widths and
            touches nothing else */}
        <ul class="m-0 flex list-none flex-col gap-0.5 p-0">
          <Index each={view().moves}>
            {(move) => (
              <li
                class="relative overflow-hidden rounded border border-line-soft bg-line-soft px-1
                  py-0.5"
                title={`${move().name}${move().disabled ? ' — disabled' : ''}`}
              >
                <div
                  class={`absolute inset-y-0 left-0 ${
                    move().disabled ? 'bg-muted/30' : 'bg-tide/30'
                  }`}
                  style={{ width: `${move().ready * 100}%` }}
                />
                <span class={`relative block truncate ${move().disabled ? 'text-muted' : ''}`}>
                  {move().name}
                </span>
              </li>
            )}
          </Index>
        </ul>

        {/* What each of these does is the half worth reading, and
            neither fits in a box this wide: the name is what is
            shown, and the card over it says the rest */}
        <ul class="m-0 flex list-none flex-col gap-0.5 p-0">
          <For each={view().abilities} fallback={<Meta>No ability</Meta>}>
            {(ability) => (
              <li>
                <TooltipHost class="block" {...ability}>
                  <span
                    class="block truncate rounded border border-line-soft bg-tide-soft px-1 py-0.5
                      text-tide-dark"
                  >
                    {ability.name}
                  </span>
                </TooltipHost>
              </li>
            )}
          </For>
        </ul>

        <ul class="m-0 flex list-none flex-col gap-0.5 p-0">
          <For each={view().items} fallback={<Meta>No item</Meta>}>
            {(item) => (
              <li>
                <TooltipHost class="block" {...item}>
                  <span
                    class="block truncate rounded border border-line-soft bg-gold-soft px-1 py-0.5
                      text-gold"
                  >
                    {item.name}
                  </span>
                </TooltipHost>
              </li>
            )}
          </For>
        </ul>
      </div>

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
