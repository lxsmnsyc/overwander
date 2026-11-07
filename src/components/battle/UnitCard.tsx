import { For, Index, type JSX, Show, createMemo } from 'solid-js';
import type Unit from '../../battle/unit';
import { Statuses } from '../../data/ids/status';
import { getStatusName } from '../../model/health';
import { ABILITY_PILLS } from '../details';
import { getSpeciesData } from '../../data/species';
import MoveTooltip from '../moves/MoveTooltip';
import { Meta, TooltipHost } from '../styled';
import { HealthTrack } from './battle-view/plates';
import ItemTray from './battle-view/ItemTray';
import { type UnitReading, readHealth, readUnit } from './battle-view/unit-reading';
import { m } from '../../i18n/paraglide/messages.js';

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
/** How large an item's square is on the hover card */
const CARD_ITEM = 30;

export const STATUS_COLORS: Record<Statuses, string> = {
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
  [Statuses.Staggered]: '#e8c547',
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
  [Statuses.Comatose]: '#6b6486',
  [Statuses.Taunted]: '#a85a7a',
  [Statuses.Tormented]: '#7a4a6a',
  [Statuses.Imprisoned]: '#5a5a8a',
  [Statuses.Rooted]: '#5f8a4a',
  [Statuses.Drowsy]: '#8a8ac9',
  [Statuses.Centered]: '#c9a04a',
  [Statuses.Coated]: '#7a8ac9',
  [Statuses.Snatching]: '#6a6a4a',
  [Statuses.Grudging]: '#5a3f5a',
  [Statuses.Uproaring]: '#c97a4a',
  [Statuses.Helped]: '#7ac9a0',
  [Statuses.MindRead]: '#c9a0e0',
  [Statuses.Embargoed]: '#8a7f6b',
  [Statuses.HealBlocked]: '#c97a8a',
  [Statuses.PowerTricked]: '#e0b06b',
  [Statuses.Roosting]: '#a0c9d6',
  [Statuses.MagnetRisen]: '#d6c96b',
  [Statuses.AquaRinged]: '#6bb8d6',
  [Statuses.Telekinetic]: '#d68ad6',
  [Statuses.SkyDropped]: '#8ab4e0',
  [Statuses.PowerShifted]: '#d69a5a',
};

export interface UnitCardProps {
  unit: Unit;
  /**
   * A counter the owner bumps when the battle says this unit moved.
   * Reading it is what subscribes the card to its own unit and nobody
   * else's — the engine mutates units in place, so there is nothing
   * here to observe directly
   */
  revision: () => number;
  /**
   * Drawn as a tooltip over the field: nothing on it is pressed, so it
   * wears the tooltip's surface rather than a card's
   */
  tip?: boolean;
}

