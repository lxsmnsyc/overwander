// Treecko through Torkoal.

import { describe, expect, it } from 'vitest';
import {
  CHEER_MAX_SHOUTS,
  GROVE_DAMAGE_SCALE,
  GROVE_HEAL_FRACTION,
  GROWTH_MAX_STAGES,
} from '../../../../src/battle/abilities/signature/__create';
import { AttackPriority } from '../../../../src/core/event-emitter';
import { BattleEvents, EffectType, MoveTargetType } from '../../../../src/battle/events';
import { Stages, Stats, StatsKind } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { Items } from '../../../../src/data/ids/items';
import { DamageFlags, MoveCategories, MoveTargets, Moves } from '../../../../src/data/ids/moves';
import { Statuses, Weathers } from '../../../../src/data/ids/status';
import {
  STORED_BOUNCE_CAP,
  STORED_BOUNCE_SHARE,
} from '../../../../src/battle/abilities/signature/spoink-to-deoxys';
import turns from '../../../../src/battle/turn';
import {
  BODY_HEAT_SCALE,
  BOTTOMLESS_FRACTION,
  COCOON_DURATION,
  COCOON_SCALE,
  COCOON_THRESHOLD,
  CROOKED_RUN_MAX_STACKS,
  CROOKED_RUN_SCALE,
  ECHO_CHAMBER_DELAY,
  ECHO_CHAMBER_FRACTION,
  EMPATH_SCALE,
  EMPATH_THRESHOLD,
  FEEDING_FRENZY_MAX_STAGES,
  GULLS_GREED_SHARE,
  JOLT_START_SCALE,
  KITTEN_PACE_SCALE,
  LURE_SCENT_SCALE,
  MAGMA_VENT_FRACTION,
  MAGMA_VENT_THRESHOLD,
  MIND_OVER_BODY_SCALE,
  MYCELIUM_SCALE,
  ORE_HUNGER_FRACTION,
  PACK_HUNT_SCALE,
  PERENNIAL_HEAL_FRACTION,
  PERENNIAL_THRESHOLD,
  VANISHING_ACT_DURATION,
} from '../../../../src/battle/abilities/signature/treecko-to-torkoal';
import { unitTarget } from '../../../../src/battle/utils';
import { createBattle, createUnit, pinRandom } from '../../harness';
import {
  NONE_CAUSE,
  act,
  dealDamage,
  makeAttack,
  resolveAttackDamage,
  resolveAttackStat,
  rollMove,
  rolled,
} from './helpers';

describe('the Hoenn starters', () => {
  it('grows Sap Surge a stage of Speed for every action', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    createUnit(battle, teamB);
    holder.addAbility(Abilities.SapSurge);

    for (let grown = 1; grown <= GROWTH_MAX_STAGES; grown += 1) {
      act(battle, holder);

      expect(holder.stages[Stages.Speed]).toBe(grown);
    }

    // It only grows itself so far
    act(battle, holder);

    expect(holder.stages[Stages.Speed]).toBe(GROWTH_MAX_STAGES);

    // Taking the field again starts it over, stages and all
    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });
    act(battle, holder);

    expect(holder.stages[Stages.Speed]).toBe(GROWTH_MAX_STAGES + 1);
  });

  it('grows Ember Surge a stage of Attack for every blow that lands', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.EmberSurge);

    rollMove(battle, holder, enemy, Moves.Pound, true);

    expect(holder.stages[Stages.Attack]).toBe(1);

    // Acting is not landing
    act(battle, holder);

    expect(holder.stages[Stages.Attack]).toBe(1);
  });

  it('grows Silt Surge a stage of Special Defense for every hit taken', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SiltSurge);

    const blow = { type: EffectType.Move, move: Moves.Pound, unit: enemy } as const;

    enemy.damage(blow, holder, 10, 0);

    expect(holder.stages[Stages.SpecialDefense]).toBe(1);

    // Chip damage is not a blow
    enemy.damage(blow, holder, 10, DamageFlags.Indirect);

    expect(holder.stages[Stages.SpecialDefense]).toBe(1);
  });
});

