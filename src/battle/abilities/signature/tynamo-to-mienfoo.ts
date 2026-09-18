import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags } from '../../../data/ids/moves';
import { Statuses } from '../../../data/ids/status';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { onUnitActs } from '../../utils';
import { createAbility, getAbilityHolders } from '../__create';

/**
 * Twist Mountain and the moor below it: the bear that fights with its
 * own breath, the crystal that chains what it catches, the eel that
 * will not let go, and the one that answers with its sleeves.
 */

/** What a mouthful of frozen breath is worth, and how often it takes */
export const FROST_FANGS_SCALE = 1.25;
export const FROST_FANGS_CHANCE = 0.2;

/** How much longer a freeze holds while the chains are out */
export const CRYSTAL_CHAIN_SCALE = 2;

/** What being held costs, each time the held one reaches for a move */
export const LATCH_ON_SHARE = 1 / 16;

/** What the sleeves take off a blow that reaches them */
export const SLEEVE_GUARD_SCALE = 0.75;

const setupAbilities = [
  /**
   * Frost Fangs: the breath it hardens into teeth, so it answers what
   * it closes on rather than what it throws from a distance
   */
  createAbility(
    Abilities.FrostFangs,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
          const parent = event.parent;

          if (
            parent.source.hasAbility(Abilities.FrostFangs) &&
            parent.source.checkMoveContact(parent.move, {
              type: MoveTargetType.Unit,
              unit: parent.target,
            })
          ) {
            event.value *= FROST_FANGS_SCALE;
          }
        }),

        battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
          const source = event.source;
          const target = event.target;

          if (
            !event.success ||
            !target.alive ||
            !source.hasAbility(Abilities.FrostFangs) ||
            battle.random() >= FROST_FANGS_CHANCE ||
            !source.checkMoveContact(event.move, { type: MoveTargetType.Unit, unit: target })
          ) {
            return;
          }
          source.triggerAbility(Abilities.FrostFangs);
          target.addStatus(Statuses.Frozen, {
            type: EffectType.Ability,
            ability: Abilities.FrostFangs,
            unit: source,
          });
        }),
      ]),
  ),

  /**
   * Crystal Chain: it stretches a freeze somebody else landed rather
   * than laying one, so a Fire move still breaks it on schedule
   */
  createAbility(Abilities.CrystalChain, (battle) =>
    battle.on(BattleEvents.CheckUnitStatusDuration, EventPriority.Post, (event) => {
      const held = event.source;

      if (event.status !== Statuses.Frozen) {
        return;
      }

      for (const crystal of getAbilityHolders(battle, Abilities.CrystalChain)) {
        if (crystal.alive && crystal.team.alliance !== held.team.alliance) {
          event.duration *= CRYSTAL_CHAIN_SCALE;
          return;
        }
      }
    }),
  ),

  /**
   * Latch On: the sucker mouth holds one thing at a time, so taking a
   * second lets the first go
   */
  createAbility(Abilities.LatchOn, (battle) => {
    /** What each holder currently has hold of */
    const held = new WeakMap<Unit, Unit>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;
        const target = event.target;

        if (
          !event.success ||
          !target.alive ||
          held.get(source) === target ||
          !source.hasAbility(Abilities.LatchOn) ||
          !source.checkMoveContact(event.move, { type: MoveTargetType.Unit, unit: target })
        ) {
          return;
        }
        source.triggerAbility(Abilities.LatchOn);
        held.set(source, target);
      }),

      battle.on(BattleEvents.CheckUnitEscape, EventPriority.Post, (event) => {
        if (!event.success) {
          return;
        }

        for (const eel of getAbilityHolders(battle, Abilities.LatchOn)) {
          if (eel.alive && held.get(eel) === event.source) {
            event.success = false;
            return;
          }
        }
      }),

      ...onUnitActs(battle, (unit) => {
        if (!unit.alive) {
          return;
        }

        for (const eel of getAbilityHolders(battle, Abilities.LatchOn)) {
          if (!eel.alive || held.get(eel) !== unit) {
            continue;
          }
          eel.damage(
            { type: EffectType.Ability, ability: Abilities.LatchOn, unit: eel },
            unit,
            Math.max(1, Math.floor(unit.checkStat(Stats.HP, 0) * LATCH_ON_SHARE)),
            DamageFlags.Indirect,
          );
          return;
        }
      }),
    ]);
  }),

  /** Sleeve Guard: the fur takes the blow, so only a blow that touches */
  createAbility(Abilities.SleeveGuard, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const parent = event.parent;

      if (
        parent.target.hasAbility(Abilities.SleeveGuard) &&
        parent.source.checkMoveContact(parent.move, {
          type: MoveTargetType.Unit,
          unit: parent.target,
        })
      ) {
        event.value *= SLEEVE_GUARD_SCALE;
      }
    }),
  ),
];

export default setupAbilities;
