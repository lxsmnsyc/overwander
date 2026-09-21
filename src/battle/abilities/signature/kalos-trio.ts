import { EventPriority } from '../../../core/event-emitter';
import Abilities from '../../../data/ids/abilities';
import { BattleEvents, EffectType } from '../../events';
import type Unit from '../../unit';
import { createAbility, getAbilityHolders } from '../__create';

/** What a stage is worth where the order keeper is standing */
export const EVEN_KEEL_SCALE = 0.5;

/** What the stag adds to a rise, and what the bird adds to a drop */
export const AURA_STAGE_STEP = 1;

/**
 * Kalos's three, told on one axis. A stat stage is life put into
 * something or taken out of it: the stag gives a deeper measure, the
 * bird takes one, and the thing in the ground flattens both
 */
const setupAbilities = [
  // Xerneas: what its own side is given, it is given more of
  createAbility(Abilities.Quickening, (battle) =>
    battle.on(BattleEvents.UnitAddStage, EventPriority.Pre, (event) => {
      if (event.value <= 0) {
        return;
      }

      const stag = standing(battle, Abilities.Quickening, event.source);

      if (stag != null) {
        stag.triggerAbility(Abilities.Quickening);
        event.value += AURA_STAGE_STEP;
      }
    }),
  ),

  // Yveltal: what it takes off an enemy, it takes deeper. Only its own
  // doing counts, so a drop somebody else lands is untouched
  createAbility(Abilities.Withering, (battle) =>
    battle.on(BattleEvents.UnitAddStage, EventPriority.Pre, (event) => {
      const cause = event.cause;

      if (
        event.value >= 0 ||
        cause.type === EffectType.None ||
        cause.unit === event.source ||
        !cause.unit.hasAbility(Abilities.Withering)
      ) {
        return;
      }

      cause.unit.triggerAbility(Abilities.Withering);
      event.value -= AURA_STAGE_STEP;
    }),
  ),

  // Zygarde: where it stands, nothing either side has built up counts
  // for what it should, its own stages included
  createAbility(Abilities.EvenKeel, (battle) =>
    battle.on(BattleEvents.CheckUnitStage, EventPriority.Post, (event) => {
      if (event.value !== 0 && standing(battle, Abilities.EvenKeel) != null) {
        event.value = Math.trunc(event.value * EVEN_KEEL_SCALE);
      }
    }),
  ),
];

/**
 * A holder of this ability still on the field, on `team` if one is
 * named
 */
function standing(
  battle: Parameters<typeof getAbilityHolders>[0],
  ability: Abilities,
  mate?: Unit,
): Unit | undefined {
  for (const holder of getAbilityHolders(battle, ability)) {
    if (holder.alive && holder.hasAbility(ability) && (mate == null || holder.team === mate.team)) {
      return holder;
    }
  }

  return undefined;
}

export default setupAbilities;