describe('Pack Hunt', () => {
  it('hits harder at whatever an ally has already been at', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.PackHunt);

    const target = unitTarget(enemy);

    expect(holder.checkMovePower(Moves.Pound, target)).toBe(40);

    // Its own bite opens nothing up
    holder.damage({ type: EffectType.Move, move: Moves.Pound, unit: holder }, enemy, 10, 0);

    expect(holder.checkMovePower(Moves.Pound, target)).toBe(40);

    ally.damage({ type: EffectType.Move, move: Moves.Pound, unit: ally }, enemy, 10, 0);

    expect(holder.checkMovePower(Moves.Pound, target)).toBeCloseTo(40 * PACK_HUNT_SCALE, 5);
  });
});

describe('Crooked Run', () => {
  it('is harder to hit for every step it takes, until something lands', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.CrookedRun);

    const target = unitTarget(holder);
    const clean = enemy.checkMoveAccuracy(Moves.Pound, target);

    for (let steps = 1; steps <= CROOKED_RUN_MAX_STACKS + 2; steps += 1) {
      act(battle, holder);

      const kept = Math.min(CROOKED_RUN_MAX_STACKS, steps);

      expect(enemy.checkMoveAccuracy(Moves.Pound, target)).toBeCloseTo(
        (clean ?? 0) * CROOKED_RUN_SCALE ** kept,
        5,
      );
    }

    // Caught once, and the whole run counts for nothing
    enemy.damage(NONE_CAUSE, holder, 1, 0);

    expect(enemy.checkMoveAccuracy(Moves.Pound, target)).toBe(clean);
  });

  it('leaves a blow aimed at anybody else alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.CrookedRun);

    const clean = enemy.checkMoveAccuracy(Moves.Pound, unitTarget(ally));

    act(battle, holder);

    expect(enemy.checkMoveAccuracy(Moves.Pound, unitTarget(ally))).toBe(clean);
  });
});

describe('Cocoon', () => {
  it('shells over once, cutting both sides of a blow', () => {
    const { battle, teamA, teamB } = createBattle();
    // The damage roll is pinned, so the blows differ only by the shell
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Cocoon);

    const maxHP = holder.checkStat(Stats.HP, 0);
    const bare = resolveAttackDamage(battle, enemy, holder);
    const thrown = resolveAttackDamage(battle, holder, enemy);

    holder.setHealth(maxHP * COCOON_THRESHOLD + 10);
    enemy.damage(NONE_CAUSE, holder, 20, 0);

    expect(resolveAttackDamage(battle, enemy, holder)).toBeCloseTo(bare * COCOON_SCALE, 5);
    expect(resolveAttackDamage(battle, holder, enemy)).toBeCloseTo(thrown * COCOON_SCALE, 5);

    // The shell opens on its own, and it only ever grows one
    battle.tick(COCOON_DURATION);

    expect(resolveAttackDamage(battle, enemy, holder)).toBeCloseTo(bare, 5);

    holder.setHealth(maxHP * COCOON_THRESHOLD - 1);
    enemy.damage(NONE_CAUSE, holder, 1, 0);

    expect(resolveAttackDamage(battle, enemy, holder)).toBeCloseTo(bare, 5);
  });
});

describe('the Lotad and Seedot pair', () => {
  it('calls up its own sky as it takes the field', () => {
    const { battle, teamA } = createBattle();
    const lotad = createUnit(battle, teamA);
    lotad.addAbility(Abilities.WaterBloom);

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: lotad,
      reactivation: false,
    });
    battle.tick(turns(1));

    expect(battle.weather.current).toBe(Weathers.Rain);

    const seedot = createUnit(battle, teamA);
    seedot.addAbility(Abilities.SunRoot);

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: seedot,
      reactivation: false,
    });
    battle.tick(turns(1));

    // Whichever arrived last owns the sky, which is how the two cancel
    expect(battle.weather.current).toBe(Weathers.Sunny);
  });

  it('pays the water half in health and the sun half in damage', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const lotad = createUnit(battle, teamA);
    const seedot = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    lotad.addAbility(Abilities.WaterBloom);
    seedot.addAbility(Abilities.SunRoot);

    const maxHP = lotad.checkStat(Stats.HP, 0);
    const clean = resolveAttackDamage(battle, seedot, enemy);

    lotad.setHealth(maxHP / 2);
    lotad.setWeather(Weathers.Rain);

    act(battle, lotad);

    expect(lotad.health - maxHP / 2).toBeCloseTo(maxHP * GROVE_HEAL_FRACTION, 5);

    // Nothing for the sun half while the rain stands
    expect(resolveAttackDamage(battle, seedot, enemy)).toBeCloseTo(clean, 5);

    seedot.setWeather(Weathers.Sunny);
    lotad.setHealth(maxHP / 2);

    act(battle, lotad);

    expect(lotad.health).toBe(maxHP / 2);
    expect(resolveAttackDamage(battle, seedot, enemy)).toBeCloseTo(clean * GROVE_DAMAGE_SCALE, 5);
  });
});

