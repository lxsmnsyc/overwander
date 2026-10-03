import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import Abilities from '../../../data/ids/abilities';
import { MoveAttackFlags } from '../../../data/ids/moves';
import { Statuses } from '../../../data/ids/status';
import { isPunchMove } from '../../../data/moves/punches';
import type Battle from '../../core';
import { BattleEvents, MoveTargetType, type UnitTriggerMoveChildEvent } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { STATUS_MOVES } from '../../moves/status';
import { isCentered } from '../../status/centered';
import type Unit from '../../unit';
import { isOwnBerry, unitTarget } from '../../utils';
import { createAbility, getAbilityHolders } from '../__create';
import { createUnitState, isPseudoMove, isSingleTargetMove } from './__create';

/** What a punch thrown after one went wrong is worth */
export const REBOUND_PUNCH_SCALE = 1.5;

/** What its moves are worth while its head is spinning */
export const DIZZY_TWIRL_SCALE = 1.3;

/** What a berry is worth to a teammate while the bee stands */
export const HONEY_SHARE_SCALE = 1.5;

/** A standing holder of Honey Share beside the eater, not the eater itself */
function sharerOf(battle: Battle, eater: Unit): Unit | undefined {
  for (const holder of getAbilityHolders(battle, Abilities.HoneyShare)) {
    if (
      holder !== eater &&
      holder.alive &&
      holder.team === eater.team &&
      holder.hasAbility(Abilities.HoneyShare)
    ) {
      return holder;
    }
  }
  return undefined;
}

/**
 * The four Melemele's meadow and hill turn up: the crab that punches
 * harder for the one it whiffed, the dancer that turns a spin into
 * style, the bee that shares its honey, and the puppy that picks a
 * fight
 */
const setupAbilities = [
  createAbility(Abilities.ReboundPunch, (battle) => {
    const { state: charged, lifecycles } = createUnitState<boolean>(battle);
    // Holders throwing the punch the charge was spent on, so each blow
    // of it carries the charge
    const firing = new Set<Unit>();

    function charge(event: UnitTriggerMoveChildEvent): void {
      const { source, move, target } = event.parent;

      if (
        target.type === MoveTargetType.Unit &&
        target.unit !== source &&
        isPunchMove(move) &&
        source.hasAbility(Abilities.ReboundPunch) &&
        !charged.get(source)
      ) {
        charged.set(source, true);
        source.triggerAbility(Abilities.ReboundPunch);
      }
    }

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.UnitTriggerMoveMissed, EventPriority.Post, charge),
      // A move turned away before it could land, a guard's work above all
      battle.on(BattleEvents.UnitTriggerMoveFailed, EventPriority.Post, charge),
      battle.on(BattleEvents.UnitTriggerMoveEnd, EventPriority.Pre, (event) => {
        const source = event.source;

        firing.delete(source);

        if (isPunchMove(event.move) && charged.get(source)) {
          charged.delete(source);
          firing.add(source);
        }
      }),
      battle.on(BattleEvents.UnitTriggerMoveEnd, EventPriority.Post, (event) => {
        firing.delete(event.source);
      }),
      battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
        const source = event.source;

        if (
          event.power != null &&
          isPunchMove(event.move) &&
          (firing.has(source) || charged.get(source) === true) &&
          source.hasAbility(Abilities.ReboundPunch)
        ) {
          event.power *= REBOUND_PUNCH_SCALE;
        }
      }),
    ]);
  }),

  createAbility(
    Abilities.DizzyTwirl,
    (battle) =>
      new MergedLifecycle([
        // Before the swing at Post, which turning the trigger away
        // skips, and the cast it would have cost goes ahead
        battle.on(BattleEvents.UnitTriggerStatus, EventPriority.Pre, (event) => {
          if (event.status === Statuses.Confused && event.source.hasAbility(Abilities.DizzyTwirl)) {
            event.disabled = true;
            event.source.triggerAbility(Abilities.DizzyTwirl);
          }
        }),
        battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
          if (
            event.power != null &&
            !isPseudoMove(event.move) &&
            event.source.status[Statuses.Confused] != null &&
            event.source.hasAbility(Abilities.DizzyTwirl)
          ) {
            event.power *= DIZZY_TWIRL_SCALE;
          }
        }),
        // Confusing it is a gift, so the AI is refused it outright
        battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Post, (event) => {
          if (
            event.usable &&
            STATUS_MOVES[event.move] === Statuses.Confused &&
            event.target.type === MoveTargetType.Unit &&
            event.target.unit.hasAbility(Abilities.DizzyTwirl)
          ) {
            event.usable = false;
          }
        }),
      ]),
  ),

  createAbility(
    Abilities.HoneyShare,
    (battle) =>
      new MergedLifecycle([
        // Before Exact, which is where the health actually goes back
        battle.on(BattleEvents.UnitHeal, EventPriority.Pre, (event) => {
          const eater = event.target;

          if (event.value <= 0 || !isOwnBerry(event.cause, eater)) {
            return;
          }

          const bee = sharerOf(battle, eater);

          if (bee != null) {
            bee.triggerAbility(Abilities.HoneyShare);
            event.value *= HONEY_SHARE_SCALE;
          }
        }),
        // A stage is whole, so half a stage more rounds up to one
        battle.on(BattleEvents.UnitAddStage, EventPriority.Pre, (event) => {
          const eater = event.source;

          if (event.value <= 0 || !isOwnBerry(event.cause, eater)) {
            return;
          }

          const bee = sharerOf(battle, eater);

          if (bee != null) {
            bee.triggerAbility(Abilities.HoneyShare);
            event.value = Math.ceil(event.value * HONEY_SHARE_SCALE);
          }
        }),
      ]),
  ),

  createAbility(Abilities.Provoke, (battle) => {
    // Each provoked enemy and the holder it has to aim at
    const provoked = new Map<Unit, Unit>();

    function forget(unit: Unit): void {
      provoked.delete(unit);

      for (const [enemy, holder] of provoked) {
        if (holder === unit) {
          provoked.delete(enemy);
        }
      }
    }

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const holder = event.source;
        const enemy = event.target;

        if (
          !event.success ||
          event.flags & MoveAttackFlags.Simulated ||
          isPseudoMove(event.move) ||
          !enemy.alive ||
          enemy.team.alliance === holder.team.alliance ||
          !holder.hasAbility(Abilities.Provoke)
        ) {
          return;
        }
        if (provoked.get(enemy) !== holder) {
          provoked.set(enemy, holder);
          holder.triggerAbility(Abilities.Provoke);
        }
      }),
      // Turned as the cast is aimed, where Follow Me turns one. Only a
      // move aimed at the holder's side is owed: a heal for a teammate
      // is nothing to turn on it
      battle.on(BattleEvents.UnitCast, EventPriority.Post, (event) => {
        const caster = event.source;
        const holder = provoked.get(caster);
        const target = caster.casting?.target;

        if (
          holder == null ||
          target == null ||
          target.type !== MoveTargetType.Unit ||
          !isSingleTargetMove(event.move) ||
          target.unit.team.alliance !== holder.team.alliance
        ) {
          return;
        }

        provoked.delete(caster);

        // A Follow Me already drew the move, and what it drew is its own
        if (
          target.unit === holder ||
          isCentered(target.unit) ||
          !holder.alive ||
          !holder.hasAbility(Abilities.Provoke)
        ) {
          return;
        }

        caster.updateCast({ target: unitTarget(holder) });
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        forget(event.source);
      }),
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        forget(event.source);
      }),
    ]);
  }),
];

export default setupAbilities;
