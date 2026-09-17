import { type JSX, Suspense, createEffect, createResource, onCleanup } from 'solid-js';

import { getBuddyEffects } from '../../../auth/buddy';
import { onBuddyChange } from '../../../auth/buddy-changes';
import { useAuth } from '../../../auth/context';
import syncDevShinyBoost from '../../../auth/dev-shiny';

import { getRetiredKeys } from '../../../auth/safari';

import settings from '../../app/settings';
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

  const [buddy, { refetch: refetchBuddy }] = createResource(
    () => auth.user()?.uid ?? null,
    getBuddyEffects,
  );

  // A development run's shiny odds, told to the dev server too once
  // somebody is signed in to ask it
  createEffect(() => {
    const on = settings().devShinyBoost;

    if (import.meta.env.DEV && auth.user() != null) {
      syncDevShinyBoost(on).catch(() => undefined);
    }
  });

  // Swapped or re-equipped in a dialog over the board, which never unmounts
  onCleanup(
    onBuddyChange(() => {
      Promise.resolve(refetchBuddy()).catch(() => undefined);
    }),
  );

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
