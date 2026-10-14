import { AttackPriority, EventPriority } from '../../../../core/event-emitter';
import { Stats } from '../../../../data/constants/stats';
import type Abilities from '../../../../data/ids/abilities';
import type { Types } from '../../../../data/constants/types';
import type { MoveCategories } from '../../../../data/ids/moves';
import { Terrains } from '../../../../data/ids/status';
import type Battle from '../../../core';
import { BattleEvents } from '../../../events';
import { MergedLifecycle } from '../../../lifecycle';
import type Unit from '../../../unit';
import { createAbility } from '../../__create';
import { createUnitState } from './helpers';

/** What each head in an Alola starter's audience is worth, and how many count */
export const AUDIENCE_SHARE = 0.1;
export const AUDIENCE_LIMIT = 4;

/** Who an Alola starter plays to: the far side, or its own team */
export type AudienceKind = 'enemies' | 'team';

/** How many of its audience are standing, capped at the limit */
function audienceSize(unit: Unit, kind: AudienceKind): number {
  let count = 0;
  const crowd = kind === 'team' ? unit.team.units : unit.battle.units(unit.team.alliance);

  for (const other of crowd) {
    if (other !== unit && other.alive) {
      count += 1;
    }
  }

  return Math.min(count, AUDIENCE_LIMIT);
}

/**
 * What the Alola starters share: each plays to a crowd, and one of its
 * stats counts for more with every head in it. Recounted on every
 * read, so the crowd thinning shows at once. The team is the holder's
 * own, never the whole alliance
 */
export function createAudienceAbility(
  ability: Abilities,
  stat: Stats,
  kind: AudienceKind,
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) =>
    battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
      if (event.stat === stat && event.source.hasAbility(ability)) {
        event.value *= 1 + audienceSize(event.source, kind) * AUDIENCE_SHARE;
      }
    }),
  );
}

/** What a stored hit-back charge is worth to the move it is spent on */
export const HIT_BACK_SCALE = 1.5;

/**
 * What Turtonator and Drampa share: a blow of one category landing on
 * the holder's team charges it, and its next landed move of its own type
 * hits back harder. The Sun one answers physical blows with fire and the
 * Moon one special blows with dragon breath, so together they cover both
 */
export function createHitBackAbility(
  ability: Abilities,
  category: MoveCategories,
  type: Types,
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) => {
    const { state: charged, lifecycles } = createUnitState<boolean>(battle);

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const { source, target } = event;

        if (event.success && source.team.alliance !== target.team.alliance) {
          if (event.category === category) {
            for (const holder of target.team.units) {
              if (holder.alive && charged.get(holder) !== true && holder.hasAbility(ability)) {
                charged.set(holder, true);
                holder.triggerAbility(ability);
              }
            }
          }
          if (event.type === type && charged.get(source) === true) {
            charged.delete(source);
          }
        }
      }),
      battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
        if (
          event.power != null &&
          charged.get(event.source) === true &&
          event.source.checkMoveType(event.move, event.target) === type
        ) {
          event.power *= HIT_BACK_SCALE;
        }
      }),
    ]);
  });
}

/** What a Tapu's terrain makes its team's blessed stat count for */
export const BLESSING_SCALE = 1.25;

/**
 * What the Tapus share: while a guardian's own terrain is down, one
 * stat of each unit on its team counts for more. The field is read
 * rather than the unit, so a teammate in the air is blessed too, and
 * two holders on one team still bless it once
 */
export function createBlessingAbility(
  ability: Abilities,
  terrain: Terrains,
  stat: Stats,
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) =>
    battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
      const unit = event.source;
      const laid =
        battle.terrain.current === Terrains.None
          ? unit.team.terrain.current
          : battle.terrain.current;

      if (event.stat !== stat || laid !== terrain) {
        return;
      }

      for (const mate of unit.team.units) {
        if (mate.alive && mate.hasAbility(ability)) {
          event.value *= BLESSING_SCALE;
          return;
        }
      }
    }),
  );
}

/** The most the light trio's moves are lifted by, at the far end of their health */
export const SKY_ARC_RISE = 0.3;

/**
 * What the light trio share: its damaging moves are lifted in a
 * straight line by how much health it has. `rising` holders burn
 * brightest whole, the rest brightest broken
 */
export function createSkyArcAbility(
  ability: Abilities,
  rising: boolean,
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) =>
    battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      const unit = event.source;

      if (event.power == null || event.power <= 0 || !unit.hasAbility(ability)) {
        return;
      }

      const full = unit.checkStat(Stats.HP, 0);
      const share = full > 0 ? Math.min(1, unit.health / full) : 0;

      event.power *= 1 + SKY_ARC_RISE * (rising ? share : 1 - share);
    }),
  );
}

/**
 * What the Ultra Beasts share: one type this world would beat it with
 * lands only as hard as any other. The weakness goes the way Strong
 * Winds takes a Flying type's, one defending type at a time, so it is
 * never turned into a resistance
 */
export function createForeignBodyAbility(
  ability: Abilities,
  type: Types,
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveEffectiveness, EventPriority.Post, (event) => {
      if (
        event.multiplier > 1 &&
        event.parent.type === type &&
        event.parent.target.hasAbility(ability)
      ) {
        event.multiplier = 1;
      }
    }),
  );
}
