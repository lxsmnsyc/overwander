import 'server-only';
import { asCaughtPokemon, isAuctionableCatch } from '../auth/caught-record';
import { getMaxHealth, rescaleHealth } from '../auth/health';
import { ITEM_STACKS } from '../auth/stacks';
import type { Species } from '../data/ids/species';
import { getFusionHusk, getFusionItem, getFusionPartner } from '../data/species/fusion';
import { isEggRecord, isGuardedRecord } from './catch-fields';
import { readCaughtIn, updateCaughtIn } from './caught-io';
import { tx } from './db';
import { isCatchLocked } from './locks';
import { recordFoundSpecies } from './pokedex';
import { asNumber } from './read';
import { readStackIn, spendStackIn } from './stacks';

/**
 * Folding a partner into its husk (a dragon into a Kyurem, the sun or
 * the moon into a Necrozma), and pulling it back out, written with
 * admin credentials.
 *
 * Both halves survive a fusion: the husk takes the new shape and the
 * dragon is kept, hidden and pointed at what it went into, which is
 * what lets the pair come apart again. Each joining and each parting
 * spends one of the item, so a bag full of them is worth its count
 */

/** A catch nobody may fold in or take apart: busy, fragile or spoken for */
function unavailable(caught: Record<string, unknown>, uid: string): boolean {
  return (
    caught.owner !== uid || isCatchLocked(caught) || isEggRecord(caught) || isGuardedRecord(caught)
  );
}

/** Whether this catch is the player's buddy, which is never folded away */
async function isBuddy(
  transaction: Parameters<typeof readCaughtIn>[0],
  uid: string,
  catchId: string,
): Promise<boolean> {
  const profiles = await transaction`select buddy_id from profiles where id = ${uid}`;

  return profiles.at(0)?.buddy_id === catchId;
}

/**
 * Fold a partner into its husk. Resolves the shape it now stands in,
 * or null when the fusion is refused: either half is not the player's
 * or is busy, the shapes do not match, or the item is missing
 */
export async function fuseCatch(
  uid: string,
  catchId: string,
  partnerId: string,
  into: Species,
): Promise<Species | null> {
  const wanted = getFusionPartner(into);
  const wantedHusk = getFusionHusk(into);
  const item = getFusionItem(into);

  if (wanted == null || wantedHusk == null || item == null || catchId === partnerId) {
    return null;
  }
  const fused = await tx(async (transaction) => {
    const caught = await readCaughtIn(transaction, catchId);
    const partner = await readCaughtIn(transaction, partnerId);

    if (
      caught == null ||
      partner == null ||
      unavailable(caught, uid) ||
      unavailable(partner, uid)
    ) {
      return null;
    }
    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    const husk = asNumber(caught.species) as Species;
    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    const dragon = asNumber(partner.species) as Species;

    // A husk that is already carrying one, or a dragon that is
    // already inside something, is not free to be joined
    if (husk !== wantedHusk || dragon !== wanted || caught.fusedWith != null) {
      return null;
    }
    if (partner.hidden === true) {
      return null;
    }
    if (await isBuddy(transaction, uid, partnerId)) {
      return null;
    }
    const held = await readStackIn(transaction, ITEM_STACKS, uid, item);

    if (!(await spendStackIn(transaction, ITEM_STACKS, uid, item, held))) {
      return null;
    }
    const record = asCaughtPokemon(caught);
    const whole = getMaxHealth({ ...record, species: into });

    await updateCaughtIn(transaction, catchId, {
      species: into,
      canEvolve: false,
      featProgress: 0,
      auctionable: isAuctionableCatch({ ...record, species: into }),
      health: rescaleHealth(record.health, getMaxHealth(record), whole),
      maxHealth: whole,
      // The shape names what is inside it, so taking the pair apart
      // reads the row it already has
      fusedWith: partnerId,
    });
    // The dragon keeps everything it is: it is put away rather than
    // spent, and stays out of the boxes until it is called back
    await updateCaughtIn(transaction, partnerId, { hidden: true });

    return into;
  });

  if (fused != null) {
    await recordFoundSpecies(uid, fused, false);
  }
  return fused;
}

/**
 * Pull the partner back out of a fused shape. Resolves the shape the
 * husk falls back to, or null when it is refused
 */
export async function unfuseCatch(uid: string, catchId: string): Promise<Species | null> {
  return tx(async (transaction) => {
    const caught = await readCaughtIn(transaction, catchId);

    if (caught == null || unavailable(caught, uid)) {
      return null;
    }
    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    const species = asNumber(caught.species) as Species;

    const husk = getFusionHusk(species);
    const item = getFusionItem(species);

    if (husk == null || item == null) {
      return null;
    }
    const partnerId: unknown = caught.fusedWith;

    if (typeof partnerId !== 'string') {
      return null;
    }
    const partner = await readCaughtIn(transaction, partnerId, true, []);

    // The dragon is handed back to whoever holds the shape it is in,
    // and only out of a row that is really in there
    if (partner == null || partner.owner !== uid || partner.hidden !== true) {
      return null;
    }
    const held = await readStackIn(transaction, ITEM_STACKS, uid, item);

    if (!(await spendStackIn(transaction, ITEM_STACKS, uid, item, held))) {
      return null;
    }
    const record = asCaughtPokemon(caught);
    const whole = getMaxHealth({ ...record, species: husk });

    await updateCaughtIn(transaction, catchId, {
      species: husk,
      canEvolve: false,
      featProgress: 0,
      auctionable: isAuctionableCatch({ ...record, species: husk }),
      health: rescaleHealth(record.health, getMaxHealth(record), whole),
      maxHealth: whole,
      fusedWith: null,
    });
    await updateCaughtIn(transaction, partnerId, { hidden: false });

    return husk;
  });
}