describe("Migrant's Wind", () => {
  it('casts Tailwind over its side as it arrives', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.MigrantsWind);

    let cast: Moves | undefined;
    battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
      if (event.target.type === MoveTargetType.Team) {
        cast = event.move;
      }
    });

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });

    expect(cast).toBe(Moves.Tailwind);
  });
});

describe("Gull's Greed", () => {
  it('takes its cut out of an enemy heal', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.GullsGreed);

    const maxHP = holder.checkStat(Stats.HP, 0);
    holder.setHealth(maxHP / 2);
    enemy.setHealth(1);

    enemy.heal(NONE_CAUSE, enemy, 40, 0);

    expect(enemy.health).toBeCloseTo(1 + 40 * (1 - GULLS_GREED_SHARE), 5);
    expect(holder.health).toBeCloseTo(maxHP / 2 + 40 * GULLS_GREED_SHARE, 5);

    // Nothing taken out of its own side's healing
    const ally = createUnit(battle, teamA);
    ally.setHealth(1);

    ally.heal(NONE_CAUSE, ally, 40, 0);

    expect(ally.health).toBeCloseTo(41, 5);
  });
});

describe('Empath', () => {
  it('answers for whatever its side is carrying', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Empath);

    const parent = makeAttack(holder, enemy, Moves.Ember, Types.Fire, MoveCategories.Special);

    expect(resolveAttackStat(battle, parent, holder, Stats.SpecialAttack, 100)).toBe(100);

    ally.setHealth(ally.checkStat(Stats.HP, 0) * EMPATH_THRESHOLD - 1);

    expect(resolveAttackStat(battle, parent, holder, Stats.SpecialAttack, 100)).toBeCloseTo(
      100 * EMPATH_SCALE,
      5,
    );

    // Its own hurt is not the side's, and the physical half is untouched
    ally.setHealth(ally.checkStat(Stats.HP, 0));
    holder.setHealth(1);

    expect(resolveAttackStat(battle, parent, holder, Stats.SpecialAttack, 100)).toBe(100);
  });
});

describe('Surface Walk', () => {
  it('lets the hazards and the weather pass under it', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SurfaceWalk);

    const maxHP = holder.checkStat(Stats.HP, 0);

    enemy.damage(
      { type: EffectType.Move, move: Moves.Spikes, unit: enemy },
      holder,
      maxHP / 8,
      DamageFlags.Indirect,
    );

    expect(holder.health).toBe(maxHP);

    holder.damage(
      { type: EffectType.Weather, weather: Weathers.Sandstorm, unit: holder },
      holder,
      maxHP / 16,
      DamageFlags.Indirect,
    );

    expect(holder.health).toBe(maxHP);

    // A blow is still a blow
    enemy.damage({ type: EffectType.Move, move: Moves.Pound, unit: enemy }, holder, maxHP / 4, 0);

    expect(holder.health).toBeLessThan(maxHP);
  });
});

describe('Mycelium', () => {
  it('feeds on whatever is already sick, whichever side is carrying it', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Mycelium);

    const cleanOut = resolveAttackDamage(battle, holder, enemy);
    const cleanIn = resolveAttackDamage(battle, enemy, holder);

    enemy.addStatus(Statuses.Poisoned, NONE_CAUSE);

    expect(resolveAttackDamage(battle, holder, enemy)).toBeCloseTo(cleanOut * MYCELIUM_SCALE, 5);

    // Its own side is no exception: the fungus does not pick a team
    holder.addStatus(Statuses.Burned, NONE_CAUSE);

    expect(resolveAttackDamage(battle, enemy, holder)).toBeCloseTo(cleanIn * MYCELIUM_SCALE, 5);
  });
});

