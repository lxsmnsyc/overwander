import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages, Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags, MoveAttackFlags } from '../../../data/ids/moves';
import { Types } from '../../../data/constants/types';
import { Items } from '../../../data/ids/items';
import { Statuses, Weathers } from '../../../data/ids/status';
import { FORCED_SWITCH_MOVES } from '../../moves/switch-out';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { MAJOR_STATUS_CONDITIONS } from '../../status';
import { countHeldItems, hasAnyStatus, hasFreeItemSlot, onUnitActs, unitTarget } from '../../utils';
import { createAbility } from '../__create';
import {
  STAT_STAGES,
  createDamageTaken,
  createEclipseAbility,
  createEonAbility,
  createFeudAbility,
  createFossilPairAbility,
  createPrimalAbility,
  createSealedAbility,
  createStatExtremes,
  createUnitCounter,
  createUnitState,
} from './__create';

/** The share of a blow the springs keep, and how much they hold */
export const STORED_BOUNCE_SHARE = 1 / 2;
export const STORED_BOUNCE_CAP = 1 / 2;

/** What a fresh set of spots is worth, and what it costs */
export const UNIQUE_SPOTS_RAISED = 2;
export const UNIQUE_SPOTS_LOWERED = 1;

/** The five a set of spots is rolled over */
const SPOTTED_STAGES = [
  Stages.Attack,
  Stages.Defense,
  Stages.SpecialAttack,
  Stages.SpecialDefense,
  Stages.Speed,
];

/** What walking into the pit costs whoever missed */
export const ANTLION_PIT_FRACTION = 1 / 8;

/** How many times a wish-granter must act, and what the wish is worth */
export const SEVEN_WISHES_COUNT = 7;
export const SEVEN_WISHES_FRACTION = 1 / 4;

/** How often a rearranging body drifts further into its own shape */
export const FORM_DRIFT_INTERVAL = 6000;

/** What half a heart is worth to the other one */
export const SHARED_HEART_SHARE = 1 / 2;

/** What a skull-first charge is worth, and what it costs */
export const SKULL_CHARGE_SCALE = 1.4;
export const SKULL_CHARGE_RECOIL = 1 / 8;

/** What each of the others is worth to a hive, and how many count */
export const HIVE_MIND_STEP = 0.1;
export const HIVE_MIND_MAX_ALLIES = 3;

/** How often a touch of frost takes hold */
export const COLD_SNAP_CHANCE = 0.2;

/** What a round of applause is worth */
export const APPLAUSE_FRACTION = 1 / 16;

/** What the pearl is worth while it is still in the shell */
export const PEARL_GUARD_SCALE = 1.5;

/** What the ferryman takes for a passenger */
export const SOUL_HARVEST_FRACTION = 1 / 4;

/** How often the fruit comes in */
export const FRUIT_CROP_INTERVAL = 8000;

/** What a ringing head does to the far side's wind-ups */
export const RINGING_HEAD_SCALE = 1.25;

/** What a marked target's next blow is worth, and how long the mark waits */
export const DOOM_MARK_SCALE = 1.3;
export const DOOM_MARK_DURATION = 4000;

/** What a scarred fish's own venom is worth to it */
export const SCARRED_BEAUTY_SCALE = 1.4;

/** How long it must stand still to disappear, and how well it hides */
export const BLEND_IN_DELAY = 2000;
export const BLEND_IN_SCALE = 0.5;

/** What any sky at all is worth to something built out of one */
export const WEATHER_WORN_DEALT_SCALE = 1.3;
export const WEATHER_WORN_TAKEN_SCALE = 0.85;

/** What each stage the target has lost is worth, and how many count */
export const MALICE_POOL_STEP = 0.1;
export const MALICE_POOL_MAX_STAGES = 5;

/** The seven a pool of malice is counted over */
const MALICE_STAGES = [
  Stages.Attack,
  Stages.Defense,
  Stages.SpecialAttack,
  Stages.SpecialDefense,
  Stages.Speed,
  Stages.Accuracy,
  Stages.Evasion,
];

