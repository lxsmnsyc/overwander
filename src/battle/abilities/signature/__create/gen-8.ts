import { AttackPriority, EventPriority } from '../../../../core/event-emitter';
import type { Stages } from '../../../../data/constants/stats';
import { Stats } from '../../../../data/constants/stats';
import type Abilities from '../../../../data/ids/abilities';
import { type Types, getTypeFactor } from '../../../../data/constants/types';
import { MoveAttackFlags, Moves } from '../../../../data/ids/moves';
import type Battle from '../../../core';
import { BattleEvents, EffectType, MoveTargetType } from '../../../events';
import { MergedLifecycle } from '../../../lifecycle';
import type Unit from '../../../unit';
import { unitTarget } from '../../../utils';
import { createAbility, getAbilityHolders } from '../../__create';
import turns from '../../../turn';
import { createTimedMarks, createUnitState } from './helpers';

/**
 * What Galar's fossils share: two halves stitched together. A move of
 * the head's type strikes as the tail's against any target the tail's
 * type hits harder, so the swap is asked per target, never per cast
 */
export function createStitchedAbility(
  ability: Abilities,
  head: Types,
  tail: Types,
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveType, EventPriority.Post, (event) => {
      const aimed = event.target;

      if (
        event.type !== head ||
        aimed.type !== MoveTargetType.Unit ||
        !event.source.hasAbility(ability)
      ) {
        return;
      }

      const types = [...aimed.unit.types];

      if (getTypeFactor(tail, types) > getTypeFactor(head, types)) {
        event.type = tail;
      }
    }),
  );
}

/** How long a Galar starter waits before it can cue again */
export const CUE_COOLDOWN = turns(4);

/**
 * What the Galar starters share: each plays for the team, so a move of
 * its own type it lands on an enemy cues an assist move for its side.
 * Who the assist goes to is the family's own, and a cue with nobody to
 * go to is not spent
 */
export function createCueAbility(
  ability: Abilities,
  type: Types,
  move: Moves,
  pick: (holder: Unit, target: Unit) => Unit | undefined,
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) => {
    const resting = createTimedMarks(battle);

    return new MergedLifecycle([
      ...resting.lifecycles,
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;

        if (
          !event.success ||
          event.type !== type ||
          event.flags & MoveAttackFlags.Simulated ||
          source.team.alliance === event.target.team.alliance ||
          !source.alive ||
          resting.has(source) ||
          !source.hasAbility(ability)
        ) {
          return;
        }

        const cued = pick(source, event.target);

        if (cued == null) {
          return;
        }

        resting.mark(source, CUE_COOLDOWN);
        source.triggerAbility(ability);
        source.triggerMove(move, unitTarget(cued), 0);
      }),
    ]);
  });
}

/** How low one of the side falls before the sword or the shield answers */
export const SWORN_THRESHOLD = 1 / 2;

/** Which of the two heroes an ability is */
export type SwornSide = 'strikes' | 'guards';

/**
 * What Zacian and Zamazenta share: an oath to their own side. The first
 * time one of it is taken under half by an enemy, the sword casts Sacred
 * Sword at whoever did it and the shield casts Follow Me to stand in
 * front. Each answers once per unit, and the shield never for itself
 */
export function createSwornAbility(
  ability: Abilities,
  side: SwornSide,
): ((battle: Battle) => void) & { ability: Abilities } {
  const strikes = side === 'strikes';

  return createAbility(ability, (battle) => {
    const { state: answered, lifecycles } = createUnitState<true>(battle);

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const fallen = event.target;
        const striker = event.source;

        if (
          !event.success ||
          !fallen.alive ||
          answered.has(fallen) ||
          striker.team.alliance === fallen.team.alliance ||
          (strikes && !striker.alive) ||
          fallen.health >= fallen.checkStat(Stats.HP, 0) * SWORN_THRESHOLD
        ) {
          return;
        }

        for (const holder of getAbilityHolders(battle, ability)) {
          if (
            !holder.alive ||
            holder.team !== fallen.team ||
            (!strikes && holder === fallen) ||
            !holder.hasAbility(ability)
          ) {
            continue;
          }

          answered.set(fallen, true);
          holder.triggerAbility(ability);
          holder.triggerMove(
            strikes ? Moves.SacredSword : Moves.FollowMe,
            strikes ? unitTarget(striker) : { type: MoveTargetType.None },
            0,
          );
        }
      }),
    ]);
  });
}

/** What a knockout is worth to each of the king's side */
export const REIGN_STAGES = 1;
export const REIGN_MEND_FRACTION = 1 / 8;

/** What the king's reins hand the team: a stage, or some health back */
export type ReignReward = Stages | 'mend';

/**
 * What Calyrex and its two steeds share: the king's reins. Each enemy
 * the holder knocks out lifts its whole team, the steeds by a stage of
 * the stat they ride on and the king by mending everyone
 */
export function createReignAbility(
  ability: Abilities,
  reward: ReignReward,
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(
    ability,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
          const source = event.source;

          if (
            event.success &&
            !event.target.alive &&
            source.alive &&
            source.team.alliance !== event.target.team.alliance &&
            source.hasAbility(ability)
          ) {
            source.triggerAbility(ability);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== ability) {
            return;
          }

          const source = event.source;
          const cause = { type: EffectType.Ability, ability, unit: source } as const;

          for (const unit of source.team.units) {
            if (!unit.alive) {
              continue;
            }

            if (reward === 'mend') {
              source.heal(cause, unit, unit.checkStat(Stats.HP, 0) * REIGN_MEND_FRACTION, 0);
            } else {
              unit.addStage(reward, REIGN_STAGES, cause);
            }
          }
        }),
      ]),
  );
}
