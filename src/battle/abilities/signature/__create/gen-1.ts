import { EventPriority } from '../../../../core/event-emitter';
import type { Stages } from '../../../../data/constants/stats';
import { Stats } from '../../../../data/constants/stats';
import Abilities from '../../../../data/ids/abilities';
import type { Types } from '../../../../data/constants/types';
import type Battle from '../../../core';
import { BattleEvents, EffectType } from '../../../events';
import { MergedLifecycle } from '../../../lifecycle';
import type Unit from '../../../unit';
import { createAbility } from '../../__create';
import { enemyHolder, fieldHolder, isPoisoned } from './helpers';

/** What a field tilted toward a type is worth, and against one */
export const FIELD_RAISED_SCALE = 1.2;
export const FIELD_LOWERED_SCALE = 0.8;

/**
 * What the Kanto starters share: each tilts the whole field toward its
 * own type and away from the one that type beats, its own side included.
 * Read where the blow's damage is worked out, so it reaches every move
 * of that type whoever threw it
 */
export function createFieldAbility(
  ability: Abilities,
  raised: Types,
  lowered: Types,
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const parent = event.parent;
      const holder = fieldHolder(battle, ability);

      if (!holder) {
        return;
      }

      if (parent.type === raised) {
        event.value *= FIELD_RAISED_SCALE;
      } else if (parent.type === lowered) {
        event.value *= FIELD_LOWERED_SCALE;
      }
    }),
  );
}

/** Each Kanto bird and its Galarian mirror, both ways round */
const MIRROR_WINGS = new Map<Abilities, Abilities>([
  [Abilities.Frostwing, Abilities.Glarewing],
  [Abilities.Glarewing, Abilities.Frostwing],
  [Abilities.Stormwing, Abilities.Strikewing],
  [Abilities.Strikewing, Abilities.Stormwing],
  [Abilities.Emberwing, Abilities.Wrathwing],
  [Abilities.Wrathwing, Abilities.Emberwing],
]);

/**
 * What the Kanto birds and their Galarian forms share: the beat of the
 * wings as one takes the field costs every enemy a stage of whatever
 * that bird's weather works on. A bird facing its mirror on the far
 * side beats nothing, and the mirror beats nothing back
 */
export function createWingbeatAbility(
  ability: Abilities,
  stage: Stages,
): ((battle: Battle) => void) & { ability: Abilities } {
  const mirror = MIRROR_WINGS.get(ability);

  return createAbility(
    ability,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (
            !event.reactivation &&
            event.source.hasAbility(ability) &&
            (mirror == null || enemyHolder(battle, event.source, mirror) == null)
          ) {
            event.source.triggerAbility(ability);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== ability) {
            return;
          }

          const source = event.source;
          const cause = { type: EffectType.Ability, ability, unit: source } as const;

          for (const enemy of battle.units(source.team.alliance)) {
            if (enemy.alive) {
              enemy.addStage(stage, -1, cause);
            }
          }
        }),
      ]),
  );
}

/** What one poisoned enemy is worth to the court, and how many it counts */
export const REGAL_COURT_STEP = 0.15;
export const REGAL_COURT_MAX_ENEMIES = 3;

/** Which half of the court an ability is: the shield or the spear */
export type RegalCourtSide = 'defends' | 'attacks';

/** How many of the holder's enemies are standing there poisoned */
function poisonedEnemies(battle: Battle, holder: Unit): number {
  let counted = 0;

  for (const enemy of battle.units(holder.team.alliance)) {
    if (enemy.alive && isPoisoned(enemy)) {
      counted += 1;
    }
  }

  return Math.min(REGAL_COURT_MAX_ENEMIES, counted);
}

/**
 * What the two Nidoran lines share: both are paid in poison, so every
 * poisoned enemy on the field lifts the holder. The female takes her
 * due on the defending side and the male his on the attacking one,
 * which is why either one poisoning is worth something to both
 */
export function createRegalCourtAbility(
  ability: Abilities,
  side: RegalCourtSide,
): ((battle: Battle) => void) & { ability: Abilities } {
  const defends = side === 'defends';

  return createAbility(ability, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
      const parent = event.parent;
      const holder = defends ? parent.target : parent.source;
      const wanted = defends
        ? event.stat === Stats.Defense || event.stat === Stats.SpecialDefense
        : event.stat === Stats.Attack || event.stat === Stats.SpecialAttack;

      if (!wanted || event.unit !== holder || !holder.hasAbility(ability)) {
        return;
      }

      const counted = poisonedEnemies(battle, holder);

      if (counted > 0) {
        event.value *= 1 + REGAL_COURT_STEP * counted;
      }
    }),
  );
}

/** What the shell keeps out, and what the blade cuts through */
export const FOSSIL_SHELL_SCALE = 1.25;
export const FOSSIL_BLADE_SCALE = 0.75;

/** Which fossil an ability is: the shell that holds or the blade that opens it */
export type FossilSide = 'shell' | 'blade';

/**
 * What the two Kanto fossils share: both are written on the defending
 * side of a blow, the shell raising its own and the blade cutting into
 * whatever it strikes. Meeting the counterpart is what answers either,
 * since the two multiply back toward nothing
 */
export function createFossilAbility(
  ability: Abilities,
  side: FossilSide,
): ((battle: Battle) => void) & { ability: Abilities } {
  const shell = side === 'shell';

  return createAbility(ability, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
      const parent = event.parent;
      const holder = shell ? parent.target : parent.source;

      if (
        (event.stat !== Stats.Defense && event.stat !== Stats.SpecialDefense) ||
        event.unit !== parent.target ||
        !holder.hasAbility(ability)
      ) {
        return;
      }

      event.value *= shell ? FOSSIL_SHELL_SCALE : FOSSIL_BLADE_SCALE;
    }),
  );
}
