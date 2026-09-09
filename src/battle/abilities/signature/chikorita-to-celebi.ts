import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages, Stats } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { Items } from '../../../data/ids/items';
import { TeamStatuses } from '../../../data/ids/status';
import {
  DamageFlags,
  MoveAttackFlags,
  MoveFlags,
  MoveTargets,
  Moves,
  StatFlags,
  affectsFoesOnly,
} from '../../../data/ids/moves';
import { getMoveData } from '../../../data/moves';
import type Battle from '../../core';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { PASSED_STAGES } from '../../moves/switch-out';
import type Unit from '../../unit';
import { hasFreeItemSlot, isWeatherSandstorm, onUnitActs, unitTarget } from '../../utils';
import { createAbility } from '../__create';
import {
  BATTLE_STATS,
  createStatAverage,
  createUnitCounter,
  createUnitState,
  enemyHolder,
  isChannelledMove,
} from './__create';

/** What the bed of petals gives an ally each time it moves */
export const PETAL_BED_FRACTION = 1 / 16;

/** What holding a move down is worth */
export const SUNLIT_CHARGE_SCALE = 1.3;

/** How far down misery goes looking for company */
export const SHARED_MISERY_THRESHOLD = 1 / 3;

/** What share of a hit is banked to be given back */
export const BACKLASH_SHARE = 1 / 4;

/** What riding the storm is worth to whatever is aimed at it */
export const SAND_RIDER_SCALE = 0.75;

/** What a target that has already been cowed is worth */
export const BULLY_SCALE = 1.3;

/** What a paw licked clean between blows gives back */
export const SWEET_PAW_SHARE = 1 / 8;

/** What standing near molten ground costs, each time an enemy moves */
export const MAGMA_TRAIL_FRACTION = 1 / 16;

/** What a wing spread over somebody is worth to them */
export const ESCORT_SCALE = 1.3;

/** What each landed blow adds to the roll, and how far it builds */
export const MOMENTUM_STEP = 0.1;
export const MOMENTUM_MAX_STACKS = 5;

/** What a head full of antlers is worth against somebody thinking */
export const MIND_FOG_SCALE = 0.85;

/** The screens a pair of tusks goes through */
const SCREENS = [TeamStatuses.Reflect, TeamStatuses.LightScreen];

/** The other end an attacking stat has, for a pokemon that swings with both */
const OTHER_ATTACK_STAT: { [key in Stats]?: Stats } = {
  [Stats.Attack]: Stats.SpecialAttack,
  [Stats.SpecialAttack]: Stats.Attack,
};

/** The hurt ally with the least health left, as a share of its own */
function neediestAlly(battle: Battle, unit: Unit): Unit | undefined {
  let found: Unit | undefined;
  let lowest = 1;

  for (const ally of battle.units()) {
    if (ally === unit || !ally.alive || ally.team.alliance !== unit.team.alliance) {
      continue;
    }

    const share = ally.health / ally.checkStat(Stats.HP, 0);

    if (share < lowest) {
      found = ally;
      lowest = share;
    }
  }

  return found;
}

/** The standing enemy with the most health left */
function healthiestEnemy(battle: Battle, unit: Unit): Unit | undefined {
  let best: Unit | undefined;

  for (const enemy of battle.units(unit.team.alliance)) {
    if (enemy.alive && (best == null || enemy.health > best.health)) {
      best = enemy;
    }
  }

  return best;
}

/** The first enemy still standing, for an ability that casts at one */
function firstEnemy(battle: Battle, unit: Unit): Unit | undefined {
  for (const enemy of battle.units(unit.team.alliance)) {
    if (enemy.alive) {
      return enemy;
    }
  }

  return undefined;
}

/** A standing holder on this unit's side other than the unit itself */
function escortedBy(battle: Battle, unit: Unit, ability: Abilities): Unit | undefined {
  for (const ally of battle.units()) {
    if (
      ally !== unit &&
      ally.alive &&
      ally.team.alliance === unit.team.alliance &&
      ally.hasAbility(ability)
    ) {
      return ally;
    }
  }

  return undefined;
}

/** The standing holder on this unit's own side */
function guardedBy(battle: Battle, unit: Unit, ability: Abilities): Unit | undefined {
  for (const ally of battle.units()) {
    if (ally.alive && ally.team.alliance === unit.team.alliance && ally.hasAbility(ability)) {
      return ally;
    }
  }

  return undefined;
}

