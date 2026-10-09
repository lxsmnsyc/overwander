import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { MoveAttackFlags, MoveTargets, Moves, affectsFoesOnly } from '../../../data/ids/moves';
import { Statuses } from '../../../data/ids/status';
import { isBerry } from '../../../data/items/berries';
import { getMoveData } from '../../../data/moves';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import turns from '../../turn';
import type Unit from '../../unit';
import { isConsumable, isWeatherSandstorm, stealableItem, unitTarget } from '../../utils';
import { createAbility, getAbilityHolders } from '../__create';
import { createTimedMarks, worstHurtMate } from './__create';

/** How long the spear waits before it is thrown again */
export const SPEARHEAD_COOLDOWN = turns(3);

/** How long the venom takes to build another charge */
export const VENOM_CHARGE_COOLDOWN = turns(3);

/** Whether the unit has an Octolock of its own on somebody */
function holdsSomeone(unit: Unit): boolean {
  for (const enemy of unit.battle.units(unit.team.alliance)) {
    const held = enemy.status[Statuses.Cornered];

    if (
      enemy.alive &&
      held != null &&
      held.type === EffectType.Move &&
      held.move === Moves.Octolock &&
      held.unit === unit
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Galar Mine to Hulbury: the apple that shares its fruit, the snake
 * that burrows through the sand, the bird that keeps what it swallows,
 * the fish that strikes first, the toxic baby, the coiled centipede,
 * the octopus that grabs, and the urchin that shocks whoever touches it
 */
const setupAbilities = [
  // Applin: the fruit is shared with whoever needs it most. Only a
  // berry whose effect rides its own trigger can be passed on; one
  // that answers a blow has nothing to answer on the teammate
  createAbility(Abilities.SharedHarvest, (battle) => {
    // A second Applin on the far end must not pass the same bite back
    let sharing = false;

    return battle.on(BattleEvents.UnitTriggerItem, EventPriority.Post, (event) => {
      const eater = event.source;

      if (sharing || !isBerry(event.item) || !eater.hasAbility(Abilities.SharedHarvest)) {
        return;
      }

      const mate = worstHurtMate(eater);

      if (mate == null) {
        return;
      }

      eater.triggerAbility(Abilities.SharedHarvest);
      sharing = true;
      battle.emit(BattleEvents.UnitTriggerItem, {
        id: 'UnitTriggerItem',
        disabled: false,
        source: mate,
        item: event.item,
      });
      sharing = false;
    });
  }),

  // Silicobra: under the sand it moves underground, and comes up under
  // every enemy at once
  createAbility(Abilities.CoilBurrow, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveTargeting, EventPriority.Post, (event) => {
      if (
        event.target === MoveTargets.Unit &&
        affectsFoesOnly(event.affects) &&
        getMoveData(event.move).type === Types.Ground &&
        event.source.hasAbility(Abilities.CoilBurrow) &&
        isWeatherSandstorm(event.source)
      ) {
        event.target = MoveTargets.None;
      }
    }),
  ),

  // Cramorant: every Water move it lands leaves something in its
  // throat, which is Stockpile's business
  createAbility(
    Abilities.ThroatPouch,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
          const source = event.source;

          if (
            event.success &&
            !(event.flags & MoveAttackFlags.Simulated) &&
            event.type === Types.Water &&
            source.alive &&
            source.hasAbility(Abilities.ThroatPouch)
          ) {
            source.triggerAbility(Abilities.ThroatPouch);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.ThroatPouch) {
            event.source.triggerMove(Moves.Stockpile, { type: MoveTargetType.None }, 0);
          }
        }),
      ]),
  ),

  // Arrokuda: whoever lines up a move at it is speared before it lets go
  createAbility(Abilities.Spearhead, (battle) => {
    const waiting = createTimedMarks(battle);

    return new MergedLifecycle([
      ...waiting.lifecycles,
      battle.on(BattleEvents.UnitCast, EventPriority.Post, (event) => {
        const caster = event.source;
        const aimed = caster.casting?.target ?? event.target;

        if (aimed.type !== MoveTargetType.Unit) {
          return;
        }

        const holder = aimed.unit;

        if (
          !holder.alive ||
          holder.team.alliance === caster.team.alliance ||
          waiting.has(holder) ||
          !holder.hasAbility(Abilities.Spearhead)
        ) {
          return;
        }

        waiting.mark(holder, SPEARHEAD_COOLDOWN);
        holder.triggerAbility(Abilities.Spearhead);
        holder.triggerMove(Moves.AquaJet, unitTarget(caster), 0);
      }),
    ]);
  }),

  // Toxel: the poison in an enemy feeds the charge in its own body,
  // which is Charge's business
  createAbility(Abilities.VenomCharge, (battle) => {
    const waiting = createTimedMarks(battle);
    /** Health standing as each poison bite begins */
    const before = new Map<Unit, number>();

    return new MergedLifecycle([
      ...waiting.lifecycles,
      battle.on(BattleEvents.UnitTriggerStatus, EventPriority.Pre, (event) => {
        if (event.status === Statuses.Poisoned || event.status === Statuses.BadlyPoisoned) {
          before.set(event.source, event.source.health);
        }
      }),
      battle.on(BattleEvents.UnitTriggerStatus, EventPriority.Post, (event) => {
        const poisoned = event.source;
        const standing = before.get(poisoned);

        before.delete(poisoned);
        // A Poison Heal or a Magic Guard means the poison cost nothing
        if (standing == null || poisoned.health >= standing) {
          return;
        }

        for (const holder of getAbilityHolders(battle, Abilities.VenomCharge)) {
          if (
            holder.alive &&
            holder.team.alliance !== poisoned.team.alliance &&
            !waiting.has(holder) &&
            holder.hasAbility(Abilities.VenomCharge)
          ) {
            waiting.mark(holder, VENOM_CHARGE_COOLDOWN);
            holder.triggerAbility(Abilities.VenomCharge);
          }
        }
      }),
      battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
        if (event.ability === Abilities.VenomCharge) {
          event.source.triggerMove(Moves.Charge, { type: MoveTargetType.None }, 0);
        }
      }),
    ]);
  }),

  // Sizzlipede: its fire burns up the target's berry the way
  // Incinerate does, and nobody gets anything out of it
  createAbility(Abilities.CinderCoils, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      const { source, target } = event;

      if (
        !event.success ||
        event.flags & MoveAttackFlags.Simulated ||
        event.type !== Types.Fire ||
        target === source ||
        !source.hasAbility(Abilities.CinderCoils)
      ) {
        return;
      }

      const held = stealableItem(target);

      if (held == null || !isBerry(held)) {
        return;
      }

      const cause = {
        type: EffectType.Ability,
        ability: Abilities.CinderCoils,
        unit: source,
      } as const;

      source.triggerAbility(Abilities.CinderCoils);
      target.removeItem(held, cause, isConsumable(held));
    }),
  ),

  // Clobbopus: whatever it grabs, it keeps hold of, one at a time.
  // The hold is Octolock's business
  createAbility(Abilities.ArmLock, (battle) => {
    // Aimed but still in flight, so a second touch does not throw twice
    const reaching = new Set<Unit>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const { source, target } = event;

        if (
          !event.success ||
          event.flags & MoveAttackFlags.Simulated ||
          event.move === Moves.Octolock ||
          target === source ||
          !target.alive ||
          target.team.alliance === source.team.alliance ||
          reaching.has(source) ||
          !source.hasAbility(Abilities.ArmLock) ||
          !source.checkMoveContact(event.move, unitTarget(target)) ||
          holdsSomeone(source)
        ) {
          return;
        }

        source.triggerAbility(Abilities.ArmLock);
        source.triggerMove(Moves.Octolock, unitTarget(target), 0);
      }),
      // Counted from the throw rather than the touch, so a refused throw
      // leaves nothing behind
      battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
        if (event.move === Moves.Octolock) {
          reaching.add(event.source);
        }
      }),
      battle.on(BattleEvents.UnitTriggerMoveEnd, EventPriority.Post, (event) => {
        if (event.move === Moves.Octolock) {
          reaching.delete(event.source);
        }
      }),
    ]);
  }),

  // Pincurchin: the spines carry a current, and Thunder Shock is what
  // a touch earns
  createAbility(Abilities.LiveSpines, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      const { source, target } = event;

      if (
        !event.success ||
        event.flags & MoveAttackFlags.Simulated ||
        target === source ||
        !target.alive ||
        !source.alive ||
        !target.hasAbility(Abilities.LiveSpines) ||
        !source.checkMoveContact(event.move, unitTarget(target))
      ) {
        return;
      }

      target.triggerAbility(Abilities.LiveSpines);
      target.triggerMove(Moves.ThunderShock, unitTarget(source), 0);
    }),
  ),
];

export default setupAbilities;