export default function UnitCard(props: UnitCardProps): JSX.Element {
  /** One reading of the unit, recomputed only when that unit moved */
  const view = createMemo((): UnitReading => {
    props.revision();
    return readUnit(props.unit);
  });

  const unit = (): Unit => view().unit;
  const health = (): number => readHealth(view());

  return (
    <li
      class={`flex w-64 shrink-0 flex-col gap-1.5 rounded-card border-2 border-line text-left text-xs
        ${props.tip === true ? 'bg-paper px-3 pt-2.5 pb-3 shadow-float' : 'bg-paper/95 px-2.5 py-2 shadow-pop-sm'}
        ${unit().alive ? '' : 'opacity-50 grayscale'}`}
    >
      {/* What it is. The level comes first because in a raid the
          difference between a party member and the thing killing it is
          usually the level */}
      <div class="flex items-baseline gap-1.5 truncate">
        <span class="font-extrabold text-muted">{m.ow_level({ level: unit().level })}</span>
        <strong class="truncate font-display text-[15px] font-semibold">
          {getSpeciesData(unit().species).name}
        </strong>
      </div>

      {/* One bar cut in two: what it has left on top, what it is
          winding up underneath. They were two bars in two places, which
          asked a player watching a boss to read one thing in two —
          and the answer to "will it get the move off" is both halves
          at once */}
      <div class="flex items-center gap-1">
        <div class="flex grow flex-col gap-0.5">
          <HealthTrack value={health()} tone={unit().alive ? 'leaf' : 'muted'} class="h-2" />
          {/* The lower half is empty while nothing is being wound up,
              rather than absent: a bar that changed height every time
              its pokemon threw a move would push the card about */}
          <div class="h-1.5 overflow-hidden rounded-full bg-line-soft">
            <Show when={view().acting}>
              {(acting) => (
                <div
                  class={`h-full ${acting().channelling ? 'bg-arcane' : 'bg-gold'}`}
                  style={{ width: `${acting().done * 100}%` }}
                  title={
                    acting().channelling
                      ? m.battle_channelling({ move: acting().name })
                      : m.battle_casting({ move: acting().name })
                  }
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
        <span class="shrink-0 font-display font-semibold tabular-nums text-muted">
          {Math.max(0, Math.round(unit().health))}
        </span>
      </div>

      {/* What it is winding up, said in words under the bar it is
          moving */}
      <Show when={view().acting}>
        {(acting) => (
          <Meta
            class={`truncate font-extrabold ${
              acting().channelling ? 'text-arcane-dark' : 'text-gold-dark'
            }`}
          >
            {acting().channelling
              ? m.battle_channelling({ move: acting().name })
              : m.battle_casting({ move: acting().name })}
          </Meta>
        )}
      </Show>

      {/* What it can do, what it is, and what it carries — three
          columns, because they answer three different questions and a
          single stack of pills reads as one long list of words */}
      <div class="grid grid-cols-3 gap-1">
        {/* The moves, each box a bar of its own cooldown. A full box is
            a move that can be thrown now.

            `Index` rather than `For`: the boxes are slots that go
            on saying different things, not a list of things that come
            and go. `For` keys on the item, and an item reduced to what
            it draws is a new object on every tick — which would rebuild
            every row sixty times a second. `Index` keys on the slot
            and hands the row a signal, so a tick moves the widths and
            touches nothing else */}
        <ul class="m-0 flex list-none flex-col gap-0.5 p-0">
          <Index each={view().moves}>
            {(move) => (
              <li>
                <MoveTooltip class="block" move={move().move}>
                  <span
                    class="relative block overflow-hidden rounded-[7px] bg-line-soft px-1.5 py-0.5
                      font-bold"
                  >
                    <span
                      class={`absolute inset-y-0 left-0 ${
                        move().disabled ? 'bg-muted/20' : 'bg-leaf-soft'
                      }`}
                      style={{ width: `${move().ready * 100}%` }}
                    />
                    <span class={`relative block truncate ${move().disabled ? 'text-muted' : ''}`}>
                      {move().name}
                    </span>
                  </span>
                </MoveTooltip>
              </li>
            )}
          </Index>
        </ul>

        {/* What each of these does is the half worth reading, and
            neither fits in a box this wide: the name is what is
            shown, and the card over it says the rest */}
        <ul class="m-0 flex list-none flex-col gap-0.5 p-0">
          <For each={view().abilities} fallback={<Meta>{m.battle_no_ability()}</Meta>}>
            {(ability) => (
              <li>
                <TooltipHost
                  class="block"
                  kind="ability"
                  name={ability.name}
                  description={ability.description}
                >
                  <span
                    class={`block truncate rounded-full border px-1.5 py-0.5 font-bold ${ABILITY_PILLS[ability.kind]}`}
                  >
                    {ability.name}
                  </span>
                </TooltipHost>
              </li>
            )}
          </For>
        </ul>

        <ItemTray items={view().items} size={CARD_ITEM} />
      </div>

      {/* And whatever is stuck to it, as colours, each named in a
          tooltip and to a screen reader */}
      <Show when={view().statuses.length}>
        <div class="flex flex-wrap gap-0.5">
          <For each={view().statuses}>
            {(status) => (
              <TooltipHost class="inline-flex" kind="status" name={getStatusName(status)}>
                <span
                  class="size-3 rounded-[4px]"
                  style={{ 'background-color': STATUS_COLORS[status] }}
                  aria-label={getStatusName(status)}
                  role="img"
                />
              </TooltipHost>
            )}
          </For>
        </div>
      </Show>
    </li>
  );
}
