import { isEgg } from '../../auth/egg';
import { breed } from '../../auth/npcs';
import { BREEDING_FEE } from '../../data/overworld/npc';
import { canBreed, canLayEggs } from '../../overworld/breeding';
import playEffect, { Effect } from '../../components/app/sound';
import { PickCatchForm } from '../../components/forms/pick-catch';
import { asParent, goldHeld } from '../shared';
import type { NpcScript } from '../create';

/** The breeder: two pokemon and a fee, and an egg if the pair will have each other */
const breeder: NpcScript = async (visit) => {
  const gold = await visit.gold();
  const pair = await visit.form(PickCatchForm, {
    player: visit.player,
    action: 'Breed',
    verb: 'Breed',
    step: 'Choose a pair',
    min: 2,
    max: 2,
    cost: { gold: BREEDING_FEE },
    have: goldHeld(gold, BREEDING_FEE),
    empty: 'You have nothing to breed.',
    // A legendary is unbreedable whatever it stands beside, so it is left out
    filter: (option) =>
      !isEgg(option.caught) && !option.fighting && canLayEggs(option.caught.species),
    check: ([first, second]) =>
      canBreed(asParent(first.caught), asParent(second.caught))
        ? null
        : 'Those two will have nothing to do with each other.',
  });

  if (pair == null) {
    return;
  }
  if ((await breed(visit.snapshot, visit.cell, [pair[0].id, pair[1].id])) == null) {
    await visit.say('No luck. Wrong pair, a short purse, or you have bred with me this while.');
    return;
  }
  playEffect(Effect.EggGet);
  visit.notify({
    title: 'An egg',
    message: `Carry it as your buddy and walk. −${BREEDING_FEE} gold`,
    tone: 'leaf',
  });
  visit.changed();
  await visit.say('An egg, and a fine one. Keep it close and keep walking.');
};

export default breeder;
