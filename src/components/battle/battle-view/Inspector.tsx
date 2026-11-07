import { For, Index, type JSX, Show, createMemo } from 'solid-js';
import { Transition } from 'terracotta';
import type Battle from '../../../battle/battle';
import type Unit from '../../../battle/unit';
import { getSpeciesData } from '../../../data/species';
import { getStatusName } from '../../../model/health';
import { ABILITY_PILLS } from '../../details';
import MoveTooltip from '../../moves/MoveTooltip';
import { Button, CloseButton, Meta, TooltipHost } from '../../styled';
import { STATUS_COLORS } from '../UnitCard';
import followUnit from './follow-unit';
import { GLASS, HealthTrack, LABEL } from './plates';
import { type MoveReading, type UnitReading, readHealth, readUnit } from './unit-reading';
import { m } from '../../../i18n/paraglide/messages.js';

/**
 * The pokemon a player pressed, docked at the right edge of the field
 * and read in full: what it is casting and how much of it is left, its
 * moves with their cooldowns, its abilities and items, and what is
 * stuck to it. Open sheet goes on to its catch sheet. On a phone it is
 * a sheet across the foot of the screen instead.
 */

/**
 * The dock's way in and out: it slides in from past the right edge on
 * a spring (a phone's sheet rises from under the foot) and leaves on
 * the exit curve. The distances go to nothing under reduce motion, so
 * all that is left is the fade
 */
const DOCK = {
  enter: 'motion-crossfade transition-[opacity,translate] duration-(--motion-move) ease-spring',
  enterFrom:
    'opacity-0 translate-y-full sm:translate-x-[calc(100%+1rem)] sm:translate-y-0' +
    ' in-[.reduce-motion]:translate-x-0 in-[.reduce-motion]:translate-y-0',
  enterTo: 'opacity-100 translate-x-0 translate-y-0',
  entered: 'opacity-100',
  leave: 'motion-crossfade transition-[opacity,translate] duration-(--motion-move-exit) ease-exit',
  leaveFrom: 'opacity-100 translate-x-0 translate-y-0',
  leaveTo:
    'opacity-0 translate-y-full sm:translate-x-[calc(100%+1rem)] sm:translate-y-0' +
    ' in-[.reduce-motion]:translate-x-0 in-[.reduce-motion]:translate-y-0',
} as const;

/** What a move's row says on its right: ready, the seconds left, or off */
function describeCooldown(move: MoveReading): string {
  if (move.disabled) {
    return m.battle_move_off();
  }
  if (move.ready >= 1) {
    return m.battle_move_ready();
  }
  return m.battle_move_seconds({ seconds: Math.ceil(move.left / 1000) });
}

/** The dock's name for a screen reader: the pokemon it shows */
function readName(unit: Unit | null): string | undefined {
  return unit == null ? undefined : getSpeciesData(unit.species).name;
}

export interface InspectorProps {
  battle: Battle;
  /** The pokemon being inspected, or null with the dock put away */
  unit: Unit | null;
  /** Whether a banner stands across the top, which the dock starts under */
  raid: boolean;
  onClose: () => void;
  /** Opens the catch sheet, offered only for a pokemon that stands for a record */
  onOpenSheet: (unit: Unit) => void;
}

