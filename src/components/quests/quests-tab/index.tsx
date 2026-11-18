import type { JSX } from '@solidjs/web';
import { Loading, createEffect, createMemo, refresh } from 'solid-js';

import { getQuests } from '../../../auth/quests';
import { getRotations } from '../../../auth/rotations';

import { Note } from '../../styled';
import QuestBoard from './board';
import { m } from '../../../i18n/paraglide/messages.js';

/**
 * The quest board: what the game asks, where the player stands on
 * each ask, and the claiming. Progress is the server's arithmetic;
 * this only draws the numbers it is handed.
 */

export interface QuestsTabProps {
  /** Whether the board's dialog stands open, for the reopen re-read */
  isOpen: boolean;
  /** Called when a claimed meeting takes the page, so the dialog shuts */
  onClose: () => void;
}

export default function QuestsTab(props: QuestsTabProps): JSX.Element {
  const standings = createMemo(async () => getQuests());
  const rotations = createMemo(async () => getRotations());

  const reread = (): void => {
    refresh(standings).catch(() => undefined);
    refresh(rotations).catch(() => undefined);
  };

  // The dialog stays mounted once it has been opened, so a reopen
  // re-reads the board here; the mount's own fetch covers the first
  let opened = false;

  createEffect(
    () => props.isOpen,
    (isOpen) => {
      if (!isOpen) {
        return;
      }
      if (!opened) {
        opened = true;
        return;
      }
      reread();
    },
  );

  return (
    <Loading fallback={<Note class="text-center">{m.ui_looking()}</Note>}>
      <QuestBoard
        standings={standings}
        rotations={rotations}
        onClose={props.onClose}
        onChanged={reread}
      />
    </Loading>
  );
}
