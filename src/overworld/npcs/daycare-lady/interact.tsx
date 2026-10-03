import { boostedSteps, isEgg, stepsRemaining } from '../../../auth/egg';
import { boostEgg } from '../../../auth/npcs';
import { Species } from '../../../data/ids/species';
import { DAYCARE_FEE } from '../../../data/overworld/npc';
import { PickCatchForm } from '../../../components/forms/pick-catch';
import AnimatedSprite from '../../../components/sprites/AnimatedSprite';
import { goldHeld } from '../shared';
import type { NpcScript } from '../create';

/** The daycare lady: one egg, one fee, and it hatches that much sooner */
const daycare: NpcScript = async (visit) => {
  const gold = await visit.gold();
  const picked = await visit.form(PickCatchForm, {
    player: visit.player,
    action: 'Warm',
    verb: 'Warm',
    cost: { gold: DAYCARE_FEE },
    have: goldHeld(gold, DAYCARE_FEE),
    empty: 'You have no egg for her.',
    filter: (option) =>
      isEgg(option.caught) && !option.fighting && stepsRemaining(option.caught) > 0,
    // Half of a long walk is further than half of a short one
    note: (option) => `${option.caught.steps} → ${boostedSteps(option.caught)}`,
    detail: (option) => `Steps ${option.caught.steps} → ${boostedSteps(option.caught)}`,
  });

  if (picked == null) {
    return;
  }

  const steps = await boostEgg(visit.snapshot, visit.cell, picked[0].id);

  if (steps == null) {
    await visit.say(
      'I cannot take this one, dear. It may be ready, or I have warmed your one already.',
    );
    return;
  }
  visit.notify({
    title: 'Egg',
    message: `Warmed along to ${steps} steps. −${DAYCARE_FEE} gold`,
    art: () => (
      <span class="flex size-8 items-center justify-center">
        <AnimatedSprite species={Species.Egg} direction="DownLeft" fill still label="" />
      </span>
    ),
    tone: 'leaf',
  });
  visit.changed();
  await visit.say('There, nice and warm. It will not be long now.');
};

export default daycare;
