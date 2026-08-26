
import { type JSX, Suspense, createResource } from 'solid-js';

import { getBuddyEffects } from '../../../auth/buddy';
import { useAuth } from '../../../auth/context';

import { getRetiredKeys } from '../../../auth/safari';

import type { Species } from '../../../data/ids/species';

import { getInventory } from '../../../auth/inventory';
import { getRaidSpecies } from '../../../data/items/raid-items';

import { Note } from '../../styled';

import OverworldBoard from './board';

/**
 * The chunk the player is standing in, drawn to fill the screen.
 *
 * The three things about the player that the board is drawn from —
 * what they carry that calls a raid, who walks with them, and what
 * has run from them — are read one component down, under this
 * boundary
 */
export default function OverworldTab(): JSX.Element {
  const auth = useAuth();

  /**
   * The raid items the player carries, each with what it calls. They
   * are used where the player stands, so they live here rather than
   * in the bag listing
   */
  const [relics, { refetch: refetchRelics }] = createResource(
    () => auth.user()?.uid ?? null,
    async (uid) => {
      const carried = await getInventory(uid);

      return carried
        .map((entry) => ({ ...entry, species: getRaidSpecies(entry.item) }))
        .filter(
          (entry): entry is typeof entry & { species: Species } =>
            entry.species != null && entry.amount > 0,
        );
    },
  );

  const [buddy] = createResource(() => auth.user()?.uid ?? null, getBuddyEffects);

  /**
   * What has run from this player. Re-read when a meeting ends, since
   * the one that just fled is the one that has to stop being drawn
   */
  const [fled, { refetch: refetchFled }] = createResource(
    () => auth.user()?.uid ?? null,
    async (uid) => getRetiredKeys(uid),
  );

  return (
    <Suspense fallback={<Note>Reading the world…</Note>}>
      <OverworldBoard
        relics={relics}
        buddy={buddy}
        fled={fled}
        onRelicSpent={() => {
          Promise.resolve(refetchRelics()).catch(() => undefined);
        }}
        onFled={() => {
          Promise.resolve(refetchFled()).catch(() => undefined);
        }}
      />
    </Suspense>
  );
}
