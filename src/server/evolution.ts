import 'server-only';
import { asCaughtPokemon, isAuctionableCatch } from '../auth/caught-record';
import { ITEM_STACKS } from '../auth/stacks';
import { getMaxHealth, getStats, rescaleHealth } from '../auth/health';
import { getTimeOfDay } from '../data/ids/biome';
import type { Items } from '../data/ids/items';
import type { Species } from '../data/ids/species';
import type { EvolutionContext } from '../data/species';
import { getAvailableEvolutions, getConsumedItem, getSpeciesData } from '../data/species';
import { Metric } from '../auth/quest-record';
import { isEggRecord, isGuardedRecord } from './catch-fields';
import { recordCaughtSpecies } from './pokedex';
import { type ProgressBump, bumpProgress } from './quest-progress';
import { readStackIn, writeStackIn } from './stacks';
import { readCaughtIn, updateCaughtIn } from './caught-io';
import { tx } from './db';
import { isCatchLocked } from './locks';
import { asNumber, asNumberArray } from './read';
import { asBoolean } from '../auth/__normalize';

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
  let sparkles = false;
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

    // Read off the stored record rather than taken from the caller: a
    // trade evolution is opened by the handover the server wrote, not
    // by a client saying one happened
    const context: EvolutionContext = {
      species,
      level: asNumber(caught.level),
      // Filled in below, once the criteria have said what to look for
      carried: new Set<Items>(),
      // The catch carries what it holds, so the criteria read the
      // same row the species change is written back to
      // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
      held: new Set(asNumberArray(caught.items) as Items[]),
      // Settled at the handover rather than re-read here: the server
      // wrote it, so a client saying it was traded changes nothing
      canEvolve: asBoolean(caught.canEvolve),
      // Derived from the stored record rather than reported: what a
      // Tyrogue becomes is decided by the numbers the server holds
      stats: getStats(asCaughtPokemon(caught)),
      friendship: asNumber(caught.friendship),
      // The server's clock, not the caller's: a day evolution is not
      // opened by a client saying the sun is up
      time: getTimeOfDay(Date.now()),
    };
    // What is spent as well as what is allowed: a handover that does
    // not cover this evolution pays a Linking Cord for the half it
    // would have covered
    const consumed = getConsumedItem(evolution, context.canEvolve);
    // Only the item this evolution actually needs is read; the rest
    // of the bag has no bearing on the criteria
    let stock = 0;

    if (consumed != null) {
      stock = await readStackIn(transaction, ITEM_STACKS, uid, consumed);

      if (stock > 0) {
        context.carried = new Set([consumed]);
      }
    }

    if (!getAvailableEvolutions(context).some((entry) => entry.species === into)) {
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

    sparkles = record.shiny;

    await updateCaughtIn(transaction, catchId, {
      species: into,
      // Spent by the evolution it opened, and cleared by any other
      // change of shape: a handover earned by one species is never
      // read by the next one up
      canEvolve: false,
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
    // The dex counts what the player has held, and after this they
    // hold one of these. Nothing else logs it: an evolution is the
    // one way a species arrives without a catch or a hatch
    await recordCaughtSpecies(uid, evolved, sparkles);
    await bumpProgress(uid, [
      [Metric.Evolutions, from, 1],
      // oxlint-disable-next-line typescript/no-unnecessary-condition
      ...(spent == null ? [] : [[Metric.ItemUses, spent, 1] satisfies ProgressBump]),
    ]);
  }
  return evolved;
}
