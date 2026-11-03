import { isGuarded } from '../../../model/caught-record';
import { isEgg } from '../../../model/egg';
import { hyperTrain } from '../../../auth/npcs';
import { MAX_IV, STAT_NAMES, STAT_ORDER, type Stats, getIV } from '../../../data/constants/stats';
import { hyperTrainingCost } from '../../../data/overworld/npc';
import playEffect, { Effect } from '../../../components/app/sound';
import type { Choice } from '../../../components/forms/choice';
import { pickCatchThenForm } from '../../../components/forms/pick-catch-then';
import { goldHeld } from '../shared';
import type { NpcScript } from '../create';
import { formatNumber } from '../../../i18n/format';
import { m } from '../../../i18n/paraglide/messages.js';

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
    verb: m.npc_hyper_verb(),
    action: m.npc_hyper_action(),
    have: goldHeld(gold),
    empty: m.npc_hyper_empty(),
    filter: (option) => !isEgg(option.caught) && !option.fighting && !isGuarded(option.caught),
    step: m.npc_hyper_step(),
    choices: (option) => {
      const values: Choice<Stats>[] = [];

      for (const stat of STAT_ORDER) {
        const iv = getIV(option.caught.ivs, stat);
        const cost = hyperTrainingCost(iv);
        let refused: string | null = null;

        if (iv >= MAX_IV) {
          refused = m.npc_hyper_top();
        } else if (cost > gold) {
          refused = m.ui_gold({ amount: formatNumber(cost) });
        }
        values.push({
          label: m.npc_hyper_stat({ stat: STAT_NAMES[stat], value: iv, max: MAX_IV }),
          value: stat,
          detail: m.ui_gold({ amount: formatNumber(cost) }),
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
    await visit.say(m.npc_hyper_refused());
    return;
  }
  playEffect(Effect.LevelUp);
  visit.notify({
    title: STAT_NAMES[stat],
    message: m.npc_hyper_toast({ max: MAX_IV, cost: formatNumber(cost) }),
    tone: 'leaf',
  });
  visit.changed();
  await visit.say(m.npc_hyper_done());
};

export default hyper;
