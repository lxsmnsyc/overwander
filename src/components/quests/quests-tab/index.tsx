import { type JSX, Suspense, createEffect, createResource } from 'solid-js';

import { getQuests } from '../../../auth/quests';
import { getRotations } from '../../../auth/rotations';

import { Note } from '../../styled';
import QuestBoard from './board';

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
  const [standings, { refetch }] = createResource(getQuests);
  const [rotations, { refetch: respin }] = createResource(getRotations);

  // The dialog stays mounted once it has been opened, so a reopen
  // re-reads the board here; the mount's own fetch covers the first
  let opened = false;

  createEffect(() => {
    if (!props.isOpen) {
      return;
    }
    if (!opened) {
      opened = true;
      return;
    }
    Promise.resolve(refetch()).catch(() => undefined);
    Promise.resolve(respin()).catch(() => undefined);
  });

  return (
    <Suspense fallback={<Note class="text-center">Looking…</Note>}>
      <QuestBoard
        standings={standings}
        rotations={rotations}
        onClose={props.onClose}
        onChanged={() => {
          Promise.resolve(refetch()).catch(() => undefined);
          Promise.resolve(respin()).catch(() => undefined);
        }}
      />
    </Suspense>
  );
}
