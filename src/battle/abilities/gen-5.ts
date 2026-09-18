import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import Abilities from '../../data/ids/abilities';
import { Species, getBaseFormSpecies } from '../../data/ids/species';
import type Battle from '../core';
import { BattleEvents } from '../events';
import { MergedLifecycle } from '../lifecycle';
import type Unit from '../unit';
import { createAbility } from './__create';

/** How far a Darmanitan has to fall before it sits down */
export const ZEN_MODE_THRESHOLD = 1 / 2;

const setupAbilities = [
  /**
   * Zen Mode sits its holder down once a hit has taken it low enough,
   * and stands it back up if it is healed past the line. Only a
   * Darmanitan has the shapes, so anybody else who picks the ability
   * up carries a dead one
   * https://bulbapedia.bulbagarden.net/wiki/Zen_Mode_(Ability)
   */
  createAbility(Abilities.ZenMode, (battle) => {
    function settle(unit: Unit): void {
      if (
        !unit.alive ||
        !unit.hasAbility(Abilities.ZenMode) ||
        getBaseFormSpecies(unit.species) !== Species.Darmanitan
      ) {
        return;
      }

      const low = unit.health < unit.checkStat(Stats.HP, 0) * ZEN_MODE_THRESHOLD;
      const shape = low ? Species.DarmanitanZen : Species.Darmanitan;

      if (unit.species === shape) {
        return;
      }
      unit.triggerAbility(Abilities.ZenMode);
      // The shape carries its own stats and its second type with it,
      // and both shapes share an HP stat, so nothing it is standing on
      // moves underneath it
      unit.setSpecies(shape);
    }

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        settle(event.target);
      }),
      battle.on(BattleEvents.UnitHeal, EventPriority.Post, (event) => {
        settle(event.source);
      }),
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        settle(event.source);
      }),
    ]);
  }),
];

export default function setupGen5Abilities(battle: Battle): void {
  for (const setup of setupAbilities) {
    setup(battle);
  }
}
