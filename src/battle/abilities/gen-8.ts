import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stages, Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import Abilities from '../../data/ids/abilities';
import { DamageFlags, MoveCategories, MoveFlags, Moves } from '../../data/ids/moves';
import { Species } from '../../data/ids/species';
import { Statuses, TeamStatuses, Weathers } from '../../data/ids/status';
import { getMoveData } from '../../data/moves';
import { isPseudoMove } from '../../data/moves/pseudo';
import { registerWeatherWant } from '../ai/weather-wants';
import type Battle from '../core';
import { BattleEvents, type EffectCause, EffectType } from '../events';
import { MergedLifecycle } from '../lifecycle';
import { abilitiesOf } from '../moves/ability-moves';
import type Unit from '../unit';
import { hasAnyStatus, hasFreeItemSlot, isWeatherHail, onUnitActs, unitTarget } from '../utils';
import {
  createAbility,
  createBatteryAbility,
  createFurCoatAbility,
  createIntrepidSwordAbility,
  createMoxieAbility,
  createProteanAbility,
  createStalwartAbility,
  createSteelworkerAbility,
  createToughClawsAbility,
  getAbilityHolders,
} from './__create';

// The ice comes back under hail or snow, so the AI weighs calling one up
registerWeatherWant(Abilities.IceFace, [Weathers.Hail, Weathers.Snow]);

/** What Punk Rock makes of a sound move it sings, and of one sung at it */
export const PUNK_ROCK_SCALE = 1.3;
export const PUNK_ROCK_TAKEN_SCALE = 0.5;

/** What Ice Scales makes of a special blow */
export const ICE_SCALES_SCALE = 0.5;

/** What Power Spot is worth to everybody else's moves */
export const POWER_SPOT_SCALE = 1.3;

/** The share of the attacker's HP a spat-out catch takes */
export const GULP_MISSILE_FRACTION = 1 / 4;

/** The share of its HP above which a Cramorant comes up with the small catch */
export const GULP_MISSILE_THRESHOLD = 1 / 2;

/** What Steely Spirit makes of its side's Steel moves */
export const STEELY_SPIRIT_SCALE = 1.5;

/** How often Quick Draw skips the wind-up */
export const QUICK_DRAW_CHANCE = 0.3;

/** What Gorilla Tactics makes of its Attack */
export const GORILLA_TACTICS_SCALE = 1.5;

/** The Gen 9 numbers for the two Regis' type boosts */
export const TRANSISTOR_SCALE = 1.3;
export const DRAGONS_MAW_SCALE = 1.5;

/** The screens a Screen Cleaner wipes off both sides */
const SCREENS = [TeamStatuses.Reflect, TeamStatuses.LightScreen, TeamStatuses.AuroraVeil];

/** What Pastel Veil keeps off its side */
const POISONS = [Statuses.Poisoned, Statuses.BadlyPoisoned];

/** The dives a Cramorant comes back up from with something in its mouth */
const FISHING_MOVES = new Set<Moves>([Moves.Surf, Moves.Dive]);

/** A Cramorant with a catch in its mouth */
const LOADED = new Set<Species>([Species.CramorantGulping, Species.CramorantGorging]);

/** Whether a blow came from another unit's move rather than a residual or itself */
function isStruckBy(event: { cause: EffectCause; target: Unit; flags: number }): boolean {
  const cause = event.cause;

  return (
    (event.flags & DamageFlags.Indirect) === 0 &&
    cause.type === EffectType.Move &&
    cause.unit !== event.target
  );
}

/** The teammate whose Pastel Veil covers this unit, if one is standing */
function veiledBy(unit: Unit): Unit | undefined {
  for (const mate of unit.team.units) {
    if (mate.alive && mate.hasAbility(Abilities.PastelVeil)) {
      return mate;
    }
  }
  return undefined;
}

/** Whether anybody on the unit's side, itself included, is carrying a poison */
function poisonedSide(unit: Unit): boolean {
  for (const mate of unit.team.units) {
    if (mate.alive && hasAnyStatus(mate, POISONS)) {
      return true;
    }
  }
  return false;
}