describe('Wide Swing', () => {
  it('widens a physical move over the whole far side', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.WideSwing);

    expect(holder.checkMoveTargeting(Moves.Tackle).target).toBe(MoveTargets.None);

    // A special move and a status move still pick their one target
    expect(holder.checkMoveTargeting(Moves.Ember).target).toBe(MoveTargets.Unit);
    expect(holder.checkMoveTargeting(Moves.SleepPowder).target).toBe(MoveTargets.Unit);

    // And nobody else swings that wide
    expect(enemy.checkMoveTargeting(Moves.Tackle).target).toBe(MoveTargets.Unit);
  });
});

describe('Vanishing Act', () => {
  it('cannot be found for a moment after it strikes', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.VanishingAct);

    expect(rolled(battle, enemy, holder, Moves.Pound)).toBe(true);

    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(rolled(battle, enemy, holder, Moves.Pound)).toBe(false);

    // A move that covers the whole side finds it anyway
    expect(rolled(battle, enemy, holder, Moves.Earthquake)).toBe(true);

    // It comes back up on its own
    battle.tick(VANISHING_ACT_DURATION);

    expect(rolled(battle, enemy, holder, Moves.Pound)).toBe(true);
  });

  it('is taken out of the running while it is gone', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.VanishingAct);

    function usable(): boolean {
      const event = {
        id: 'CheckUnitAIMoveUsable',
        disabled: false,
        source: enemy,
        move: Moves.Pound,
        target: unitTarget(holder),
        usable: true,
      };
      battle.emit(BattleEvents.CheckUnitAIMoveUsable, event);
      return event.usable;
    }

    expect(usable()).toBe(true);

    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(usable()).toBe(false);
  });
});

describe('Echo Chamber', () => {
  it('sends a sound move back off the walls', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.EchoChamber);

    const shout = dealDamage(holder, enemy, Moves.Uproar, 90, Types.Normal, MoveCategories.Special);
    const before = enemy.health;

    battle.tick(ECHO_CHAMBER_DELAY);

    expect(before - enemy.health).toBeCloseTo(shout * ECHO_CHAMBER_FRACTION, 5);
  });

  it('has nothing to say about a move that is not sound', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.EchoChamber);

    dealDamage(holder, enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical);

    const before = enemy.health;

    battle.tick(ECHO_CHAMBER_DELAY);

    expect(enemy.health).toBe(before);
  });
});

describe('Shove', () => {
  it('costs an enemy the cast it was winding up', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Shove);
    enemy.addMove(Moves.Ember);

    enemy.cast(Moves.Ember, unitTarget(holder));

    expect(enemy.casting).not.toBeUndefined();

    holder.attack(enemy, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(enemy.status[Statuses.Flinched]).not.toBeUndefined();
    expect(enemy.casting).toBeUndefined();
  });

  it('has nothing to shove when the enemy is standing still', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Shove);

    holder.attack(enemy, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(enemy.status[Statuses.Flinched]).toBeUndefined();
  });
});

describe('Magnetize', () => {
  it('pulls what was aimed at an ally onto itself', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Magnetize);
    enemy.addMove(Moves.Ember);

    enemy.cast(Moves.Ember, unitTarget(ally));

    expect(enemy.casting?.target).toEqual(unitTarget(holder));
  });

  it('leaves a spread move and a move aimed at its own side alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);
    holder.addAbility(Abilities.Magnetize);
    enemy.addMove(Moves.Growl);

    // Aimed at its own side, so there is nothing coming to pull
    enemy.cast(Moves.Growl, unitTarget(other));

    expect(enemy.casting?.target).toEqual(unitTarget(other));
  });
});

describe('Kitten Pace', () => {
  it('plays fastest while nothing has caught it', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    const bare = createUnit(battle, teamA);
    holder.addAbility(Abilities.KittenPace);

    const clean = bare.checkStat(Stats.Speed, 0);

    expect(holder.checkStat(Stats.Speed, 0)).toBeCloseTo(clean * KITTEN_PACE_SCALE, 5);

    holder.setHealth(holder.checkStat(Stats.HP, 0) - 1);

    expect(holder.checkStat(Stats.Speed, 0)).toBeCloseTo(clean, 5);
  });
});

