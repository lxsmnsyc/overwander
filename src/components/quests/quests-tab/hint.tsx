import type { JSX } from 'solid-js';
import { DAILY_SLOTS } from '../../../data/quests/rotations';
import { Hint, HintList } from '../../styled';
import { m } from '../../../i18n/paraglide/messages.js';

/** How the board turns over and pays, behind the `?` at the sheet's top right */
export default function QuestHint(): JSX.Element {
  return (
    <Hint title={m.quest_about()}>
      <HintList>
        <li>{m.quest_hint_rotation({ count: DAILY_SLOTS })}</li>
        <li>{m.quest_hint_after()}</li>
        <li>{m.quest_hint_chains()}</li>
        <li>{m.quest_hint_claim()}</li>
      </HintList>
    </Hint>
  );
}
