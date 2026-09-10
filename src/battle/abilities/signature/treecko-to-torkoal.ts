import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages, Stats } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import {
  DamageFlags,
  MoveAttackFlags,
  MoveCategories,
  MoveTargets,
  Moves,
  affectsFoesOnly,
} from '../../../data/ids/moves';
import { getMoveData } from '../../../data/moves';
import { Statuses, Weathers } from '../../../data/ids/status';
import type Battle from '../../core';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { MAJOR_STATUS_CONDITIONS } from '../../status';
import { hasAnyStatus, isWeatherRainy, isWeatherSunny, onUnitActs, unitTarget } from '../../utils';
import { createAbility } from '../__create';
import {
  createCheerAbility,
  createDamageTaken,
  createDeceiverAbility,
  createGroveAbility,
  createGrowthAbility,
  createTimedMarks,
  createUnitCounter,
  createUnitState,
  fieldHasAbility,
  isSingleTargetMove,
  isSoundMove,
} from './__create';

/** What a target the pack has already opened up is worth */
export const PACK_HUNT_SCALE = 1.2;

/** What one crooked step takes off a blow aimed at it, and how many it keeps */
export const CROOKED_RUN_SCALE = 0.9;
export const CROOKED_RUN_MAX_STACKS = 3;

/** The cut a gull takes out of somebody else's meal */
export const GULLS_GREED_SHARE = 1 / 4;

/** What its side's hurt is worth to it, and the share that counts as hurt */
export const EMPATH_SCALE = 1.3;
export const EMPATH_THRESHOLD = 1 / 2;

/** How many meals the frenzy counts */
export const FEEDING_FRENZY_MAX_STAGES = 3;

/** What the hump takes off the far side, and the share that sets it off */
export const MAGMA_VENT_FRACTION = 1 / 8;
export const MAGMA_VENT_THRESHOLD = 1 / 2;

/** What its own sky is worth to a coal-burning shell */
export const BODY_HEAT_SCALE = 1.3;

/** What the aroma takes off the far side's Speed */
export const LURE_SCENT_SCALE = 0.85;

/** What flowering again gives back, and the share it waits for */
export const PERENNIAL_HEAL_FRACTION = 1 / 3;
export const PERENNIAL_THRESHOLD = 1 / 4;

/** What somebody else's spent item is worth to a bottomless stomach */
export const BOTTOMLESS_FRACTION = 1 / 8;

/** What the ore it eats is worth back to it */
export const ORE_HUNGER_FRACTION = 1 / 4;

/** What a blow is worth against something holding a move together */
export const MIND_OVER_BODY_SCALE = 0.5;

/** The two types the line lives on. Ground is left out: it is Aggron's
 * own worst weakness, and the line needs something that still answers it */
const ORE_TYPES = new Set<Types>([Types.Steel, Types.Rock]);

/** What the opening jolt is worth, over and above going first */
export const JOLT_START_SCALE = 1.5;

/** What an untouched cat's Speed counts as */
export const KITTEN_PACE_SCALE = 1.3;

/** What the fungus takes off anything already sick */
export const MYCELIUM_SCALE = 1.2;

/** How long nothing can find it, once it has struck */
export const VANISHING_ACT_DURATION = 1000;

/** What the echo comes back for, and how long behind the shout */
export const ECHO_CHAMBER_FRACTION = 1 / 4;
export const ECHO_CHAMBER_DELAY = 2000;

/** An echo still to come back */
interface Echo {
  source: Unit;
  target: Unit;
  amount: number;
  remaining: number;
}

/** The hazards a thing standing on the water never touches */
const HAZARD_MOVES = new Set<Moves>([Moves.Spikes, Moves.StealthRock]);

/** Whether anybody else on its side is hurt enough to feel */
function allyIsHurt(battle: Battle, unit: Unit): boolean {
  for (const ally of battle.units()) {
    if (
      ally !== unit &&
      ally.alive &&
      ally.team === unit.team &&
      ally.health < ally.checkStat(Stats.HP, 0) * EMPATH_THRESHOLD
    ) {
      return true;
    }
  }

  return false;
}

/** What the shell is worth both ways, how long it holds, and what opens it */
export const COCOON_SCALE = 0.5;
export const COCOON_DURATION = 4000;
export const COCOON_THRESHOLD = 1 / 2;

