import { asNumber, asRecordArray, asString } from './__normalize';
import type { TeamPresetRecord } from './team-preset-record';
import getIdToken from './session';
import getSupabase from './supabase';
import { requireUid } from '../server/auth';
import check, { ID, NICKNAME, PARTY, TOKEN } from '../server/validate';
import {
  removeTeamPreset as removeOnServer,
  writeTeamPreset as writeOnServer,
} from '../server/team-presets';

export { TEAM_PRESET_LIMIT } from './team-preset-record';
export type { TeamPresetRecord } from './team-preset-record';

/**
 * The parties a player saved for themselves.
 *
 * Reads run in the browser under row-level security, which only ever
 * hands back the reader's own. Writes go through the server, since a
 * preset names catch ids and only the server can say whose they are.
 */

/** Every preset this player has saved, oldest first */
export async function listTeamPresets(player: string): Promise<[string, TeamPresetRecord][]> {
  const { data } = await getSupabase()
    .from('team_presets')
    .select('id, name, made_at, team_preset_catches(slot, caught_id)')
    .eq('player', player)
    .order('made_at');

  const presets: [string, TeamPresetRecord][] = [];

  for (const row of asRecordArray(data)) {
    const held = asRecordArray(row.team_preset_catches).sort(
      (left, right) => Number(left.slot ?? 0) - Number(right.slot ?? 0),
    );
    const catches: string[] = [];

    for (const entry of held) {
      catches.push(asString(entry.caught_id));
    }
    presets.push([
      asString(row.id),
      { name: asString(row.name), madeAt: asNumber(row.made_at), catches },
    ]);
  }
  return presets;
}

/**
 * Save a party under a name, or rewrite one that already exists.
 * Resolves the preset's id, or null when a pokemon is not the
 * player's, the party is empty or repeats one, or they hold
 * `TEAM_PRESET_LIMIT` already
 */
export async function saveTeamPreset(
  preset: string | null,
  name: string,
  catches: string[],
): Promise<string | null> {
  return saveTeamPresetOnServer(await getIdToken(), preset ?? '', name, catches);
}

async function saveTeamPresetOnServer(
  token: string,
  preset: string,
  name: string,
  catches: string[],
): Promise<string | null> {
  'use server';
  check(TOKEN, token);
  check(NICKNAME, name);
  check(PARTY, catches);
  if (preset !== '') {
    check(ID, preset);
  }
  return writeOnServer(await requireUid(token), preset === '' ? null : preset, name, catches);
}

/** Drop a preset. Resolves false when it is not the player's */
export async function deleteTeamPreset(preset: string): Promise<boolean> {
  return deleteTeamPresetOnServer(await getIdToken(), preset);
}

async function deleteTeamPresetOnServer(token: string, preset: string): Promise<boolean> {
  'use server';
  check(TOKEN, token);
  check(ID, preset);
  return removeOnServer(await requireUid(token), preset);
}
