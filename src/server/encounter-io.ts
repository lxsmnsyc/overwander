import 'server-only';
import type { Items } from '../data/ids/items';
import type { EncounterRecord } from '../auth/encounter-record';
import { WORLD_GENERATION } from '../overworld/current';
import { type Tx, getSql } from './db';
import { asNumber } from './read';
import { isOwedEncounter } from '../overworld/encounter/kinds';
import { spawnKey } from '../overworld/safari';

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
  return (await readEncounters([spawnId], player)).get(spawnId) ?? null;
}

/** Several of one player's staged encounters in the record shape, by spawn id */
export async function readEncounters(
  spawnIds: string[],
  player: string,
): Promise<Map<string, Record<string, unknown>>> {
  const found = new Map<string, Record<string, unknown>>();

  if (spawnIds.length === 0) {
    return found;
  }

  const sql = getSql();
  const [rows, moves, items, abilities] = await Promise.all([
    sql`select * from encounters
        where generation = ${WORLD_GENERATION} and spawn_id = any(${spawnIds}) and player = ${player}`,
    sql`select spawn_id, move from encounter_moves
        where generation = ${WORLD_GENERATION} and spawn_id = any(${spawnIds}) and player = ${player}
        order by slot`,
    sql`select spawn_id, item from encounter_items
        where generation = ${WORLD_GENERATION} and spawn_id = any(${spawnIds}) and player = ${player}
        order by slot`,
    sql`select spawn_id, ability from encounter_abilities
        where generation = ${WORLD_GENERATION} and spawn_id = any(${spawnIds}) and player = ${player}
        order by slot`,
  ]);

  const moveIds = new Map<string, number[]>();
  const itemIds = new Map<string, number[]>();
  const abilityIds = new Map<string, number[]>();

  for (const entry of moves) {
    pushTo(moveIds, String(entry.spawn_id), asNumber(entry.move));
  }
  for (const entry of items) {
    pushTo(itemIds, String(entry.spawn_id), asNumber(entry.item));
  }
  for (const entry of abilities) {
    pushTo(abilityIds, String(entry.spawn_id), asNumber(entry.ability));
  }

  for (const row of rows) {
    const spawnId = String(row.spawn_id);
    const rolled = abilityIds.get(spawnId) ?? [];

    found.set(spawnId, {
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
      moves: moveIds.get(spawnId) ?? [],
      items: itemIds.get(spawnId) ?? [],
      timestamp: row.window_at,
      x: row.x,
      y: row.y,
      biome: row.biome,
      ...(row.place == null ? {} : { place: row.place }),
      ...(row.slots == null ? {} : { slots: row.slots }),
      ...(rolled.length > 0 ? { abilities: rolled } : {}),
      ...(row.fed == null ? {} : { fed: row.fed }),
    });
  }
  return found;
}

function pushTo(lists: Map<string, number[]>, key: string, value: number): void {
  const list = lists.get(key);

  if (list == null) {
    lists.set(key, [value]);
  } else {
    list.push(value);
  }
}

/**
 * Every meeting owed to this player that is still open: a raid prize,
 * a grunt's pokemon, a gift or a revived fossil they closed without
 * catching. Newest first
 */
export async function readWaitingEncounters(uid: string): Promise<Record<string, unknown>[]> {
  const sql = getSql();
  const [rows, retired] = await Promise.all([
    sql`
      select spawn_id, type, x, y, window_at, individual_value from encounters
      where player = ${uid} and generation = ${WORLD_GENERATION}
      order by window_at desc
    `,
    readRetiredKeys(uid),
  ]);
  const gone = new Set(retired);
  const open: string[] = [];

  for (const row of rows) {
    const key = spawnKey(
      asNumber(row.x),
      asNumber(row.y),
      asNumber(row.window_at),
      asNumber(row.individual_value),
    );

    if (isOwedEncounter(asNumber(row.type)) && !gone.has(key)) {
      open.push(String(row.spawn_id));
    }
  }

  const records = await readEncounters(open, uid);
  const waiting: Record<string, unknown>[] = [];

  for (const spawnId of open) {
    const record = records.get(spawnId);

    if (record != null) {
      waiting.push(record);
    }
  }
  return waiting;
}

