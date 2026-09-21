import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { getMoveData } from '../../../data/moves';
import { Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags } from '../../../data/ids/moves';
import { Weathers } from '../../../data/ids/status';
import { BattleEvents, EffectType, MoveTargetType, type UnitAttackEvent } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { onUnitActs } from '../../utils';
import { createAbility } from '../__create';
import { createUnitState, isPseudoMove } from './__create';

/**
 * What the desert holds: the croc that will not let go, the doll that
 * swings wide, the cactus that lives off what it stored and the mason
 * carrying its own roof.
 */

/** What a second bite on the same throat is worth */
export const DEATH_ROLL_SCALE = 1.25;

/** What a miss is still worth to something swinging that hard */
export const GLANCING_BLOW_FRACTION = 1 / 4;

/** What a clear sky is worth to a cactus, and what it drinks under one */
export const DRY_SPELL_SCALE = 1.3;
export const DRY_SPELL_HEAL = 1 / 16;

/** How much of itself the slab on its back will take first */
export const SLAB_SHARE = 1 / 4;

const setupAbilities = [
  /**
   * Death Roll: it is worth more on a throat it already has hold of,
   * which is the target's own state rather than any move history
   */
  createAbility(Abilities.DeathRoll, (battle) => {
    /** Who each holder has already landed something on */
    const held = new WeakMap<Unit, Set<Unit>>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        const parent = event.parent;

        if (
          parent.source.hasAbility(Abilities.DeathRoll) &&
          held.get(parent.source)?.has(parent.target) &&
          parent.source.checkMoveContact(parent.move, {
            type: MoveTargetType.Unit,
            unit: parent.target,
          })
        ) {
          event.value *= DEATH_ROLL_SCALE;
        }
      }),

      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        if (!event.success || !event.source.hasAbility(Abilities.DeathRoll)) {
          return;
        }

        let bitten = held.get(event.source);

        if (bitten == null) {
          bitten = new Set();
          held.set(event.source, bitten);
        }
        if (!bitten.has(event.target)) {
          event.source.triggerAbility(Abilities.DeathRoll);
          bitten.add(event.target);
        }
      }),
    ]);
  }),

  /**
   * Glancing Blow: what it throws is heavy enough to be felt even when
   * it goes wide, which is what Hustle costs the line in the first
   * place. A miss never reaches the attack step, so the blow it would
   * have landed is resolved here rather than read off one
   */
  createAbility(Abilities.GlancingBlow, (battle) =>
    battle.on(BattleEvents.UnitTriggerMoveMissed, EventPriority.Post, (event) => {
      const parent = event.parent;
      const source = parent.source;
      const move = getMoveData(parent.move);

      if (
        !source.alive ||
        parent.target.type !== MoveTargetType.Unit ||
        !parent.target.unit.alive ||
        isPseudoMove(parent.move) ||
        move.power == null ||
        !source.hasAbility(Abilities.GlancingBlow)
      ) {
        return;
      }

      const target = parent.target.unit;
      const attack: UnitAttackEvent = {
        id: 'UnitAttack',
        disabled: false,
        source,
        target,
        move: parent.move,
        value: move.power,
        category: move.category,
        type: source.checkMoveType(parent.move, parent.target),
        flags: 0,
        success: false,
      };
      const resolved = {
        id: 'UnitAttackResolveDamage',
        disabled: false,
        parent: attack,
        value: move.power,
      } as const;

      battle.emit(BattleEvents.UnitAttackResolveDamage, resolved);
      source.triggerAbility(Abilities.GlancingBlow);
      source.damage(
        { type: EffectType.Ability, ability: Abilities.GlancingBlow, unit: source },
        target,
        resolved.value * GLANCING_BLOW_FRACTION,
        DamageFlags.Indirect,
      );
    }),
  ),

  /**
   * Dry Spell: a desert plant is at its best when the sky is doing
   * nothing, living off what it put away while it could
   */
  createAbility(
    Abilities.DrySpell,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
          const source = event.parent.source;

          if (source.hasAbility(Abilities.DrySpell) && source.checkWeather() === Weathers.None) {
            event.value *= DRY_SPELL_SCALE;
          }
        }),

        ...onUnitActs(battle, (unit) => {
          const maxHealth = unit.checkStat(Stats.HP, 0);

          if (
            !unit.alive ||
            unit.health >= maxHealth ||
            !unit.hasAbility(Abilities.DrySpell) ||
            unit.checkWeather() !== Weathers.None
          ) {
            return;
          }
          unit.triggerAbility(Abilities.DrySpell);
          unit.heal(
            { type: EffectType.Ability, ability: Abilities.DrySpell, unit },
            unit,
            Math.max(1, Math.floor(maxHealth * DRY_SPELL_HEAL)),
            0,
          );
        }),
      ]),
  ),

  /**
   * Slab: the rock takes a fixed share of its owner before any of it
   * reaches the owner, so one heavy blow spends the lot where several
   * small ones are each softened
   */
  createAbility(Abilities.Slab, (battle) => {
    const { state, lifecycles } = createUnitState<number>(battle);

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
        const target = event.target;

        if (event.value <= 0 || !target.alive || !target.hasAbility(Abilities.Slab)) {
          return;
        }

        const left = state.get(target) ?? target.checkStat(Stats.HP, 0) * SLAB_SHARE;

        if (left <= 0) {
          return;
        }

        const taken = Math.min(left, event.value);

        state.set(target, left - taken);
        event.value -= taken;
        target.triggerAbility(Abilities.Slab);
      }),
    ]);
  }),
];

export default setupAbilities;