describe('the Sableye and Mawile pair', () => {
  it('knocks the highest raise off, and keeps it on the other half', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const sableye = createUnit(battle, teamA);
    const mawile = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    sableye.addAbility(Abilities.ShadowTax);
    mawile.addAbility(Abilities.JawClaim);

    enemy.addStage(Stages.Attack, 3, NONE_CAUSE);
    enemy.addStage(Stages.Defense, 1, NONE_CAUSE);

    sableye.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    // The highest raise is the one taken, and nobody keeps it
    expect(enemy.stages[Stages.Attack]).toBe(2);
    expect(enemy.stages[Stages.Defense]).toBe(1);
    expect(sableye.stages[Stages.Attack]).toBe(0);

    mawile.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(enemy.stages[Stages.Attack]).toBe(1);
    expect(mawile.stages[Stages.Attack]).toBe(1);
  });

  it('has nothing to take off a target that has raised nothing', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const mawile = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    mawile.addAbility(Abilities.JawClaim);

    enemy.addStage(Stages.Speed, -2, NONE_CAUSE);

    mawile.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(enemy.stages[Stages.Speed]).toBe(-2);
    expect(mawile.stages[Stages.Speed]).toBe(0);
  });
});

describe('Ore Hunger', () => {
  it('eats a blow of steel, rock or earth', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.OreHunger);

    const maxHP = holder.checkStat(Stats.HP, 0);
    holder.setHealth(maxHP / 2);

    enemy.damage({ type: EffectType.Move, move: Moves.RockThrow, unit: enemy }, holder, 100, 0);

    expect(holder.health).toBeCloseTo(maxHP / 2 + 100 * ORE_HUNGER_FRACTION, 5);

    // Anything else is still a blow
    holder.setHealth(maxHP);
    enemy.damage({ type: EffectType.Move, move: Moves.Pound, unit: enemy }, holder, 100, 0);

    expect(holder.health).toBeCloseTo(maxHP - 100, 5);
  });
});

describe('Mind Over Body', () => {
  it('takes half of what lands while it is holding a move together', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.MindOverBody);
    holder.addMove(Moves.Ember);

    const clean = resolveAttackDamage(battle, enemy, holder);

    holder.cast(Moves.Ember, unitTarget(enemy));

    expect(resolveAttackDamage(battle, enemy, holder)).toBeCloseTo(clean * MIND_OVER_BODY_SCALE, 5);

    holder.stopCast();

    expect(resolveAttackDamage(battle, enemy, holder)).toBeCloseTo(clean, 5);
  });
});

describe('Jolt Start', () => {
  it('puts the opening move ahead of everything, and nothing after it', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const bare = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.JoltStart);

    const target = unitTarget(enemy);
    const clean = bare.checkMovePower(Moves.Pound, target) ?? 0;

    expect(holder.checkMovePriority(Moves.Pound, target)).toBe(1);
    expect(holder.checkMovePower(Moves.Pound, target)).toBeCloseTo(clean * JOLT_START_SCALE, 5);

    act(battle, holder);

    // The jolt still covers the move it went off with, but nothing is
    // coming out ahead any more
    expect(holder.checkMovePower(Moves.Pound, target)).toBeCloseTo(clean * JOLT_START_SCALE, 5);
    expect(holder.checkMovePriority(Moves.Pound, target)).toBe(0);

    act(battle, holder);

    expect(holder.checkMovePower(Moves.Pound, target)).toBeCloseTo(clean, 5);
  });
});

describe('the Plusle and Minun pair', () => {
  it('lifts the ally that needs it and drags the best enemy down', () => {
    const { battle, teamA, teamB } = createBattle();
    const plusle = createUnit(battle, teamA);
    const minun = createUnit(battle, teamA);
    const hurt = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    plusle.addAbility(Abilities.CheerOn);
    minun.addAbility(Abilities.JeerAt);

    hurt.setHealth(hurt.checkStat(Stats.HP, 0) / 4);
    hurt.setStat(StatsKind.Base, Stats.Attack, 200);
    enemy.setStat(StatsKind.Base, Stats.Speed, 200);

    act(battle, plusle);

    expect(hurt.stages[Stages.Attack]).toBe(1);

    act(battle, minun);

    expect(enemy.stages[Stages.Speed]).toBe(-1);
  });

  it('only has so many shouts in it', () => {
    const { battle, teamA, teamB } = createBattle();
    const plusle = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    createUnit(battle, teamB);
    plusle.addAbility(Abilities.CheerOn);

    ally.setHealth(1);
    ally.setStat(StatsKind.Base, Stats.Attack, 200);

    for (let shouts = 0; shouts < CHEER_MAX_SHOUTS + 2; shouts += 1) {
      act(battle, plusle);
    }

    expect(ally.stages[Stages.Attack]).toBe(CHEER_MAX_SHOUTS);
  });
});

