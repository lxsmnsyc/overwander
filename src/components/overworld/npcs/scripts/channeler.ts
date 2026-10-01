import { getCatchSlots } from '../../../../auth/caught-record';
import { isEgg } from '../../../../auth/egg';
import { channelAbility } from '../../../../auth/npcs';
import { getAbilityData } from '../../../../data/abilities';
import { Slots, countAbilitySlots, mostSlots } from '../../../../data/constants/slots';
import { CHANNELER_FEE, getAwakenableAbilities } from '../../../../data/overworld/npc';
import playEffect, { Effect } from '../../../app/sound';
import type { CatchOption } from '../../../catches/catch-picker';
import { PickCatchForm } from '../../../forms/pick-catch';
import { scalesHeld } from '../shared';
import type { NpcScript } from '../visit';

/** Room on the record, and something in its line it does not already carry */
function hasSomethingLeft(caught: CatchOption['caught']): boolean {
  return (
    getCatchSlots(caught, Slots.Ability) < mostSlots(Slots.Ability) &&
    countAbilitySlots(caught.abilities) >= getCatchSlots(caught, Slots.Ability) &&
    getAwakenableAbilities(caught.species, caught.abilities).length > 0
  );
}

/** The channeler: hand the scale over and let her call something up */
const channeler: NpcScript = async (visit) => {
  const scales = await visit.carrying(CHANNELER_FEE);
  const picked = await visit.form(PickCatchForm, {
    player: visit.player,
    action: 'Call up',
    verb: 'Call up',
    cost: { item: CHANNELER_FEE },
    have: scalesHeld(scales),
    empty: 'You have nothing she can reach.',
    // What comes out is the line's, so a line with nothing left is left out
    filter: (option) =>
      !isEgg(option.caught) && !option.fighting && hasSomethingLeft(option.caught),
    note: (option) => `${option.caught.abilities.length} → ${option.caught.abilities.length + 1}`,
    detail: (option) =>
      `Abilities ${option.caught.abilities.length} → ${option.caught.abilities.length + 1}`,
  });

  if (picked == null) {
    return;
  }

  const drawn = await channelAbility(visit.snapshot, visit.cell, picked[0].id);

  if (drawn == null) {
    await visit.say(
      'Nothing answered. No scale, or one I cannot reach, or I have seen you this while.',
    );
    return;
  }
  playEffect(Effect.AbilityLearned);
  visit.notify({
    title: getAbilityData(drawn.ability).name,
    message: 'Called up, and room for it. (−1 Heart Scale)',
    tone: 'leaf',
  });
  visit.changed();
  await visit.say(`${getAbilityData(drawn.ability).name}. That is what answered.`);
};

export default channeler;
