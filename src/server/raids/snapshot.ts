import 'server-only';
import {
  type CatchSnapshot,
  asCatchSnapshot,
  createCatchSnapshot,
} from '../../auth/catch-snapshot';
import { asCaughtPokemon } from '../../auth/caught-record';
import { getMaxHealth, isFainted } from '../../auth/health';
import { PIKE_CURTAIN_STATUSES, PikeCurtain } from '../../data/overworld/experts';
import { packStatuses } from '../../data/ids/status';
import { isEggRecord, isGuardedRecord } from '../catch-fields';
import type { Species } from '../../data/ids/species';
import { getSql, jsonOf, newDocId, tx } from '../db';
import { readCaughtMany } from '../caught-io';
import { isCatchLocked } from '../locks';

/**
 * The team a player brought, frozen at the door. What the other side
 * may see of it is decided here
 */
/**
 * Freeze one team for the battle, dropping catches that have vanished,
 * changed hands, fainted or are already fighting somewhere else, and lock what
 * it fields into that battle. The
 * freeze and the lock share a transaction, so an item cannot be
 * handed back in the moment between them — the snapshot the fight
 * runs on and the record it came from stay the same pokemon. The lock
 * is stamped with the battle's `startedAt`, which is what lets the
 * fight release its own party and nobody else's.
 *
 * Resolves the snapshot id, or null when the team fields nothing — an
 * empty side must not stand in a battle
 */
/**
 * One pokemon as the house's rule leaves it: carrying nothing where
 * items are barred, and whatever the Pike's curtain did on top. The
 * kind room mends what walked in, which is the only thing in the game
 * that heals a party by fighting
 */
function behindTheCurtain(
  frozen: CatchSnapshot,
  options?: { bare?: boolean; curtain?: PikeCurtain },
): CatchSnapshot {
  const carried = options?.bare === true ? { ...frozen, items: [] } : frozen;
  const curtain = options?.curtain;

  if (curtain == null) {
    return carried;
  }
  if (curtain === PikeCurtain.Healed) {
    return { ...carried, health: getMaxHealth(carried), statuses: 0 };
  }

  const status = PIKE_CURTAIN_STATUSES[curtain];

  return status == null
    ? carried
    : { ...carried, statuses: carried.statuses | packStatuses([status]) };
}

export async function publishTeamSnapshot(
  player: string,
  catches: string[],
  alliance: number,
  startedAt: number,
  options?: {
    /**
     * Freeze the party carrying nothing, for a fight whose house bars
     * held items. The records keep their items: this is what was
     * taken onto the field, not what was taken off the pokemon
     */
    bare?: boolean;
    /**
     * What the Pike's curtain did to the party on the way in. It is
     * baked into the frozen snapshot rather than applied at the
     * field, so the room is part of the fight and a replay walks
     * through the same one
     */
    curtain?: PikeCurtain;
  },
): Promise<string | null> {
  if (catches.length === 0) {
    return null;
  }

  const snapshotId = newDocId();

  return tx(async (transaction) => {
    const fielded: CatchSnapshot[] = [];
    const locking: string[] = [];
    // Locked together rather than one at a time: the same `for update`
    // on every row of the party, in one question
    const found = await readCaughtMany(transaction, catches, true);

    for (const id of catches) {
      const data = found.get(id);

      // A pokemon already fighting is left behind rather than fielded
      // twice: a player may sit in two lobbies with the same party,
      // and the first raid to start is the one that gets it. An egg
      // is left behind for good — there is nothing in it to fight
      // with until it hatches — and so is a pokemon that is down,
      // which has to be healed before it fights again
      if (
        data?.owner === player &&
        !isCatchLocked(data) &&
        !isEggRecord(data) &&
        !isGuardedRecord(data) &&
        !isFainted(asCaughtPokemon(data))
      ) {
        const frozen = createCatchSnapshot(id, asCaughtPokemon(data));

        fielded.push(behindTheCurtain(frozen, options));
        locking.push(id);
      }
    }

    if (fielded.length === 0) {
      return null;
    }

    await transaction`
      insert into team_snapshots (id, player, alliance, catches)
      values (${snapshotId}, ${player}, ${alliance}, ${jsonOf(transaction, fielded)})
    `;
    await transaction`
      update caught set locked_at = ${startedAt} where id = any(${locking})
    `;
    return snapshotId;
  });
}

/**
 * What a published team snapshot actually fielded, in the order it
 * was frozen. A freeze leaves behind anything already fighting, so
 * this is the party rather than the party that was asked for, and a
 * house answering what was brought has to answer what arrived
 */
export async function readPublishedSpecies(snapshotId: string): Promise<Species[]> {
  const rows = await getSql()`select catches from team_snapshots where id = ${snapshotId}`;
  const data: unknown = rows[0]?.catches;

  if (!Array.isArray(data)) {
    return [];
  }
  return data.map((value) => asCatchSnapshot(value).species);
}
