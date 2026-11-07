// The battle keys its statuses by const-enum members, which Object.keys
// hands back as strings; the assertion below puts the enum type back
// oxlint-disable typescript/no-unsafe-type-assertion
import { type EffectCause, EffectType, type ProgressData } from '../../../battle/events';
import { castShownAs } from '../../../battle/gimmicks/dynamax/max-moves';
import type Unit from '../../../battle/unit';
import { Stats } from '../../../data/constants/stats';
import type Abilities from '../../../data/ids/abilities';
import type { Items } from '../../../data/ids/items';
import { Moves } from '../../../data/ids/moves';
import type { Statuses } from '../../../data/ids/status';
import { type AbilityKind, abilityKind, detailAbility, detailItem } from '../../details';
import { getMoveData } from '../../../data/moves';

/**
 * One pokemon in a fight read down to what a card or the inspector
 * draws. The engine mutates units in place, so a reading is a picture
 * of one instant and is taken again whenever the unit moves.
 */

/** One move's row: what it is and how far its cooldown has come back */
export interface MoveReading {
  move: Moves;
  name: string;
  disabled: boolean;
  /** From 0 to 1, where 1 is a move that can be thrown now */
  ready: number;
  /** Milliseconds until it can be thrown again, 0 when ready */
  left: number;
}

/**
 * Where a held item stands: in hand and working, in hand but stopped
 * (Embargo, Magic Room, Klutz), used up by its holder, or taken by
 * something else
 */
export type ItemState = 'held' | 'stopped' | 'used' | 'lost';

/** One item the unit started with or picked up, gone or not */
export interface ItemReading {
  item: Items;
  name: string;
  description: string;
  state: ItemState;
  /** What took a lost item: a move, an ability or an item, by name */
  by: string | null;
}

/** What the unit is winding up, if anything */
export interface ActingReading {
  name: string;
  channelling: boolean;
  /** From 0 to 1 */
  done: number;
}

export interface UnitReading {
  unit: Unit;
  maxHealth: number;
  statuses: Statuses[];
  moves: MoveReading[];
  abilities: { name: string; description: string; kind: AbilityKind }[];
  items: ItemReading[];
  acting: ActingReading | null;
}

/**
 * How far along a timed thing is, as a fraction of itself. Everything
 * the engine times (a cooldown coming back, a move being wound up)
 * counts up to its own duration, so they are all read the same way.
 * Nothing timed at all is finished: a move that is not cooling can be
 * thrown now
 */
export function readFraction(progress: ProgressData | undefined): number {
  if (progress == null) {
    return 1;
  }
  return progress.duration <= 0
    ? 1
    : Math.min(1, Math.max(0, progress.progress / progress.duration));
}

/** Milliseconds a timed thing has left to run */
function readLeft(progress: ProgressData | undefined): number {
  return progress == null ? 0 : Math.max(0, progress.duration - progress.progress);
}

/**
 * How an item left the unit. Its own spend (a berry eaten, a gem
 * used, a berry chewed again) is used up; anything else, its own
 * Fling or Trick included, names what took it
 */
function readRemoval(
  unit: Unit,
  item: Items,
  cause: EffectCause,
): Pick<ItemReading, 'state' | 'by'> {
  switch (cause.type) {
    case EffectType.Item:
      return cause.item === item && cause.unit === unit
        ? { state: 'used', by: null }
        : { state: 'lost', by: detailItem(cause.item).name };
    case EffectType.Move:
      return { state: 'lost', by: getMoveData(cause.move).name };
    case EffectType.Ability:
      // Its own ability eating its own berry (Cud Chew) is a use; a
      // foe's (Pickpocket, Magician) is a theft
      return cause.unit === unit
        ? { state: 'used', by: null }
        : { state: 'lost', by: detailAbility(cause.ability).name };
    default:
      return { state: 'lost', by: null };
  }
}

export function readUnit(unit: Unit): UnitReading {
  // The one thing being cast or channelled, read as a picture of this
  // instant rather than as the engine's own object: the state is
  // mutated in place and swapped out, and a card holding the object
  // would show a cast that finished a second ago
  const acting = unit.casting ?? unit.channeling;

  const statuses: Statuses[] = [];

  for (const status of Object.keys(unit.status) as unknown as Statuses[]) {
    if (unit.status[status] != null) {
      statuses.push(status);
    }
  }

  const moves: MoveReading[] = [];

  for (const move of Object.values(unit.moves)) {
    // The plain swing every unit is fielded with is not one of its moves
    if (move.move === Moves.Attack) {
      continue;
    }
    moves.push({
      move: move.move,
      name: getMoveData(move.move).name,
      disabled: move.disabled,
      ready: readFraction(move.cooldown),
      left: readLeft(move.cooldown),
    });
  }

  // Only the enabled half: a suppressed ability or an eaten item is one
  // the pokemon no longer has
  const abilities: UnitReading['abilities'] = [];

  for (const key of Object.keys(unit.abilities)) {
    const ability: Abilities = Number(key);

    if (unit.abilities[ability] === true) {
      abilities.push({ ...detailAbility(ability), kind: abilityKind(unit.species, ability) });
    }
  }

  // Every item the unit has held this fight. A removed item keeps its
  // key with no value, so a lost one stays in the tray
  const items: ItemReading[] = [];

  for (const key of Object.keys(unit.items)) {
    const item: Items = Number(key);
    const held = unit.items[item];

    if (held != null) {
      items.push({
        item,
        ...detailItem(item),
        state: held && unit.hasItem(item) ? 'held' : 'stopped',
        by: null,
      });
      continue;
    }
    const cause = unit.removedItems.get(item);

    if (cause == null) {
      continue;
    }
    items.push({ item, ...detailItem(item), ...readRemoval(unit, item, cause) });
  }

  return {
    unit,
    maxHealth: unit.checkStat(Stats.HP, 0),
    statuses,
    moves,
    abilities,
    items,
    acting:
      acting == null
        ? null
        : {
            name: getMoveData(castShownAs(unit, acting)).name,
            channelling: unit.channeling != null,
            done: readFraction(acting.time),
          },
  };
}

/** Health left as a share of the unit's maximum, from 0 to 1 */
export function readHealth(reading: UnitReading): number {
  const max = reading.maxHealth;

  return max <= 0 ? 0 : Math.max(0, Math.min(1, reading.unit.health / max));
}
