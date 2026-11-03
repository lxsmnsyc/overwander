import { isShadow } from '../../../model/caught-record';
import { isEgg } from '../../../model/egg';
import { groomCatch } from '../../../auth/npcs';
import { groomedFriendship } from '../../../data/constants/friendship';
import { GROOMING_FEE } from '../../../data/overworld/npc';
import { PickCatchForm } from '../../../components/forms/pick-catch';
import { sayFriendship } from '../../../components/catches/catch-summary';
import { m } from '../../../i18n/paraglide/messages.js';
import { goldHeld } from '../shared';
import type { NpcScript } from '../create';

/** The groomer: a fee, a brush, and a pokemon that thinks more of you */
const groomer: NpcScript = async (visit) => {
  const gold = await visit.gold();
  const picked = await visit.form(PickCatchForm, {
    player: visit.player,
    action: m.npc_groomer_action(),
    verb: m.npc_groomer_action(),
    cost: { gold: GROOMING_FEE },
    have: goldHeld(gold, GROOMING_FEE),
    empty: m.npc_groomer_empty(),
    // Half of what it has left to give: a great deal to one just caught, little to a friend
    filter: (option) =>
      !isEgg(option.caught) &&
      !option.fighting &&
      !isShadow(option.caught) &&
      groomedFriendship(option.caught.friendship) > option.caught.friendship,
    note: (option) =>
      m.npc_change({
        from: option.caught.friendship,
        to: groomedFriendship(option.caught.friendship),
      }),
    detail: (option) =>
      m.npc_groomer_detail({
        from: option.caught.friendship,
        to: groomedFriendship(option.caught.friendship),
      }),
  });

  if (picked == null) {
    return;
  }

  const friendship = await groomCatch(visit.snapshot, visit.cell, picked[0].id);

  if (friendship == null) {
    await visit.say(m.npc_groomer_refused());
    return;
  }
  visit.changed();
  await visit.say(m.npc_groomer_done({ mood: sayFriendship(friendship), fee: GROOMING_FEE }));
};

export default groomer;
