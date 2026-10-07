import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { MoveAttackFlags, MoveCategories, Moves } from '../../../data/ids/moves';
import { getMoveData } from '../../../data/moves';
import { BattleEvents, EffectType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { getCastTime } from '../../mechanics/move/timing';
import type Unit from '../../unit';
import { onUnitActs, unitTarget } from '../../utils';
import { createAbility } from '../__create';
import { createUnitState } from './__create';

/** How often a landed blow leaves the target yawning */
export const DROWSY_GLOW_CHANCE = 0.2;

/** What a lei heals each time its wearer acts */
export const LEI_HEAL_FRACTION = 1 / 16;

/** What the sage's call takes off a teammate's next cast */
export const SAGES_CALL_SCALE = 0.75;

/** What a hurried move is worth to the troop */
export const RUSH_PASS_SCALE = 1.3;

/** Its best attacking stat, which is who the sage calls on */
function strength(unit: Unit): number {
  return Math.max(unit.checkStat(Stats.Attack, 0), unit.checkStat(Stats.SpecialAttack, 0));
}

/** The share of its HP a unit has left, for who is worst hurt */
function share(unit: Unit): number {
  return unit.health / unit.checkStat(Stats.HP, 0);
}

/**
 * The Lush Jungle: the mushroom whose glow sends things to sleep, the
 * flower that hands out leis, and the sage and the troop, who are worth
 * more together: the one calls a teammate to hurry and the other hits
 * hardest when it is hurried
 */
const setupAbilities = [
  createAbility(Abilities.DrowsyGlow, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      const { source, target } = event;

      if (
        !event.success ||
        !target.alive ||
        target === source ||
        getMoveData(event.move).category === MoveCategories.Status ||
        !source.hasAbility(Abilities.DrowsyGlow) ||
        battle.random() >= DROWSY_GLOW_CHANCE
      ) {
        return;
      }
      source.triggerAbility(Abilities.DrowsyGlow);
      source.triggerMove(Moves.Yawn, unitTarget(target), 0);
    }),
  ),

  // Comfey: one lei per arrival, and the wearer keeps it for the fight
  createAbility(Abilities.LeiGift, (battle) => {
    const { state: wearing, lifecycles } = createUnitState<boolean>(battle);

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        const source = event.source;

        if (event.reactivation || !source.hasAbility(Abilities.LeiGift)) {
          return;
        }

        let worst: Unit | undefined;

        for (const mate of source.team.units) {
          if (mate !== source && mate.alive && (worst == null || share(mate) < share(worst))) {
            worst = mate;
          }
        }
        if (worst != null) {
          source.triggerAbility(Abilities.LeiGift);
          wearing.set(worst, true);
        }
      }),
      ...onUnitActs(battle, (unit) => {
        if (wearing.get(unit) === true) {
          unit.heal(
            { type: EffectType.Ability, ability: Abilities.LeiGift, unit },
            unit,
            unit.checkStat(Stats.HP, 0) * LEI_HEAL_FRACTION,
            0,
          );
        }
      }),
    ]);
  }),

  // Oranguru: the call waits on the teammate's next cast, and is spent
  // by it
  createAbility(Abilities.SagesCall, (battle) => {
    const { state: called, lifecycles } = createUnitState<boolean>(battle);

    return new MergedLifecycle([
      ...lifecycles,
      ...onUnitActs(battle, (unit) => {
        if (!unit.hasAbility(Abilities.SagesCall)) {
          return;
        }

        let best: Unit | undefined;

        for (const mate of unit.team.units) {
          if (mate !== unit && mate.alive && (best == null || strength(mate) > strength(best))) {
            best = mate;
          }
        }
        if (best != null) {
          unit.triggerAbility(Abilities.SagesCall);
          called.set(best, true);
        }
      }),
      battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, (event) => {
        if (called.get(event.source) === true) {
          event.duration *= SAGES_CALL_SCALE;
        }
      }),
      // After the cast time is read for real, which is what spends it
      battle.on(BattleEvents.UnitCast, EventPriority.Post, (event) => {
        called.delete(event.source);
      }),
    ]);
  }),

  // Passimian: a cast is hurried when it comes out quicker than the
  // move's own priority would make it
  createAbility(Abilities.RushPass, (battle) => {
    const { state: rushed, lifecycles } = createUnitState<Moves>(battle);

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.UnitCast, EventPriority.Post, (event) => {
        const source = event.source;
        const casting = source.casting;

        rushed.delete(source);
        if (
          casting != null &&
          source.hasAbility(Abilities.RushPass) &&
          casting.time.duration < getCastTime(getMoveData(event.move).priority ?? 0)
        ) {
          rushed.set(source, event.move);
        }
      }),
      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        const parent = event.parent;

        if (
          event.value > 0 &&
          !(parent.flags & MoveAttackFlags.Simulated) &&
          rushed.get(parent.source) === parent.move &&
          parent.source.hasAbility(Abilities.RushPass)
        ) {
          event.value *= RUSH_PASS_SCALE;
        }
      }),
    ]);
  }),
];

export default setupAbilities;
