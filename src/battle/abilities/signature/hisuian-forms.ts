import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import Abilities from '../../../data/ids/abilities';
import { MoveAttackFlags, Moves } from '../../../data/ids/moves';
import { Statuses } from '../../../data/ids/status';
import { BattleEvents, type EffectCause, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import turns from '../../turn';
import type Unit from '../../unit';
import { unitTarget } from '../../utils';
import { createAbility, getAbilityHolders } from '../__create';
import { createTuftAbility, createUnitState } from './__create';

/** What a watched enemy leaves of the holder's next cast at it */
export const WATCHFIRE_SCALE = 0.6;

/** The share of the enemy side's poison a Qwilfish drinks back */
export const VENOM_FEAST_SHARE = 1 / 2;

/** How often a contact move numbs a poisoned target */
export const NERVE_VENOM_CHANCE = 0.3;

/** How long a Zorua's spirit lingers after the blow that should fell it */
export const AFTERHAUNT_DURATION = turns(2);

/** What a soul's wrapping leaves of the next blow */
export const SOUL_CLOAK_SCALE = 1 / 2;

function abilityCause(ability: Abilities, unit: Unit): EffectCause {
  return { type: EffectType.Ability, ability, unit };
}

function isPoisoned(unit: Unit): boolean {
  return unit.status[Statuses.Poisoned] != null || unit.status[Statuses.BadlyPoisoned] != null;
}

/**
 * Hisui's regional forms: the guard dog, the husk ball, the spined
 * fish, the climbing cat, the vengeful fox and the soul-bearing fish
 */
const setupAbilities = [
  // Hisuian Growlithe: a guard dog marks whoever goes for its charges.
  // Spent as its own cast at that enemy begins, since the AI asks about
  // a cast time many times before one starts
  createAbility(Abilities.Watchfire, (battle) => {
    // Per holder, the enemies it has seen going for its team
    const { state: watched, lifecycles } = createUnitState<Set<Unit>>(battle);

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.UnitCast, EventPriority.Post, (event) => {
        const caster = event.source;
        const target = event.target;

        if (target.type !== MoveTargetType.Unit) {
          return;
        }

        watched.get(caster)?.delete(target.unit);

        const charge = target.unit;

        for (const holder of getAbilityHolders(battle, Abilities.Watchfire)) {
          if (
            holder === charge ||
            !holder.alive ||
            holder.team !== charge.team ||
            caster.team.alliance === holder.team.alliance ||
            !holder.hasAbility(Abilities.Watchfire)
          ) {
            continue;
          }

          let enemies = watched.get(holder);

          if (enemies == null) {
            enemies = new Set();
            watched.set(holder, enemies);
          }

          if (!enemies.has(caster)) {
            enemies.add(caster);
            holder.triggerAbility(Abilities.Watchfire);
          }
        }
      }),
      battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, (event) => {
        const target = event.target;

        if (target.type === MoveTargetType.Unit && watched.get(event.source)?.has(target.unit)) {
          event.duration *= WATCHFIRE_SCALE;
        }
      }),
    ]);
  }),

  // Hisuian Voltorb: the husk splits under half and scatters its seeds
  createTuftAbility(Abilities.HuskBurst, (holder, enemy) => {
    holder.triggerMove(Moves.LeechSeed, unitTarget(enemy), 0);
  }),

  // Hisuian Qwilfish: the venom it carries feeds it as it works. Read
  // around the residual rather than the damage, so whoever laid the
  // poison does not matter
  createAbility(Abilities.VenomFeast, (battle) => {
    const standing = new WeakMap<object, number>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitTriggerStatus, EventPriority.Pre, (event) => {
        if (event.status === Statuses.Poisoned || event.status === Statuses.BadlyPoisoned) {
          standing.set(event, event.source.health);
        }
      }),
      battle.on(BattleEvents.UnitTriggerStatus, EventPriority.Post, (event) => {
        const before = standing.get(event);
        const victim = event.source;

        if (before == null) {
          return;
        }

        const lost = Math.max(0, before - victim.health);

        if (lost <= 0) {
          return;
        }

        for (const holder of getAbilityHolders(battle, Abilities.VenomFeast)) {
          if (
            holder.alive &&
            holder.team.alliance !== victim.team.alliance &&
            holder.hasAbility(Abilities.VenomFeast)
          ) {
            holder.triggerAbility(Abilities.VenomFeast);
            holder.heal(
              abilityCause(Abilities.VenomFeast, holder),
              holder,
              lost * VENOM_FEAST_SHARE,
              0,
            );
          }
        }
      }),
    ]);
  }),

  // Hisuian Sneasel: its claws carry a second venom that numbs what the
  // first has already reached. Nothing in the engine holds a unit to one
  // status, so the paralysis lands beside the poison
  createAbility(Abilities.NerveVenom, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      const source = event.source;
      const target = event.target;

      if (
        !event.success ||
        !target.alive ||
        source === target ||
        event.flags & MoveAttackFlags.Simulated ||
        !source.hasAbility(Abilities.NerveVenom) ||
        !isPoisoned(target) ||
        target.status[Statuses.Paralyzed] != null ||
        !source.checkMoveContact(event.move, unitTarget(target)) ||
        battle.random() >= NERVE_VENOM_CHANCE
      ) {
        return;
      }

      source.triggerAbility(Abilities.NerveVenom);
      target.addStatus(Statuses.Paralyzed, abilityCause(Abilities.NerveVenom, source));
    }),
  ),

  // Hisuian Zorua: the blow that should fell it leaves its spirit on
  // 1 HP for a while, out of every enemy's reach, and then it goes.
  // Once per fight rather than once per arrival
  createAbility(Abilities.Afterhaunt, (battle) => {
    const spent = new Set<Unit>();
    // Each lingering spirit, who struck it down and how long it has left
    const lingering = new Map<Unit, { attacker: Unit; left: number }>();

    function fall(spirit: Unit, attacker: Unit): void {
      lingering.delete(spirit);
      spirit.setHealth(0);
      spirit.faint(attacker);
    }

    const clock = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
      // Copied first: a fall can set off a blow that leaves another
      // spirit lingering, which must not lose time on this tick
      // oxlint-disable-next-line unicorn/no-useless-spread
      for (const [spirit, linger] of [...lingering]) {
        linger.left -= event.duration;

        if (linger.left <= 0) {
          fall(spirit, linger.attacker);
        }
      }

      if (lingering.size === 0) {
        clock.stop();
      }
    });

    clock.stop();

    return new MergedLifecycle([
      clock,
      battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
        const target = event.target;

        if (
          !target.alive ||
          event.value < target.health ||
          spent.has(target) ||
          !target.hasAbility(Abilities.Afterhaunt)
        ) {
          return;
        }

        spent.add(target);
        event.value = target.health - 1;
        lingering.set(target, { attacker: event.source, left: AFTERHAUNT_DURATION });
        clock.start();
        target.triggerAbility(Abilities.Afterhaunt);
      }),
      battle.on(BattleEvents.CheckUnitCanDamage, EventPriority.Post, (event) => {
        if (lingering.has(event.target)) {
          event.success = false;
        }
      }),
      battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
        const aimed = event.target;

        if (
          aimed.type === MoveTargetType.Unit &&
          lingering.has(aimed.unit) &&
          aimed.unit.team.alliance !== event.source.team.alliance
        ) {
          event.immune = true;
        }
      }),
      // Leaving would let it slip the fall it owes
      battle.on(BattleEvents.CheckUnitEscape, EventPriority.Post, (event) => {
        if (lingering.has(event.source)) {
          event.success = false;
        }
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        lingering.delete(event.source);
      }),
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        const linger = lingering.get(event.source);

        if (linger != null) {
          fall(event.source, linger.attacker);
        }
      }),
    ]);
  }),

  // White Basculin: the souls of the fallen ride with it. One wrapping
  // at a time, spent on the next blow it takes
  createAbility(Abilities.SoulCloak, (battle) => {
    const { state: cloaked, lifecycles } = createUnitState<true>(battle);

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        const fallen = event.source;

        for (const holder of getAbilityHolders(battle, Abilities.SoulCloak)) {
          if (
            holder !== fallen &&
            holder.alive &&
            holder.team === fallen.team &&
            holder.hasAbility(Abilities.SoulCloak)
          ) {
            cloaked.set(holder, true);
            holder.triggerAbility(Abilities.SoulCloak);
          }
        }
      }),
      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        const parent = event.parent;
        const target = parent.target;

        if (parent.source === target || !cloaked.has(target)) {
          return;
        }

        event.value *= SOUL_CLOAK_SCALE;

        if (!(parent.flags & MoveAttackFlags.Simulated)) {
          cloaked.delete(target);
        }
      }),
    ]);
  }),
];

export default setupAbilities;
