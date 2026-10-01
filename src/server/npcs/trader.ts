import 'server-only';
import { Acquisition } from '../../auth/caught-record';
import { ITEM_STACKS } from '../../auth/stacks';
import { Metric } from '../../auth/quest-record';
import { Balls, type Items } from '../../data/ids/items';
import type { Species } from '../../data/ids/species';
import Npc, { NPC_NAMES } from '../../data/overworld/npc';
import { settleHandover } from '../../data/species';
import { deriveTraderPokemon, paysForOffer } from '../../overworld/trader';
import { isEggRecord, isFavoriteRecord, isGuardedRecord, withoutHeld } from '../catch-fields';
import { insertCaughtIn } from '../caught';
import { readCaughtIn, updateCaughtIn } from '../caught-io';
import { tx } from '../db';
import { isCatchLocked } from '../locks';
import { recordFoundSpecies } from '../pokedex';
import { bumpProgress } from '../quest-progress';
import { asNumber, asNumberArray } from '../read';
import { readStacksIn, writeStackIn } from '../stacks';
import { releaseVisit, resolveNpc, takeVisit } from './visits';

/**
 * Swap one of the player's catches for one of the trader's six, once a
 * window. The catch goes, its held items back to the bag, and his
 * pokemon arrives traded in the same transaction.
 *
 * Resolves the new catch's id, or null when he refuses: he is not
 * standing there, the offer is not one of his, the window's swap is
 * already made, or the catch is not the player's to give (fighting,
 * an egg, a favourite, guarded, the buddy) or not of the offer's band
 */
export default async function tradeWithTrader(
  uid: string,
  x: number,
  y: number,
  cell: number,
  offer: number,
  catchId: string,
  now: number,
  offset: number,
  locale: string,
): Promise<string | null> {
  const snapshot = resolveNpc(x, y, cell, now, offset, Npc.Trader);
  const spawn = snapshot?.getTraderOffer(cell).at(offer);

  if (snapshot == null || spawn == null) {
    return null;
  }

  const visit = await takeVisit(snapshot, 'swap', cell, uid, { caught: catchId });

  if (visit == null) {
    return null;
  }

  const encounter = deriveTraderPokemon(snapshot, spawn, uid);
  let arrived: string | null;

  try {
    arrived = await tx(async (transaction) => {
      const caught = await readCaughtIn(transaction, catchId, true, ['items']);

      if (
        caught == null ||
        caught.owner !== uid ||
        isCatchLocked(caught) ||
        isEggRecord(caught) ||
        isFavoriteRecord(caught) ||
        isGuardedRecord(caught)
      ) {
        return null;
      }

      // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
      const given = asNumber(caught.species) as Species;

      if (!paysForOffer(given, encounter.species)) {
        return null;
      }

      const profile = await transaction`select buddy_id from profiles where id = ${uid} for update`;

      if (profile.at(0)?.buddy_id === catchId) {
        return null;
      }

      // What it was holding stays with the player rather than the trader
      // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
      const returning = new Map<Items, number>();

      for (const item of asNumberArray(caught.items) as Items[]) {
        returning.set(item, (returning.get(item) ?? 0) + 1);
      }

      const carried = await readStacksIn(transaction, ITEM_STACKS, uid, [...returning.keys()]);

      for (const [item, count] of returning) {
        await writeStackIn(transaction, ITEM_STACKS, uid, item, (carried.get(item) ?? 0) + count);
      }
      await transaction`delete from caught where id = ${catchId}`;

      const id = await insertCaughtIn(
        transaction,
        uid,
        { ...encounter, spawn: `trader${cell}:${uid}:${snapshot.npcTimestamp}`, player: uid },
        Balls.PokeBall,
        Acquisition.Trade,
        now,
        offset,
        locale,
        NPC_NAMES[Npc.Trader],
      );

      // The swap is the trade a trade evolution asks for, and eats the
      // held item it wants, the way a trade between players does
      const handover = settleHandover(encounter.species, given, new Set(encounter.items));

      await updateCaughtIn(transaction, id, {
        traded: true,
        canEvolve: handover.opens,
        ...(handover.spends == null
          ? {}
          : { items: withoutHeld(encounter.items, handover.spends) }),
      });
      return id;
    });
  } catch (error) {
    await releaseVisit(visit);
    throw error;
  }

  if (arrived == null) {
    await releaseVisit(visit);
    return null;
  }
  await recordFoundSpecies(uid, encounter.species, encounter.shiny);
  await bumpProgress(uid, [[Metric.Trades, 0, 1]]);
  return arrived;
}
