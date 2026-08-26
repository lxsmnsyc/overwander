import { type JSX, Suspense, createResource } from 'solid-js';

import { getQuests } from '../../../auth/quests';

import { Note } from '../../styled';
import QuestBoard from './board';

/**
 * The quest board: what the game asks, where the player stands on
 * each ask, and the claiming. Progress is the server's arithmetic;
 * this only draws the numbers it is handed.
 */

export interface QuestsTabProps {
  /** Called when a claimed meeting takes the page, so the dialog shuts */
  onClose: () => void;
}

export default function QuestsTab(props: QuestsTabProps): JSX.Element {
  const [standings, { refetch }] = createResource(getQuests);

  return (
    <Suspense fallback={<Note class="text-center">Looking…</Note>}>
      <QuestBoard
        standings={standings}
        onClose={props.onClose}
        onChanged={() => {
          Promise.resolve(refetch()).catch(() => undefined);
        }}
      />
    </Suspense>
  );
}
