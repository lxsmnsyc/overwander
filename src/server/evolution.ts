import 'server-only';
import { asCaughtPokemon, isAuctionableCatch } from '../auth/caught-record';
import { ITEM_STACKS } from '../auth/stacks';
import { getMaxHealth, rescaleHealth } from '../auth/health';
import type { Items } from '../data/ids/items';
import type { Species } from '../data/ids/species';
import { getAvailableEvolutions, getConsumedItem, getSpeciesData } from '../data/species';
import { Metric } from '../auth/quest-record';
import { isEggRecord, isGuardedRecord } from './catch-fields';
import { type ProgressBump, bumpProgress } from './quest-progress';
import { readStackIn, writeStackIn } from './stacks';
import { readCaughtIn, updateCaughtIn } from './caught-io';
import { tx } from './db';
import { isCatchLocked } from './locks';
import { asNumber, asNumberArray } from './read';

/**
 * Evolving, written with admin credentials. An evolution turns a
 * common pokemon into a rare one and spends a stone doing it, so the
 * criteria (level, held item, carried item) are checked here against
 * the stored rows and never taken from the caller.
 *
 * Resolves the new species, or null when the evolution is refused:
 * the catch is not the player's, the species is not one of its
 * evolutions, a condition is unmet, or the required item is gone
 */
export default async function evolveCatch(
  uid: string,
  catchId: string,
  into: Species,
): Promise<Species | null> {
  let spent: Items | null = null;
  let from: Species | null = null;
  const evolved = await tx(async (transaction) => {
    const caught = await readCaughtIn(transaction, catchId);

    // A pokemon in a live battle fights as the species its snapshot
    // froze, so it evolves once the fight is over and not before —
    // and an egg has to become a pokemon before it can become a
    // different one
    if (
      caught == null ||
      caught.owner !== uid ||
      isCatchLocked(caught) ||
      isEggRecord(caught) ||
      isGuardedRecord(caught)
    ) {
      return null;
    }

    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    const species = asNumber(caught.species) as Species;
    const evolution = (getSpeciesData(species).evolvesInto ?? []).find(
      (entry) => entry.species === into,
    );

    if (evolution == null) {
      return null;
    }

    const consumed = getConsumedItem(evolution);
    // Only the item this evolution actually needs is read; the rest
    // of the bag has no bearing on the criteria
    const carried = new Set<Items>();
    let stock = 0;

    if (consumed != null) {
      stock = await readStackIn(transaction, ITEM_STACKS, uid, consumed);

      if (stock > 0) {
        carried.add(consumed);
      }
    }

    const context = {
      level: asNumber(caught.level),
      carried,
      // The catch carries what it holds, so the criteria read the
      // same row the species change is written back to
      // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
      held: new Set(asNumberArray(caught.items) as Items[]),
      // Read off the stored record rather than taken from the caller:
      // a trade evolution is opened by the trade the server wrote, not
      // by a client saying one happened
      traded: caught.traded === true,
    };

    if (!getAvailableEvolutions(species, context).some((entry) => entry.species === into)) {
      return null;
    }

    if (consumed != null) {
      await writeStackIn(transaction, ITEM_STACKS, uid, consumed, stock - 1);
      spent = consumed;
    }
    from = species;
    // An evolution is a bigger pokemon, not a healed one: the share
    // of health it had is what it keeps, so a Charmander at half
    // stays a Charmeleon at half
    const record = asCaughtPokemon(caught);

    await updateCaughtIn(transaction, catchId, {
      species: into,
      // No Gen 1 line evolves into a legendary, so this changes
      // nothing today. It is written anyway because the day a line
      // does, a silent wrong answer here would be very hard to see
      auctionable: isAuctionableCatch({ ...record, species: into }),
      health: rescaleHealth(
        record.health,
        getMaxHealth(record),
        getMaxHealth({ ...record, species: into }),
      ),
    });
    return into;
  });

  // oxlint-disable-next-line typescript/no-unnecessary-condition
  if (evolved != null && from != null) {
    await bumpProgress(uid, [
      [Metric.Evolutions, from, 1],
      // oxlint-disable-next-line typescript/no-unnecessary-condition
      ...(spent == null ? [] : [[Metric.ItemUses, spent, 1] satisfies ProgressBump]),
    ]);
  }
  return evolved;
}
