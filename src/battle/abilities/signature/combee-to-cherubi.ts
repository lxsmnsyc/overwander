import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages, Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { MoveAttackFlags } from '../../../data/ids/moves';
import { Statuses } from '../../../data/ids/status';
import type Battle from '../../core';
import { BattleEvents, EffectType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { createAbility } from '../__create';

/** What a worker brings back, as a share of the teammate's own pool */
export const POLLEN_DOLE_FRACTION = 1 / 16;

/** Where the sac stops holding it up */
export const FLOAT_SAC_THRESHOLD = 1 / 2;

/** What opening is worth: the health it puts back, and the stage it gains */
export const SECOND_BLOOM_FRACTION = 1 / 4;
export const SECOND_BLOOM_STAGES = 1;

/** The hurt teammate with the least health left, as a share of its own */
function neediestAlly(battle: Battle, unit: Unit): Unit | undefined {
  let found: Unit | undefined;
  let lowest = 1;

  for (const ally of battle.units()) {
    if (ally === unit || !ally.alive || ally.team !== unit.team) {
      continue;
    }

    const share = ally.health / ally.checkStat(Stats.HP, 0);

    if (share < lowest) {
      found = ally;
      lowest = share;
    }
  }

  return found;
}

/**
 * The comb, the sac and the blossom: one works for the hive, one is
 * held off the ground until it is opened, and one opens itself
 */
const setupAbilities = [
  /**
   * Pollen Dole: what a worker gathers goes to whoever needs it, and
   * a Combee with nobody to bring it to gathers for nothing
   */
  createAbility(Abilities.PollenDole, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      const source = event.source;

      if (
        !event.success ||
        event.flags & MoveAttackFlags.Simulated ||
        !source.hasAbility(Abilities.PollenDole)
      ) {
        return;
      }

      const needy = neediestAlly(battle, source);

      if (needy == null) {
        return;
      }

      source.triggerAbility(Abilities.PollenDole);
      source.heal(
        { type: EffectType.Ability, ability: Abilities.PollenDole, unit: source },
        needy,
        needy.checkStat(Stats.HP, 0) * POLLEN_DOLE_FRACTION,
        0,
      );
    }),
  ),

  /**
   * Float Sac: the sac holds it off the ground, so Ground moves and
   * anything laid on the floor miss it. Being opened is what ends
   * that, and healing afterwards does not put the air back in
   */
  createAbility(Abilities.FloatSac, (battle) => {
    /** Whose sac has already been opened this fight */
    const emptied = new Set<Unit>();

    return new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitGrounded, EventPriority.Post, (event) => {
        const source = event.source;

        if (
          event.grounded &&
          !emptied.has(source) &&
          source.status[Statuses.Grounded] == null &&
          source.hasAbility(Abilities.FloatSac)
        ) {
          event.grounded = false;
        }
      }),
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const target = event.target;

        if (
          event.success &&
          !emptied.has(target) &&
          target.hasAbility(Abilities.FloatSac) &&
          target.health < target.checkStat(Stats.HP, 0) * FLOAT_SAC_THRESHOLD
        ) {
          emptied.add(target);
          target.triggerAbility(Abilities.FloatSac);
        }
      }),
    ]);
  }),

  /**
   * Second Bloom: the cherry opens when it is worth opening, which is
   * the one thing this line does that the sky has no say in
   */
  createAbility(Abilities.SecondBloom, (battle) => {
    /** Who has already opened */
    const bloomed = new Set<Unit>();

    return battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
      const target = event.target;

      if (
        !event.success ||
        !target.alive ||
        bloomed.has(target) ||
        !target.hasAbility(Abilities.SecondBloom) ||
        target.health >= target.checkStat(Stats.HP, 0) * FLOAT_SAC_THRESHOLD
      ) {
        return;
      }

      const cause = {
        type: EffectType.Ability,
        ability: Abilities.SecondBloom,
        unit: target,
      } as const;

      bloomed.add(target);
      target.triggerAbility(Abilities.SecondBloom);
      target.heal(cause, target, target.checkStat(Stats.HP, 0) * SECOND_BLOOM_FRACTION, 0);
      target.addStage(Stages.SpecialAttack, SECOND_BLOOM_STAGES, cause);
    });
  }),
];

export default setupAbilities;