/** What a bed of silt takes off everything standing in it */
export const SILT_BED_SCALE = 0.9;

/** What an untouched target is worth to a fighter with no manners */
export const DIRTY_FIGHTER_SCALE = 1.3;

/** What each second of waiting is worth, and how long the wait counts */
export const PATIENT_STALK_STEP = 0.1;
export const PATIENT_STALK_MAX_STEPS = 5;
export const PATIENT_STALK_SECOND = 1000;

const spoinkToDeoxys = [
  // Spoink: the springs keep half of whatever lands on it, and the next
  // blow it lands gives the lot back
  createAbility(Abilities.StoredBounce, (battle) => {
    const damage = createDamageTaken(battle);
    const { state, lifecycles } = createUnitState<number>(battle);

    return new MergedLifecycle([
      ...damage.lifecycles,
      ...lifecycles,
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const taken = damage.taken(event);
        const target = event.target;

        if (
          !event.success ||
          taken == null ||
          taken <= 0 ||
          event.flags & DamageFlags.Indirect ||
          !target.alive ||
          !target.hasAbility(Abilities.StoredBounce)
        ) {
          return;
        }

        const held = (state.get(target) ?? 0) + taken * STORED_BOUNCE_SHARE;

        state.set(target, Math.min(target.checkStat(Stats.HP, 0) * STORED_BOUNCE_CAP, held));
      }),
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;
        const held = state.get(source);

        if (
          !event.success ||
          !event.target.alive ||
          event.flags & MoveAttackFlags.Simulated ||
          held == null ||
          held <= 0 ||
          !source.hasAbility(Abilities.StoredBounce)
        ) {
          return;
        }

        state.set(source, 0);
        source.triggerAbility(Abilities.StoredBounce);

        source.damage(
          { type: EffectType.Ability, ability: Abilities.StoredBounce, unit: source },
          event.target,
          held,
          DamageFlags.Indirect,
        );
      }),
    ]);
  }),

  // Spinda: no two of them are marked the same, so each arrival rolls
  // its own pair of spots
  createAbility(Abilities.UniqueSpots, (battle) =>
    battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
      const source = event.source;

      if (event.reactivation || !source.hasAbility(Abilities.UniqueSpots)) {
        return;
      }

      const raised = SPOTTED_STAGES[Math.floor(battle.random() * SPOTTED_STAGES.length)];
      const others = SPOTTED_STAGES.filter((stage) => stage !== raised);
      const lowered = others[Math.floor(battle.random() * others.length)];
      const cause = {
        type: EffectType.Ability,
        ability: Abilities.UniqueSpots,
        unit: source,
      } as const;

      source.triggerAbility(Abilities.UniqueSpots);
      source.addStage(raised, UNIQUE_SPOTS_RAISED, cause);
      source.addStage(lowered, -UNIQUE_SPOTS_LOWERED, cause);
    }),
  ),

  // Trapinch: the pit is the point. Whatever swings at it and misses
  // has already fallen in
  createAbility(Abilities.AntlionPit, (battle) =>
    battle.on(BattleEvents.UnitTriggerMoveRollHit, EventPriority.Post, (event) => {
      const parent = event.parent;
      const target = parent.target;

      if (
        event.hit ||
        target.type !== MoveTargetType.Unit ||
        parent.source === target.unit ||
        !target.unit.hasAbility(Abilities.AntlionPit)
      ) {
        return;
      }

      const pit = target.unit;

      pit.triggerAbility(Abilities.AntlionPit);
      pit.damage(
        { type: EffectType.Ability, ability: Abilities.AntlionPit, unit: pit },
        parent.source,
        parent.source.checkStat(Stats.HP, 0) * ANTLION_PIT_FRACTION,
        DamageFlags.Indirect,
      );
    }),
  ),

  // Cacnea: it waits for whatever it is following to tire, and the
  // whole wait goes into one blow
  createAbility(Abilities.PatientStalk, (battle) => {
    const { state, lifecycles } = createUnitState<{ steps: number; waited: number }>(battle);

    function held(unit: Unit): number {
      return state.get(unit)?.steps ?? 0;
    }

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
        for (const unit of battle.units()) {
          if (!unit.alive || !unit.hasAbility(Abilities.PatientStalk)) {
            continue;
          }

          if (unit.casting != null || unit.channeling != null) {
            continue;
          }

          const kept = state.get(unit) ?? { steps: 0, waited: 0 };
          const waited = kept.waited + event.duration;

          state.set(unit, {
            steps: Math.min(
              PATIENT_STALK_MAX_STEPS,
              kept.steps + Math.floor(waited / PATIENT_STALK_SECOND),
            ),
            waited: waited % PATIENT_STALK_SECOND,
          });
        }
      }),
      battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
        const source = event.source;

        if (event.power != null && source.hasAbility(Abilities.PatientStalk)) {
          event.power *= 1 + PATIENT_STALK_STEP * held(source);
        }
      }),
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;

        if (
          event.success &&
          !(event.flags & MoveAttackFlags.Simulated) &&
          held(source) > 0 &&
          source.hasAbility(Abilities.PatientStalk)
        ) {
          source.triggerAbility(Abilities.PatientStalk);
          state.set(source, { steps: 0, waited: 0 });
        }
      }),
    ]);
  }),

  // Swablu: the cotton takes the first thing thrown at it and nothing
  // reaches the bird under it
  createAbility(Abilities.CloudStep, (battle) => {
    const spent = new Set<Unit>();

    return battle.on(BattleEvents.CheckUnitCanDamage, EventPriority.Post, (event) => {
      const cause = event.cause;
      const target = event.target;

      if (
        !event.success ||
        event.flags & DamageFlags.Indirect ||
        cause.type !== EffectType.Move ||
        cause.unit === target ||
        spent.has(target) ||
        !target.hasAbility(Abilities.CloudStep)
      ) {
        return;
      }

      spent.add(target);
      target.triggerAbility(Abilities.CloudStep);
      event.success = false;
    });
  }),

  // Luvdisc: the pair feels the same things, so what is done for one
  // reaches the other. Its own gift is skipped, or two of them would
  // pass one heal back and forth
  createAbility(Abilities.SharedHeart, (battle) =>
    battle.on(BattleEvents.UnitHeal, EventPriority.Post, (event) => {
      const target = event.target;
      const cause = event.cause;

      if (
        event.value <= 0 ||
        (cause.type === EffectType.Ability && cause.ability === Abilities.SharedHeart)
      ) {
        return;
      }

      for (const heart of battle.units()) {
        if (
          heart === target ||
          !heart.alive ||
          heart.team.alliance !== target.team.alliance ||
          !heart.hasAbility(Abilities.SharedHeart)
        ) {
          continue;
        }

        heart.triggerAbility(Abilities.SharedHeart);
        heart.heal(
          { type: EffectType.Ability, ability: Abilities.SharedHeart, unit: heart },
          heart,
          event.value * SHARED_HEART_SHARE,
          0,
        );
      }
    }),
  ),

  // Bagon: it goes head first off the cliff, and Rock Head only ever
  // answered for what a move's own recoil does
  createAbility(Abilities.SkullCharge, (battle) => {
    const damage = createDamageTaken(battle);

    return new MergedLifecycle([
      ...damage.lifecycles,
      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        const parent = event.parent;

        if (
          parent.source.hasAbility(Abilities.SkullCharge) &&
          parent.source.checkMoveContact(parent.move, unitTarget(parent.target))
        ) {
          event.value *= SKULL_CHARGE_SCALE;
        }
      }),
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const taken = damage.taken(event);
        const cause = event.cause;

        if (
          !event.success ||
          taken == null ||
          taken <= 0 ||
          event.flags & DamageFlags.Indirect ||
          cause.type !== EffectType.Move ||
          cause.unit === event.target ||
          !cause.unit.alive ||
          !cause.unit.hasAbility(Abilities.SkullCharge) ||
          !cause.unit.checkMoveContact(cause.move, unitTarget(event.target))
        ) {
          return;
        }

        const charger = cause.unit;

        charger.triggerAbility(Abilities.SkullCharge);
        charger.damage(
          { type: EffectType.Ability, ability: Abilities.SkullCharge, unit: charger },
          charger,
          taken * SKULL_CHARGE_RECOIL,
          DamageFlags.Indirect,
        );
      }),
    ]);
  }),

  // Beldum: the line thinks with whatever is standing beside it, and
  // one of them alone is only one brain
  createAbility(Abilities.HiveMind, (battle) =>
    battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      const source = event.source;

      if (event.power == null || !source.hasAbility(Abilities.HiveMind)) {
        return;
      }

      let hive = 0;

      for (const unit of battle.units()) {
        if (unit !== source && unit.alive && unit.team.alliance === source.team.alliance) {
          hive += 1;
        }
      }

      event.power *= 1 + HIVE_MIND_STEP * Math.min(HIVE_MIND_MAX_ALLIES, hive);
    }),
  ),

  // The weather trio: each holds back until the fight turns, and what
  // wakes then stays awake
  createPrimalAbility(Abilities.PrimalSea, Stages.SpecialAttack, Types.Water),
  createPrimalAbility(Abilities.PrimalLand, Stages.Attack, Types.Ground),
  createPrimalAbility(Abilities.PrimalSky, Stages.SpecialAttack, Types.Dragon),

  // Jirachi: it counts what it is asked for, and grants the lot on the
  // seventh, its own side included
  createAbility(Abilities.SevenWishes, (battle) => {
    const { counter, lifecycles } = createUnitCounter(battle);

    return new MergedLifecycle([
      ...onUnitActs(battle, (unit) => {
        if (!unit.hasAbility(Abilities.SevenWishes)) {
          return;
        }

        const asked = counter.get(unit) + 1;

        if (asked < SEVEN_WISHES_COUNT) {
          counter.set(unit, asked);
          return;
        }

        counter.set(unit, 0);
        unit.triggerAbility(Abilities.SevenWishes);

        const cause = {
          type: EffectType.Ability,
          ability: Abilities.SevenWishes,
          unit,
        } as const;

        for (const ally of battle.units()) {
          if (ally.alive && ally.team.alliance === unit.team.alliance) {
            unit.heal(cause, ally, ally.checkStat(Stats.HP, 0) * SEVEN_WISHES_FRACTION, 0);
          }
        }

        // The cure is the wish it keeps for itself: a side-wide Heal
        // Bell every seven actions was more than anything could answer
        unit.cure(cause);
      }),
      ...lifecycles,
    ]);
  }),

  // Deoxys: the body keeps rearranging itself toward whatever shape it
  // is already in, taking what it needs off whatever it uses least
  createAbility(Abilities.FormDrift, (battle) => {
    const stats = createStatExtremes();

    let waited = 0;

    return battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
      waited += event.duration;

      if (waited < FORM_DRIFT_INTERVAL || stats.measuring()) {
        return;
      }

      waited = 0;

      for (const unit of battle.units()) {
        if (!unit.alive || !unit.hasAbility(Abilities.FormDrift)) {
          continue;
        }

        const { highest, lowest } = stats.extremes(unit);
        const raised = STAT_STAGES[highest];
        const lowered = STAT_STAGES[lowest];
        const cause = {
          type: EffectType.Ability,
          ability: Abilities.FormDrift,
          unit,
        } as const;

        unit.triggerAbility(Abilities.FormDrift);

        // Explicit null checks: the first Stages enum member is 0
        if (raised != null) {
          unit.addStage(raised, 1, cause);
        }
        if (lowered != null) {
          unit.addStage(lowered, -1, cause);
        }
      }
    });
  }),

  // The three Regis: each stands sealed for its first seconds and then
  // wakes for good, two stages up in the stat it was built around
  createSealedAbility(Abilities.StoneSeal, Stages.Defense),
  createSealedAbility(Abilities.FrostSeal, Stages.SpecialDefense),
  createSealedAbility(Abilities.IronSeal, Stages.Attack),

  // Latias and Latios: counterparts, one flying over its side and one
  // flying through whatever the far side put up
  createEonAbility(Abilities.EonShield, 'shields'),
  createEonAbility(Abilities.EonLance, 'pierces'),

  // Snorunt: the cold takes hold of whatever touches it, sometimes
  createAbility(Abilities.ColdSnap, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      const source = event.source;
      const target = event.target;

      if (
        !event.success ||
        !source.alive ||
        event.flags & MoveAttackFlags.Simulated ||
        !target.hasAbility(Abilities.ColdSnap) ||
        !source.checkMoveContact(event.move, unitTarget(target)) ||
        battle.random() > COLD_SNAP_CHANCE
      ) {
        return;
      }

      target.triggerAbility(Abilities.ColdSnap);
      source.addStatus(Statuses.Frozen, {
        type: EffectType.Ability,
        ability: Abilities.ColdSnap,
        unit: target,
      });
    }),
  ),

  // Spheal: it claps for everybody else's work, and the clapping is
  // what does it good
  createAbility(Abilities.Applause, (battle) =>
    battle.on(BattleEvents.UnitTriggerMoveRollHit, EventPriority.Post, (event) => {
      const source = event.parent.source;

      if (!event.hit) {
        return;
      }

      for (const seal of battle.units()) {
        if (
          seal === source ||
          !seal.alive ||
          seal.team.alliance !== source.team.alliance ||
          !seal.hasAbility(Abilities.Applause)
        ) {
          continue;
        }

        seal.triggerAbility(Abilities.Applause);
        seal.heal(
          { type: EffectType.Ability, ability: Abilities.Applause, unit: seal },
          seal,
          seal.checkStat(Stats.HP, 0) * APPLAUSE_FRACTION,
          0,
        );
      }
    }),
  ),

  // Clamperl: the pearl is what the shell is worth, and an empty shell
  // is worth nothing
  createAbility(Abilities.PearlGuard, (battle) =>
    battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
      const source = event.source;

      if (
        (event.stat === Stats.SpecialAttack || event.stat === Stats.SpecialDefense) &&
        source.hasAbility(Abilities.PearlGuard) &&
        countHeldItems(source) > 0
      ) {
        event.value *= PEARL_GUARD_SCALE;
      }
    }),
  ),

  // Relicanth: a hundred million years of nothing changing, so the type
  // chart has nothing to say about it either way
  createAbility(
    Abilities.Unchanged,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitAttackResolveEffectiveness, EventPriority.Post, (event) => {
          if (event.parent.target.hasAbility(Abilities.Unchanged)) {
            event.multiplier = 1;
          }
        }),
        battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
          if (
            event.immune &&
            event.target.type === MoveTargetType.Unit &&
            event.target.unit.hasAbility(Abilities.Unchanged)
          ) {
            event.immune = false;
          }
        }),
      ]),
  ),

  // Duskull: the line ferries whatever falls, whichever side it fell on
  createAbility(Abilities.SoulHarvest, (battle) =>
    battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
      for (const reaper of battle.units()) {
        if (reaper === event.source || !reaper.alive || !reaper.hasAbility(Abilities.SoulHarvest)) {
          continue;
        }

        reaper.triggerAbility(Abilities.SoulHarvest);
        reaper.heal(
          { type: EffectType.Ability, ability: Abilities.SoulHarvest, unit: reaper },
          reaper,
          reaper.checkStat(Stats.HP, 0) * SOUL_HARVEST_FRACTION,
          0,
        );
      }
    }),
  ),

  // Tropius: the fruit comes in on its own clock, and there is nowhere
  // to put it while its hands are full
  createAbility(Abilities.FruitCrop, (battle) => {
    let waited = 0;

    return battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
      waited += event.duration;

      if (waited < FRUIT_CROP_INTERVAL) {
        return;
      }

      waited = 0;

      for (const tree of battle.units()) {
        if (tree.alive && tree.hasAbility(Abilities.FruitCrop) && hasFreeItemSlot(tree)) {
          tree.triggerAbility(Abilities.FruitCrop);
          tree.addItem(Items.SitrusBerry);
        }
      }
    });
  }),

  // Chimecho: the note hangs over the far side and everything they
  // wind up takes longer through it. Cast time only, never a cooldown
  createAbility(Abilities.RingingHead, (battle) => {
    function ringing(unit: Unit): boolean {
      for (const chime of battle.units(unit.team.alliance)) {
        if (chime.alive && chime.hasAbility(Abilities.RingingHead)) {
          return true;
        }
      }

      return false;
    }

    return new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, (event) => {
        if (ringing(event.source)) {
          event.duration *= RINGING_HEAD_SCALE;
        }
      }),
      battle.on(BattleEvents.CheckUnitMoveChannelTime, EventPriority.Post, (event) => {
        if (ringing(event.source)) {
          event.duration *= RINGING_HEAD_SCALE;
        }
      }),
    ]);
  }),

  // Absol: what it reads is coming for somebody, and the next thing to
  // land is what it was reading. Set after its own blow resolves, so
  // the blow that marks is never the blow that spends the mark
  createAbility(Abilities.DoomMark, (battle) => {
    const marks = new Map<Unit, number>();

    const clock = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
      for (const [unit, left] of marks) {
        const next = left - event.duration;

        if (next <= 0) {
          marks.delete(unit);
        } else {
          marks.set(unit, next);
        }
      }

      if (marks.size === 0) {
        clock.stop();
      }
    });

    clock.stop();

    return new MergedLifecycle([
      clock,
      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        const target = event.parent.target;

        if (marks.has(target)) {
          marks.delete(target);
          event.value *= DOOM_MARK_SCALE;
        }
      }),
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;

        if (
          event.success &&
          event.target.alive &&
          !(event.flags & MoveAttackFlags.Simulated) &&
          source.hasAbility(Abilities.DoomMark)
        ) {
          source.triggerAbility(Abilities.DoomMark);
          marks.set(event.target, DOOM_MARK_DURATION);
          clock.start();
        }
      }),
    ]);
  }),

  // Feebas: what it is carrying is what it grew out of, so the scars
  // feed the same half of it that Marvel Scale guards
  createAbility(Abilities.ScarredBeauty, (battle) =>
    battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
      const source = event.source;

      if (
        event.stat === Stats.SpecialAttack &&
        source.hasAbility(Abilities.ScarredBeauty) &&
        hasAnyStatus(source, MAJOR_STATUS_CONDITIONS)
      ) {
        event.value *= SCARRED_BEAUTY_SCALE;
      }
    }),
  ),

  // Castform: it is made out of whatever sky is up, so any sky at all
  // suits it and a clear one leaves it as it was
  createAbility(Abilities.WeatherWorn, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const parent = event.parent;

      if (
        parent.source.hasAbility(Abilities.WeatherWorn) &&
        parent.source.checkWeather() !== Weathers.None
      ) {
        event.value *= WEATHER_WORN_DEALT_SCALE;
      }

      if (
        parent.target.hasAbility(Abilities.WeatherWorn) &&
        parent.target.checkWeather() !== Weathers.None
      ) {
        event.value *= WEATHER_WORN_TAKEN_SCALE;
      }
    }),
  ),

  // Kecleon: standing still is what hides it, and the moment it reaches
  // for a move the colours give it away again
  createAbility(Abilities.BlendIn, (battle) => {
    const { state, lifecycles } = createUnitState<number>(battle);

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
        for (const unit of battle.units()) {
          if (!unit.alive || !unit.hasAbility(Abilities.BlendIn)) {
            continue;
          }

          if (unit.casting != null || unit.channeling != null) {
            state.set(unit, 0);
            continue;
          }

          state.set(unit, (state.get(unit) ?? 0) + event.duration);
        }
      }),
      // Reaching for a move gives it away before the wind-up even starts
      ...onUnitActs(battle, (unit) => {
        if (unit.hasAbility(Abilities.BlendIn)) {
          state.set(unit, 0);
        }
      }),
      battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, (event) => {
        const target = event.target;

        if (
          event.accuracy == null ||
          target.type !== MoveTargetType.Unit ||
          !target.unit.hasAbility(Abilities.BlendIn) ||
          (state.get(target.unit) ?? 0) < BLEND_IN_DELAY
        ) {
          return;
        }

        event.accuracy *= BLEND_IN_SCALE;
      }),
    ]);
  }),

  // Shuppet: it feeds on whatever has been done to the thing in front
  // of it, so a well-worked target is what it hits hardest
  createAbility(Abilities.MalicePool, (battle) =>
    battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      const target = event.target;

      if (
        event.power == null ||
        target.type !== MoveTargetType.Unit ||
        !event.source.hasAbility(Abilities.MalicePool)
      ) {
        return;
      }

      let lost = 0;

      for (const stage of MALICE_STAGES) {
        const held = target.unit.stages[stage];

        if (held < 0) {
          lost -= held;
        }
      }

      event.power *= 1 + MALICE_POOL_STEP * Math.min(MALICE_POOL_MAX_STAGES, lost);
    }),
  ),

  // Barboach: the silt it stirs up is under everybody's feet, its own
  // included, and anything not standing on the ground is above it
  createAbility(Abilities.SiltBed, (battle) =>
    battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
      const source = event.source;

      if (event.stat !== Stats.Speed || !source.checkGrounded()) {
        return;
      }

      for (const fish of battle.units()) {
        if (fish.alive && fish.hasAbility(Abilities.SiltBed)) {
          event.value *= SILT_BED_SCALE;
          return;
        }
      }
    }),
  ),

  // Corphish: it picks on whatever has not been touched yet, which is
  // the opposite end of the fight from Houndour's chase
  createAbility(Abilities.DirtyFighter, (battle) =>
    battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      const target = event.target;

      if (
        event.power == null ||
        target.type !== MoveTargetType.Unit ||
        !event.source.hasAbility(Abilities.DirtyFighter) ||
        target.unit.health < target.unit.checkStat(Stats.HP, 0)
      ) {
        return;
      }

      event.power *= DIRTY_FIGHTER_SCALE;
    }),
  ),

  // Baltoy: it spins on one point and nothing tips it off that point
  createAbility(
    Abilities.SpinBalance,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Post, (event) => {
          if (
            !event.immune &&
            event.status === Statuses.Flinched &&
            event.source.hasAbility(Abilities.SpinBalance)
          ) {
            event.immune = true;
          }
        }),
        battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
          if (
            !event.immune &&
            FORCED_SWITCH_MOVES.has(event.move) &&
            event.target.type === MoveTargetType.Unit &&
            event.target.unit.hasAbility(Abilities.SpinBalance)
          ) {
            event.immune = true;
          }
        }),
        battle.on(BattleEvents.CheckUnitCanAddStage, EventPriority.Post, (event) => {
          if (event.success && event.value < 0 && event.source.hasAbility(Abilities.SpinBalance)) {
            event.success = false;

            // A cue is for a real attempt, not for the AI weighing one
            if (!event.simulated) {
              event.source.triggerAbility(Abilities.SpinBalance);
            }
          }
        }),
      ]),
  ),

  // Lileep and Anorith: Hoenn's two fossils, one pinning what it
  // touches and one running down whatever cannot keep up
  createFossilPairAbility(Abilities.RootHold, 'anchors'),
  createFossilPairAbility(Abilities.ClawRush, 'chases'),

  // Zangoose and Seviper: counterparts feuding over the venom, one
  // working it deeper and one hunting whatever carries it
  createFeudAbility(Abilities.FeudClaws, 'punishes'),
  createFeudAbility(Abilities.DeepeningVenom, 'deepens'),

  // Lunatone and Solrock: counterparts whose auras blot each other out,
  // since two stones in the sky at once is an eclipse
  createEclipseAbility(Abilities.MoonPull, Abilities.SunGlare, 'allies'),
  createEclipseAbility(Abilities.SunGlare, Abilities.MoonPull, 'enemies'),
];

export default spoinkToDeoxys;
