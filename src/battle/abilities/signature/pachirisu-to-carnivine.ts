import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags, MoveAttackFlags, Moves } from '../../../data/ids/moves';
import { Statuses } from '../../../data/ids/status';
import type Unit from '../../unit';
import { BattleEvents, EffectType } from '../../events';
import { unitTarget } from '../../utils';
import { MergedLifecycle } from '../../lifecycle';
import { createAbility, createContactHazard, getAbilityHolders } from '../__create';
import { createUnitState, isSoundMove } from './__create';

/** How often the fur pays out on somebody touching a friend. */
const SPARKFUR_CHANCE = 0.3;

/** How often a shout leaves the listener turned around. */
const BIRDSONG_CHANCE = 0.2;

/** What the stone takes in when somebody stops standing. */
export const SOULWELL_SHARE = 1 / 4;

/** Whoever on this unit's team is holding the fur up, itself included */
function furred(unit: Unit, ability: Abilities): Unit | null {
  for (const holder of getAbilityHolders(unit.battle, ability)) {
    if (holder.alive && holder.team === unit.team && holder.hasAbility(ability)) {
      return holder;
    }
  }

  return null;
}

const setupAbilities = [
  /**
   * Sparkfur: the charge is in the fur rather than in the pokemon, so
   * it is the squirrel's friends who are live to the touch. It covers
   * its own team, itself included
   */
  createAbility(
    Abilities.Sparkfur,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
          if (
            !event.success ||
            event.flags & DamageFlags.Indirect ||
            event.cause.type !== EffectType.Move ||
            event.cause.unit === event.target ||
            event.cause.unit.team === event.target.team ||
            !event.cause.unit.checkMoveContact(event.cause.move, unitTarget(event.target)) ||
            battle.random() >= SPARKFUR_CHANCE
          ) {
            return;
          }

          const squirrel = furred(event.target, Abilities.Sparkfur);

          if (squirrel != null) {
            squirrel.triggerAbility(Abilities.Sparkfur);

            event.cause.unit.addStatus(Statuses.Paralyzed, {
              type: EffectType.Ability,
              ability: Abilities.Sparkfur,
              unit: squirrel,
            });
          }
        }),
        // Touching anybody it stands with costs something, so the AI is
        // told before it decides to
        createContactHazard(battle, Abilities.Sparkfur),
      ]),
  ),

  /**
   * Birdsong: whatever it is shouting, the shape of the noise is its
   * own, and a listener loses the thread of it
   */
  createAbility(Abilities.Birdsong, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      if (
        event.success &&
        !(event.flags & MoveAttackFlags.Simulated) &&
        event.source !== event.target &&
        event.source.hasAbility(Abilities.Birdsong) &&
        isSoundMove(event.move) &&
        battle.random() < BIRDSONG_CHANCE
      ) {
        event.source.triggerAbility(Abilities.Birdsong);

        event.target.addStatus(Statuses.Confused, {
          type: EffectType.Ability,
          ability: Abilities.Birdsong,
          unit: event.source,
        });
      }
    }),
  ),

  /**
   * Soulwell: the stone takes in whoever stopped standing, whichever
   * side they were on. It answers a fainting rather than a kill, so
   * a unit that went down to its own poison counts the same
   */
  createAbility(Abilities.Soulwell, (battle) =>
    battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
      for (const stone of getAbilityHolders(battle, Abilities.Soulwell)) {
        if (stone.alive && stone !== event.source && stone.hasAbility(Abilities.Soulwell)) {
          stone.triggerAbility(Abilities.Soulwell);
          stone.heal(
            { type: EffectType.Ability, ability: Abilities.Soulwell, unit: stone },
            stone,
            Math.max(1, Math.floor(stone.checkStat(Stats.HP, 0) * SOULWELL_SHARE)),
            0,
          );
        }
      }
    }),
  ),

  /**
   * Snapvine: the trap shuts on whoever it reaches first, once each.
   * It casts the move rather than writing its own hold, so Bind's own
   * duration and chip stay the authority
   */
  createAbility(Abilities.Snapvine, (battle) => {
    const { state, lifecycles } = createUnitState<Set<Unit>>(battle);

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        if (
          !event.success ||
          event.flags & DamageFlags.Indirect ||
          event.cause.type !== EffectType.Move ||
          event.cause.unit === event.target ||
          !event.cause.unit.hasAbility(Abilities.Snapvine) ||
          !event.target.alive
        ) {
          return;
        }

        const vine = event.cause.unit;
        const bitten = state.get(vine) ?? new Set<Unit>();

        if (bitten.has(event.target) || event.target.status[Statuses.Trapped] != null) {
          return;
        }
        bitten.add(event.target);
        state.set(vine, bitten);

        vine.triggerAbility(Abilities.Snapvine);
        vine.triggerMove(Moves.Bind, unitTarget(event.target), 0);
      }),
    ]);
  }),
];

export default setupAbilities;
