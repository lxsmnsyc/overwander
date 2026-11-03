import { boostedSteps, isEgg, stepsRemaining } from '../../../model/egg';
import { boostEgg } from '../../../auth/npcs';
import { Species } from '../../../data/ids/species';
import { DAYCARE_FEE } from '../../../data/overworld/npc';
import { PickCatchForm } from '../../../components/forms/pick-catch';
import AnimatedSprite from '../../../components/sprites/AnimatedSprite';
import { m } from '../../../i18n/paraglide/messages.js';
import { goldHeld } from '../shared';
import type { NpcScript } from '../create';

/** The daycare lady: one egg, one fee, and it hatches that much sooner */
const daycare: NpcScript = async (visit) => {
  const gold = await visit.gold();
  const picked = await visit.form(PickCatchForm, {
    player: visit.player,
    action: m.npc_daycare_action(),
    verb: m.npc_daycare_action(),
    cost: { gold: DAYCARE_FEE },
    have: goldHeld(gold, DAYCARE_FEE),
    empty: m.npc_daycare_empty(),
    filter: (option) =>
      isEgg(option.caught) && !option.fighting && stepsRemaining(option.caught) > 0,
    // Half of a long walk is further than half of a short one
    note: (option) => m.npc_change({ from: option.caught.steps, to: boostedSteps(option.caught) }),
    detail: (option) =>
      m.npc_daycare_detail({ from: option.caught.steps, to: boostedSteps(option.caught) }),
  });

  if (picked == null) {
    return;
  }

  const steps = await boostEgg(visit.snapshot, visit.cell, picked[0].id);

  if (steps == null) {
    await visit.say(m.npc_daycare_refused());
    return;
  }
  visit.notify({
    title: m.npc_daycare_toast_title(),
    message: m.npc_daycare_toast({ steps, fee: DAYCARE_FEE }),
    art: () => (
      <span class="flex size-8 items-center justify-center">
        <AnimatedSprite species={Species.Egg} direction="DownLeft" fill still label="" />
      </span>
    ),
    tone: 'leaf',
  });
  visit.changed();
  await visit.say(m.npc_daycare_done());
};

export default daycare;