const treeckoToTorkoal = [
  // The Hoenn starters: one growth each, in the stat its line is built
  // on, set off by what that line does with a fight
  createGrowthAbility(Abilities.SapSurge, Stages.Speed, 'acts'),
  createGrowthAbility(Abilities.EmberSurge, Stages.Attack, 'lands'),
  createGrowthAbility(Abilities.SiltSurge, Stages.SpecialDefense, 'takes'),

  // Poochyena: it hunts what the pack has already been at. Kept on the
  // quarry, so it is dropped when that quarry leaves or falls
  createAbility(Abilities.PackHunt, (battle) => {
    const { state, lifecycles } = createUnitState<Set<Unit>>(battle);

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const cause = event.cause;

        if (
          !event.success ||
          event.flags & DamageFlags.Indirect ||
          cause.type === EffectType.None
        ) {
          return;
        }

        const marks = state.get(event.target) ?? new Set<Unit>();

        marks.add(cause.unit);
        state.set(event.target, marks);
      }),
      battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
        const target = event.target;
        const source = event.source;

        if (
          event.power == null ||
          target.type !== MoveTargetType.Unit ||
          !source.hasAbility(Abilities.PackHunt)
        ) {
          return;
        }

        const marks = state.get(target.unit);

        if (marks == null) {
          return;
        }

        // The pack, not the hound itself: what it has bitten alone is
        // no easier for the next bite
        for (const hunter of marks) {
          if (hunter !== source && hunter.team === source.team) {
            event.power *= PACK_HUNT_SCALE;

            return;
          }
        }
      }),
      ...lifecycles,
    ]);
  }),

  // Zigzagoon: it never comes at anything straight, and the run only
  // counts while nothing has caught it
  createAbility(Abilities.CrookedRun, (battle) => {
    const { counter, lifecycles } = createUnitCounter(battle);

    return new MergedLifecycle([
      ...onUnitActs(battle, (unit) => {
        const steps = counter.get(unit);

        if (steps >= CROOKED_RUN_MAX_STACKS || !unit.hasAbility(Abilities.CrookedRun)) {
          return;
        }

        counter.set(unit, steps + 1);
        unit.triggerAbility(Abilities.CrookedRun);
      }),
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        if (
          event.success &&
          !(event.flags & DamageFlags.Indirect) &&
          event.target.hasAbility(Abilities.CrookedRun)
        ) {
          counter.clear(event.target);
        }
      }),
      battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, (event) => {
        const target = event.target;

        if (
          event.accuracy == null ||
          target.type !== MoveTargetType.Unit ||
          !target.unit.hasAbility(Abilities.CrookedRun)
        ) {
          return;
        }

        event.accuracy *= CROOKED_RUN_SCALE ** counter.get(target.unit);
      }),
      ...lifecycles,
    ]);
  }),

  // Wurmple: the shell it grows into, borrowed once in a fight. It
  // covers both sides of a blow, so hiding costs it the exchange
  createAbility(Abilities.Cocoon, (battle) => {
    const shelled = createTimedMarks(battle);
    const spent = new Set<Unit>();

    return new MergedLifecycle([
      ...shelled.lifecycles,
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const target = event.target;

        if (
          !event.success ||
          !target.alive ||
          spent.has(target) ||
          !target.hasAbility(Abilities.Cocoon) ||
          target.health >= target.checkStat(Stats.HP, 0) * COCOON_THRESHOLD
        ) {
          return;
        }

        spent.add(target);
        target.triggerAbility(Abilities.Cocoon);
        shelled.mark(target, COCOON_DURATION);
      }),
      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        const parent = event.parent;

        if (shelled.has(parent.target)) {
          event.value *= COCOON_SCALE;
        }

        if (shelled.has(parent.source)) {
          event.value *= COCOON_SCALE;
        }
      }),
    ]);
  }),

  // Lotad and Seedot: counterparts, each calling up its own sky and
  // paid by it, so the last one in owns the weather
  createGroveAbility(Abilities.WaterBloom, Weathers.Rain, isWeatherRainy, 'heals'),
  createGroveAbility(Abilities.SunRoot, Weathers.Sunny, isWeatherSunny, 'strikes'),

  // Taillow: the flock arrives already moving, and what a following
  // wind is worth is Tailwind's business
  createAbility(
    Abilities.MigrantsWind,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (!event.reactivation && event.source.hasAbility(Abilities.MigrantsWind)) {
            event.source.triggerAbility(Abilities.MigrantsWind);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.MigrantsWind) {
            event.source.triggerMove(
              Moves.Tailwind,
              { type: MoveTargetType.Team, team: event.source.team },
              0,
            );
          }
        }),
      ]),
  ),

  // Wingull: the gull takes its cut of whatever the far side is given,
  // and what it takes is exactly what they lose
  createAbility(Abilities.GullsGreed, (battle) =>
    battle.on(BattleEvents.UnitHeal, EventPriority.Pre, (event) => {
      const target = event.target;
      const cause = event.cause;

      if (
        event.value <= 0 ||
        (cause.type === EffectType.Ability && cause.ability === Abilities.GullsGreed)
      ) {
        return;
      }

      for (const gull of battle.units(target.team.alliance)) {
        if (!gull.alive || !gull.hasAbility(Abilities.GullsGreed)) {
          continue;
        }

        const taken = event.value * GULLS_GREED_SHARE;

        event.value -= taken;

        gull.triggerAbility(Abilities.GullsGreed);
        gull.heal(
          { type: EffectType.Ability, ability: Abilities.GullsGreed, unit: gull },
          gull,
          taken,
          0,
        );

        return;
      }
    }),
  ),

  // Ralts: it answers what its side is feeling, so the worse the fight
  // goes for the others the harder it hits
  createAbility(Abilities.Empath, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
      const source = event.parent.source;

      if (
        event.stat === Stats.SpecialAttack &&
        event.unit === source &&
        source.hasAbility(Abilities.Empath) &&
        allyIsHurt(battle, source)
      ) {
        event.value *= EMPATH_SCALE;
      }
    }),
  ),

  // Shroomish: the fungus feeds on whatever is already sick, whichever
  // side is carrying it
  createAbility(Abilities.Mycelium, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      if (
        fieldHasAbility(battle, Abilities.Mycelium) &&
        hasAnyStatus(event.parent.target, MAJOR_STATUS_CONDITIONS)
      ) {
        event.value *= MYCELIUM_SCALE;
      }
    }),
  ),

  // Slakoth: one enormous arm, so the rare swing reaches the whole far
  // side. The same widening Caterpie's powder gets
  createAbility(Abilities.WideSwing, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveTargeting, EventPriority.Post, (event) => {
      if (
        event.target === MoveTargets.Unit &&
        affectsFoesOnly(event.affects) &&
        getMoveData(event.move).category === MoveCategories.Physical &&
        event.source.hasAbility(Abilities.WideSwing)
      ) {
        event.target = MoveTargets.None;
      }
    }),
  ),

  // Nincada: it is back underground before the answer comes. The miss
  // is rolled rather than written into accuracy, since a falsy accuracy
  // means no check at all
  createAbility(Abilities.VanishingAct, (battle) => {
    const gone = createTimedMarks(battle);

    return new MergedLifecycle([
      ...gone.lifecycles,
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;

        if (
          event.success &&
          !(event.flags & MoveAttackFlags.Simulated) &&
          source.hasAbility(Abilities.VanishingAct)
        ) {
          source.triggerAbility(Abilities.VanishingAct);
          gone.mark(source, VANISHING_ACT_DURATION);
        }
      }),
      // Only what is aimed at it alone loses it: a move that covers the
      // whole side finds it whether it is hiding or not
      battle.on(BattleEvents.UnitTriggerMoveRollHit, EventPriority.Post, (event) => {
        const parent = event.parent;
        const target = parent.target;

        if (
          event.hit &&
          target.type === MoveTargetType.Unit &&
          isSingleTargetMove(parent.move) &&
          gone.has(target.unit)
        ) {
          event.hit = false;
        }
      }),
      // Nothing is worth aiming at it while it is gone, and the AI is
      // told rather than left to spend a cast finding out
      battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Post, (event) => {
        if (
          event.usable &&
          event.target.type === MoveTargetType.Unit &&
          isSingleTargetMove(event.move) &&
          gone.has(event.target.unit)
        ) {
          event.usable = false;
        }
      }),
    ]);
  }),

  // Whismur: the shout comes back off the walls. The echo is indirect,
  // so it neither crits nor carries whatever the move did
  createAbility(Abilities.EchoChamber, (battle) => {
    const damage = createDamageTaken(battle);
    const echoes: Echo[] = [];

    const clock = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
      for (const echo of echoes) {
        echo.remaining -= event.duration;
      }

      const due = echoes.filter((echo) => echo.remaining <= 0);

      for (const echo of due) {
        echoes.splice(echoes.indexOf(echo), 1);

        if (!echo.source.alive || !echo.target.alive) {
          continue;
        }

        echo.source.triggerAbility(Abilities.EchoChamber);
        echo.source.damage(
          { type: EffectType.Ability, ability: Abilities.EchoChamber, unit: echo.source },
          echo.target,
          echo.amount,
          DamageFlags.Indirect,
        );
      }

      if (echoes.length === 0) {
        clock.stop();
      }
    });

    clock.stop();

    return new MergedLifecycle([
      clock,
      ...damage.lifecycles,
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const taken = damage.taken(event);
        const cause = event.cause;

        if (
          !event.success ||
          taken == null ||
          taken <= 0 ||
          event.flags & DamageFlags.Indirect ||
          cause.type !== EffectType.Move ||
          !isSoundMove(cause.move) ||
          !cause.unit.hasAbility(Abilities.EchoChamber)
        ) {
          return;
        }

        echoes.push({
          source: cause.unit,
          target: event.target,
          amount: taken * ECHO_CHAMBER_FRACTION,
          remaining: ECHO_CHAMBER_DELAY,
        });
        clock.start();
      }),
    ]);
  }),

  // Makuhita: the palm that puts somebody off their feet. Only worth
  // anything against something already winding a move up, since a
  // flinch is what interrupts one
  createAbility(Abilities.Shove, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      const source = event.source;
      const target = event.target;

      if (
        !event.success ||
        !target.alive ||
        event.flags & MoveAttackFlags.Simulated ||
        (target.casting == null && target.channeling == null) ||
        !source.hasAbility(Abilities.Shove) ||
        !source.checkMoveContact(event.move, unitTarget(target))
      ) {
        return;
      }

      source.triggerAbility(Abilities.Shove);
      target.addStatus(Statuses.Flinched, {
        type: EffectType.Ability,
        ability: Abilities.Shove,
        unit: source,
      });
    }),
  ),

  // Nosepass: the nose pulls what is coming at its side onto itself.
  // Turned as the cast is aimed, which is where Follow Me turns one
  createAbility(Abilities.Magnetize, (battle) =>
    battle.on(BattleEvents.UnitCast, EventPriority.Post, (event) => {
      const caster = event.source;
      const target = event.target;

      if (target.type !== MoveTargetType.Unit || !isSingleTargetMove(event.move)) {
        return;
      }

      const aimed = target.unit;

      if (aimed.team.alliance === caster.team.alliance) {
        return;
      }

      for (const magnet of aimed.team.units) {
        if (magnet !== aimed && magnet.alive && magnet.hasAbility(Abilities.Magnetize)) {
          magnet.triggerAbility(Abilities.Magnetize);
          caster.updateCast({ target: { type: MoveTargetType.Unit, unit: magnet } });
          return;
        }
      }
    }),
  ),

  // Skitty: it plays fastest while nothing has caught it, so the first
  // hit it takes is what settles it down
  createAbility(Abilities.KittenPace, (battle) =>
    battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
      const source = event.source;

      if (
        event.stat === Stats.Speed &&
        source.hasAbility(Abilities.KittenPace) &&
        source.health >= source.checkStat(Stats.HP, 0)
      ) {
        event.value *= KITTEN_PACE_SCALE;
      }
    }),
  ),

  // Carvanha: every meal makes the school braver, whoever served it
  createAbility(Abilities.FeedingFrenzy, (battle) => {
    const { counter, lifecycles } = createUnitCounter(battle);

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        for (const shark of battle.units(event.source.team.alliance)) {
          const fed = counter.get(shark);

          if (
            fed >= FEEDING_FRENZY_MAX_STAGES ||
            !shark.alive ||
            !shark.hasAbility(Abilities.FeedingFrenzy)
          ) {
            continue;
          }

          counter.set(shark, fed + 1);
          shark.triggerAbility(Abilities.FeedingFrenzy);
          shark.addStage(Stages.Attack, 1, {
            type: EffectType.Ability,
            ability: Abilities.FeedingFrenzy,
            unit: shark,
          });
        }
      }),
      ...lifecycles,
    ]);
  }),

  // Wailmer: what it spouts goes over everything in front of it, the
  // same widening Caterpie's powder gets
  createAbility(Abilities.Spout, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveTargeting, EventPriority.Post, (event) => {
      if (
        event.target === MoveTargets.Unit &&
        affectsFoesOnly(event.affects) &&
        getMoveData(event.move).type === Types.Water &&
        event.source.hasAbility(Abilities.Spout)
      ) {
        event.target = MoveTargets.None;
      }
    }),
  ),

  // Numel: the hump goes off once the fight turns, and it goes off over
  // the whole far side
  createAbility(Abilities.MagmaVent, (battle) => {
    const spent = new Set<Unit>();

    return battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
      const target = event.target;

      if (
        !event.success ||
        !target.alive ||
        spent.has(target) ||
        !target.hasAbility(Abilities.MagmaVent) ||
        target.health >= target.checkStat(Stats.HP, 0) * MAGMA_VENT_THRESHOLD
      ) {
        return;
      }

      spent.add(target);
      target.triggerAbility(Abilities.MagmaVent);

      const cause = {
        type: EffectType.Ability,
        ability: Abilities.MagmaVent,
        unit: target,
      } as const;

      for (const enemy of battle.units(target.team.alliance)) {
        if (enemy.alive) {
          target.damage(
            cause,
            enemy,
            enemy.checkStat(Stats.HP, 0) * MAGMA_VENT_FRACTION,
            DamageFlags.Indirect,
          );
        }
      }
    });
  }),

  // Torkoal: the coal in the shell burns hotter under its own sun, and
  // Drought is in its pool to put one up
  createAbility(Abilities.BodyHeat, (battle) =>
    battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
      const source = event.source;

      if (
        (event.stat === Stats.Defense || event.stat === Stats.SpecialDefense) &&
        source.hasAbility(Abilities.BodyHeat) &&
        isWeatherSunny(source)
      ) {
        event.value *= BODY_HEAT_SCALE;
      }
    }),
  ),

  // Volbeat and Illumise: counterparts, each hanging its own aura over
  // the far side. Two knobs rather than one, so two listeners
  createAbility(Abilities.TailLight, (battle) =>
    battle.on(BattleEvents.CheckUnitStage, EventPriority.Post, (event) => {
      const source = event.source;

      if (event.stage !== Stages.Evasion || event.value <= 0) {
        return;
      }

      for (const firefly of battle.units(source.team.alliance)) {
        if (firefly.alive && firefly.hasAbility(Abilities.TailLight)) {
          event.value = 0;
          return;
        }
      }
    }),
  ),

  createAbility(Abilities.LureScent, (battle) =>
    battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
      const source = event.source;

      if (event.stat !== Stats.Speed) {
        return;
      }

      for (const firefly of battle.units(source.team.alliance)) {
        if (firefly.alive && firefly.hasAbility(Abilities.LureScent)) {
          event.value *= LURE_SCENT_SCALE;
          return;
        }
      }
    }),
  ),

  // Roselia: it flowers again out of nothing, once, and comes up clean
  createAbility(Abilities.Perennial, (battle) => {
    const spent = new Set<Unit>();

    return battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
      const target = event.target;

      if (
        !event.success ||
        !target.alive ||
        spent.has(target) ||
        !target.hasAbility(Abilities.Perennial) ||
        target.health >= target.checkStat(Stats.HP, 0) * PERENNIAL_THRESHOLD
      ) {
        return;
      }

      spent.add(target);
      target.triggerAbility(Abilities.Perennial);

      const cause = {
        type: EffectType.Ability,
        ability: Abilities.Perennial,
        unit: target,
      } as const;

      target.heal(cause, target, target.checkStat(Stats.HP, 0) * PERENNIAL_HEAL_FRACTION, 0);
      target.cure(cause);
    });
  }),

  // Gulpin: anybody's spent item is a meal, since the stomach does not
  // ask whose it was
  createAbility(Abilities.Bottomless, (battle) =>
    battle.on(BattleEvents.UnitRemoveItem, EventPriority.Post, (event) => {
      const cause = event.cause;

      // Spent rather than knocked away: a consumed item carries its own
      // item cause, which nothing else that takes one does
      if (cause.type !== EffectType.Item || cause.item !== event.item) {
        return;
      }

      for (const stomach of battle.units()) {
        if (stomach.alive && stomach.hasAbility(Abilities.Bottomless)) {
          stomach.triggerAbility(Abilities.Bottomless);
          stomach.heal(
            { type: EffectType.Ability, ability: Abilities.Bottomless, unit: stomach },
            stomach,
            stomach.checkStat(Stats.HP, 0) * BOTTOMLESS_FRACTION,
            0,
          );
        }
      }
    }),
  ),

  // Aron: steel, rock and earth are what the line eats, so a blow of
  // one feeds it rather than hurting it
  createAbility(Abilities.OreHunger, (battle) =>
    battle.on(BattleEvents.CheckUnitCanDamage, EventPriority.Post, (event) => {
      const cause = event.cause;
      const target = event.target;

      if (
        !event.success ||
        event.flags & DamageFlags.Indirect ||
        cause.type !== EffectType.Move ||
        cause.unit === target ||
        !target.hasAbility(Abilities.OreHunger) ||
        !ORE_TYPES.has(cause.unit.checkMoveType(cause.move, unitTarget(target)))
      ) {
        return;
      }

      const fed = event.value * ORE_HUNGER_FRACTION;

      event.success = false;

      // The meal is worked out of the blow that was refused, so it has
      // to be read here rather than off a later trigger
      target.triggerAbility(Abilities.OreHunger);
      target.heal(
        { type: EffectType.Ability, ability: Abilities.OreHunger, unit: target },
        target,
        fed,
        0,
      );
    }),
  ),

  // Meditite: the line meditates through the blow, so what lands on it
  // while it is holding a move together barely reaches it
  createAbility(Abilities.MindOverBody, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const target = event.parent.target;

      if (
        target.hasAbility(Abilities.MindOverBody) &&
        (target.casting != null || target.channeling != null)
      ) {
        event.value *= MIND_OVER_BODY_SCALE;
      }
    }),
  ),

  // Electrike: the first thing it does in a fight is the fast thing.
  // Counted by actions, so the jolt covers the move it goes off on and
  // nothing after it
  createAbility(Abilities.JoltStart, (battle) => {
    const { counter, lifecycles } = createUnitCounter(battle);

    return new MergedLifecycle([
      ...onUnitActs(battle, (unit) => {
        if (unit.hasAbility(Abilities.JoltStart) && counter.get(unit) <= 1) {
          counter.set(unit, counter.get(unit) + 1);

          if (counter.get(unit) === 1) {
            unit.triggerAbility(Abilities.JoltStart);
          }
        }
      }),
      battle.on(BattleEvents.CheckUnitMovePriority, EventPriority.Post, (event) => {
        if (event.source.hasAbility(Abilities.JoltStart) && counter.get(event.source) === 0) {
          event.priority += 1;
        }
      }),
      battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
        if (
          event.power != null &&
          event.source.hasAbility(Abilities.JoltStart) &&
          counter.get(event.source) <= 1
        ) {
          event.power *= JOLT_START_SCALE;
        }
      }),
      ...lifecycles,
    ]);
  }),

  // Plusle and Minun: counterparts shouting at opposite ends of the
  // field, one lifting its own side and one dragging the other down
  createCheerAbility(Abilities.CheerOn, 'cheers'),
  createCheerAbility(Abilities.JeerAt, 'jeers'),

  // Sableye and Mawile: counterparts working the same knob, one knocking
  // a raised stage off and the other keeping it
  createDeceiverAbility(Abilities.ShadowTax, 'strips'),
  createDeceiverAbility(Abilities.JawClaim, 'steals'),

  // Surskit: it stands on the water rather than in it, so what settles
  // on the ground and what falls out of the sky both pass it by
  createAbility(Abilities.SurfaceWalk, (battle) =>
    battle.on(BattleEvents.CheckUnitCanDamage, EventPriority.Post, (event) => {
      const cause = event.cause;
      const laid = cause.type === EffectType.Move && HAZARD_MOVES.has(cause.move);

      if (
        event.success &&
        (laid || cause.type === EffectType.Weather) &&
        event.target.hasAbility(Abilities.SurfaceWalk)
      ) {
        event.target.triggerAbility(Abilities.SurfaceWalk);
        event.success = false;
      }
    }),
  ),
];

export default treeckoToTorkoal;
