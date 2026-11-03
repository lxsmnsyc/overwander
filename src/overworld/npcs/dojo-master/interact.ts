import { getCatchSlots } from '../../../model/caught-record';
import { isEgg } from '../../../model/egg';
import { trainMoveSlot } from '../../../auth/npcs';
import { Slots, mostSlots } from '../../../data/constants/slots';
import { DOJO_MASTER_FEE } from '../../../data/overworld/npc';
import playEffect, { Effect } from '../../../components/app/sound';
import { PickCatchForm } from '../../../components/forms/pick-catch';
import { m } from '../../../i18n/paraglide/messages.js';
import { scalesHeld } from '../shared';
import type { NpcScript } from '../create';

/** The Dojo Master: a Heart Scale for room for one more move, as often as there are scales */
const dojo: NpcScript = async (visit) => {
  let line: string | undefined;

  for (;;) {
    const scales = await visit.carrying(DOJO_MASTER_FEE);
    const picked = await visit.form(
      PickCatchForm,
      {
        player: visit.player,
        action: m.npc_dojo_action(),
        verb: m.npc_dojo_action(),
        cost: { item: DOJO_MASTER_FEE },
        have: scalesHeld(scales),
        empty: m.npc_dojo_empty(),
        filter: (option) =>
          !isEgg(option.caught) &&
          !option.fighting &&
          getCatchSlots(option.caught, Slots.Move) < mostSlots(Slots.Move),
        note: (option) =>
          m.npc_dojo_note({
            from: getCatchSlots(option.caught, Slots.Move),
            to: getCatchSlots(option.caught, Slots.Move) + 1,
          }),
        detail: (option) =>
          m.npc_dojo_detail({
            from: getCatchSlots(option.caught, Slots.Move),
            to: getCatchSlots(option.caught, Slots.Move) + 1,
          }),
      },
      { line },
    );

    if (picked == null) {
      return;
    }

    const slots = await trainMoveSlot(visit.snapshot, visit.cell, picked[0].id);

    if (slots == null) {
      line = m.npc_dojo_refused();
      continue;
    }
    playEffect(Effect.ItemSlot);
    visit.changed();
    line = m.npc_dojo_done({ slots });
  }
};

export default dojo;
