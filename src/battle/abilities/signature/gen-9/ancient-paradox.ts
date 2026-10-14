import { AttackPriority, EventPriority } from '../../../../core/event-emitter';
import type { Stages } from '../../../../data/constants/stats';
import { Stats } from '../../../../data/constants/stats';
import { Types } from '../../../../data/constants/types';
import Abilities from '../../../../data/ids/abilities';
import { MoveAttackFlags, MoveCategories, Moves } from '../../../../data/ids/moves';
import { Statuses } from '../../../../data/ids/status';
import { getMoveData } from '../../../../data/moves';
import type Battle from '../../../battle';
import { BattleEvents, EffectType, MoveTargetType, type UnitAttackEvent } from '../../../events';
import { MergedLifecycle } from '../../../lifecycle';
import { WEATHER_DAMAGE } from '../../../mechanics/weather';
import { BLOW_GUARDS, guardOf } from '../../../moves/protect';
import type Unit from '../../../unit';
import { unitTarget } from '../../../unit-checks';
import { isWeatherSunny, skyOverTeam } from '../../../weather';
import { createAbility } from '../../__create';
import {
  createDamageTaken,
  createNextCastPenalty,
  createUnitState,
  isSingleTargetMove,
  isSoundMove,
} from '../__create';

/** How much faster Shriek Speed winds up a sound move */
export const SHRIEK_SPEED_SCALE = 0.7;

/** The chance Eerie Flutter turns a move aimed at it */
export const EERIE_FLUTTER_CHANCE = 0.2;

/** The share of HP Ancient Cocoon has to fall under */
export const ANCIENT_COCOON_THRESHOLD = 1 / 3;

/** How much slower Moon Howl makes each enemy's next wind-up */
export const MOON_HOWL_SCALE = 1.3;

/** How much faster Steam Surge winds up a Water move in sun */
export const STEAM_SURGE_SCALE = 0.8;

/** The share of HP Molten Bulwark heals for each blocked move */
export const MOLTEN_BULWARK_FRACTION = 1 / 8;

/** The chance Storm Cloud lays Electric Terrain */
export const STORM_CLOUD_CHANCE = 0.15;

/** Whether a landed attack is one an ability should answer, not the AI weighing one */
function landedForReal(battle: Battle, event: UnitAttackEvent): boolean {
  return (
    event.success &&
    !(event.flags & MoveAttackFlags.Simulated) &&
    !battle.estimating &&
    event.source.team.alliance !== event.target.team.alliance
  );
}

/** The attacker's standing teammates, itself excluded */
function standingMates(battle: Battle, attacker: Unit): Unit[] {
  const mates: Unit[] = [];

  for (const unit of battle.units()) {
    if (unit !== attacker && unit.alive && unit.team.alliance === attacker.team.alliance) {
      mates.push(unit);
    }
  }
  return mates;
}

/**
 * Paldea's ancient paradoxes, each built on how its line fights rather
 * than on a shared frame
 */
