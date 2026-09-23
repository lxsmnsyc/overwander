import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags, MoveCategories } from '../../../data/ids/moves';
import { Weathers } from '../../../data/ids/status';
import { BattleEvents, EffectType } from '../../events';
import { createAbility } from '../__create';

/**
 * Dragonspiral Tower and the tunnels under it: the tusks that score
 * whatever they touch, the one that has to bask before it can move,
 * and the three heads that all want a bite.
 */

/** What a tusk takes off whatever it was dragged across */
export const SCORING_STAGES = -1;

/** What a warm body is worth to a cave dragon's cast */
export const SUNWARMED_SCALE = 0.75;

/** What the side heads get out of a bite the middle one took */
export const THREE_HEADS_SHARE = 1 / 3;

const SUNLIT = new Set<Weathers>([Weathers.Sunny, Weathers.ExtremeSunny]);

const setupAbilities = [
  /**
   * Scoring: the tusks cut the target rather than the air, so it is
   * the physical half of what it throws that leaves a mark
   */
  createAbility(Abilities.Scoring, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      const source = event.source;

      if (
        !event.success ||
        event.category !== MoveCategories.Physical ||
        !event.target.alive ||
        !source.hasAbility(Abilities.Scoring)
      ) {
        return;
      }
      source.triggerAbility(Abilities.Scoring);
      event.target.addStage(Stages.Defense, SCORING_STAGES, {
        type: EffectType.Ability,
        ability: Abilities.Scoring,
        unit: source,
      });
    }),
  ),

  /**
   * Sunwarmed: a cold Druddigon is a slow one. Cast times only, never
   * the cooldown, which is Speed's to answer
   */
  createAbility(Abilities.Sunwarmed, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, (event) => {
      const source = event.source;

      if (source.hasAbility(Abilities.Sunwarmed) && SUNLIT.has(source.checkWeather())) {
        event.duration *= SUNWARMED_SCALE;
      }
    }),
  ),

  /**
   * Three Heads: whatever the middle one bit, a side head reaches for
   * something else. The share is dealt directly rather than as a
   * second attack, so nothing that answers a blow answers it twice
   */
  createAbility(Abilities.ThreeHeads, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const parent = event.parent;
      const source = parent.source;

      if (event.value <= 0 || !source.alive || !source.hasAbility(Abilities.ThreeHeads)) {
        return;
      }

      const others = [];

      for (const enemy of battle.units(source.team.alliance)) {
        if (enemy.alive && enemy !== parent.target) {
          others.push(enemy);
        }
      }

      if (others.length === 0) {
        return;
      }

      const bitten = others[Math.floor(battle.random() * others.length)];

      source.triggerAbility(Abilities.ThreeHeads);
      source.damage(
        { type: EffectType.Ability, ability: Abilities.ThreeHeads, unit: source },
        bitten,
        event.value * THREE_HEADS_SHARE,
        DamageFlags.Indirect,
      );
    }),
  ),
];

export default setupAbilities;