/**
 * Write down what the player just fed this meeting.
 *
 * The berry is spent in the same call that lands here, so the row is
 * the only place it survives to the catch. One column rather than a
 * list: the encounter chews one treat at a time, and a later feeding
 * is the one that counts
 */
export async function stampFeed(spawnId: string, player: string, item: Items): Promise<void> {
  const sql = getSql();

  await sql`
    update encounters set fed = ${item}
    where generation = ${WORLD_GENERATION} and spawn_id = ${spawnId} and player = ${player}
  `;
}

/**
 * Stage one, idempotently: the primary key makes a second staging of
 * the same meeting a no-op, which is what lets re-entering an
 * encounter never re-roll it
 */
export async function writeEncounter(transaction: Tx, record: EncounterRecord): Promise<void> {
  const inserted = await transaction`
    insert into encounters
      (generation, spawn_id, player, type, species, level, individual_value, trait_value,
       ivs, lair, nature, ability, gender, shiny, shadow, window_at, x, y,
       biome, place, slots)
    values
      (${WORLD_GENERATION}, ${record.spawn}, ${record.player}, ${record.type}, ${record.species},
       ${record.level}, ${record.individualValue}, ${record.traitValue},
       ${record.ivs}, ${record.lair}, ${record.nature}, ${record.ability},
       ${record.gender}, ${record.shiny}, ${record.shadow}, ${record.timestamp},
       ${record.x}, ${record.y}, ${record.biome},
       ${record.place ?? null}, ${record.slots ?? null})
    on conflict (generation, spawn_id, player) do nothing
  `;

  if (inserted.count === 0) {
    return;
  }

  const key = { generation: WORLD_GENERATION, spawn_id: record.spawn, player: record.player };
  const moves: (typeof key & { slot: number; move: number })[] = [];
  const items: (typeof key & { slot: number; item: number })[] = [];
  const abilities: (typeof key & { slot: number; ability: number })[] = [];

  for (const [slot, move] of record.moves.entries()) {
    moves.push({ ...key, slot, move });
  }
  for (const [slot, item] of record.items.entries()) {
    items.push({ ...key, slot, item });
  }
  for (const [slot, ability] of (record.abilities ?? []).entries()) {
    abilities.push({ ...key, slot, ability });
  }

  if (moves.length > 0) {
    await transaction`
      insert into encounter_moves ${transaction(moves, 'generation', 'spawn_id', 'player', 'slot', 'move')}
    `;
  }
  if (items.length > 0) {
    await transaction`
      insert into encounter_items ${transaction(items, 'generation', 'spawn_id', 'player', 'slot', 'item')}
    `;
  }
  if (abilities.length > 0) {
    await transaction`
      insert into encounter_abilities ${transaction(abilities, 'generation', 'spawn_id', 'player', 'slot', 'ability')}
    `;
  }
}

/** The keys of every encounter that has run from this player, in the live generation */
export async function readRetiredKeys(uid: string): Promise<string[]> {
  const rows = await getSql()`
    select key from fled_encounters
    where player = ${uid} and generation = ${WORLD_GENERATION}
  `;
  const keys: string[] = [];

  for (const row of rows) {
    keys.push(String(row.key));
  }
  return keys;
}

/** The safari tally stored on this player's encounter, as it was written */
export async function readSafariTally(spawnId: string, player: string): Promise<unknown> {
  const rows = await getSql()`
    select safari from encounters
    where generation = ${WORLD_GENERATION} and spawn_id = ${spawnId} and player = ${player}
  `;

  return rows.at(0)?.safari ?? null;
}
