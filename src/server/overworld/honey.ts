import 'server-only';
import AleaRNG from '../../core/alea';
import type { EncounterRecord } from '../../auth/encounter-record';
import { Items } from '../../data/ids/items';
import { LATHER_COST, rollHoneyTree } from '../../data/overworld/honey-tree';
import Landmark from '../../data/overworld/landmark';
import type ChunkSnapshot from '../../overworld/chunk-snapshot';
import { WORLD_GENERATION } from '../../overworld/current';
import type { Spawn } from '../../overworld/chunk-snapshot';
import { getSql } from '../db';
import { ITEM_STACKS } from '../../auth/stacks';
import { readStackIn, spendStackIn } from '../stacks';
import { asString } from '../read';
import { claim, resolveSnapshot } from './claims';
import { startEncounter } from './spawns';

/** What a lather came to: a pokemon met, or why nothing happened */
export type LatherResult =
  | { kind: 'encounter'; encounter: EncounterRecord }
  | { kind: 'lathered' }
  | { kind: 'no-honey' };

/**
 * The honey trees keep their markers in the berry ledger: a marker is a
 * cell in a landmark window, and what is written is the jar spent on it
 */
export function honeyPrefix(snapshot: ChunkSnapshot): string {
  return `${snapshot.groundKey}@${snapshot.landmarkTimestamp}$honey`;
}

/** Which of this chunk's honey trees this player has lathered this window */
export async function listLatheredHoneyTrees(
  uid: string,
  x: number,
  y: number,
  now: number,
  offset: number,
): Promise<number[]> {
  const snapshot = await resolveSnapshot(x, y, now, offset);

  if (snapshot == null) {
    return [];
  }

  const prefix = honeyPrefix(snapshot);
  const rows = await getSql()`
    select marker from berry_claims
    where generation = ${WORLD_GENERATION} and player = ${uid} and marker like ${`${prefix}%`}
  `;

  return rows
    .map((row) => Number(asString(row.marker).slice(prefix.length)))
    .filter((cell) => Number.isInteger(cell));
}

/**
 * Lather a honey tree: one jar spent, and whatever it draws out met on
 * the spot. Once per player per landmark window, and the pokemon is
 * rolled per player so two players at one tree meet different ones
 */
export async function latherHoneyTree(
  uid: string,
  x: number,
  y: number,
  cell: number,
  now: number,
  offset: number,
): Promise<LatherResult | null> {
  const snapshot = await resolveSnapshot(x, y, now, offset);

  if (snapshot == null || snapshot.chunk.getLandmarkCells().get(cell) !== Landmark.HoneyTree) {
    return null;
  }

  const id = `${honeyPrefix(snapshot)}${cell}`;

  // The jar is spent in the claim's own transaction. Without one the
  // claim is rolled back, so a player who buys honey can still lather
  // this window. An object, since the checker reads a `let` set inside
  // the payment as never having changed
  const jar = { missing: false };

  const lathered = await claim(
    'berry_claims',
    id,
    { player: uid, item: Items.Honey, amount: LATHER_COST },
    async (transaction) => {
      const held = await readStackIn(transaction, ITEM_STACKS, uid, Items.Honey);

      jar.missing = !(await spendStackIn(
        transaction,
        ITEM_STACKS,
        uid,
        Items.Honey,
        held,
        LATHER_COST,
      ));
      return !jar.missing;
    },
  );

  if (!lathered) {
    return jar.missing ? { kind: 'no-honey' } : { kind: 'lathered' };
  }

  const key = `${id}:${uid}`;
  const rng = new AleaRNG(key);
  const species = rollHoneyTree(() => rng.random());

  if (species == null) {
    return null;
  }

  const spawn: Spawn = [species, rng.int32(), rng.int32()];

  return { kind: 'encounter', encounter: await startEncounter(uid, snapshot, key, spawn) };
}
