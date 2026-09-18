import 'server-only';
import { Metric } from '../auth/quest-record';
import { ITEM_STACKS } from '../auth/stacks';
import { countAbilitySlots, getSlots } from '../data/constants/slots';
import { getSignatureAbility } from '../data/abilities';
import type Abilities from '../data/ids/abilities';
import { Items } from '../data/ids/items';
import type { Species } from '../data/ids/species';
import { ABILITY_CAPSULE_SLOT } from '../data/items/ability-items';
import { getSpeciesData } from '../data/species';
import awakenAbility, { type Awakening } from './awaken';
import { isEggRecord, isGuardedRecord } from './catch-fields';
import { readCaughtIn, updateCaughtIn } from './caught-io';
import { tx } from './db';
import { isCatchLocked } from './locks';
import { bumpProgress } from './quest-progress';
import { asNumber, asNumberArray } from './read';
import { readStackIn, writeStackIn } from './stacks';

/**
 * The two items that work on a pokemon's abilities, written with
 * admin credentials.
 *
 * A Capsule is the Channeler's own trade paid for with an item, so it
 * goes through her function rather than repeating it. A Patch writes
 * the one ability nothing rolls, which is its own transaction. Neither
 * is spent on a pokemon that gained nothing.
 */

/** A catch nobody may spend either of these on */
function unavailable(caught: Record<string, unknown>, uid: string): boolean {
  return (
    caught.owner !== uid || isCatchLocked(caught) || isEggRecord(caught) || isGuardedRecord(caught)
  );
}

/** The signature this species is owed, or null where its family has none */
function speciesSignature(species: Species): Abilities | null {
  return getSignatureAbility(getSpeciesData(species).family);
}

/**
 * Draw another of the line's abilities out of one of the player's
 * catches, widening it to hold the new one.
 *
 * This is what the Channeler does, paid for with a capsule instead of
 * a Heart Scale and asked whenever the player likes rather than once
 * a window, so it goes through her own function: the slot, the ability
 * and the refusals are hers and must not come apart here. The roll is
 * fresh per use, so a capsule is a draw rather than a fixed answer
 *
 * Resolves what was drawn and how much room it now has, or null when
 * the use is refused: the catch is not the player's, it is fighting,
 * it is still an egg or guarded, no capsule is carried, the field is
 * full, or its line has nothing it does not already carry
 */
export async function useAbilityCapsule(uid: string, catchId: string): Promise<Awakening | null> {
  const drawn = await awakenAbility(
    uid,
    catchId,
    Items.AbilityCapsule,
    `${uid}:${catchId}:capsule:${Date.now()}:${crypto.randomUUID()}`,
  );

  if (drawn != null) {
    await bumpProgress(uid, [[Metric.ItemUses, Items.AbilityCapsule, 1]]);
  }
  return drawn;
}

/**
 * Write a family's signature into one of the player's catches, giving
 * up `dropped` where there is no free slot to put it in.
 *
 * Resolves the signature written, or null when the use is refused: the
 * catch is not the player's, it is fighting, it is still an egg or
 * guarded, no patch is carried, it already keeps its signature, or the
 * pokemon is full and the ability named is not one it has
 */
export async function useAbilityPatch(
  uid: string,
  catchId: string,
  dropped: Abilities | null = null,
): Promise<Abilities | null> {
  const written = await tx(async (transaction) => {
    const caught = await readCaughtIn(transaction, catchId, true, ['abilities']);

    if (caught == null || unavailable(caught, uid)) {
      return null;
    }
    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    const species = asNumber(caught.species) as Species;
    const signature = speciesSignature(species);

    if (signature == null) {
      return null;
    }
    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    const known = asNumberArray(caught.abilities) as Abilities[];

    if (known.includes(signature)) {
      return null;
    }

    const room = getSlots(asNumber(caught.slots), ABILITY_CAPSULE_SLOT);
    // With room to spare it goes in beside what the pokemon has;
    // otherwise something has to come out, and which one is the
    // player's to say rather than this to pick
    let kept: Abilities[] | null = null;

    if (countAbilitySlots(known) < room) {
      kept = [...known, signature];
    } else if (dropped != null && known.includes(dropped)) {
      const rest: Abilities[] = [];

      for (const ability of known) {
        if (ability !== dropped) {
          rest.push(ability);
        }
      }
      kept = [...rest, signature];
    }

    if (kept == null) {
      return null;
    }

    const stock = await readStackIn(transaction, ITEM_STACKS, uid, Items.AbilityPatch);

    if (stock < 1) {
      return null;
    }

    await writeStackIn(transaction, ITEM_STACKS, uid, Items.AbilityPatch, stock - 1);
    await updateCaughtIn(transaction, catchId, { abilities: kept });

    return signature;
  });

  if (written != null) {
    await bumpProgress(uid, [[Metric.ItemUses, Items.AbilityPatch, 1]]);
  }
  return written;
}
