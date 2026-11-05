import { Slots, defaultSlots, getSlots, mostSlots } from '../../../src/data/constants/slots';
import type { EncounterRecord } from '../../../src/model/encounter-record';

/**
 * The CHECK constraints and column types a meeting is written under,
 * read once from `db/migrations` and named here. A value outside one
 * fails the insert, so a player who won the encounter loses the catch
 * (2cf05e9bf: a legendary rolled level 103)
 */

/** `caught_level_check` and `caught_learn_from_check` (0001, 0003) */
export const LEVEL_BOUNDS = [1, 100] as const;

/** `caught_ivs_check` (0001): six five-bit values */
export const IVS_BOUNDS = [0, 1073741823] as const;

/** `caught_slots_check` (0001): three three-bit counts */
export const SLOTS_BOUNDS = [0, 511] as const;

/** `caught_moves_slot_check` (0005): eight move slots */
export const MOVE_SLOT_COUNT = 8;

/** A `smallint` column: type, level, lair, nature, gender, biome and slots in `encounters` */
const SMALLINT = [-32768, 32767] as const;

/** An `integer` column: species, both rolls, ivs, ability, x and y in `encounters` */
const INTEGER = [-2147483648, 2147483647] as const;

function within(value: number, [least, most]: readonly [number, number]): boolean {
  return Number.isInteger(value) && value >= least && value <= most;
}

/** Every way a meeting would fail its insert, empty when it would not */
export function checkEncounterRow(record: EncounterRecord): string[] {
  const broken: string[] = [];
  const name = `species ${record.species} (${record.spawn})`;

  // The bounds the catch is held to
  if (!within(record.level, LEVEL_BOUNDS)) {
    broken.push(`${name}: level ${record.level}`);
  }
  if (!within(record.ivs, IVS_BOUNDS)) {
    broken.push(`${name}: ivs ${record.ivs}`);
  }

  // The room it walks in with has to hold what it walks in with
  const slots = record.slots ?? defaultSlots();

  if (!within(slots, SLOTS_BOUNDS)) {
    broken.push(`${name}: slots ${slots}`);
  }
  if (record.moves.length > Math.min(MOVE_SLOT_COUNT, getSlots(slots, Slots.Move))) {
    broken.push(`${name}: ${record.moves.length} moves in ${getSlots(slots, Slots.Move)} slots`);
  }
  if ((record.abilities?.length ?? 1) > mostSlots(Slots.Ability)) {
    broken.push(`${name}: ${record.abilities?.length} abilities`);
  }

  // The column types of the encounters row itself
  const small: [string, number | null][] = [
    ['type', record.type],
    ['lair', record.lair],
    ['nature', record.nature],
    ['gender', record.gender],
    ['biome', record.biome],
  ];

  for (const [column, value] of small) {
    if (value != null && !within(value, SMALLINT)) {
      broken.push(`${name}: ${column} ${value}`);
    }
  }

  const wide: [string, number][] = [
    ['species', record.species],
    ['individual_value', record.individualValue],
    ['trait_value', record.traitValue],
    ['ability', record.ability],
    ['x', record.x],
    ['y', record.y],
  ];

  for (const [column, value] of wide) {
    if (!within(value, INTEGER)) {
      broken.push(`${name}: ${column} ${value}`);
    }
  }
  return broken;
}
