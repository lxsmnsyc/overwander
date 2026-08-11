// The battle keys its status, stage, ability and item records by
// const-enum members, which Object.keys hands back as strings; the
// assertions below put the enum type back on them
// oxlint-disable typescript/no-unsafe-type-assertion
import {
  type Accessor,
  For,
  type JSX,
  type Setter,
  Show,
  batch,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from 'solid-js';
import type Alliance from '../battle/alliance';
import type Battle from '../battle/core';
import { BattleEvents } from '../battle/events';
import Unit from '../battle/unit';
import { type BaseEvent, EventPriority } from '../core/event-emitter';
import { Stages, Stats } from '../data/constants/stats';
import { getAbilityData } from '../data/abilities';
import type Abilities from '../data/ids/abilities';
import type { Items } from '../data/ids/items';
import { Statuses, Weathers } from '../data/ids/status';
import { getItemData } from '../data/items';
import { getMoveData } from '../data/moves';
import { getSpeciesData } from '../data/species';
import { Badge, Card, List, Meta, Note, Row } from './styled';

/**
 * Everything that changes what one unit looks like. The battle
 * mutates its units in place, so the view cannot observe them
 * directly — each card re-reads its own unit when the battle says
 * that unit moved, and nobody else's card redraws. The progress
 * bars ride the engine's own update events, which only fire while
 * something is actually casting, channeling or cooling
 */
const UNIT_EVENTS = [
  BattleEvents.UnitSetHealth,
  BattleEvents.UnitSetMaxHealth,
  BattleEvents.UnitSetStat,
  BattleEvents.UnitDamage,
  BattleEvents.UnitHeal,
  BattleEvents.UnitCure,
  BattleEvents.UnitFaints,
  BattleEvents.UnitAddStatus,
  BattleEvents.UnitRemoveStatus,
  BattleEvents.UnitTriggerStatus,
  BattleEvents.UnitUpdateStatusTimer,
  BattleEvents.UnitAddStage,
  BattleEvents.UnitRemoveStage,
  BattleEvents.UnitResetStages,
  BattleEvents.UnitAddType,
  BattleEvents.UnitRemoveType,
  BattleEvents.UnitAddAbility,
  BattleEvents.UnitRemoveAbility,
  BattleEvents.UnitEnableAbility,
  BattleEvents.UnitDisableAbility,
  BattleEvents.UnitTriggerAbility,
  BattleEvents.UnitAddItem,
  BattleEvents.UnitRemoveItem,
  BattleEvents.UnitEnableItem,
  BattleEvents.UnitDisableItem,
  BattleEvents.UnitTriggerItem,
  BattleEvents.UnitAddMove,
  BattleEvents.UnitRemoveMove,
  BattleEvents.UnitEnableMove,
  BattleEvents.UnitDisableMove,
  BattleEvents.UnitStartCooldown,
  BattleEvents.UnitUpdateCooldown,
  BattleEvents.UnitFinishCooldown,
  BattleEvents.UnitCast,
  BattleEvents.UnitUpdateCast,
  BattleEvents.UnitFinishCast,
  BattleEvents.UnitStopCast,
  BattleEvents.UnitInterrupt,
  BattleEvents.UnitChannel,
  BattleEvents.UnitUpdateChannel,
  BattleEvents.UnitFinishChannel,
  BattleEvents.UnitStopChannel,
  BattleEvents.UnitTriggerMove,
  BattleEvents.UnitTriggerMoveEnd,
  BattleEvents.UnitSetLevel,
  BattleEvents.UnitSetNature,
  BattleEvents.UnitSetGender,
  BattleEvents.UnitSetSpecies,
  BattleEvents.UnitSetAppearance,
] as const;

/**
 * Everything that changes who is on the field, rather than how one
 * of them looks. These rebuild the roster the field walks
 */
const ROSTER_EVENTS = [
  BattleEvents.UnitCreated,
  BattleEvents.UnitEntersField,
  BattleEvents.UnitLeavesField,
  BattleEvents.UnitSwitch,
  BattleEvents.TeamAddUnit,
  BattleEvents.TeamRemoveUnit,
  BattleEvents.AllianceAddTeam,
  BattleEvents.AllianceRemoveTeam,
  BattleEvents.AddAlliance,
  BattleEvents.RemoveAlliance,
] as const;

/**
 * The weather line, battle-wide and per team
 */
const WEATHER_EVENTS = [BattleEvents.SetWeather, BattleEvents.TeamSetWeather] as const;

/**
 * How many trigger lines the log keeps
 */
const LOG_LIMIT = 12;

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

const STAGE_NAMES: Record<Stages, string> = {
  [Stages.Attack]: 'Atk',
  [Stages.Defense]: 'Def',
  [Stages.SpecialAttack]: 'SpA',
  [Stages.SpecialDefense]: 'SpD',
  [Stages.Speed]: 'Spe',
  [Stages.Evasion]: 'Eva',
  [Stages.Accuracy]: 'Acc',
};

function describeAbility(ability: Abilities): string {
  try {
    return getAbilityData(ability).name;
  } catch {
    return `Ability #${ability}`;
  }
}

function describeItem(item: Items): string {
  try {
    return getItemData(item).name;
  } catch {
    return `Item #${item}`;
  }
}

const WEATHER_NAMES: Record<Weathers, string> = {
  [Weathers.None]: 'Clear',
  [Weathers.Sunny]: 'Sunny',
  [Weathers.Rain]: 'Rain',
  [Weathers.Sandstorm]: 'Sandstorm',
  [Weathers.Hail]: 'Hail',
  [Weathers.Snow]: 'Snow',
  [Weathers.Fog]: 'Fog',
  [Weathers.ExtremeSunny]: 'Harsh sunlight',
  [Weathers.HeavyRain]: 'Heavy rain',
  [Weathers.StrongWinds]: 'Strong winds',
};

/**
 * One alliance flattened into plain arrays. The battle keeps its
 * roster in Sets that mutate in place, so the field takes a copy it
 * can render and rebuilds it when the roster changes
 */
interface AllianceView {
  alliance: Alliance;
  teams: Unit[][];
}

/**
 * The units an event concerns: the one that acted, and the one it
 * landed on when there is one. A few of the listed events carry
 * neither, and simply redraw nothing
 */
function unitsOf(event: BaseEvent): Unit[] {
  const units: Unit[] = [];

  if ('source' in event && event.source instanceof Unit) {
    units.push(event.source);
  }
  if ('target' in event && event.target instanceof Unit) {
    units.push(event.target);
  }
  return units;
}

function readRoster(battle: Battle): AllianceView[] {
  return [...battle.alliances].map((alliance) => ({
    alliance,
    teams: [...alliance.teams].map((team) => [...team.units]),
  }));
}

/**
 * What a bar is measuring. Health, a cast and a channel are three
 * different clocks running on the same unit, and telling them apart at
 * a glance is most of what the readout is for
 */
type MeterTone = 'health' | 'down' | 'cast' | 'channel';

const METER_TONES: Record<MeterTone, string> = {
  health: 'bg-leaf',
  down: 'bg-muted',
  cast: 'bg-tide',
  channel: 'bg-arcane',
};

function Meter(props: { value: number; max: number; tone: MeterTone }): JSX.Element {
  const share = (): number =>
    props.max <= 0 ? 0 : Math.max(0, Math.min(1, props.value / props.max));

  return (
    <div class="h-2 overflow-hidden rounded-full bg-line-soft">
      <div
        class={`h-full rounded-full ${METER_TONES[props.tone]}`}
        style={{ width: `${share() * 100}%` }}
      />
    </div>
  );
}

/**
 * One unit as it stands right now: health, what it is in the middle
 * of, what is stuck to it, and what it brought
 */
function UnitCard(props: { unit: Unit; revision: () => number }): JSX.Element {
  /**
   * One reading of the unit, recomputed when the battle reports that
   * this unit moved — reading its revision is what subscribes the
   * card to its own unit and nobody else's
   */
  const view = createMemo(() => {
    const unit = props.unit;

    return {
      at: props.revision(),
      unit,
      maxHealth: unit.checkStat(Stats.HP, 0),
      statuses: (Object.keys(unit.status) as unknown as Statuses[]).filter(
        (status) => unit.status[status] != null,
      ),
      stages: (Object.entries(unit.stages) as unknown as [Stages, number][]).filter(
        ([, value]) => value !== 0,
      ),
      abilities: (Object.keys(unit.abilities) as unknown as Abilities[]).filter(
        (ability) => unit.abilities[ability] === true,
      ),
      items: (Object.keys(unit.items) as unknown as Items[]).filter(
        (item) => unit.items[item] === true,
      ),
      moves: Object.values(unit.moves),
    };
  });

  const unit = (): Unit => view().unit;
  const maxHealth = (): number => view().maxHealth;
  const statuses = (): Statuses[] => view().statuses;
  const stages = (): [Stages, number][] => view().stages;
  const abilities = (): Abilities[] => view().abilities;
  const items = (): Items[] => view().items;

  return (
    <li
      class={`flex flex-col gap-1.5 rounded-lg border border-line bg-paper px-3 py-2 text-left
        text-sm ${unit().alive ? '' : 'opacity-45'}`}
    >
      <div class="flex flex-wrap items-baseline gap-x-2">
        <strong class="grow">{getSpeciesData(unit().species).name}</strong>
        <Meta>Lv. {unit().level}</Meta>
      </div>
      <Meta>
        {Math.max(0, unit().health)} / {maxHealth()} HP
        {unit().alive ? '' : ' · fainted'}
      </Meta>
      <Meter value={unit().health} max={maxHealth()} tone={unit().alive ? 'health' : 'down'} />

      {/* What the unit is in the middle of doing */}
      <Show when={unit().casting}>
        {(casting) => (
          <>
            <Meta>Casting {getMoveData(casting().move).name}</Meta>
            <Meter value={casting().time.progress} max={casting().time.duration} tone="cast" />
          </>
        )}
      </Show>
      <Show when={unit().channeling}>
        {(channeling) => (
          <>
            <Meta>
              Channeling {getMoveData(channeling().move).name} · {channeling().steps} left
            </Meta>
            <Meter
              value={channeling().time.progress}
              max={channeling().time.duration}
              tone="channel"
            />
          </>
        )}
      </Show>

      {/* Everything stuck to the unit, in the order it matters: what
          is being done to it, how it has been moved, what it is, and
          what it brought */}
      <Show when={statuses().length}>
        <Row class="gap-1">
          <For each={statuses()}>
            {(status) => <Badge tone="ember">{STATUS_NAMES[status]}</Badge>}
          </For>
        </Row>
      </Show>

      <Show when={stages().length}>
        <Row class="gap-1">
          <For each={stages()}>
            {([stage, value]) => (
              <Badge tone={value > 0 ? 'leaf' : 'ember'}>
                {STAGE_NAMES[stage]} {value > 0 ? `+${value}` : value}
              </Badge>
            )}
          </For>
        </Row>
      </Show>

      <Show when={abilities().length}>
        <Row class="gap-1">
          <For each={abilities()}>
            {(ability) => <Badge tone="tide">{describeAbility(ability)}</Badge>}
          </For>
        </Row>
      </Show>

      <Show when={items().length}>
        <Row class="gap-1">
          <For each={items()}>{(item) => <Badge tone="gold">{describeItem(item)}</Badge>}</For>
        </Row>
      </Show>

      {/* Moves, with the ones cooling down called out */}
      <Row class="gap-1">
        <For each={view().moves}>
          {(move) => (
            <span class={move.cooldown ? 'opacity-50' : ''}>
              <Badge>
                {getMoveData(move.move).name}
                {move.disabled ? ' · disabled' : ''}
                {move.cooldown ? ' · cooling' : ''}
              </Badge>
            </span>
          )}
        </For>
      </Row>
    </li>
  );
}

export interface BattleFieldProps {
  battle: Battle;
  /**
   * A label per alliance, so a raid can name its sides rather than
   * numbering them
   */
  label?: (alliance: Alliance, index: number) => string;
}

/**
 * The battle as it stands: every alliance, its teams and their
 * units, plus a running log of the abilities and items that fired
 */
export default function BattleField(props: BattleFieldProps): JSX.Element {
  const [log, setLog] = createSignal<string[]>([]);
  const [roster, setRoster] = createSignal<AllianceView[]>(readRoster(props.battle));
  const [weather, setWeather] = createSignal(props.battle.weather.current);
  /**
   * One revision per unit, so an event about one pokemon redraws
   * that card alone. Cards register their own signal the first time
   * they read it, and units that never appear cost nothing
   */
  const revisions = new Map<Unit, [Accessor<number>, Setter<number>]>();

  const revisionOf = (unit: Unit): Accessor<number> => {
    let entry = revisions.get(unit);

    if (entry == null) {
      entry = createSignal(0);
      revisions.set(unit, entry);
    }
    return entry[0];
  };

  const touch = (unit: Unit): void => {
    revisions.get(unit)?.[1]((value) => value + 1);
  };

  onMount(() => {
    /**
     * Unit events name the unit they concern: `source` acts, and the
     * ones that land on somebody else carry a `target` too. Both are
     * redrawn, in one batch, so a hit updates attacker and defender
     * together rather than in two renders
     */
    const onUnitEvent = (event: BaseEvent): void => {
      batch(() => {
        for (const unit of unitsOf(event)) {
          touch(unit);
        }
      });
    };

    const onRosterEvent = (): void => {
      setRoster(readRoster(props.battle));
    };

    const onWeatherEvent = (): void => {
      setWeather(props.battle.weather.current);
    };

    for (const event of UNIT_EVENTS) {
      props.battle.on(event, EventPriority.Post, onUnitEvent);
    }
    for (const event of ROSTER_EVENTS) {
      props.battle.on(event, EventPriority.Post, onRosterEvent);
    }
    for (const event of WEATHER_EVENTS) {
      props.battle.on(event, EventPriority.Post, onWeatherEvent);
    }

    const push = (line: string): void => {
      setLog((lines) => [line, ...lines].slice(0, LOG_LIMIT));
    };

    // Triggered abilities and items announce themselves; the log is
    // the only place a one-frame event is visible at all
    const ability = props.battle.on(
      BattleEvents.UnitTriggerAbility,
      EventPriority.Post,
      (event) => {
        push(
          `${getSpeciesData(event.source.species).name}'s ${describeAbility(event.ability)} fired`,
        );
      },
    );
    const item = props.battle.on(BattleEvents.UnitTriggerItem, EventPriority.Post, (event) => {
      push(`${getSpeciesData(event.source.species).name} used its ${describeItem(event.item)}`);
    });
    const faint = props.battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
      push(`${getSpeciesData(event.source.species).name} fainted`);
    });

    onCleanup(() => {
      for (const event of UNIT_EVENTS) {
        props.battle.off(event, EventPriority.Post, onUnitEvent);
      }
      for (const event of ROSTER_EVENTS) {
        props.battle.off(event, EventPriority.Post, onRosterEvent);
      }
      for (const event of WEATHER_EVENTS) {
        props.battle.off(event, EventPriority.Post, onWeatherEvent);
      }
      ability.stop();
      item.stop();
      faint.stop();
    });
  });

  return (
    <div class="flex flex-col gap-4">
      <Show when={weather() !== Weathers.None}>
        <Row>
          <Badge tone="tide">Weather: {WEATHER_NAMES[weather()]}</Badge>
        </Row>
      </Show>

      {/* Two sides of a fight read side by side where there is room
          for it, and stacked where there is not */}
      <div class="grid gap-4 lg:grid-cols-2">
        <For each={roster()}>
          {(alliance, index) => (
            <Card title={props.label?.(alliance.alliance, index()) ?? `Alliance ${index() + 1}`}>
              <For each={alliance.teams}>
                {(team, teamIndex) => (
                  <>
                    <Show when={alliance.teams.length > 1}>
                      <h4>Team {teamIndex() + 1}</h4>
                    </Show>
                    <List>
                      <For each={team}>
                        {(unit) => <UnitCard unit={unit} revision={revisionOf(unit)} />}
                      </For>
                    </List>
                  </>
                )}
              </For>
            </Card>
          )}
        </For>
      </div>

      <Card title="Log">
        <Show when={log().length} fallback={<Note>Nothing has fired yet.</Note>}>
          {/* Newest last, and only so tall: a long fight should not
              push the field off the screen */}
          <ul
            class="m-0 flex max-h-64 list-none flex-col gap-0.5 overflow-y-auto p-0 text-left
            text-sm text-muted"
          >
            <For each={log()}>{(line) => <li>{line}</li>}</For>
          </ul>
        </Show>
      </Card>
    </div>
  );
}