const ancientParadox = [
  // Great Tusk: it charges in headlong, and the next blow it lands
  // shrugs off what the last charge cost it
  createAbility(Abilities.HeadlongGuard, (battle) => {
    const { state: owed, lifecycles } = createUnitState<Map<Stages, number>>(battle);
    const before = new WeakMap<UnitAttackEvent, Map<Stages, number>>();

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.UnitAddStage, EventPriority.Post, (event) => {
        const cause = event.cause;
        const source = event.source;

        if (
          battle.estimating ||
          event.value >= 0 ||
          cause.type !== EffectType.Move ||
          cause.unit !== source ||
          !source.hasAbility(Abilities.HeadlongGuard)
        ) {
          return;
        }

        const drops = owed.get(source) ?? new Map<Stages, number>();

        drops.set(event.stage, (drops.get(event.stage) ?? 0) - event.value);
        owed.set(source, drops);
      }),
      battle.on(BattleEvents.UnitResetStages, EventPriority.Post, (event) => {
        owed.delete(event.source);
      }),
      // Only what was owed before this blow is paid back by it, so a
      // Close Combat never undoes its own drop
      battle.on(BattleEvents.UnitAttack, AttackPriority.Pre, (event) => {
        const drops = owed.get(event.source);

        if (drops != null) {
          before.set(event, new Map(drops));
        }
      }),
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;
        const snapshot = before.get(event);
        const drops = owed.get(source);

        if (
          snapshot == null ||
          drops == null ||
          !landedForReal(battle, event) ||
          !source.alive ||
          !source.hasAbility(Abilities.HeadlongGuard) ||
          !source.checkMoveContact(event.move, unitTarget(event.target))
        ) {
          return;
        }

        const cause = {
          type: EffectType.Ability,
          ability: Abilities.HeadlongGuard,
          unit: source,
        } as const;

        source.triggerAbility(Abilities.HeadlongGuard);
        for (const [stage, amount] of snapshot) {
          const left = drops.get(stage) ?? 0;
          const paid = Math.min(amount, left);

          if (paid > 0) {
            source.addStage(stage, paid, cause);
          }
          if (left - paid > 0) {
            drops.set(stage, left - paid);
          } else {
            drops.delete(stage);
          }
        }
      }),
    ]);
  }),

  // Scream Tail: the scream comes out before the breath is drawn
  createAbility(Abilities.ShriekSpeed, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, (event) => {
      if (event.source.hasAbility(Abilities.ShriekSpeed) && isSoundMove(event.move)) {
        event.duration *= SHRIEK_SPEED_SCALE;
      }
    }),
  ),

  // Flutter Mane: an eerie flicker, and the blow lands on whoever
  // stands beside the attacker. Turned as it lands, the way Mother's
  // Shield turns one, so the roll is only ever made for a real move
  createAbility(Abilities.EerieFlutter, (battle) =>
    battle.on(BattleEvents.UnitTriggerMoveTarget, AttackPriority.Pre, (event) => {
      const target = event.target;
      const attacker = event.source;

      if (
        battle.estimating ||
        target.type !== MoveTargetType.Unit ||
        target.unit === attacker ||
        target.unit.team.alliance === attacker.team.alliance ||
        !target.unit.hasAbility(Abilities.EerieFlutter) ||
        !isSingleTargetMove(event.move) ||
        battle.random() >= EERIE_FLUTTER_CHANCE
      ) {
        return;
      }

      const moth = target.unit;
      const mates = standingMates(battle, attacker);

      moth.triggerAbility(Abilities.EerieFlutter);
      if (mates.length > 0) {
        const index = Math.min(mates.length - 1, Math.floor(battle.random() * mates.length));

        event.target = unitTarget(mates[index]);
        return;
      }

      event.disabled = true;
      battle.emit(BattleEvents.UnitTriggerMoveMissed, {
        id: 'UnitTriggerMoveMissed',
        disabled: false,
        parent: event,
      });
    }),
  ),

  // Slither Wing: worn down far enough, it sheds the old skin and
  // dances, once a fight
  createAbility(Abilities.AncientCocoon, (battle) => {
    const shed = new Set<Unit>();
    const damage = createDamageTaken(battle);

    return new MergedLifecycle([
      ...damage.lifecycles,
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const moth = event.target;
        const taken = damage.taken(event);

        if (
          taken == null ||
          taken <= 0 ||
          battle.estimating ||
          !moth.alive ||
          shed.has(moth) ||
          !moth.hasAbility(Abilities.AncientCocoon)
        ) {
          return;
        }

        const line = moth.checkStat(Stats.HP, 0) * ANCIENT_COCOON_THRESHOLD;

        if (moth.health + taken < line || moth.health >= line) {
          return;
        }

        shed.add(moth);
        moth.triggerAbility(Abilities.AncientCocoon);
        moth.triggerMove(Moves.QuiverDance, unitTarget(moth), 0);
      }),
    ]);
  }),

  // Sandy Shocks: the charge runs through the sand, so the ground
  // conducts it rather than swallowing it
  createAbility(
    Abilities.EarthCurrent,
    (battle) =>
      new MergedLifecycle([
        // At Exact, right after the type chart's own answer, so a guard
        // or an absorbing ability still has its say at Post
        battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Exact, (event) => {
          if (
            event.immune &&
            event.type === Types.Electric &&
            event.target.type === MoveTargetType.Unit &&
            event.target.unit.types.has(Types.Ground) &&
            event.source.hasAbility(Abilities.EarthCurrent)
          ) {
            event.immune = false;
          }
        }),
        battle.on(BattleEvents.UnitAttackResolveEffectiveness, EventPriority.Post, (event) => {
          if (
            event.multiplier === 0 &&
            event.defendingType === Types.Ground &&
            event.parent.type === Types.Electric &&
            event.parent.source.hasAbility(Abilities.EarthCurrent)
          ) {
            event.multiplier = 1;
          }
        }),
      ]),
  ),

  // Roaring Moon: the howl as it lands rattles everyone opposite into
  // hesitating over their next move
  createAbility(Abilities.MoonHowl, (battle) => {
    const shaken = createNextCastPenalty(battle, MOON_HOWL_SCALE);

    return new MergedLifecycle([
      ...shaken.lifecycles,
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        const wolf = event.source;

        if (event.reactivation || !wolf.hasAbility(Abilities.MoonHowl)) {
          return;
        }

        wolf.triggerAbility(Abilities.MoonHowl);
        for (const enemy of battle.units(wolf.team.alliance)) {
          if (enemy.alive) {
            shaken.mark(enemy);
          }
        }
      }),
    ]);
  }),

  // Walking Wake: Hydro Steam's trick, carried by every Water move it
  // throws. Extreme sun still dries the water up
  createAbility(
    Abilities.SteamSurge,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, (event) => {
          const source = event.source;

          if (
            source.hasAbility(Abilities.SteamSurge) &&
            isWeatherSunny(source) &&
            getMoveData(event.move).category !== MoveCategories.Status &&
            source.checkMoveType(event.move, event.target) === Types.Water
          ) {
            event.duration *= STEAM_SURGE_SCALE;
          }
        }),
        // Divides out exactly the factor the sky put on, under the same
        // rule: a target sheltered from the sun was never weakened
        battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
          const parent = event.parent;
          const source = parent.source;

          if (
            parent.type !== Types.Water ||
            parent.category === MoveCategories.Status ||
            parent.flags & MoveAttackFlags.Pure ||
            !source.hasAbility(Abilities.SteamSurge) ||
            !isWeatherSunny(source)
          ) {
            return;
          }

          const weather = source.checkWeather();
          const factor = WEATHER_DAMAGE[weather]?.get(Types.Water);
          const target = parent.target;
          const sheltered =
            skyOverTeam(target.team) === weather && target.checkWeather() !== weather;

          if (factor != null && factor > 0 && factor < 1 && !sheltered) {
            event.value /= factor;
          }
        }),
      ]),
  ),

  // Gouging Fire: the heat of the guard it raises seals its wounds. The
  // guard's own cue marks the block, so a move that failed for some
  // other reason while it was raised heals nothing
  createAbility(Abilities.MoltenBulwark, (battle) => {
    const blocked = new WeakSet<Unit>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitTriggerMoveTarget, AttackPriority.Pre, (event) => {
        if (event.target.type === MoveTargetType.Unit) {
          blocked.delete(event.target.unit);
        }
      }),
      battle.on(BattleEvents.UnitTriggerStatus, EventPriority.Post, (event) => {
        if (event.status === Statuses.Protected) {
          blocked.add(event.source);
        }
      }),
      battle.on(BattleEvents.UnitTriggerMoveFailed, EventPriority.Post, (event) => {
        const { source, move, target } = event.parent;

        if (battle.estimating || target.type !== MoveTargetType.Unit || target.unit === source) {
          return;
        }

        const guard = target.unit;
        const raised = guardOf(guard);

        if (
          raised == null ||
          !blocked.has(guard) ||
          !guard.alive ||
          !guard.hasAbility(Abilities.MoltenBulwark) ||
          (BLOW_GUARDS.has(raised) && getMoveData(move).category === MoveCategories.Status)
        ) {
          return;
        }

        blocked.delete(guard);
        guard.triggerAbility(Abilities.MoltenBulwark);
        guard.heal(
          { type: EffectType.Ability, ability: Abilities.MoltenBulwark, unit: guard },
          guard,
          guard.checkStat(Stats.HP, 0) * MOLTEN_BULWARK_FRACTION,
          0,
        );
      }),
    ]);
  }),

  // Raging Bolt: the thundercloud on its back sometimes breaks over
  // the field
  createAbility(Abilities.StormCloud, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      const source = event.source;

      if (
        event.type !== Types.Electric ||
        !landedForReal(battle, event) ||
        !source.alive ||
        !source.hasAbility(Abilities.StormCloud) ||
        battle.random() >= STORM_CLOUD_CHANCE
      ) {
        return;
      }

      source.triggerAbility(Abilities.StormCloud);
      source.triggerMove(Moves.ElectricTerrain, { type: MoveTargetType.None }, 0);
    }),
  ),
];

export default ancientParadox;