const chikoritaToCelebi = [
  // Chikorita: the party stands in something that mends them. Paid as
  // each ally reaches for a move, and never to the flower itself
  createAbility(
    Abilities.PetalBed,
    (battle) =>
      new MergedLifecycle(
        onUnitActs(battle, (unit) => {
          if (unit.hasAbility(Abilities.PetalBed)) {
            return;
          }

          const flower = guardedBy(battle, unit, Abilities.PetalBed);

          if (!flower) {
            return;
          }

          flower.triggerAbility(Abilities.PetalBed);

          flower.heal(
            { type: EffectType.Ability, ability: Abilities.PetalBed, unit: flower },
            unit,
            unit.checkStat(Stats.HP, 0) * PETAL_BED_FRACTION,
            0,
          );
        }),
      ),
  ),

  // Cyndaquil: the back flares as it arrives, and what that does is
  // Will-O-Wisp's business rather than this ability's
  createAbility(
    Abilities.Ignition,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (!event.reactivation && event.source.hasAbility(Abilities.Ignition)) {
            event.source.triggerAbility(Abilities.Ignition);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== Abilities.Ignition) {
            return;
          }

          const enemy = firstEnemy(battle, event.source);

          if (enemy) {
            event.source.triggerMove(Moves.WillOWisp, unitTarget(enemy), 0);
          }
        }),
      ]),
  ),

  // Totodile: it bites and does not let go, which is the hold Bind
  // already knows how to put on
  createAbility(Abilities.GatorGrip, (battle) => {
    // The bind is itself a contact move, so without this the grip would
    // grip its own grip
    const gripping = new Set<Unit>();

    return battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      const source = event.source;
      const target = event.target;

      if (
        !event.success ||
        !target.alive ||
        event.flags & MoveAttackFlags.Simulated ||
        gripping.has(source) ||
        !source.hasAbility(Abilities.GatorGrip) ||
        !source.checkMoveContact(event.move, unitTarget(target))
      ) {
        return;
      }

      gripping.add(source);
      source.triggerAbility(Abilities.GatorGrip);
      source.triggerMove(Moves.Bind, unitTarget(target), 0);
      gripping.delete(source);
    });
  }),

  // Sentret: it is the one watching, so nothing catches its side
  // unawares
  createAbility(Abilities.Sentry, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveCriticalHit, EventPriority.Post, (event) => {
      if (!event.critical) {
        return;
      }

      const lookout = guardedBy(battle, event.parent.target, Abilities.Sentry);

      if (lookout) {
        event.critical = false;

        lookout.triggerAbility(Abilities.Sentry);
      }
    }),
  ),

  // Hoothoot: the owl settles in and the light bends around its side,
  // which is Reflect's business rather than this ability's
  createAbility(
    Abilities.WatchfulRoost,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (!event.reactivation && event.source.hasAbility(Abilities.WatchfulRoost)) {
            event.source.triggerAbility(Abilities.WatchfulRoost);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.WatchfulRoost) {
            event.source.triggerMove(
              Moves.Reflect,
              { type: MoveTargetType.Team, team: event.source.team },
              0,
            );
          }
        }),
      ]),
  ),

  // Ledyba: what it built up goes down the line, the way a baton does,
  // however it was taken off the field
  createAbility(Abilities.Relay, (battle) => {
    // Stages are wiped as a unit leaves, so they are taken down before
    // the walk and handed over once the pair have swapped places
    const carried = new Map<Unit, number[]>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitSwitch, EventPriority.Pre, (event) => {
        const source = event.source;

        if (source === event.target || !source.hasAbility(Abilities.Relay)) {
          return;
        }

        const stages = PASSED_STAGES.map((stage) => source.stages[stage]);

        if (stages.some((stage) => stage !== 0)) {
          carried.set(source, stages);

          source.triggerAbility(Abilities.Relay);
        }
      }),
      battle.on(BattleEvents.UnitFinishSwitch, EventPriority.Post, (event) => {
        const passed = carried.get(event.source);

        if (passed == null) {
          return;
        }

        carried.delete(event.source);

        const cause = {
          type: EffectType.Ability,
          ability: Abilities.Relay,
          unit: event.source,
        } as const;

        for (const [at, stage] of PASSED_STAGES.entries()) {
          const difference = passed[at] - event.target.stages[stage];

          if (difference !== 0) {
            event.target.addStage(stage, difference, cause);
          }
        }
      }),
    ]);
  }),

  // Spinarak: the web goes up before anything walks into it, and what
  // silk does to a stride is String Shot's business
  createAbility(
    Abilities.SilkSnare,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (!event.reactivation && event.source.hasAbility(Abilities.SilkSnare)) {
            event.source.triggerAbility(Abilities.SilkSnare);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.SilkSnare) {
            // String Shot already reaches everything opposite, so one
            // cast covers the field
            event.source.triggerMove(Moves.StringShot, { type: MoveTargetType.None }, 0);
          }
        }),
      ]),
  ),

  // Chinchou: the lantern goes up as it arrives, and whatever swims at
  // it is Confuse Ray's to deal with
  createAbility(
    Abilities.LanternLure,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (!event.reactivation && event.source.hasAbility(Abilities.LanternLure)) {
            event.source.triggerAbility(Abilities.LanternLure);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== Abilities.LanternLure) {
            return;
          }

          const enemy = firstEnemy(battle, event.source);

          if (enemy) {
            event.source.triggerMove(Moves.ConfuseRay, unitTarget(enemy), 0);
          }
        }),
      ]),
  ),

  // Togepi: luck as a plain certainty, spent on everybody it is
  // standing with rather than on itself
  createAbility(Abilities.GoodOmen, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, (event) => {
      if (event.accuracy != null && guardedBy(battle, event.source, Abilities.GoodOmen)) {
        event.accuracy = undefined;
      }
    }),
  ),

  // Natu: it saw the blow before it arrived, and what a foreseen blow
  // does is Future Sight's business
  createAbility(
    Abilities.Prophecy,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (!event.reactivation && event.source.hasAbility(Abilities.Prophecy)) {
            event.source.triggerAbility(Abilities.Prophecy);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== Abilities.Prophecy) {
            return;
          }

          const enemy = firstEnemy(battle, event.source);

          if (enemy) {
            event.source.triggerMove(Moves.FutureSight, unitTarget(enemy), 0);
          }
        }),
      ]),
  ),

  // Mareep: the fleece has to go somewhere as it arrives, and what a
  // shock does to a nervous system is Thunder Wave's business
  createAbility(
    Abilities.LiveWire,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (!event.reactivation && event.source.hasAbility(Abilities.LiveWire)) {
            event.source.triggerAbility(Abilities.LiveWire);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== Abilities.LiveWire) {
            return;
          }

          const enemy = firstEnemy(battle, event.source);

          if (enemy) {
            event.source.triggerMove(Moves.ThunderWave, unitTarget(enemy), 0);
          }
        }),
      ]),
  ),

  // Marill: the float is already full, so what will not fit goes at
  // somebody. Measured before the heal is clamped and paid once it has
  // gone through, so a refused heal spills nothing
  createAbility(Abilities.Spillover, (battle) => {
    const surplus = new WeakMap<object, number>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitHeal, EventPriority.Pre, (event) => {
        const target = event.target;

        if (!target.hasAbility(Abilities.Spillover)) {
          return;
        }

        const over = target.health + event.value - target.checkStat(Stats.HP, 0);

        if (over > 0) {
          surplus.set(event, over);
        }
      }),
      battle.on(BattleEvents.UnitHeal, EventPriority.Post, (event) => {
        const over = surplus.get(event);
        const target = event.target;

        if (over == null) {
          return;
        }

        surplus.delete(event);

        const enemy = firstEnemy(battle, target);

        if (!enemy) {
          return;
        }

        target.triggerAbility(Abilities.Spillover);

        target.damage(
          { type: EffectType.Ability, ability: Abilities.Spillover, unit: target },
          enemy,
          over,
          DamageFlags.Indirect,
        );
      }),
    ]);
  }),

  // Sudowoodo: the act is the whole pokemon. Answered where
  // effectiveness is worked out, one defending type at a time, so a
  // Water move meets a tree rather than a rock
  createAbility(Abilities.FalseWood, (battle) => {
    const { state, lifecycles } = createUnitState<boolean>(battle);
    // The disguise stands for one type: whichever defending type comes
    // first is answered as Grass, and the rest count for nothing
    const answered = new WeakSet<object>();
    const spare = new WeakSet<object>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitAttackResolveEffectiveness, EventPriority.Pre, (event) => {
        const parent = event.parent;
        const target = parent.target;

        if (state.get(target) || !target.hasAbility(Abilities.FalseWood)) {
          return;
        }

        if (answered.has(parent)) {
          spare.add(event);
          return;
        }

        answered.add(parent);
        event.defendingType = Types.Grass;

        if (!(parent.flags & MoveAttackFlags.Simulated)) {
          target.triggerAbility(Abilities.FalseWood);
        }
      }),
      battle.on(BattleEvents.UnitAttackResolveEffectiveness, EventPriority.Post, (event) => {
        if (spare.has(event)) {
          event.multiplier = 1;
        }
      }),
      // One blow is all the act survives, until it next takes the field
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        if (event.success && event.target.hasAbility(Abilities.FalseWood)) {
          state.set(event.target, true);
        }
      }),
      ...lifecycles,
    ]);
  }),

  // Hoppip: it is carried on the wind rather than standing on the
  // ground, so nothing holds it and nothing slows it
  createAbility(
    Abilities.Updraft,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitEscape, EventPriority.Post, (event) => {
          if (!event.success && event.source.hasAbility(Abilities.Updraft)) {
            event.success = true;

            event.source.triggerAbility(Abilities.Updraft);
          }
        }),
        battle.on(BattleEvents.CheckUnitCanAddStage, EventPriority.Post, (event) => {
          if (
            event.success &&
            event.value < 0 &&
            event.stage === Stages.Speed &&
            event.source.hasAbility(Abilities.Updraft)
          ) {
            event.success = false;

            // A cue is something a watcher sees, so it waits for a real
            // attempt rather than the AI weighing one
            if (!event.simulated) {
              event.source.triggerAbility(Abilities.Updraft);
            }
          }
        }),
      ]),
  ),

  // Aipom: the tail is a third hand, and what a thrown item does on
  // impact is Fling's business
  createAbility(
    Abilities.Tailthrow,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (!event.reactivation && event.source.hasAbility(Abilities.Tailthrow)) {
            event.source.triggerAbility(Abilities.Tailthrow);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== Abilities.Tailthrow) {
            return;
          }

          const enemy = firstEnemy(battle, event.source);

          if (enemy) {
            event.source.triggerMove(Moves.Fling, unitTarget(enemy), 0);
          }
        }),
      ]),
  ),

  // Sunkern: the whole line is built around gathering light, so what
  // it holds down lands harder and nothing shakes it loose
  createAbility(
    Abilities.SunlitCharge,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
          if (
            event.power != null &&
            event.source.hasAbility(Abilities.SunlitCharge) &&
            isChannelledMove(event.move)
          ) {
            event.power *= SUNLIT_CHARGE_SCALE;
          }
        }),
        // Fainting still ends it: that interrupt fires at zero health
        battle.on(BattleEvents.UnitInterrupt, EventPriority.Pre, (event) => {
          const source = event.source;

          if (source.health > 0 && source.channeling && source.hasAbility(Abilities.SunlitCharge)) {
            event.disabled = true;

            source.triggerAbility(Abilities.SunlitCharge);
          }
        }),
      ]),
  ),

  // Yanma: the wingbeat is the attack, and a sound does not stop at
  // whoever it was aimed at
  createAbility(Abilities.Resonance, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveTargeting, EventPriority.Post, (event) => {
      if (
        event.target === MoveTargets.Unit &&
        affectsFoesOnly(event.affects) &&
        (getMoveData(event.move).flags & MoveFlags.Sound) !== 0 &&
        event.source.hasAbility(Abilities.Resonance)
      ) {
        event.target = MoveTargets.None;
      }
    }),
  ),

  // Wooper: it turns up looking half asleep and passes that on, which
  // is Yawn's business rather than this ability's
  createAbility(
    Abilities.ContagiousYawn,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (!event.reactivation && event.source.hasAbility(Abilities.ContagiousYawn)) {
            event.source.triggerAbility(Abilities.ContagiousYawn);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== Abilities.ContagiousYawn) {
            return;
          }

          const enemy = firstEnemy(battle, event.source);

          if (enemy) {
            event.source.triggerMove(Moves.Yawn, unitTarget(enemy), 0);
          }
        }),
      ]),
  ),

  // Murkrow: anything shiny that hits the ground is the crow's. Its
  // own losses are not: a crow cannot be robbed by itself
  createAbility(Abilities.Magpie, (battle) =>
    battle.on(BattleEvents.UnitRemoveItem, EventPriority.Post, (event) => {
      const cause = event.cause;
      const victim = event.source;

      // Nobody's own doing: eating a berry or throwing an item names
      // the holder, and that is not a thing left lying about
      if (cause.type === EffectType.None || cause.unit === victim) {
        return;
      }

      for (const crow of battle.units()) {
        if (
          crow !== victim &&
          crow.alive &&
          crow.hasAbility(Abilities.Magpie) &&
          hasFreeItemSlot(crow)
        ) {
          crow.triggerAbility(Abilities.Magpie);
          crow.addItem(event.item);

          return;
        }
      }
    }),
  ),

  // Misdreavus: it will not go down on its own, and evening the two of
  // them up is Pain Split's business
  createAbility(Abilities.SharedMisery, (battle) => {
    const { state, lifecycles } = createUnitState<boolean>(battle);

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const target = event.target;

        if (
          !event.success ||
          !target.alive ||
          state.get(target) ||
          !target.hasAbility(Abilities.SharedMisery) ||
          target.health >= target.checkStat(Stats.HP, 0) * SHARED_MISERY_THRESHOLD
        ) {
          return;
        }

        const enemy = healthiestEnemy(battle, target);

        if (!enemy) {
          return;
        }

        state.set(target, true);
        target.triggerAbility(Abilities.SharedMisery);
        target.triggerMove(Moves.PainSplit, unitTarget(enemy), 0);
      }),
      ...lifecycles,
    ]);
  }),

  // Unown: a wall of symbols cancels whatever was carried in past it
  createAbility(Abilities.RuinousScript, (battle) =>
    battle.on(BattleEvents.CheckUnitItem, EventPriority.Post, (event) => {
      if (event.enabled && enemyHolder(battle, event.source, Abilities.RuinousScript)) {
        event.enabled = false;
      }
    }),
  ),

  // Wobbuffet: it has no offence of its own, so what it gives back is
  // whatever was put into it, paid as it next moves
  createAbility(Abilities.Backlash, (battle) => {
    const { state, lifecycles } = createUnitState<{ bank: number; attacker: Unit }>(battle);

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const cause = event.cause;
        const target = event.target;

        if (
          !event.success ||
          !target.alive ||
          event.flags & DamageFlags.Indirect ||
          cause.type === EffectType.None ||
          cause.unit === target ||
          !target.hasAbility(Abilities.Backlash)
        ) {
          return;
        }

        const held = state.get(target);
        const bank = (held?.bank ?? 0) + event.value * BACKLASH_SHARE;

        state.set(target, { bank, attacker: cause.unit });
      }),
      ...onUnitActs(battle, (unit) => {
        const held = state.get(unit);

        if (held == null || !unit.hasAbility(Abilities.Backlash)) {
          return;
        }

        state.delete(unit);

        if (!held.attacker.alive) {
          return;
        }

        unit.triggerAbility(Abilities.Backlash);

        unit.damage(
          { type: EffectType.Ability, ability: Abilities.Backlash, unit },
          held.attacker,
          held.bank,
          DamageFlags.Indirect,
        );
      }),
      ...lifecycles,
    ]);
  }),

  // Girafarig: two heads, and the one with the better idea is the one
  // that swings. Asked of the attacking stat only, so what it defends
  // with is its own business
  createAbility(Abilities.Ambidextrous, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
      const source = event.parent.source;

      if (event.unit !== source || !source.hasAbility(Abilities.Ambidextrous)) {
        return;
      }

      const other = OTHER_ATTACK_STAT[event.stat];

      if (other == null) {
        return;
      }

      event.value = Math.max(event.value, source.resolveStat(other, StatFlags.Attack));
    }),
  ),

  // Pineco: it goes off as it goes down, and what the pieces do to the
  // ground is Spikes' and Toxic Spikes' business
  createAbility(Abilities.Shrapnel, (battle) =>
    battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
      const source = event.source;

      if (!source.hasAbility(Abilities.Shrapnel)) {
        return;
      }

      source.triggerAbility(Abilities.Shrapnel);

      for (const team of battle.teams(source.team.alliance)) {
        for (const move of [Moves.Spikes, Moves.ToxicSpikes]) {
          source.triggerMove(move, { type: MoveTargetType.Team, team }, 0);
        }
      }
    }),
  ),

  // Dunsparce: nothing about it is sharp and nothing is weak, which is
  // the whole of what the line is known for
  createAbility(Abilities.EvenKeel, (battle) => {
    const stats = createStatAverage();

    return battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
      if (
        !stats.measuring() &&
        BATTLE_STATS.includes(event.stat) &&
        event.source.hasAbility(Abilities.EvenKeel)
      ) {
        event.value = stats.average(event.source);
      }
    });
  }),

  // Gligar: the sand its kin hide in is the sand it flies on, so a
  // storm is worth aim to it and cover as well
  createAbility(
    Abilities.SandRider,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, (event) => {
          if (
            event.accuracy != null &&
            event.source.hasAbility(Abilities.SandRider) &&
            isWeatherSandstorm(event.source)
          ) {
            event.accuracy = undefined;
          }
        }),
        battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
          const target = event.parent.target;

          if (target.hasAbility(Abilities.SandRider) && isWeatherSandstorm(target)) {
            event.value *= SAND_RIDER_SCALE;
          }
        }),
      ]),
  ),

  // Snubbull: it picks on whatever has already been put in its place,
  // which its own Intimidate is there to arrange
  createAbility(Abilities.Bully, (battle) =>
    battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      const target = event.target;

      if (
        event.power != null &&
        target.type === MoveTargetType.Unit &&
        target.unit.stages[Stages.Attack] < 0 &&
        event.source.hasAbility(Abilities.Bully)
      ) {
        event.power *= BULLY_SCALE;
      }
    }),
  ),

  // Qwilfish: the last spine goes into whoever pushed it that far, and
  // what the venom does afterwards is Toxic's business
  createAbility(Abilities.LastBarb, (battle) =>
    battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
      const source = event.source;
      const killer = event.attacker;

      if (!source.hasAbility(Abilities.LastBarb) || killer === source || !killer.alive) {
        return;
      }

      source.triggerAbility(Abilities.LastBarb);
      source.triggerMove(Moves.Toxic, unitTarget(killer), 0);
    }),
  ),

  // Shuckle: what the shell does to a berry is the line's one claim to
  // fame, so it turns up with the juice already made
  createAbility(
    Abilities.Fermenter,
    (battle) =>
      new MergedLifecycle(
        onUnitActs(battle, (unit) => {
          if (unit.hasAbility(Abilities.Fermenter) && hasFreeItemSlot(unit)) {
            unit.triggerAbility(Abilities.Fermenter);
            unit.addItem(Items.BerryJuice);
          }
        }),
      ),
  ),

  // Heracross: it picks whatever it grabs up and throws it, and what
  // being thrown off the field means is Whirlwind's business. Once per
  // enemy, so the field is not a revolving door
  createAbility(Abilities.Heave, (battle) => {
    const { state, lifecycles } = createUnitState<boolean>(battle);

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;
        const target = event.target;

        if (
          !event.success ||
          !target.alive ||
          event.flags & MoveAttackFlags.Simulated ||
          state.get(target) ||
          !source.hasAbility(Abilities.Heave) ||
          !source.checkMoveContact(event.move, unitTarget(target))
        ) {
          return;
        }

        state.set(target, true);
        source.triggerAbility(Abilities.Heave);
        source.triggerMove(Moves.Whirlwind, unitTarget(target), 0);
      }),
      ...lifecycles,
    ]);
  }),

  // Sneasel: the claws are the whole of the design, so what they leave
  // behind is an opening for the next pass
  createAbility(Abilities.SharpClaw, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      const source = event.source;
      const target = event.target;

      if (
        !event.success ||
        !target.alive ||
        event.flags & MoveAttackFlags.Simulated ||
        !source.hasAbility(Abilities.SharpClaw) ||
        !source.checkMoveContact(event.move, unitTarget(target))
      ) {
        return;
      }

      source.triggerAbility(Abilities.SharpClaw);
      target.addStage(Stages.Defense, -1, {
        type: EffectType.Ability,
        ability: Abilities.SharpClaw,
        unit: source,
      });
    }),
  ),

  // Teddiursa: it licks its paws between swings. Paid through the
  // drain check, so a Liquid Ooze turns it back on itself the way it
  // would any other drink
  createAbility(Abilities.SweetPaw, (battle) =>
    battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
      const cause = event.cause;
      const source = event.source;

      if (
        !event.success ||
        event.flags & DamageFlags.Indirect ||
        cause.type !== EffectType.Move ||
        cause.unit !== source ||
        !source.hasAbility(Abilities.SweetPaw) ||
        !source.checkMoveContact(cause.move, unitTarget(event.target))
      ) {
        return;
      }

      const amount = source.checkDrain(event.target, event.value * SWEET_PAW_SHARE);

      source.triggerAbility(Abilities.SweetPaw);

      if (amount >= 0) {
        source.heal(cause, source, amount, 0);
      } else {
        source.damage(cause, source, -amount, DamageFlags.Indirect);
      }
    }),
  ),

  // Slugma: it leaves the ground molten behind it, and whatever else
  // is standing there pays for it as it moves
  createAbility(
    Abilities.MagmaTrail,
    (battle) =>
      new MergedLifecycle(
        onUnitActs(battle, (unit) => {
          const slug = enemyHolder(battle, unit, Abilities.MagmaTrail);

          if (!slug) {
            return;
          }

          slug.triggerAbility(Abilities.MagmaTrail);

          slug.damage(
            { type: EffectType.Ability, ability: Abilities.MagmaTrail, unit: slug },
            unit,
            unit.checkStat(Stats.HP, 0) * MAGMA_TRAIL_FRACTION,
            DamageFlags.Indirect,
          );
        }),
      ),
  ),

  // Swinub: the tusks go through the wall rather than round it, so the
  // screen is gone for everybody afterwards. Torn down before the blow
  // lands, the way Brick Break does it
  createAbility(Abilities.Icebreaker, (battle) =>
    battle.on(BattleEvents.UnitTriggerMoveTarget, AttackPriority.Pre, (event) => {
      if (
        event.target.type !== MoveTargetType.Unit ||
        !event.source.hasAbility(Abilities.Icebreaker)
      ) {
        return;
      }

      const team = event.target.unit.team;
      const cause = {
        type: EffectType.Ability,
        ability: Abilities.Icebreaker,
        unit: event.source,
      } as const;

      for (const screen of SCREENS) {
        if (team.status[screen] != null) {
          event.source.triggerAbility(Abilities.Icebreaker);
          team.removeStatus(screen, cause);
        }
      }
    }),
  ),

  // Corsola: the reef takes nothing in on its own, so what reaches it
  // reaches whichever branch needs it most
  createAbility(Abilities.CoralBloom, (battle) => {
    // The shared heal must not bloom a heal of its own
    const blooming = new Set<Unit>();

    return battle.on(BattleEvents.UnitHeal, EventPriority.Post, (event) => {
      const target = event.target;

      if (event.value <= 0 || blooming.has(target) || !target.hasAbility(Abilities.CoralBloom)) {
        return;
      }

      const ally = neediestAlly(battle, target);

      if (!ally) {
        return;
      }

      blooming.add(target);
      target.triggerAbility(Abilities.CoralBloom);
      target.heal(
        { type: EffectType.Ability, ability: Abilities.CoralBloom, unit: target },
        ally,
        event.value,
        0,
      );
      blooming.delete(target);
    });
  }),

  // Remoraid: it shoots from where it is, so nothing that answers a
  // touch ever gets to answer
  createAbility(Abilities.Standoff, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveContact, EventPriority.Post, (event) => {
      if (event.contact && event.source.hasAbility(Abilities.Standoff)) {
        event.contact = false;
      }
    }),
  ),

  // Delibird: the sack is for somebody else, so it turns up with the
  // parcel already addressed to whoever needs it
  createAbility(
    Abilities.Delivery,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (!event.reactivation && event.source.hasAbility(Abilities.Delivery)) {
            event.source.triggerAbility(Abilities.Delivery);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== Abilities.Delivery) {
            return;
          }

          const ally = neediestAlly(battle, event.source);

          if (ally && hasFreeItemSlot(ally)) {
            ally.addItem(Items.BerryJuice);
          }
        }),
      ]),
  ),

  // Mantine: the wing goes over whatever is riding with it, which is
  // the only thing its 140 was ever for
  createAbility(Abilities.Escort, (battle) =>
    battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
      if (event.stat !== Stats.SpecialDefense) {
        return;
      }

      const wing = escortedBy(battle, event.source, Abilities.Escort);

      if (wing) {
        event.value *= ESCORT_SCALE;
      }
    }),
  ),

  // Skarmory: the feathers it loses are steel, and where they land is
  // Spikes' business
  createAbility(Abilities.Steelmolt, (battle) =>
    battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
      const target = event.target;

      if (
        !event.success ||
        event.flags & DamageFlags.Indirect ||
        !target.hasAbility(Abilities.Steelmolt)
      ) {
        return;
      }

      target.triggerAbility(Abilities.Steelmolt);

      for (const team of battle.teams(target.team.alliance)) {
        target.triggerMove(Moves.Spikes, { type: MoveTargetType.Team, team }, 0);
      }
    }),
  ),

  // Houndour: the cry is what brings the rest of the pack in at a run
  createAbility(
    Abilities.PackHowl,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (!event.reactivation && event.source.hasAbility(Abilities.PackHowl)) {
            event.source.triggerAbility(Abilities.PackHowl);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== Abilities.PackHowl) {
            return;
          }

          const source = event.source;
          const cause = {
            type: EffectType.Ability,
            ability: Abilities.PackHowl,
            unit: source,
          } as const;

          for (const ally of battle.units()) {
            if (ally !== source && ally.alive && ally.team.alliance === source.team.alliance) {
              ally.addStage(Stages.Attack, 1, cause);
            }
          }
        }),
      ]),
  ),

  // Phanpy: it is heavier every time it comes round again, and nothing
  // short of leaving the field slows it back down
  createAbility(Abilities.Momentum, (battle) => {
    const { counter, lifecycles } = createUnitCounter(battle);

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitTriggerMoveRollHit, EventPriority.Post, (event) => {
        const source = event.parent.source;

        if (event.hit && source.hasAbility(Abilities.Momentum)) {
          counter.set(source, Math.min(MOMENTUM_MAX_STACKS, counter.get(source) + 1));

          source.triggerAbility(Abilities.Momentum);
        }
      }),
      battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
        const held = counter.get(event.source);

        if (event.power != null && held > 0 && event.source.hasAbility(Abilities.Momentum)) {
          event.power *= 1 + MOMENTUM_STEP * held;
        }
      }),
      ...lifecycles,
    ]);
  }),

  // Stantler: the antlers make the air hard to think through, which
  // costs whatever is trying to think its way past them
  createAbility(Abilities.MindFog, (battle) =>
    battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
      if (
        event.stat === Stats.SpecialAttack &&
        enemyHolder(battle, event.source, Abilities.MindFog)
      ) {
        event.value *= MIND_FOG_SCALE;
      }
    }),
  ),

  // Smeargle: it paints with whatever it was last shown, so the colour
  // on its tail is the colour that hit it
  createAbility(Abilities.Palette, (battle) => {
    const { state, lifecycles } = createUnitState<Types>(battle);

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const cause = event.cause;
        const target = event.target;

        if (
          !event.success ||
          cause.type !== EffectType.Move ||
          cause.unit === target ||
          !target.hasAbility(Abilities.Palette)
        ) {
          return;
        }

        state.set(target, cause.unit.checkMoveType(cause.move, unitTarget(target)));
      }),
      battle.on(BattleEvents.CheckUnitMoveType, EventPriority.Post, (event) => {
        const painted = state.get(event.source);

        if (painted != null && event.source.hasAbility(Abilities.Palette)) {
          event.type = painted;
        }
      }),
      ...lifecycles,
    ]);
  }),

  // Miltank: the bell it wears is the point of it, and what a bell
  // does to a sick herd is Heal Bell's business
  createAbility(
    Abilities.Cowbell,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (!event.reactivation && event.source.hasAbility(Abilities.Cowbell)) {
            event.source.triggerAbility(Abilities.Cowbell);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.Cowbell) {
            event.source.triggerMove(
              Moves.HealBell,
              { type: MoveTargetType.Team, team: event.source.team },
              0,
            );
          }
        }),
      ]),
  ),
];

export default chikoritaToCelebi;
