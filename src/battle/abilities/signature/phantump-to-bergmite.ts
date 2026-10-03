import { EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { MoveCategories, Moves, StatFlags } from '../../../data/ids/moves';
import { BattleEvents } from '../../events';
import { createAbility } from '../__create';
import { createCurseAbility } from './__create';

/**
 * The two the versions keep apart and the ice that grinds past them
 * both. Each ghost lays its own type onto whatever it hits, so a
 * target that has met both is Grass and Ghost at once and every
 * weakness either curse opened stays open
 */
const setupAbilities = [
  // Phantump: the wood takes the target into itself
  createCurseAbility(Abilities.Undergrowth, Moves.ForestsCurse, Types.Grass),

  // Pumpkaboo: the lantern calls the target over to the dead
  createCurseAbility(Abilities.Hollowing, Moves.TrickOrTreat, Types.Ghost),

  // Bergmite: a glacier hits with its bulk rather than with anything
  // it swings, so the wall it puts up is the blow as well
  createAbility(Abilities.Deadweight, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
      const parent = event.parent;
      const attacker = parent.source;

      if (
        event.unit !== attacker ||
        event.stat !== Stats.Attack ||
        parent.category !== MoveCategories.Physical ||
        !attacker.hasAbility(Abilities.Deadweight)
      ) {
        return;
      }

      const defense = attacker.resolveStat(Stats.Defense, StatFlags.Attack);

      if (defense > event.value) {
        // Renamed as well, so anything after this reads the stat in use
        event.stat = Stats.Defense;
        event.value = defense;
      }
    }),
  ),
];

export default setupAbilities;
