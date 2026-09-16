import type Abilities from '../data/ids/abilities';
import type { Awakening } from '../server/awaken';
import {
  useAbilityCapsule as useCapsuleOnServerSide,
  useAbilityPatch as usePatchOnServerSide,
} from '../server/ability-items';
import { requireUid } from '../server/auth';
import check, { ID, MAYBE_GAME_ID, TOKEN } from '../server/validate';
import getIdToken from './session';

/**
 * The two items that work on a pokemon's abilities.
 *
 * What a capsule may widen and what a patch may write are both
 * decided on the server against the stored record: the dialog says
 * which pokemon, and which ability is given up where one has to be.
 */

/**
 * Draw another of the line's abilities into a catch, widening it to
 * hold the new one, which is what the Channeler does for a Heart
 * Scale. Resolves what came up and how much room it has now, or null
 * when the capsule could not be spent
 */
export async function useAbilityCapsule(catchId: string): Promise<Awakening | null> {
  return capsuleOnServer(await getIdToken(), catchId);
}

/**
 * Write the family's signature into a catch, giving up `dropped`
 * where there is no free slot for it. Resolves the ability written,
 * or null when the patch could not be spent
 */
export async function useAbilityPatch(
  catchId: string,
  dropped: Abilities | null = null,
): Promise<Abilities | null> {
  return patchOnServer(await getIdToken(), catchId, dropped);
}

async function capsuleOnServer(token: string, catchId: string): Promise<Awakening | null> {
  'use server';
  check(TOKEN, token);
  check(ID, catchId);
  return useCapsuleOnServerSide(await requireUid(token), catchId);
}

async function patchOnServer(
  token: string,
  catchId: string,
  dropped: Abilities | null,
): Promise<Abilities | null> {
  'use server';
  check(TOKEN, token);
  check(ID, catchId);
  check(MAYBE_GAME_ID, dropped);
  return usePatchOnServerSide(await requireUid(token), catchId, dropped);
}
