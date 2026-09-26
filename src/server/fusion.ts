import 'server-only';
import { asCaughtPokemon, isAuctionableCatch } from '../auth/caught-record';
import { getMaxHealth, rescaleHealth } from '../auth/health';
import { ITEM_STACKS } from '../auth/stacks';
import type { Species } from '../data/ids/species';
import { FUSION_HUSK, FUSION_ITEM, getFusionPartner, isFusedSpecies } from '../data/species/fusion';
import { isEggRecord, isGuardedRecord } from './catch-fields';
import { readCaughtIn, updateCaughtIn } from './caught-io';
import { tx } from './db';
import { isCatchLocked } from './locks';
import { recordFoundSpecies } from './pokedex';
import { asNumber } from './read';
import { readStackIn } from './stacks';

/**
 * Folding a dragon into a Kyurem, and pulling it back out, written
 * with admin credentials.
 *
 * Both halves survive a fusion: the husk takes the new shape and the
 * dragon is kept, hidden and pointed at what it went into, which is
 * what lets the pair come apart again. The splicers are held rather
 * than spent, so the only thing checked about them is that the player
 * has a pair
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
 * Fold a dragon into a Kyurem. Resolves the shape it now stands in,
 * or null when the fusion is refused: either half is not the player's
 * or is busy, the shapes do not match, or there are no splicers
 */
export async function fuseCatch(
  uid: string,
  catchId: string,
  partnerId: string,
  into: Species,
): Promise<Species | null> {
  const wanted = getFusionPartner(into);

  if (wanted == null || catchId === partnerId) {
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
    if (husk !== FUSION_HUSK || dragon !== wanted || caught.fusedWith != null) {
      return null;
    }
    if (partner.hidden === true) {
      return null;
    }
    if (await isBuddy(transaction, uid, partnerId)) {
      return null;
    }
    if ((await readStackIn(transaction, ITEM_STACKS, uid, FUSION_ITEM)) < 1) {
      return null;
    }
    const record = asCaughtPokemon(caught);
    const whole = getMaxHealth({ ...record, species: into });

    await updateCaughtIn(transaction, catchId, {
      species: into,
      canEvolve: false,
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
 * Pull the dragon back out of a fused Kyurem. Resolves the shape the
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

    if (!isFusedSpecies(species)) {
      return null;
    }
    if ((await readStackIn(transaction, ITEM_STACKS, uid, FUSION_ITEM)) < 1) {
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
    const record = asCaughtPokemon(caught);
    const whole = getMaxHealth({ ...record, species: FUSION_HUSK });

    await updateCaughtIn(transaction, catchId, {
      species: FUSION_HUSK,
      canEvolve: false,
      auctionable: isAuctionableCatch({ ...record, species: FUSION_HUSK }),
      health: rescaleHealth(record.health, getMaxHealth(record), whole),
      maxHealth: whole,
      fusedWith: null,
    });
    await updateCaughtIn(transaction, partnerId, { hidden: false });

    return FUSION_HUSK;
  });
}
