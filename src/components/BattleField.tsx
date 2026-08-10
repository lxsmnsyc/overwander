// The battle keys its status, stage, ability and item records by
// const-enum members, which Object.keys hands back as strings; the
// assertions below put the enum type back on them
// oxlint-disable typescript/no-unsafe-type-assertion
import { For, type JSX, Show, createMemo, createSignal, onCleanup, onMount } from 'solid-js';
import type Alliance from '../battle/alliance';
import type Battle from '../battle/core';
import { BattleEvents } from '../battle/events';
import type Unit from '../battle/unit';
import { EventPriority } from '../core/event-emitter';
import { Stages, Stats } from '../data/constants/stats';
import { getAbilityData } from '../data/abilities';
import type Abilities from '../data/ids/abilities';
import type { Items } from '../data/ids/items';
import { Statuses } from '../data/ids/status';
import { getItemData } from '../data/items';
import { getMoveData } from '../data/moves';
import { getSpeciesData } from '../data/species';

/**
 * Every event that changes something the field draws. The battle
 * mutates its units in place, so the view cannot observe them
 * directly — it re-reads them when the battle says they moved.
 * Progress bars ride the engine's own update events, which only
 * fire while something is actually casting, channeling or cooling
 */
const FIELD_EVENTS = [
  BattleEvents.UnitSetHealth,
  BattleEvents.UnitSetMaxHealth,
  BattleEvents.UnitDamage,
  BattleEvents.UnitHeal,
  BattleEvents.UnitFaints,
  BattleEvents.UnitAddStatus,
  BattleEvents.UnitRemoveStatus,
  BattleEvents.UnitUpdateStatusTimer,
  BattleEvents.UnitAddStage,
  BattleEvents.UnitRemoveStage,
  BattleEvents.UnitResetStages,
  BattleEvents.UnitAddAbility,
  BattleEvents.UnitRemoveAbility,
  BattleEvents.UnitEnableAbility,
  BattleEvents.UnitDisableAbility,
  BattleEvents.UnitAddItem,
  BattleEvents.UnitRemoveItem,
  BattleEvents.UnitEnableItem,
  BattleEvents.UnitDisableItem,
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
  BattleEvents.UnitChannel,
  BattleEvents.UnitUpdateChannel,
  BattleEvents.UnitFinishChannel,
  BattleEvents.UnitStopChannel,
  BattleEvents.UnitSetLevel,
  BattleEvents.UnitSetSpecies,
  BattleEvents.UnitEntersField,
  BattleEvents.UnitLeavesField,
  BattleEvents.TeamAddUnit,
  BattleEvents.TeamRemoveUnit,
  BattleEvents.AllianceAddTeam,
  BattleEvents.AllianceRemoveTeam,
] as const;

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

const CARD_STYLE = {
  border: '1px solid #ddd',
  'border-radius': '0.4rem',
  padding: '0.5rem 0.75rem',
  margin: '0.35rem 0',
  'text-align': 'left',
} as const;

const CHIP_STYLE = {
  display: 'inline-block',
  border: '1px solid #ccc',
  'border-radius': '999px',
  padding: '0 0.5rem',
  margin: '0 0.25rem 0.25rem 0',
  'font-size': '0.8rem',
} as const;