/** Whether a teammate other than the unit itself has a stage off zero */
function stagedMate(unit: Unit): boolean {
  for (const mate of unit.team.units) {
    if (mate === unit || !mate.alive) {
      continue;
    }
    for (const value of Object.values(mate.stages)) {
      if (value !== 0) {
        return true;
      }
    }
  }
  return false;
}

/** Whether a screen is up over either side */
function screensUp(battle: Battle): boolean {
  for (const team of battle.teams()) {
    for (const screen of SCREENS) {
      if (team.status[screen] != null) {
        return true;
      }
    }
  }
  return false;
}

/** Galar's abilities, as far as its route lines are written */
const setupAbilities = [
  // Scorbunny's line: Protean under its own name
  // https://bulbapedia.bulbagarden.net/wiki/Libero_(Ability)
  createProteanAbility(Abilities.Libero),

  // Toxtricity (and Rillaboom here): its own songs carry further, and
  // it hears less of anybody else's
  // https://bulbapedia.bulbagarden.net/wiki/Punk_Rock_(Ability)
  createToughClawsAbility(Abilities.PunkRock, MoveFlags.Sound, PUNK_ROCK_SCALE),
  createAbility(Abilities.PunkRock, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const { move, target } = event.parent;

      if (
        target.hasAbility(Abilities.PunkRock) &&
        (getMoveData(move).flags & MoveFlags.Sound) !== 0
      ) {
        event.value *= PUNK_ROCK_TAKEN_SCALE;
      }
    }),
  ),

  // Snom and Frosmoth: the scales take the edge off anything thrown at it
  // https://bulbapedia.bulbagarden.net/wiki/Ice_Scales_(Ability)
  createFurCoatAbility(Abilities.IceScales, MoveCategories.Special, ICE_SCALES_SCALE),

  // Stonjourner: standing beside it lifts every move its teammates throw
  // https://bulbapedia.bulbagarden.net/wiki/Power_Spot_(Ability)
  createBatteryAbility(Abilities.PowerSpot, null, POWER_SPOT_SCALE),

  // Duraludon, and Arrokuda's line: what they aim at is what they hit
  // https://bulbapedia.bulbagarden.net/wiki/Propeller_Tail_(Ability)
  createStalwartAbility(Abilities.Stalwart),
  createStalwartAbility(Abilities.PropellerTail),

  // Gossifleur and Eldegoss: a blow that lands shakes the cotton loose,
  // and it slows everybody else on the field
  // https://bulbapedia.bulbagarden.net/wiki/Cotton_Down_(Ability)
  createAbility(
    Abilities.CottonDown,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
          const { source, target } = event;

          if (event.success && event.category !== MoveCategories.Status && source !== target) {
            target.triggerAbility(Abilities.CottonDown);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== Abilities.CottonDown) {
            return;
          }
          for (const unit of battle.units()) {
            if (unit !== event.source && unit.alive) {
              unit.addStage(Stages.Speed, -1, {
                type: EffectType.Ability,
                ability: Abilities.CottonDown,
                unit: event.source,
              });
            }
          }
        }),
      ]),
  ),

  /**
   * Yamper: no Poké Ball is thrown inside a fight here, so it fetches
   * the first thing anybody else flings instead, if it has a hand free.
   * Once a fight, like the mainline's
   * https://bulbapedia.bulbagarden.net/wiki/Ball_Fetch_(Ability)
   */
  createAbility(Abilities.BallFetch, (battle) => {
    const fetched = new WeakSet<Unit>();

    return battle.on(BattleEvents.UnitRemoveItem, EventPriority.Post, (event) => {
      const cause = event.cause;

      if (cause.type !== EffectType.Move || cause.move !== Moves.Fling) {
        return;
      }
      for (const dog of getAbilityHolders(battle, Abilities.BallFetch)) {
        if (
          dog !== event.source &&
          dog.alive &&
          !fetched.has(dog) &&
          dog.hasAbility(Abilities.BallFetch) &&
          hasFreeItemSlot(dog)
        ) {
          dog.addItem(event.item);

          // Cue only when the catch held: the add can still be refused
          if (dog.items[event.item] === true) {
            fetched.add(dog);
            dog.triggerAbility(Abilities.BallFetch);
            return;
          }
        }
      }
    });
  }),

  /**
   * Cramorant: a Surf or a Dive brings it back up with a catch, the
   * small one above 1/2 HP and the big one at or below, and whoever next
   * strikes it gets the catch spat at them for 1/4 of their HP. The
   * small one costs them 1 stage of Defense, the big one paralyses them.
   * Both cue the ability, so each stays where it happens
   * https://bulbapedia.bulbagarden.net/wiki/Gulp_Missile_(Ability)
   */
  createAbility(
    Abilities.GulpMissile,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
          const bird = event.source;

          if (
            !FISHING_MOVES.has(event.move) ||
            bird.species !== Species.Cramorant ||
            !bird.alive ||
            !bird.hasAbility(Abilities.GulpMissile)
          ) {
            return;
          }

          const small = bird.health > bird.checkStat(Stats.HP, 0) * GULP_MISSILE_THRESHOLD;

          bird.triggerAbility(Abilities.GulpMissile);
          // Every shape shares an HP stat, so its health stands
          bird.setSpecies(small ? Species.CramorantGulping : Species.CramorantGorging);
        }),
        battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
          const bird = event.target;
          const cause = event.cause;
          const caught = bird.species;

          if (
            !event.success ||
            !isStruckBy(event) ||
            cause.type !== EffectType.Move ||
            !LOADED.has(caught) ||
            !bird.hasAbility(Abilities.GulpMissile)
          ) {
            return;
          }

          const attacker = cause.unit;
          const spat = {
            type: EffectType.Ability,
            ability: Abilities.GulpMissile,
            unit: bird,
          } as const;

          bird.triggerAbility(Abilities.GulpMissile);
          bird.setSpecies(Species.Cramorant);
          if (!attacker.alive) {
            return;
          }
          bird.damage(
            spat,
            attacker,
            attacker.checkStat(Stats.HP, 0) * GULP_MISSILE_FRACTION,
            DamageFlags.Indirect,
          );
          // The spit may have finished them, which the checker cannot see
          // oxlint-disable-next-line typescript/no-unnecessary-condition
          if (!attacker.alive) {
            return;
          }
          if (caught === Species.CramorantGulping) {
            attacker.addStage(Stages.Defense, -1, spat);
          } else {
            attacker.addStatus(Statuses.Paralyzed, spat);
          }
        }),
      ]),
  ),

  /**
   * Eiscue: the ice takes the first physical blow and breaks, leaving
   * its faster, frailer face. Hail or snow freezes it back over, as the
   * sky comes out or as it walks in under one
   * https://bulbapedia.bulbagarden.net/wiki/Ice_Face_(Ability)
   */
  createAbility(Abilities.IceFace, (battle) => {
    function refreeze(unit: Unit): void {
      if (unit.alive && unit.species === Species.EiscueNoice && isWeatherHail(unit)) {
        unit.triggerAbility(Abilities.IceFace);
      }
    }

    function refreezeAll(): void {
      for (const unit of getAbilityHolders(battle, Abilities.IceFace)) {
        refreeze(unit);
      }
    }

    return new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitCanDamage, EventPriority.Post, (event) => {
        const { cause, target } = event;

        if (
          !event.success ||
          !isStruckBy(event) ||
          cause.type !== EffectType.Move ||
          target.species !== Species.Eiscue ||
          !target.hasAbility(Abilities.IceFace) ||
          getMoveData(cause.move).category !== MoveCategories.Physical
        ) {
          return;
        }
        event.success = false;
        target.triggerAbility(Abilities.IceFace);
      }),
      battle.on(BattleEvents.SetWeather, EventPriority.Post, refreezeAll),
      battle.on(BattleEvents.TeamSetWeather, EventPriority.Post, refreezeAll),
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        refreeze(event.source);
      }),
      // The detections only fire on the shape they leave, so one swap answers both
      battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
        const unit = event.source;

        if (event.ability !== Abilities.IceFace) {
          return;
        }
        if (unit.species === Species.Eiscue) {
          unit.setSpecies(Species.EiscueNoice);
        } else if (unit.species === Species.EiscueNoice) {
          unit.setSpecies(Species.Eiscue);
        }
      }),
    ]);
  }),

  /**
   * Morpeko: the mainline swings its mood at the end of every turn,
   * so here it swings each time it acts, which is what turns its Aura
   * Wheel between Electric and Dark
   * https://bulbapedia.bulbagarden.net/wiki/Hunger_Switch_(Ability)
   */
  createAbility(
    Abilities.HungerSwitch,
    (battle) =>
      new MergedLifecycle([
        ...onUnitActs(battle, (unit) => {
          if (
            (unit.species === Species.Morpeko || unit.species === Species.MorpekoHangry) &&
            unit.alive
          ) {
            unit.triggerAbility(Abilities.HungerSwitch);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          const unit = event.source;

          if (event.ability !== Abilities.HungerSwitch) {
            return;
          }
          if (unit.species === Species.Morpeko) {
            unit.setSpecies(Species.MorpekoHangry);
          } else if (unit.species === Species.MorpekoHangry) {
            unit.setSpecies(Species.Morpeko);
          }
        }),
      ]),
  ),

  // Galarian Meowth's line: the whole side's Steel moves ring harder,
  // the holder's own among them. Two holders do not stack
  // https://bulbapedia.bulbagarden.net/wiki/Steely_Spirit_(Ability)
  createAbility(Abilities.SteelySpirit, (battle) =>
    battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      if (
        event.power == null ||
        event.source.checkMoveType(event.move, event.target) !== Types.Steel
      ) {
        return;
      }
      for (const mate of event.source.team.units) {
        if (mate.alive && mate.hasAbility(Abilities.SteelySpirit)) {
          event.power *= STEELY_SPIRIT_SCALE;
          return;
        }
      }
    }),
  ),

  /**
   * Galarian Ponyta's line: no poison lands on its side, and a teammate
   * already poisoned is cured as it arrives or gains the ability. Every
   * detection cures, so the cure rides the cue
   * https://bulbapedia.bulbagarden.net/wiki/Pastel_Veil_(Ability)
   */
  createAbility(
    Abilities.PastelVeil,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Post, (event) => {
          if (!event.immune && POISONS.includes(event.status) && veiledBy(event.source) != null) {
            event.immune = true;
          }
        }),
        battle.on(BattleEvents.UnitAddStatusFailed, EventPriority.Post, (event) => {
          if (POISONS.includes(event.status)) {
            veiledBy(event.source)?.triggerAbility(Abilities.PastelVeil);
          }
        }),
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (event.source.alive && poisonedSide(event.source)) {
            event.source.triggerAbility(Abilities.PastelVeil);
          }
        }),
        battle.on(BattleEvents.UnitAddAbility, EventPriority.Post, (event) => {
          if (
            event.ability === Abilities.PastelVeil &&
            event.source.alive &&
            poisonedSide(event.source)
          ) {
            event.source.triggerAbility(Abilities.PastelVeil);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== Abilities.PastelVeil) {
            return;
          }

          const cause = {
            type: EffectType.Ability,
            ability: Abilities.PastelVeil,
            unit: event.source,
          } as const;

          for (const mate of event.source.team.units) {
            for (const poison of POISONS) {
              if (mate.alive && mate.status[poison] != null) {
                mate.removeStatus(poison, cause);
              }
            }
          }
        }),
      ]),
  ),

  /**
   * Galarian Slowpoke: some draws go off with no wind-up, which is what
   * moving first is in a fight with no turn order. Rolled as the cast
   * opens, the way a Quick Claw is, and only for an attack
   * https://bulbapedia.bulbagarden.net/wiki/Quick_Draw_(Ability)
   */
  createAbility(Abilities.QuickDraw, (battle) => {
    const drawn = new Set<Unit>();

    function holster(unit: Unit): void {
      drawn.delete(unit);
    }

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitCast, EventPriority.Pre, (event) => {
        holster(event.source);
        if (
          event.source.hasAbility(Abilities.QuickDraw) &&
          getMoveData(event.move).category !== MoveCategories.Status &&
          battle.random() < QUICK_DRAW_CHANCE
        ) {
          event.source.triggerAbility(Abilities.QuickDraw);
        }
      }),
      battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
        if (event.ability === Abilities.QuickDraw) {
          drawn.add(event.source);
        }
      }),
      battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, (event) => {
        if (drawn.has(event.source)) {
          event.duration = 0;
        }
      }),
      battle.on(BattleEvents.UnitFinishCast, EventPriority.Post, (event) => {
        holster(event.source);
      }),
      battle.on(BattleEvents.UnitStopCast, EventPriority.Post, (event) => {
        holster(event.source);
      }),
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        holster(event.source);
      }),
    ]);
  }),

  // Galarian Slowking: the brew it pours on arrival washes its
  // teammates' stages back to zero, good and bad alike
  // https://bulbapedia.bulbagarden.net/wiki/Curious_Medicine_(Ability)
  createAbility(
    Abilities.CuriousMedicine,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (
            event.source.alive &&
            event.source.hasAbility(Abilities.CuriousMedicine) &&
            stagedMate(event.source)
          ) {
            event.source.triggerAbility(Abilities.CuriousMedicine);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== Abilities.CuriousMedicine) {
            return;
          }

          const cause = {
            type: EffectType.Ability,
            ability: Abilities.CuriousMedicine,
            unit: event.source,
          } as const;

          for (const mate of event.source.team.units) {
            if (mate !== event.source && mate.alive) {
              mate.resetStages(cause);
            }
          }
        }),
      ]),
  ),

  // Galarian Mr. Mime's line: walking in wipes every screen off the
  // field, its own side's as well
  // https://bulbapedia.bulbagarden.net/wiki/Screen_Cleaner_(Ability)
  createAbility(
    Abilities.ScreenCleaner,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (
            event.source.alive &&
            event.source.hasAbility(Abilities.ScreenCleaner) &&
            screensUp(battle)
          ) {
            event.source.triggerAbility(Abilities.ScreenCleaner);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== Abilities.ScreenCleaner) {
            return;
          }

          const cause = {
            type: EffectType.Ability,
            ability: Abilities.ScreenCleaner,
            unit: event.source,
          } as const;

          for (const team of battle.teams()) {
            for (const screen of SCREENS) {
              team.removeStatus(screen, cause);
            }
          }
        }),
      ]),
  ),

  /**
   * Galarian Darmanitan: a Choice Band it was born with. The lock is
   * the ability's, so it goes when the ability does or when the holder
   * leaves the field
   * https://bulbapedia.bulbagarden.net/wiki/Gorilla_Tactics_(Ability)
   */
  createAbility(Abilities.GorillaTactics, (battle) => {
    const committed = new Map<Unit, Moves>();

    function isLockedOut(unit: Unit, move: Moves): boolean {
      const locked = committed.get(unit);

      return (
        locked != null &&
        locked !== move &&
        !isPseudoMove(move) &&
        unit.hasAbility(Abilities.GorillaTactics)
      );
    }

    function release(unit: Unit, ability: Abilities): void {
      if (ability === Abilities.GorillaTactics) {
        committed.delete(unit);
      }
    }

    return new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
        if (event.stat === Stats.Attack && event.source.hasAbility(Abilities.GorillaTactics)) {
          event.value *= GORILLA_TACTICS_SCALE;
        }
      }),
      // The basic swing and Struggle are what it falls back on, never what it chose
      battle.on(BattleEvents.UnitCast, EventPriority.Post, (event) => {
        if (
          event.source.hasAbility(Abilities.GorillaTactics) &&
          !isPseudoMove(event.move) &&
          !committed.has(event.source)
        ) {
          committed.set(event.source, event.move);
        }
      }),
      battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, (event) => {
        if (event.success && isLockedOut(event.source, event.move)) {
          event.success = false;
        }
      }),
      // Told before it picks, or the AI keeps reaching for a refused move
      battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Post, (event) => {
        if (event.usable && isLockedOut(event.source, event.move)) {
          event.usable = false;
        }
      }),
      battle.on(BattleEvents.UnitRemoveAbility, EventPriority.Post, (event) => {
        release(event.source, event.ability);
      }),
      battle.on(BattleEvents.UnitDisableAbility, EventPriority.Post, (event) => {
        release(event.source, event.ability);
      }),
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        committed.delete(event.source);
      }),
    ]);
  }),

  /**
   * Galarian Yamask's line: a touch trades its Wandering Spirit for one
   * of the attacker's abilities, picked the way Skill Swap picks. An
   * attacker with nothing that can trade keeps what it has
   * https://bulbapedia.bulbagarden.net/wiki/Wandering_Spirit_(Ability)
   */
  createAbility(Abilities.WanderingSpirit, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      const { source, target } = event;

      if (
        !event.success ||
        !source.alive ||
        !target.alive ||
        source === target ||
        source.hasAbility(Abilities.WanderingSpirit) ||
        !target.hasAbility(Abilities.WanderingSpirit) ||
        !abilitiesOf(target).includes(Abilities.WanderingSpirit) ||
        !source.checkMoveContact(event.move, unitTarget(target))
      ) {
        return;
      }

      const theirs = abilitiesOf(source);

      if (theirs.length === 0) {
        return;
      }

      const taken =
        theirs[Math.min(theirs.length - 1, Math.floor(battle.random() * theirs.length))];

      target.triggerAbility(Abilities.WanderingSpirit);
      target.removeAbility(Abilities.WanderingSpirit);
      source.removeAbility(taken);
      target.addAbility(taken);
      source.addAbility(Abilities.WanderingSpirit);
    }),
  ),

  // Zacian and Zamazenta: each comes in with its weapon raised
  createIntrepidSwordAbility(Abilities.IntrepidSword, Stages.Attack),
  createIntrepidSwordAbility(Abilities.DauntlessShield, Stages.Defense),

  /**
   * Kubfu's line: its contact moves go through Protect, Detect and the
   * team guards, which break as anything walking through does
   * https://bulbapedia.bulbagarden.net/wiki/Unseen_Fist_(Ability)
   */
  createAbility(Abilities.UnseenFist, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveGuard, EventPriority.Post, (event) => {
      if (
        !event.walks &&
        event.source.hasAbility(Abilities.UnseenFist) &&
        event.source.checkMoveContact(event.move, event.target)
      ) {
        event.walks = true;
      }
    }),
  ),

  // Regieleki and Regidrago, on the Gen 9 numbers
  // https://bulbapedia.bulbagarden.net/wiki/Transistor_(Ability)
  createSteelworkerAbility(Abilities.Transistor, Types.Electric, TRANSISTOR_SCALE),
  createSteelworkerAbility(Abilities.DragonsMaw, Types.Dragon, DRAGONS_MAW_SCALE),

  // Glastrier and Spectrier: Moxie, on Attack and on Special Attack
  // https://bulbapedia.bulbagarden.net/wiki/Chilling_Neigh_(Ability)
  createMoxieAbility(Abilities.ChillingNeigh, Stages.Attack),
  createMoxieAbility(Abilities.GrimNeigh, Stages.SpecialAttack),
];

export default function setupGen8Abilities(battle: Battle): void {
  for (const setup of setupAbilities) {
    setup(battle);
  }
}
