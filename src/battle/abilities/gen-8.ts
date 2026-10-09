import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stages, Stats } from '../../data/constants/stats';
import Abilities from '../../data/ids/abilities';
import { DamageFlags, MoveCategories, MoveFlags, Moves } from '../../data/ids/moves';
import { Species } from '../../data/ids/species';
import { Statuses, Weathers } from '../../data/ids/status';
import { getMoveData } from '../../data/moves';
import { registerWeatherWant } from '../ai/weather-wants';
import type Battle from '../core';
import { BattleEvents, type EffectCause, EffectType } from '../events';
import { MergedLifecycle } from '../lifecycle';
import type Unit from '../unit';
import { hasFreeItemSlot, isWeatherHail, onUnitActs } from '../utils';
import {
  createAbility,
  createBatteryAbility,
  createFurCoatAbility,
  createProteanAbility,
  createStalwartAbility,
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
];

export default function setupGen8Abilities(battle: Battle): void {
  for (const setup of setupAbilities) {
    setup(battle);
  }
}
