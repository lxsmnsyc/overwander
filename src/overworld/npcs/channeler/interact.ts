import { getCatchSlots } from '../../../model/caught-record';
import { isEgg } from '../../../model/egg';
import { channelAbility } from '../../../auth/npcs';
import { getAbilityData } from '../../../data/abilities';
import { Slots, countAbilitySlots, mostSlots } from '../../../data/constants/slots';
import { CHANNELER_FEE, getAwakenableAbilities } from '../../../data/overworld/npc';
import playEffect, { Effect } from '../../../components/app/sound';
import type { CatchOption } from '../../../components/catches/catch-picker';
import { PickCatchForm } from '../../../components/forms/pick-catch';
import { m } from '../../../i18n/paraglide/messages.js';
import { scalesHeld } from '../shared';
import type { NpcScript } from '../create';

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
    action: m.npc_channeler_action(),
    verb: m.npc_channeler_action(),
    cost: { item: CHANNELER_FEE },
    have: scalesHeld(scales),
    empty: m.npc_channeler_empty(),
    // What comes out is the line's, so a line with nothing left is left out
    filter: (option) =>
      !isEgg(option.caught) && !option.fighting && hasSomethingLeft(option.caught),
    note: (option) =>
      m.npc_change({
        from: option.caught.abilities.length,
        to: option.caught.abilities.length + 1,
      }),
    detail: (option) =>
      m.npc_channeler_detail({
        from: option.caught.abilities.length,
        to: option.caught.abilities.length + 1,
      }),
  });

  if (picked == null) {
    return;
  }

  const drawn = await channelAbility(visit.snapshot, visit.cell, picked[0].id);

  if (drawn == null) {
    await visit.say(m.npc_channeler_refused());
    return;
  }
  playEffect(Effect.AbilityLearned);
  visit.notify({
    title: getAbilityData(drawn.ability).name,
    message: m.npc_channeler_toast(),
    tone: 'leaf',
  });
  visit.changed();
  await visit.say(m.npc_channeler_done({ ability: getAbilityData(drawn.ability).name }));
};

export default channeler;
