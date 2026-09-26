import { readOnly } from '../utils/server-calls';
import type { TeamPresetRecord } from './team-preset-record';
import getIdToken from './session';
import { requireUid } from '../server/auth';
import check, { ID, NICKNAME, PARTY, TOKEN, UID } from '../server/validate';
import {
  readTeamPresets as readOnServer,
  removeTeamPreset as removeOnServer,
  writeTeamPreset as writeOnServer,
} from '../server/team-presets';

export { TEAM_PRESET_LIMIT } from './team-preset-record';
export type { TeamPresetRecord } from './team-preset-record';

/**
 * The parties a player saved for themselves. Reads and writes both go
 * through the server, since a preset names catch ids and only the
 * server can say whose they are.
 */

/** Every preset this player has saved, oldest first. Another player's are never read */
export async function listTeamPresets(player: string): Promise<[string, TeamPresetRecord][]> {
  return listTeamPresetsOnServer(await getIdToken(), player);
}

async function listTeamPresetsOnServer(
  token: string,
  player: string,
): Promise<[string, TeamPresetRecord][]> {
  'use server';
  check(TOKEN, token);
  check(UID, player);
  const uid = await requireUid(token);

  return player === uid ? readOnServer(uid) : [];
}
readOnly(listTeamPresetsOnServer);

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
