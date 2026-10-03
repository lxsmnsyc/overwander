import { getCatchSlots } from '../../../auth/caught-record';
import { isEgg } from '../../../auth/egg';
import { trainMoveSlot } from '../../../auth/npcs';
import { Slots, mostSlots } from '../../../data/constants/slots';
import { DOJO_MASTER_FEE } from '../../../data/overworld/npc';
import playEffect, { Effect } from '../../../components/app/sound';
import { PickCatchForm } from '../../../components/forms/pick-catch';
import { scalesHeld } from '../shared';
import type { NpcScript } from '../create';

/** The Dojo Master: a Heart Scale for room for one more move */
const dojo: NpcScript = async (visit) => {
  const scales = await visit.carrying(DOJO_MASTER_FEE);
  const picked = await visit.form(PickCatchForm, {
    player: visit.player,
    action: 'Train',
    verb: 'Train',
    cost: { item: DOJO_MASTER_FEE },
    have: scalesHeld(scales),
    empty: 'You have nothing he can train further.',
    filter: (option) =>
      !isEgg(option.caught) &&
      !option.fighting &&
      getCatchSlots(option.caught, Slots.Move) < mostSlots(Slots.Move),
    note: (option) =>
      `${getCatchSlots(option.caught, Slots.Move)} → ${getCatchSlots(option.caught, Slots.Move) + 1} moves`,
    detail: (option) =>
      `Move slots ${getCatchSlots(option.caught, Slots.Move)} → ${getCatchSlots(option.caught, Slots.Move) + 1}`,
  });

  if (picked == null) {
    return;
  }

  const slots = await trainMoveSlot(visit.snapshot, visit.cell, picked[0].id);

  if (slots == null) {
    await visit.say('Not this one. No scale, or it cannot be trained further.');
    return;
  }
  playEffect(Effect.ItemSlot);
  visit.changed();
  await visit.say(`Hah! Room for ${slots} moves now. (−1 Heart Scale)`);
};

export default dojo;