describe('the Volbeat and Illumise pair', () => {
  it('leaves the far side nowhere to hide and nobody quick', () => {
    const { battle, teamA, teamB } = createBattle();
    const volbeat = createUnit(battle, teamA);
    const illumise = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    // Measured before the pair lights up, since the aura covers the
    // whole far side
    const clean = enemy.checkStat(Stats.Speed, 0);

    volbeat.addAbility(Abilities.TailLight);
    illumise.addAbility(Abilities.LureScent);

    enemy.addStage(Stages.Evasion, 3, NONE_CAUSE);

    expect(enemy.checkStage(Stages.Evasion, 0)).toBe(0);
    expect(enemy.checkStat(Stats.Speed, 0)).toBeCloseTo(clean * LURE_SCENT_SCALE, 5);

    // Neither aura reaches its own side
    volbeat.addStage(Stages.Evasion, 2, NONE_CAUSE);

    expect(volbeat.checkStage(Stages.Evasion, 0)).toBe(2);
  });

  it('takes the light and the scent with it when it goes', () => {
    const { battle, teamA, teamB } = createBattle();
    const volbeat = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    volbeat.addAbility(Abilities.TailLight);

    enemy.addStage(Stages.Evasion, 2, NONE_CAUSE);

    expect(enemy.checkStage(Stages.Evasion, 0)).toBe(0);

    volbeat.faint(enemy);

    expect(enemy.checkStage(Stages.Evasion, 0)).toBe(2);
  });
});

describe('Perennial', () => {
  it('flowers again once, clean', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Perennial);

    const maxHP = holder.checkStat(Stats.HP, 0);
    holder.setHealth(maxHP * PERENNIAL_THRESHOLD + 10);
    holder.addStatus(Statuses.Poisoned, NONE_CAUSE);

    enemy.damage(NONE_CAUSE, holder, 20, 0);

    expect(holder.status[Statuses.Poisoned]).toBeUndefined();
    expect(holder.health).toBeCloseTo(
      maxHP * PERENNIAL_THRESHOLD - 10 + maxHP * PERENNIAL_HEAL_FRACTION,
      5,
    );

    // Only ever the once
    holder.setHealth(maxHP * PERENNIAL_THRESHOLD - 1);
    const before = holder.health;

    enemy.damage(NONE_CAUSE, holder, 1, 0);

    expect(holder.health).toBeCloseTo(before - 1, 5);
  });
});

describe('Bottomless', () => {
  it('feeds on whatever anybody else spends', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Bottomless);

    const maxHP = holder.checkStat(Stats.HP, 0);
    holder.setHealth(maxHP / 2);

    enemy.addItem(Items.SitrusBerry);
    enemy.setHealth(enemy.checkStat(Stats.HP, 0) / 4);
    battle.tick(turns(1));

    expect(enemy.items[Items.SitrusBerry]).toBeUndefined();
    expect(holder.health).toBeCloseTo(maxHP / 2 + maxHP * BOTTOMLESS_FRACTION, 5);
  });

  it('gets nothing from an item knocked out of a hand', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Bottomless);

    const maxHP = holder.checkStat(Stats.HP, 0);
    holder.setHealth(maxHP / 2);

    enemy.addItem(Items.Leftovers);
    enemy.removeItem(Items.Leftovers, { type: EffectType.Move, move: Moves.Pound, unit: holder });

    expect(holder.health).toBeCloseTo(maxHP / 2, 5);
  });
});

