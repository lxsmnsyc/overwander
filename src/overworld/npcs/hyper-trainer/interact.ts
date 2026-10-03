import { isGuarded } from '../../../auth/caught-record';
import { isEgg } from '../../../auth/egg';
import { hyperTrain } from '../../../auth/npcs';
import { MAX_IV, STAT_NAMES, STAT_ORDER, type Stats, getIV } from '../../../data/constants/stats';
import { hyperTrainingCost } from '../../../data/overworld/npc';
import playEffect, { Effect } from '../../../components/app/sound';
import type { Choice } from '../../../components/forms/choice';
import { PickCatchForm } from '../../../components/forms/pick-catch';
import { goldHeld } from '../shared';
import type { NpcScript } from '../create';

/**
 * The Hyper Trainer: a pokemon, then the value to take to the top. The
 * price is the points it has left, so each value says its own
 */
const hyper: NpcScript = async (visit) => {
  const gold = await visit.gold();
  const picked = await visit.form(PickCatchForm, {
    player: visit.player,
    action: 'Next',
    verb: 'Pick',
    have: goldHeld(gold),
    empty: 'You have nothing to train.',
    filter: (option) => !isEgg(option.caught) && !option.fighting && !isGuarded(option.caught),
  });

  if (picked == null) {
    return;
  }

  const [option] = picked;
  const choices: Choice<Stats>[] = [];

  for (const stat of STAT_ORDER) {
    const iv = getIV(option.caught.ivs, stat);
    const cost = hyperTrainingCost(iv);
    let refused: string | null = null;

    if (iv >= MAX_IV) {
      refused = 'At the top';
    } else if (cost > gold) {
      refused = `${cost.toLocaleString('en-US')} gold`;
    }
    choices.push({
      label: `${STAT_NAMES[stat]}  ${iv} → ${MAX_IV}`,
      value: stat,
      detail: `${cost.toLocaleString('en-US')} gold`,
      refused,
      cost: { gold: cost },
    });
  }

  const stat = await visit.ask('Which value do I take to the top?', choices, {
    list: true,
    step: 'Choose a value',
    action: 'Train',
    have: goldHeld(gold),
  });

  if (stat == null) {
    return;
  }

  const cost = hyperTrainingCost(getIV(option.caught.ivs, stat));

  if ((await hyperTrain(visit.snapshot, visit.cell, option.id, stat)) == null) {
    await visit.say('Not this one. The purse is short, or it is not yours to train.');
    return;
  }
  playEffect(Effect.LevelUp);
  visit.notify({
    title: STAT_NAMES[stat],
    message: `Trained to ${MAX_IV}. −${cost.toLocaleString('en-US')} gold`,
    tone: 'leaf',
  });
  visit.changed();
  await visit.say('All the way to the top. That is the best it will ever be.');
};

export default hyper;
