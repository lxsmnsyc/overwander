import { Index, type JSX, Show, createSignal, onCleanup } from 'solid-js';
import type Alliance from '../../battle/alliance';
import type Battle from '../../battle/core';
import { BattleEvents } from '../../battle/events';
import type Unit from '../../battle/unit';
import { EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { getSpeciesData } from '../../data/species';
import { Badge, Button } from '../styled';

/** What moves a side's standing, and so what redraws the bar */
const STANDING_EVENTS = [
  BattleEvents.UnitSetHealth,
  BattleEvents.UnitSetMaxHealth,
  BattleEvents.UnitFaints,
  BattleEvents.TeamAddUnit,
] as const;

/** How one side of the fight stands right now */
interface SideStanding {
  label: string;
  /** Health left across the side, from 0 to 1 */
  health: number;
  standing: number;
  total: number;
  friendly: boolean;
}

function standingOf(units: Unit[], label: string, friendly: boolean): SideStanding {
  let health = 0;
  let most = 0;
  let standing = 0;

  for (const unit of units) {
    health += Math.max(0, unit.health);
    most += Math.max(1, unit.checkStat(Stats.HP, 0));
    if (unit.alive) {
      standing += 1;
    }
  }
  return {
    label,
    health: most <= 0 ? 0 : Math.min(1, health / most),
    standing,
    total: units.length,
    friendly,
  };
}

function unitsIn(alliance: Alliance): Unit[] {
  const units: Unit[] = [];

  for (const team of alliance.teams) {
    for (const unit of team.units) {
      units.push(unit);
    }
  }
  return units;
}

/** The speeds a replay may be played at */
const SPEEDS = [1, 2, 3] as const;

/**
 * A side's bar: its name, the health it has left, and how many are up.
 * It fills the width it is given on a phone, where the bar is the thing
 * worth reading, and settles at a fixed width once there is room
 */
function Meter(props: { side: SideStanding; wide?: boolean }): JSX.Element {
  return (
    <div class={`flex min-w-0 grow items-center gap-2 ${props.wide === true ? '' : 'sm:grow-0'}`}>
      <span class="shrink-0 text-xs font-bold">{props.side.label}</span>
      <div
        class={`h-2.5 min-w-12 grow overflow-hidden rounded-full border border-line bg-line-soft
          ${props.wide === true ? 'min-w-24' : 'sm:w-24 sm:grow-0'}`}
        role="img"
        aria-label={`${Math.round(props.side.health * 100)}% health left`}
      >
        <div
          class={`h-full rounded-full transition-[width] duration-300
            ${props.side.friendly ? 'bg-leaf' : 'bg-ember'}`}
          style={{ width: `${props.side.health * 100}%` }}
        />
      </div>
      <span class="shrink-0 text-xs text-muted tabular-nums">
        {props.side.standing}/{props.side.total}
      </span>
    </div>
  );
}

export interface BattleTopBarProps {
  battle: Battle;
  /** Whose view it is, which decides which side is "yours" */
  player: string;
  title: string;
  replay?: boolean;
  /** How fast a replay plays, offered only where `onSpeed` is given */
  speed?: number;
  onSpeed?: (speed: number) => void;
  /** The way out. Left out where there is nowhere to leave to, like a demo */
  onLeave?: () => void;
}

/**
 * One bar across the top of a fight: what it is, how each side stands,
 * and the way out. In a raid the boss gets a wide bar of its own, since
 * how much it has left is the question the whole lobby is asking
 */
export default function BattleTopBar(props: BattleTopBarProps): JSX.Element {
  const [beat, setBeat] = createSignal(0);
  const bump = (): void => {
    setBeat((count) => count + 1);
  };

  for (const event of STANDING_EVENTS) {
    props.battle.on(event, EventPriority.Post, bump);
  }
  onCleanup(() => {
    for (const event of STANDING_EVENTS) {
      props.battle.off(event, EventPriority.Post, bump);
    }
  });

  const read = (): { boss: SideStanding | null; sides: SideStanding[] } => {
    beat();

    let own: Alliance | undefined;

    for (const alliance of props.battle.alliances) {
      for (const team of alliance.teams) {
        if (props.player !== '' && team.player === props.player) {
          own = alliance;
        }
      }
    }

    let boss: SideStanding | null = null;
    const sides: SideStanding[] = [];

    for (const alliance of props.battle.alliances) {
      const units = unitsIn(alliance);

      if (units.length === 0) {
        continue;
      }
      if (alliance.boss) {
        boss = standingOf(units, getSpeciesData(units[0].appearance).name, false);
        continue;
      }
      if (own == null) {
        // A spectator has no side, so each is numbered
        sides.push(standingOf(units, `Side ${sides.length + 1}`, sides.length === 0));
        continue;
      }
      sides.push(standingOf(units, alliance === own ? 'You' : 'Foe', alliance === own));
    }
    // Yours first, so it always reads left to right the same way
    sides.sort((one, other) => Number(other.friendly) - Number(one.friendly));
    return { boss, sides };
  };

  return (
    <div class="pointer-events-none absolute inset-x-2 top-2 z-10 sm:inset-x-3 sm:top-3">
      {/* Two rows on a phone, one from a screen wide enough: what the
          fight is and the way out above, the health below, so a bar is
          never squeezed to nothing by the buttons beside it */}
      <div
        class="flex flex-col gap-1.5 rounded-panel border-2 border-tide bg-paper/95 px-2 py-1.5
          shadow-pop backdrop-blur-sm sm:flex-row sm:items-center sm:gap-3 sm:py-1 sm:pr-1 sm:pl-3"
      >
        <div class="flex min-w-0 items-center gap-2">
          <span class="flex min-w-0 shrink items-center gap-2">
            <span class="truncate text-sm font-bold">
              {props.replay === true ? 'Replay' : props.title}
            </span>
            <Show when={props.replay}>
              <Badge>Awards nothing</Badge>
            </Show>
          </span>

          {/* The row's own spacer, so the controls keep to the end of it
              while the title keeps to the start */}
          <span class="grow sm:hidden" />

          <Show when={props.onSpeed}>
            {(choose) => (
              <div class="pointer-events-auto flex shrink-0" role="group" aria-label="Replay speed">
                <Index each={SPEEDS}>
                  {(speed) => (
                    <button
                      type="button"
                      aria-pressed={props.speed === speed()}
                      class={`rounded-none border-2 px-2.5 py-1 text-xs font-bold tabular-nums
                        shadow-none first:rounded-l-lg last:rounded-r-lg active:translate-y-0 ${
                          props.speed === speed()
                            ? 'border-tide bg-tide text-on-accent hover:text-on-accent'
                            : 'border-line bg-paper text-ink'
                        }`}
                      onClick={() => {
                        choose()(speed());
                      }}
                    >
                      {speed()}x
                    </button>
                  )}
                </Index>
              </div>
            )}
          </Show>

          <Show when={props.onLeave}>
            {(leave) => (
              <span class="pointer-events-auto shrink-0 sm:hidden">
                <Button
                  tone="primary"
                  onClick={() => {
                    leave()();
                  }}
                >
                  Leave
                </Button>
              </span>
            )}
          </Show>
        </div>

        <div class="flex min-w-0 grow flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
          <Show when={read().boss}>{(boss) => <Meter side={boss()} wide />}</Show>
          <Index each={read().sides}>{(side) => <Meter side={side()} />}</Index>
        </div>

        <Show when={props.onLeave}>
          {(leave) => (
            <span class="pointer-events-auto hidden shrink-0 sm:block">
              <Button
                tone="primary"
                onClick={() => {
                  leave()();
                }}
              >
                Leave
              </Button>
            </span>
          )}
        </Show>
      </div>
    </div>
  );
}
