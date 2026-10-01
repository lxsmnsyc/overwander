import { isShadow } from '../../../../auth/caught-record';
import { isEgg } from '../../../../auth/egg';
import { groomCatch } from '../../../../auth/npcs';
import { describeFriendship, groomedFriendship } from '../../../../data/constants/friendship';
import { GROOMING_FEE } from '../../../../data/overworld/npc';
import { PickCatchForm } from '../../../forms/pick-catch';
import { goldHeld } from '../shared';
import type { NpcScript } from '../visit';

/** The groomer: a fee, a brush, and a pokemon that thinks more of you */
const groomer: NpcScript = async (visit) => {
  const gold = await visit.gold();
  const picked = await visit.form(PickCatchForm, {
    player: visit.player,
    action: 'Groom',
    verb: 'Groom',
    cost: { gold: GROOMING_FEE },
    have: goldHeld(gold, GROOMING_FEE),
    empty: 'You have nothing for him to see to.',
    // Half of what it has left to give: a great deal to one just caught, little to a friend
    filter: (option) =>
      !isEgg(option.caught) &&
      !option.fighting &&
      !isShadow(option.caught) &&
      groomedFriendship(option.caught.friendship) > option.caught.friendship,
    note: (option) =>
      `${option.caught.friendship} → ${groomedFriendship(option.caught.friendship)}`,
    detail: (option) =>
      `Friendship ${option.caught.friendship} → ${groomedFriendship(option.caught.friendship)}`,
  });

  if (picked == null) {
    return;
  }

  const friendship = await groomCatch(visit.snapshot, visit.cell, picked[0].id);

  if (friendship == null) {
    await visit.say(
      'I cannot take that one. A shadow, a friend already, or I have seen you this while.',
    );
    return;
  }
  visit.changed();
  await visit.say(
    `Brushed and fussed over. It comes back ${describeFriendship(friendship)}. (−${GROOMING_FEE} gold)`,
  );
};

export default groomer;
