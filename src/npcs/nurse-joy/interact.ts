import { isGuarded, isShadow } from '../../auth/caught-record';
import { isEgg } from '../../auth/egg';
import { needsCare } from '../../auth/health';
import { visitNurse } from '../../auth/npcs';
import playEffect, { Effect } from '../../components/app/sound';
import { PickCatchForm } from '../../components/forms/pick-catch';
import type { NpcScript } from '../create';

/** Nurse Joy: nothing asked for, and a party handed back whole */
const nurse: NpcScript = async (visit) => {
  const party = await visit.form(PickCatchForm, {
    player: visit.player,
    action: 'Heal',
    verb: 'Heal',
    step: 'Choose who to heal',
    max: Number.POSITIVE_INFINITY,
    empty: 'You have nothing for her to look at.',
    // A shadow is the Purifying Gem's business, not something swept up in a heal
    filter: (option) =>
      !isEgg(option.caught) &&
      !option.fighting &&
      !isShadow(option.caught) &&
      needsCare(option.caught),
    reason: (option) => (isGuarded(option.caught) ? 'locked' : null),
  });

  if (party == null) {
    return;
  }

  const ids: string[] = [];

  for (const option of party) {
    ids.push(option.id);
  }
  if ((await visitNurse(visit.snapshot, visit.cell, ids)) == null) {
    await visit.say('These are all fine already. Nothing for me to do.');
    return;
  }
  playEffect(Effect.NurseHeal);
  visit.changed();
  await visit.say('There we are. Right as rain, every one of them.');
};

export default nurse;
