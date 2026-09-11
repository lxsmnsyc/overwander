import { type JSX, Suspense, createResource } from 'solid-js';

import { getBuddyEffects } from '../../../auth/buddy';
import { useAuth } from '../../../auth/context';

import { getRetiredKeys } from '../../../auth/safari';

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
        buddy={buddy}
        fled={fled}
        onFled={() => {
          Promise.resolve(refetchFled()).catch(() => undefined);
        }}
      />
    </Suspense>
  );
}
