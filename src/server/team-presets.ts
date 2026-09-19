import 'server-only';
import { TEAM_PRESET_LIMIT, type TeamPresetRecord } from '../auth/team-preset-record';
import { TEAM_SIZE } from '../auth/teams';
import { asNickname } from '../auth/nickname';
import { type Tx, getSql, newDocId, tx } from './db';
import { readCaughtMany } from './caught-io';
import { asNumber, asString } from './read';

/**
 * Team presets: the parties a player saved for themselves.
 *
 * Only the ids are kept, so a preset follows its pokemon rather than
 * freezing them, and what it names may be unusable by the time it is
 * loaded. Nothing is checked here beyond ownership: whether a pokemon
 * has fainted or is already in a raid is the picker's question, asked
 * when the preset is loaded rather than when it is saved.
 */

/** Every preset the player has saved, oldest first */
export async function readTeamPresets(uid: string): Promise<[string, TeamPresetRecord][]> {
  const sql = getSql();
  const rows = await sql`
    select id, name, made_at from team_presets where player = ${uid} order by made_at
  `;

  if (rows.length === 0) {
    return [];
  }

  const held = await sql`
    select preset_id, slot, caught_id from team_preset_catches
    where preset_id in ${sql(rows.map((row) => asString(row.id)))}
    order by preset_id, slot
  `;
  const parties = new Map<string, string[]>();

  for (const entry of held) {
    const preset = asString(entry.preset_id);

    parties.set(preset, [...(parties.get(preset) ?? []), asString(entry.caught_id)]);
  }

  const presets: [string, TeamPresetRecord][] = [];

  for (const row of rows) {
    const id = asString(row.id);

    presets.push([
      id,
      { name: asString(row.name), madeAt: asNumber(row.made_at), catches: parties.get(id) ?? [] },
    ]);
  }
  return presets;
}

/** Which of these the player actually owns, in the order they were given */
async function ownedBy(
  transaction: Tx,
  uid: string,
  catches: readonly string[],
): Promise<string[] | null> {
  const wanted = [...new Set(catches)];

  if (wanted.length !== catches.length || wanted.length === 0 || wanted.length > TEAM_SIZE) {
    return null;
  }

  const found = await readCaughtMany(transaction, wanted, false, []);
  const kept: string[] = [];

  for (const id of catches) {
    if (asString(found.get(id)?.owner) !== uid) {
      return null;
    }
    kept.push(id);
  }
  return kept;
}

/**
 * Save a party under a name, or rewrite one the player already has.
 * Resolves the preset's id, or null when a pokemon is not theirs, the
 * party is empty or repeats one, or they are at their limit
 */
export async function writeTeamPreset(
  uid: string,
  preset: string | null,
  name: string,
  catches: readonly string[],
): Promise<string | null> {
  const written = asNickname(name);

  if (written === '') {
    return null;
  }

  return tx(async (transaction) => {
    const party = await ownedBy(transaction, uid, catches);

    if (party == null) {
      return null;
    }

    if (preset != null) {
      const held = await transaction`
        select id from team_presets where id = ${preset} and player = ${uid} for update
      `;

      if (held.length === 0) {
        return null;
      }
      await transaction`update team_presets set name = ${written} where id = ${preset}`;
      await transaction`delete from team_preset_catches where preset_id = ${preset}`;
      await fill(transaction, preset, party);
      return preset;
    }

    // Counted inside the transaction, so two saves sent together
    // cannot both find room for the last one
    const standing = await transaction`
      select count(*)::int as held from team_presets where player = ${uid}
    `;

    if (asNumber(standing.at(0)?.held) >= TEAM_PRESET_LIMIT) {
      return null;
    }

    const id = newDocId();

    await transaction`
      insert into team_presets (id, player, name, made_at)
      values (${id}, ${uid}, ${written}, ${Date.now()})
    `;
    await fill(transaction, id, party);
    return id;
  });
}

async function fill(transaction: Tx, preset: string, catches: readonly string[]): Promise<void> {
  for (const [slot, caught] of catches.entries()) {
    await transaction`
      insert into team_preset_catches (preset_id, slot, caught_id)
      values (${preset}, ${slot}, ${caught})
    `;
  }
}

/** Drop a preset. Resolves false when it is not the player's */
export async function removeTeamPreset(uid: string, preset: string): Promise<boolean> {
  const sql = getSql();
  const gone = await sql`
    delete from team_presets where id = ${preset} and player = ${uid} returning id
  `;

  return gone.length > 0;
}
