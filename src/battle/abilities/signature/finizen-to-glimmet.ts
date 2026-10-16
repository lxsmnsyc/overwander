import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags, MoveAttackFlags, Moves } from '../../../data/ids/moves';
import { Statuses } from '../../../data/ids/status';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import turns from '../../turn';
import type Unit from '../../unit';
import { createAbility } from '../__create';
import { createTimedMarks, enemyHolder } from './__create';

/** The share of its HP Lifeguard has to stand above to dive in */
export const LIFEGUARD_THRESHOLD = 1 / 2;

/** How much faster Redline winds up at the very bottom of its HP */
export const REDLINE_MAX_QUICKEN = 0.3;

/** The share of its HP Shed Decoy drops a substitute below */
export const SHED_DECOY_THRESHOLD = 1 / 2;

/** How long Slag Trail rests between the layers it lays */
export const SLAG_TRAIL_COOLDOWN = turns(5);

/** How much slower a poisoned enemy of Glimmering winds up */
export const GLIMMERING_SCALE = 1.2;

function share(unit: Unit): number {
  return unit.health / Math.max(1, unit.checkStat(Stats.HP, 0));
}

function isPoisoned(unit: Unit): boolean {
  return unit.status[Statuses.Poisoned] != null || unit.status[Statuses.BadlyPoisoned] != null;
}

const finizenToGlimmet = [
  // Finizen: it swims in for the one about to go under, and only while
  // it has the strength to spare. Each teammate is pulled out once
  createAbility(Abilities.Lifeguard, (battle) => {
    const rescued = new Set<Unit>();

    return battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
      const mate = event.target;
      const cause = event.cause;

      // Runs after a substitute has eaten the blow, so only what would
      // reach the teammate is weighed. A braced teammate is not falling
      if (
        battle.estimating ||
        !mate.alive ||
        rescued.has(mate) ||
        cause.type !== EffectType.Move ||
        cause.unit.team.alliance === mate.team.alliance ||
        event.flags & (DamageFlags.Indirect | DamageFlags.NonLethal) ||
        event.value < mate.health
      ) {
        return;
      }

      for (const guard of mate.team.units) {
        if (
          guard !== mate &&
          guard.alive &&
          guard.hasAbility(Abilities.Lifeguard) &&
          share(guard) > LIFEGUARD_THRESHOLD
        ) {
          rescued.add(mate);
          event.disabled = true;
          guard.triggerAbility(Abilities.Lifeguard);
          event.source.damage(cause, guard, event.value, event.flags);
          return;
        }
      }
    });
  }),

  // Varoom: the engine runs hotter the closer it is to blowing.
  // Cast times only, never the cooldown, which is Speed's
  createAbility(Abilities.Redline, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, (event) => {
      const source = event.source;

      if (source.hasAbility(Abilities.Redline)) {
        event.duration *= 1 - REDLINE_MAX_QUICKEN * (1 - Math.min(1, share(source)));
      }
    }),
  ),

  // Cyclizar: it leaves a shed skin behind the first time it is run
  // down. The substitute is put up directly, since the move's cast
  // would take the HP the description says it does not pay
  createAbility(Abilities.ShedDecoy, (battle) => {
    const shed = new Set<Unit>();
    const before = new WeakMap<object, number>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
        if (event.target.hasAbility(Abilities.ShedDecoy)) {
          before.set(event, event.target.health);
        }
      }),
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const target = event.target;
        const was = before.get(event);

        if (was == null || !event.success || !target.alive || shed.has(target)) {
          return;
        }

        const line = target.checkStat(Stats.HP, 0) * SHED_DECOY_THRESHOLD;

        if (was < line || target.health >= line) {
          return;
        }

        shed.add(target);
        target.triggerAbility(Abilities.ShedDecoy);
        target.addStatus(Statuses.Substituted, {
          type: EffectType.Ability,
          ability: Abilities.ShedDecoy,
          unit: target,
        });
      }),
    ]);
  }),

  // Orthworm: the molten track it leaves cools into spikes, laid by
  // Spikes itself so the layers and their bite stay the move's
  createAbility(Abilities.SlagTrail, (battle) => {
    const resting = createTimedMarks(battle);

    return new MergedLifecycle([
      ...resting.lifecycles,
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;

        if (
          !event.success ||
          event.flags & MoveAttackFlags.Simulated ||
          battle.estimating ||
          event.type !== Types.Steel ||
          event.target.team.alliance === source.team.alliance ||
          !source.alive ||
          resting.has(source) ||
          !source.hasAbility(Abilities.SlagTrail)
        ) {
          return;
        }

        resting.mark(source, SLAG_TRAIL_COOLDOWN);
        source.triggerAbility(Abilities.SlagTrail);
        source.triggerMove(Moves.Spikes, { type: MoveTargetType.Team, team: event.target.team }, 0);
      }),
    ]);
  }),

  // Glimmet: the glow hangs in the poisoned air, and anything breathing
  // it moves sluggishly
  createAbility(Abilities.Glimmering, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, (event) => {
      const source = event.source;

      if (isPoisoned(source) && enemyHolder(battle, source, Abilities.Glimmering)) {
        event.duration *= GLIMMERING_SCALE;
      }
    }),
  ),
];

export default finizenToGlimmet;