describe('Feeding Frenzy', () => {
  it('takes a step for each enemy that falls, up to the cap', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.FeedingFrenzy);

    const meals = [];
    for (let index = 0; index < FEEDING_FRENZY_MAX_STAGES + 1; index += 1) {
      meals.push(createUnit(battle, teamB));
    }

    for (const [index, meal] of meals.entries()) {
      meal.faint(holder);

      expect(holder.stages[Stages.Attack]).toBe(Math.min(FEEDING_FRENZY_MAX_STAGES, index + 1));
    }
  });

  it('is fed by nothing on its own side', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.FeedingFrenzy);

    ally.faint(enemy);

    expect(holder.stages[Stages.Attack]).toBe(0);
  });
});

describe('Spout', () => {
  it('widens a Water move over the whole far side', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Spout);

    expect(holder.checkMoveTargeting(Moves.WaterGun).target).toBe(MoveTargets.None);

    // Anything that is not Water still picks its one target
    expect(holder.checkMoveTargeting(Moves.Ember).target).toBe(MoveTargets.Unit);

    // And nobody else spouts
    expect(enemy.checkMoveTargeting(Moves.WaterGun).target).toBe(MoveTargets.Unit);
  });
});

describe('Magma Vent', () => {
  it('empties the hump over the far side once', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const first = createUnit(battle, teamB);
    const second = createUnit(battle, teamB);
    holder.addAbility(Abilities.MagmaVent);

    const maxHP = holder.checkStat(Stats.HP, 0);
    holder.setHealth(maxHP * MAGMA_VENT_THRESHOLD + 10);

    first.damage(NONE_CAUSE, holder, 20, 0);

    for (const enemy of [first, second]) {
      const theirs = enemy.checkStat(Stats.HP, 0);

      expect(theirs - enemy.health).toBeCloseTo(theirs * MAGMA_VENT_FRACTION, 5);
    }

    // Only ever the once
    const before = first.health;

    holder.setHealth(maxHP * MAGMA_VENT_THRESHOLD - 1);
    first.damage(NONE_CAUSE, holder, 1, 0);

    expect(first.health).toBe(before);
  });
});

describe('Body Heat', () => {
  it('counts both defences higher under its own sun', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.BodyHeat);

    const defense = holder.checkStat(Stats.Defense, 0);
    const special = holder.checkStat(Stats.SpecialDefense, 0);
    const attack = holder.checkStat(Stats.Attack, 0);

    holder.setWeather(Weathers.Sunny);

    expect(holder.checkStat(Stats.Defense, 0)).toBeCloseTo(defense * BODY_HEAT_SCALE, 5);
    expect(holder.checkStat(Stats.SpecialDefense, 0)).toBeCloseTo(special * BODY_HEAT_SCALE, 5);

    // Nothing about what it hits with
    expect(holder.checkStat(Stats.Attack, 0)).toBeCloseTo(attack, 5);
  });
});

describe('Stored Bounce', () => {
  it('keeps half of what lands on it and gives the lot back', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.StoredBounce);

    enemy.damage({ type: EffectType.Move, move: Moves.Pound, unit: enemy }, holder, 80, 0);

    const before = enemy.health;
    const dealt = dealDamage(holder, enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical);

    // The blow itself plus the stored half of the 80 it took
    expect(before - enemy.health).toBeCloseTo(dealt, 5);
    expect(dealt).toBeGreaterThan(80 * STORED_BOUNCE_SHARE);

    // The bank empties on that one blow
    const second = dealDamage(
      holder,
      enemy,
      Moves.Pound,
      40,
      Types.Normal,
      MoveCategories.Physical,
    );

    expect(second).toBeLessThan(dealt - 80 * STORED_BOUNCE_SHARE + 1);
  });

  it('holds no more than half its own HP', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.StoredBounce);

    const maxHP = holder.checkStat(Stats.HP, 0);

    for (let hits = 0; hits < 8; hits += 1) {
      enemy.damage({ type: EffectType.Move, move: Moves.Pound, unit: enemy }, holder, maxHP / 4, 0);
      holder.setHealth(maxHP);
    }

    const bare = createUnit(battle, teamA);
    const clean = dealDamage(bare, enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical);
    const loaded = dealDamage(
      holder,
      enemy,
      Moves.Pound,
      40,
      Types.Normal,
      MoveCategories.Physical,
    );

    expect(loaded - clean).toBeCloseTo(maxHP * STORED_BOUNCE_CAP, 0);
  });
});
