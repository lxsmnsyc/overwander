import type { JSX } from '@solidjs/web';
import { Loading, Show, createEffect, createMemo, onSettled, refresh } from 'solid-js';

import { getBuddyEffects } from '../../../auth/buddy';
import type { Buddy } from '../../../overworld/core';
import { onBuddyChange } from '../../../auth/buddy-changes';
import { useAuth } from '../../../auth/context';
import syncDevShinyBoost from '../../../auth/dev-shiny';

import { getRetiredKeys } from '../../../auth/safari';

import settings from '../../app/settings';
import { Note } from '../../styled';

import OverworldBoard from './board';
import { m } from '../../../i18n/paraglide/messages.js';

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

  const uid = createMemo(() => auth.user()?.uid ?? null);
  const buddy = createMemo<Buddy | null | undefined>((): Promise<Buddy | null> | undefined => {
    const player = uid();

    return player == null ? undefined : getBuddyEffects(player);
  });

  // A development run's shiny odds, told to the dev server too once
  // somebody is signed in to ask it
  createEffect(
    () => ({ on: settings().devShinyBoost, signed: auth.user() != null }),
    ({ on, signed }) => {
      if (import.meta.env.DEV && signed) {
        syncDevShinyBoost(on).catch(() => undefined);
      }
    },
  );

  // Swapped or re-equipped in a dialog over the board, which never unmounts
  onSettled(() =>
    onBuddyChange(() => {
      refresh(buddy).catch(() => undefined);
    }),
  );

  /**
   * What has run from this player. Re-read when a meeting ends, since
   * the one that just fled is the one that has to stop being drawn
   */
  const fled = createMemo<Set<string> | undefined>((): Promise<Set<string>> | undefined => {
    const player = uid();

    return player == null ? undefined : getRetiredKeys(player);
  });

  return (
    <Loading fallback={<Note>{m.board_reading()}</Note>}>
      {/* Mounted once both have landed: the walk and its windows read
          the board from timers and handlers, where a read with no
          answer yet throws rather than waits */}
      <Show when={[buddy(), fled()]}>
        <OverworldBoard
          buddy={buddy}
          fled={fled}
          onFled={() => {
            refresh(fled).catch(() => undefined);
          }}
        />
      </Show>
    </Loading>
  );
}
