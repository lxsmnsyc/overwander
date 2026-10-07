import { isGuarded } from '../../../auth/caught-record';
import { isEgg } from '../../../auth/egg';
import { hyperTrain } from '../../../auth/npcs';
import { MAX_IV, STAT_NAMES, STAT_ORDER, type Stats, getIV } from '../../../data/constants/stats';
import { hyperTrainingCost } from '../../../data/overworld/npc';
import playEffect, { Effect } from '../../../components/app/sound';
import type { Choice } from '../../../components/forms/choice';
import { pickCatchThenForm } from '../../../components/forms/pick-catch-then';
import { goldHeld } from '../shared';
import type { NpcScript } from '../create';

/** The pokemon and the value, asked on one screen */
const TrainForm = pickCatchThenForm<Stats>();

/**
 * The Hyper Trainer: a pokemon and the value to take to the top, on one
 * screen. The price is the points it has left, so each value says its own
 */
const hyper: NpcScript = async (visit) => {
  const gold = await visit.gold();
  const picked = await visit.form(TrainForm, {
    player: visit.player,
    verb: 'Pick',
    action: 'Train',
    have: goldHeld(gold),
    empty: 'You have nothing to train.',
    filter: (option) => !isEgg(option.caught) && !option.fighting && !isGuarded(option.caught),
    step: 'Choose a value',
    choices: (option) => {
      const values: Choice<Stats>[] = [];

      for (const stat of STAT_ORDER) {
        const iv = getIV(option.caught.ivs, stat);
        const cost = hyperTrainingCost(iv);
        let refused: string | null = null;

        if (iv >= MAX_IV) {
          refused = 'At the top';
        } else if (cost > gold) {
          refused = `${cost.toLocaleString('en-US')} gold`;
        }
        values.push({
          label: `${STAT_NAMES[stat]}  ${iv} → ${MAX_IV}`,
          value: stat,
          detail: `${cost.toLocaleString('en-US')} gold`,
          refused,
          cost: { gold: cost },
        });
      }
      return values;
    },
  });

  if (picked == null) {
    return;
  }

  const [option, stat] = picked;
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