function Meter(props: { value: number; max: number; color: string }): JSX.Element {
  const share = (): number =>
    props.max <= 0 ? 0 : Math.max(0, Math.min(1, props.value / props.max));

  return (
    <div
      style={{
        background: '#eee',
        'border-radius': '999px',
        height: '0.5rem',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${share() * 100}%`,
          background: props.color,
          height: '100%',
        }}
      />
    </div>
  );
}

/**
 * One unit as it stands right now: health, what it is in the middle
 * of, what is stuck to it, and what it brought
 */
function UnitCard(props: { unit: Unit; revision: number }): JSX.Element {
  /**
   * One reading of the unit. The battle mutates it in place, so the
   * card recomputes whenever the poller bumps the revision — that
   * dependency is the whole point of reading it here
   */
  const view = createMemo(() => {
    const unit = props.unit;

    return {
      // Reading the revision is the dependency that re-runs the memo
      at: props.revision,
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
    <li style={{ ...CARD_STYLE, opacity: unit().alive ? '1' : '0.45' }}>
      <strong>
        {getSpeciesData(unit().species).name} · Lv. {unit().level}
      </strong>
      <div>
        {Math.max(0, unit().health)} / {maxHealth()} HP
        {unit().alive ? '' : ' · fainted'}
      </div>
      <Meter value={unit().health} max={maxHealth()} color={unit().alive ? '#4c9a4c' : '#999'} />

      {/* What the unit is in the middle of doing */}
      <Show when={unit().casting}>
        {(casting) => (
          <div>
            <div>Casting {getMoveData(casting().move).name}</div>
            <Meter value={casting().time.progress} max={casting().time.duration} color="#4c7a9a" />
          </div>
        )}
      </Show>
      <Show when={unit().channeling}>
        {(channeling) => (
          <div>
            <div>
              Channeling {getMoveData(channeling().move).name} · {channeling().steps} left
            </div>
            <Meter
              value={channeling().time.progress}
              max={channeling().time.duration}
              color="#7a4c9a"
            />
          </div>
        )}
      </Show>

      <Show when={statuses().length}>
        <div>
          <For each={statuses()}>
            {(status) => <span style={CHIP_STYLE}>{STATUS_NAMES[status]}</span>}
          </For>
        </div>
      </Show>

      <Show when={stages().length}>
        <div>
          <For each={stages()}>
            {([stage, value]) => (
              <span style={CHIP_STYLE}>
                {STAGE_NAMES[stage]} {value > 0 ? `+${value}` : value}
              </span>
            )}
          </For>
        </div>
      </Show>

      <Show when={abilities().length}>
        <div>
          <For each={abilities()}>
            {(ability) => <span style={CHIP_STYLE}>{describeAbility(ability)}</span>}
          </For>
        </div>
      </Show>

      <Show when={items().length}>
        <div>
          <For each={items()}>{(item) => <span style={CHIP_STYLE}>{describeItem(item)}</span>}</For>
        </div>
      </Show>

      {/* Moves, with the ones cooling down called out */}
      <div>
        <For each={view().moves}>
          {(move) => (
            <span style={{ ...CHIP_STYLE, opacity: move.cooldown ? '0.5' : '1' }}>
              {getMoveData(move.move).name}
              {move.disabled ? ' · disabled' : ''}
              {move.cooldown ? ' · cooling' : ''}
            </span>
          )}
        </For>
      </div>
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
  const [revision, setRevision] = createSignal(0);
  const [log, setLog] = createSignal<string[]>([]);

  onMount(() => {
    // Several events land per battle frame; the re-read is coalesced
    // to one per animation frame rather than one per event
    let frame: number | null = null;

    const bump = (): void => {
      frame ??= requestAnimationFrame(() => {
        frame = null;
        setRevision((value) => value + 1);
      });
    };

    for (const event of FIELD_EVENTS) {
      props.battle.on(event, EventPriority.Post, bump);
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
      if (frame != null) {
        cancelAnimationFrame(frame);
      }
      for (const event of FIELD_EVENTS) {
        props.battle.off(event, EventPriority.Post, bump);
      }
      ability.stop();
      item.stop();
      faint.stop();
    });
  });

  // Teams and units can join mid-fight and the sets are not
  // reactive, so the roster is re-read whenever the battle reports a
  // change. Reading the revision is what makes that happen
  const alliances = createMemo(() => (revision() >= 0 ? [...props.battle.alliances] : []));

  return (
    <div>
      <For each={alliances()}>
        {(alliance, index) => (
          <section>
            <h2>{props.label?.(alliance, index()) ?? `Alliance ${index() + 1}`}</h2>
            <For each={[...alliance.teams]}>
              {(team, teamIndex) => (
                <>
                  <Show when={alliance.teams.size > 1}>
                    <h3>Team {teamIndex() + 1}</h3>
                  </Show>
                  <ul style={{ 'list-style': 'none', padding: '0' }}>
                    <For each={[...team.units]}>
                      {(unit) => <UnitCard unit={unit} revision={revision()} />}
                    </For>
                  </ul>
                </>
              )}
            </For>
          </section>
        )}
      </For>

      <section>
        <h2>Log</h2>
        <Show when={log().length} fallback={<p>Nothing has fired yet.</p>}>
          <ul style={{ 'list-style': 'none', padding: '0', 'text-align': 'left' }}>
            <For each={log()}>{(line) => <li>{line}</li>}</For>
          </ul>
        </Show>
      </section>
    </div>
  );
}
