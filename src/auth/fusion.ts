import type { Species } from '../data/ids/species';
import { requireUid } from '../server/auth';
import { fuseCatch as fuseOnServerSide, unfuseCatch as unfuseOnServerSide } from '../server/fusion';
import getIdToken from './session';

/**
 * Folding a dragon into a Kyurem, and taking it back out.
 *
 * Which shapes may be joined, which halves are busy and whether the
 * player holds the splicers are all settled on the server against the
 * stored rows: the dialog only says which two pokemon.
 */

/**
 * Fold the dragon into the Kyurem. Resolves the shape the Kyurem now
 * stands in, or null when the fusion was refused
 */
export async function fuseCatch(
  catchId: string,
  partnerId: string,
  into: Species,
): Promise<Species | null> {
  return fuseOnServer(await getIdToken(), catchId, partnerId, into);
}

/**
 * Take the fused Kyurem apart. Resolves the shape it falls back to,
 * or null when it was refused
 */
export async function unfuseCatch(catchId: string): Promise<Species | null> {
  return unfuseOnServer(await getIdToken(), catchId);
}

async function fuseOnServer(
  token: string,
  catchId: string,
  partnerId: string,
  into: Species,
): Promise<Species | null> {
  'use server';
  return fuseOnServerSide(await requireUid(token), catchId, partnerId, into);
}

async function unfuseOnServer(token: string, catchId: string): Promise<Species | null> {
  'use server';
  return unfuseOnServerSide(await requireUid(token), catchId);
}
