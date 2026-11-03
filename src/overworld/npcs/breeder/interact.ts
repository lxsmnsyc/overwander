import { isEgg } from '../../../model/egg';
import { breed } from '../../../auth/npcs';
import { BREEDING_FEE } from '../../../data/overworld/npc';
import { canBreed, canLayEggs } from '../../breeding';
import playEffect, { Effect } from '../../../components/app/sound';
import { PickCatchForm } from '../../../components/forms/pick-catch';
import { formatNumber } from '../../../i18n/format';
import { m } from '../../../i18n/paraglide/messages.js';
import { asParent, goldHeld } from '../shared';
import type { NpcScript } from '../create';

/** The breeder: two pokemon and a fee, and an egg if the pair will have each other */
const breeder: NpcScript = async (visit) => {
  const gold = await visit.gold();
  const pair = await visit.form(PickCatchForm, {
    player: visit.player,
    action: m.npc_breeder_action(),
    verb: m.npc_breeder_action(),
    step: m.npc_breeder_step(),
    min: 2,
    max: 2,
    cost: { gold: BREEDING_FEE },
    have: goldHeld(gold, BREEDING_FEE),
    empty: m.npc_breeder_empty(),
    // A legendary is unbreedable whatever it stands beside, so it is left out
    filter: (option) =>
      !isEgg(option.caught) && !option.fighting && canLayEggs(option.caught.species),
    check: ([first, second]) =>
      canBreed(asParent(first.caught), asParent(second.caught))
        ? null
        : m.npc_breeder_incompatible(),
  });

  if (pair == null) {
    return;
  }
  if ((await breed(visit.snapshot, visit.cell, [pair[0].id, pair[1].id])) == null) {
    await visit.say(m.npc_breeder_refused());
    return;
  }
  playEffect(Effect.EggGet);
  visit.notify({
    title: m.npc_breeder_toast_title(),
    message: m.npc_breeder_toast({ fee: formatNumber(BREEDING_FEE) }),
    tone: 'leaf',
  });
  visit.changed();
  await visit.say(m.npc_breeder_done());
};

export default breeder;
