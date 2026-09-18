import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags } from '../../../data/ids/moves';
import { TeamStatuses } from '../../../data/ids/status';
import { BattleEvents, EffectType, type UnitAttackEvent } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { createAbility } from '../__create';

/**
 * What Route 5 holds: the fox, the chinchilla and the two the games
 * hand out one apiece.
 */

/** What a fixed stare is worth to whoever is aiming with it */
export const FIXATION_SCALE = 1.2;

/** How much of a teammate's blow the cell takes instead */
export const DIVISION_SHARE = 1 / 4;

/** Everything a tidy pokemon will not leave lying on either side */
const LITTER = new Set<TeamStatuses>([
  TeamStatuses.Spikes,
  TeamStatuses.ToxicSpikes,
  TeamStatuses.StealthRock,
  TeamStatuses.Reflect,
  TeamStatuses.LightScreen,
]);

const setupAbilities = [
  /**
   * Bluff: it was never standing where the blow went. Only the first
   * one that would have hurt most, since the trick works once
   */
  createAbility(Abilities.Bluff, (battle) => {
    /** Who has already used theirs */
    const spent = new Set<Unit>();
    // Effectiveness is answered one defending type at a time, so the
    // whole blow's worth is only known once they have all been asked
    const totals = new WeakMap<UnitAttackEvent, number>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitAttackResolveEffectiveness, EventPriority.Post, (event) => {
        if (event.parent.target.hasAbility(Abilities.Bluff)) {
          totals.set(event.parent, (totals.get(event.parent) ?? 1) * event.multiplier);
        }
      }),
      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        const target = event.parent.target;
        const total = totals.get(event.parent);

        if (
          event.value <= 0 ||
          total == null ||
          total <= 1 ||
          spent.has(target) ||
          !target.hasAbility(Abilities.Bluff)
        ) {
          return;
        }

        spent.add(target);
        event.value = 0;
        target.triggerAbility(Abilities.Bluff);
      }),

      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        if (!event.reactivation) {
          spent.delete(event.source);
        }
      }),
    ]);
  }),

  /**
   * Clean Sweep: it cannot leave a mess standing, and whose mess it
   * was does not come into it
   */
  createAbility(Abilities.CleanSweep, (battle) =>
    battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
      const source = event.source;

      if (event.reactivation || !source.hasAbility(Abilities.CleanSweep)) {
        return;
      }

      const cause = {
        type: EffectType.Ability,
        ability: Abilities.CleanSweep,
        unit: source,
      } as const;
      let swept = false;

      for (const team of battle.teams()) {
        for (const status of LITTER) {
          if (team.status[status] != null) {
            team.removeStatus(status, cause);
            swept = true;
          }
        }
      }

      if (swept) {
        source.triggerAbility(Abilities.CleanSweep);
      }
    }),
  ),

  /**
   * Fixation: its whole team throws at whatever it has settled on,
   * which is the one closest to going down
   */
  createAbility(Abilities.Fixation, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const parent = event.parent;
      const source = parent.source;
      let watcher: Unit | undefined;

      for (const mate of source.team.units) {
        if (mate.alive && mate.hasAbility(Abilities.Fixation)) {
          watcher = mate;
          break;
        }
      }

      if (watcher == null) {
        return;
      }

      let failing = parent.target;

      for (const enemy of battle.units(source.team.alliance)) {
        if (enemy.alive && enemy.health < failing.health) {
          failing = enemy;
        }
      }

      if (failing === parent.target) {
        event.value *= FIXATION_SCALE;
      }
    }),
  ),

  /**
   * Division: what is aimed at one of them is shared out, and the cell
   * takes its share directly rather than through the blow, so nothing
   * about the blow itself changes
   */
  createAbility(Abilities.Division, (battle) =>
    battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
      const target = event.target;

      if (event.value <= 0 || event.flags & DamageFlags.Indirect || !target.alive) {
        return;
      }

      for (const mate of target.team.units) {
        if (mate === target || !mate.alive || !mate.hasAbility(Abilities.Division)) {
          continue;
        }

        const shared = event.value * DIVISION_SHARE;

        event.value -= shared;
        mate.triggerAbility(Abilities.Division);
        mate.damage(
          { type: EffectType.Ability, ability: Abilities.Division, unit: mate },
          mate,
          shared,
          DamageFlags.Indirect,
        );
        return;
      }
    }),
  ),
];

export default setupAbilities;