/** The body of the dock, reading one unit as it moves */
function InspectorBody(props: {
  battle: Battle;
  unit: Unit;
  onClose: () => void;
  onOpenSheet: (unit: Unit) => void;
}): JSX.Element {
  const beat = followUnit(
    () => props.battle,
    () => props.unit,
  );
  const view = createMemo((): UnitReading => {
    beat();
    return readUnit(props.unit);
  });
  const health = (): number => readHealth(view());
  const alive = (): boolean => view().unit.alive;

  return (
    <>
      <div class="flex items-center justify-between gap-2">
        <span class="flex min-w-0 items-baseline gap-1.5">
          <span class="shrink-0 text-xs font-extrabold text-muted">
            {m.ow_level({ level: view().unit.level })}
          </span>
          <span class="truncate font-display text-xl font-semibold">
            {getSpeciesData(view().unit.species).name}
          </span>
        </span>
        <CloseButton label={m.battle_close()} onPress={props.onClose} />
      </div>

      {/* Health over what it is winding up, then both said in words */}
      <div class="flex flex-col gap-[3px]">
        <HealthTrack value={health()} tone={alive() ? 'leaf' : 'muted'} class="h-2.5" />
        <div class="relative h-1.5 overflow-hidden rounded-full bg-line-soft">
          <Show when={view().acting}>
            {(acting) => (
              <span
                class={`absolute inset-y-0 left-0 ${acting().channelling ? 'bg-arcane' : 'bg-gold'}`}
                style={{ width: `${acting().done * 100}%` }}
              />
            )}
          </Show>
        </div>
        <div class="flex items-baseline justify-between gap-2 text-xs font-extrabold">
          <span class="min-w-0 truncate">
            <Show when={view().acting}>
              {(acting) => (
                <span class={acting().channelling ? 'text-arcane-dark' : 'text-gold-dark'}>
                  {acting().channelling
                    ? m.battle_channelling({ move: acting().name })
                    : m.battle_casting({ move: acting().name })}
                </span>
              )}
            </Show>
          </span>
          <span class="shrink-0 font-display font-semibold text-muted tabular-nums">
            {m.battle_health_of({
              health: Math.max(0, Math.round(view().unit.health)),
              max: Math.round(view().maxHealth),
            })}
          </span>
        </div>
      </div>

      {/* The part that scrolls when the dock is short */}
      <div class="-mx-1 flex min-h-0 grow flex-col gap-2.5 overflow-y-auto px-1">
        <div class={LABEL}>{m.battle_inspect_moves()}</div>
        {/* `Index`: the rows are slots whose cooldowns move every tick,
            and keying on a fresh reading would rebuild each row */}
        <ul class="m-0 flex list-none flex-col gap-1 p-0">
          <Index each={view().moves}>
            {(move) => (
              <li>
                <MoveTooltip class="block" move={move().move}>
                  <span
                    class="relative flex h-[30px] items-center justify-between gap-2 overflow-hidden
                      rounded-[9px] bg-parchment px-2.5 text-xs font-extrabold dark:bg-line-soft"
                  >
                    <span
                      class={`absolute inset-y-0 left-0 ${
                        move().disabled ? 'bg-muted/20' : 'bg-leaf-soft'
                      }`}
                      style={{ width: `${move().ready * 100}%` }}
                    />
                    <span class={`relative truncate ${move().disabled ? 'text-muted' : ''}`}>
                      {move().name}
                    </span>
                    <span class="relative shrink-0 font-bold text-muted tabular-nums">
                      {describeCooldown(move())}
                    </span>
                  </span>
                </MoveTooltip>
              </li>
            )}
          </Index>
        </ul>

        <div class={LABEL}>{m.battle_inspect_traits()}</div>
        <div class="flex flex-wrap gap-1">
          <For each={view().abilities} fallback={<Meta>{m.battle_no_ability()}</Meta>}>
            {(ability) => (
              <TooltipHost
                class="inline-flex"
                kind="ability"
                name={ability.name}
                description={ability.description}
              >
                <span
                  class={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11px]
                    font-extrabold ${ABILITY_PILLS[ability.kind]}`}
                >
                  {ability.name}
                </span>
              </TooltipHost>
            )}
          </For>
          <For each={view().items} fallback={<Meta>{m.battle_no_item()}</Meta>}>
            {(item) => (
              <TooltipHost class="inline-flex" kind="item" {...item}>
                <span
                  class="inline-flex h-6 items-center rounded-full border border-gold/60
                    bg-gold-soft px-2.5 text-[11px] font-extrabold text-gold-dark"
                >
                  {item.name}
                </span>
              </TooltipHost>
            )}
          </For>
        </div>

        <Show when={view().statuses.length > 0}>
          <ul class="m-0 flex list-none flex-row flex-wrap gap-x-3 gap-y-1 p-0">
            <For each={view().statuses}>
              {(status) => (
                <li class="flex items-center gap-1 text-xs font-extrabold">
                  <span
                    class="size-3.5 shrink-0 rounded-[4px]"
                    style={{ 'background-color': STATUS_COLORS[status] }}
                    aria-hidden="true"
                  />
                  {getStatusName(status)}
                </li>
              )}
            </For>
          </ul>
        </Show>
      </div>

      {/* A pokemon that stands for no record (a raid boss, a demo's
          dummy) has no sheet to open */}
      <Show when={view().unit.caught !== ''}>
        <Button
          class="h-10 shrink-0 justify-center self-stretch"
          onClick={() => {
            props.onOpenSheet(props.unit);
          }}
        >
          {m.battle_open_sheet()}
        </Button>
      </Show>
    </>
  );
}

export default function Inspector(props: InspectorProps): JSX.Element {
  // The last unit pressed, kept while the dock leaves so it does not
  // empty out on its way off the screen
  const shown = createMemo<Unit | null>((last) => props.unit ?? last, null);

  return (
    <Transition
      appear
      show={props.unit != null}
      {...DOCK}
      class={`pointer-events-auto absolute z-20 flex flex-col gap-2.5 p-3.5 ${GLASS}
        inset-x-0 bottom-0 h-[46dvh] rounded-t-sheet border-b-0
        sm:inset-x-auto sm:right-3.5 sm:h-auto sm:w-[clamp(260px,25cqw,290px)] sm:rounded-[22px]
        sm:border-b-2 ${
          props.raid
            ? 'sm:top-[min(124px,32dvh)] sm:bottom-[min(70px,15dvh)]'
            : 'sm:top-[min(110px,24dvh)] sm:bottom-[min(70px,15dvh)]'
        }`}
      role="region"
      aria-label={readName(shown())}
    >
      <Show when={shown()} keyed>
        {(unit) => (
          <InspectorBody
            battle={props.battle}
            unit={unit}
            onClose={props.onClose}
            onOpenSheet={props.onOpenSheet}
          />
        )}
      </Show>
    </Transition>
  );
}
