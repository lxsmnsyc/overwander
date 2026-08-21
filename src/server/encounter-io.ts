import 'server-only';
import type { EncounterRecord } from '../auth/encounter-record';
import { type Tx, getSql } from './db';
import { asNumber } from './read';

/**
 * The encounter tables in and out of the legacy record shape, the
 * same bridge [`caught-io.ts`](./caught-io.ts) is for catches. The
 * row is the authority on what a player met, so the reader is what
 * `recordCatch` builds a pokemon from.
 */

/**
 * One staged encounter in the record shape, or null when the player
 * is not in it
 */
export async function readEncounter(
  spawnId: string,
  player: string,
): Promise<Record<string, unknown> | null> {
  const sql = getSql();
  const rows = await sql`
    select * from encounters where spawn_id = ${spawnId} and player = ${player}
  `;
  const row = rows.at(0);

  if (row == null) {
    return null;
  }

  const [moves, items, abilities] = await Promise.all([
    sql`select move from encounter_moves
        where spawn_id = ${spawnId} and player = ${player} order by slot`,
    sql`select item from encounter_items
        where spawn_id = ${spawnId} and player = ${player} order by slot`,
    sql`select ability from encounter_abilities
        where spawn_id = ${spawnId} and player = ${player} order by slot`,
  ]);

  return {
    spawn: spawnId,
    player,
    type: row.type,
    species: row.species,
    level: row.level,
    individualValue: row.individual_value,
    traitValue: row.trait_value,
    ivs: row.ivs,
    lair: row.lair,
    nature: row.nature,
    ability: row.ability,
    gender: row.gender,
    shiny: row.shiny,
    shadow: row.shadow,
    moves: moves.map((entry) => asNumber(entry.move)),
    items: items.map((entry) => asNumber(entry.item)),
    timestamp: row.window_at,
    x: row.x,
    y: row.y,
    biome: row.biome,
    ...(row.place == null ? {} : { place: row.place }),
    ...(row.slots == null ? {} : { slots: row.slots }),
    ...(abilities.length > 0
      ? { abilities: abilities.map((entry) => asNumber(entry.ability)) }
      : {}),
  };
}

/**
 * Stage one, idempotently: the primary key makes a second staging of
 * the same meeting a no-op, which is what lets re-entering an
 * encounter never re-roll it
 */
export async function writeEncounter(transaction: Tx, record: EncounterRecord): Promise<void> {
  const inserted = await transaction`
    insert into encounters
      (spawn_id, player, type, species, level, individual_value, trait_value,
       ivs, lair, nature, ability, gender, shiny, shadow, window_at, x, y,
       biome, place, slots)
    values
      (${record.spawn}, ${record.player}, ${record.type}, ${record.species},
       ${record.level}, ${record.individualValue}, ${record.traitValue},
       ${record.ivs}, ${record.lair}, ${record.nature}, ${record.ability},
       ${record.gender}, ${record.shiny}, ${record.shadow}, ${record.timestamp},
       ${record.x}, ${record.y}, ${record.biome},
       ${record.place ?? null}, ${record.slots ?? null})
    on conflict (spawn_id, player) do nothing
  `;

  if (inserted.count === 0) {
    return;
  }

  const key = { spawn_id: record.spawn, player: record.player };
  const moves = record.moves.map((move, slot) => ({ ...key, slot, move }));
  const items = record.items.map((item, slot) => ({ ...key, slot, item }));
  const abilities = (record.abilities ?? []).map((ability, slot) => ({ ...key, slot, ability }));

  if (moves.length > 0) {
    await transaction`
      insert into encounter_moves ${transaction(moves, 'spawn_id', 'player', 'slot', 'move')}
    `;
  }
  if (items.length > 0) {
    await transaction`
      insert into encounter_items ${transaction(items, 'spawn_id', 'player', 'slot', 'item')}
    `;
  }
  if (abilities.length > 0) {
    await transaction`
      insert into encounter_abilities ${transaction(abilities, 'spawn_id', 'player', 'slot', 'ability')}
    `;
  }
}
