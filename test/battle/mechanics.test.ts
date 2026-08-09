import { describe, expect, it } from 'vitest';
import { EventPriority } from '../../src/core/event-emitter';
import { BattleModes } from '../../src/battle/core';
import { BattleEvents, EffectType, MoveTargetType } from '../../src/battle/events';
import type Unit from '../../src/battle/unit';
import { Stages, Stats, StatsKind } from '../../src/data/constants/stats';
import { Types } from '../../src/data/constants/types';
import Abilities from '../../src/data/ids/abilities';
import { Items } from '../../src/data/ids/items';
import { DamageFlags, MoveCategories, Moves, StatFlags } from '../../src/data/ids/moves';
import { Species } from '../../src/data/ids/species';
import { Weathers } from '../../src/data/ids/status';
import { getSpeciesAbilities } from '../../src/data/species';
import { createBattle, createUnit, pinRandom } from './harness';

const NONE_CAUSE = { type: EffectType.None } as const;

function unitTarget(unit: Unit): { readonly type: MoveTargetType.Unit; readonly unit: Unit } {
  return { type: MoveTargetType.Unit, unit } as const;
}

describe('damage mechanics', () => {
  it('lethal damage clamps to zero and faints the target', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const victim = createUnit(battle, teamB);

    attacker.damage(NONE_CAUSE, victim, 999, 0);

    expect(victim.health).toBe(0);
    expect(victim.alive).toBe(false);
  });

  it('non-lethal damage leaves the target at one health', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const victim = createUnit(battle, teamB);

    attacker.damage(NONE_CAUSE, victim, 999, DamageFlags.NonLethal);

    expect(victim.health).toBe(1);
    expect(victim.alive).toBe(true);
  });

  it('healing clamps at max health', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);
    unit.setHealth(150);

    unit.heal(NONE_CAUSE, unit, 50, 0);

    expect(unit.health).toBe(160);
  });
});

describe('stat and stage mechanics', () => {
  it('computes battle stats from level and base stats', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);

    expect(unit.checkStat(Stats.HP, 0)).toBe(160);
    expect(unit.checkStat(Stats.Attack, 0)).toBe(105);
  });

  it('clamps stages at plus and minus six', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);

    unit.addStage(Stages.Attack, 8, NONE_CAUSE);
    expect(unit.stages[Stages.Attack]).toBe(6);

    unit.addStage(Stages.Attack, -20, NONE_CAUSE);
    expect(unit.stages[Stages.Attack]).toBe(-6);
  });

  it('applies the stage factor when resolving stats', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);

    unit.addStage(Stages.Attack, 2, NONE_CAUSE);
    expect(unit.resolveStat(Stats.Attack, StatFlags.Attack)).toBe(210);

    unit.addStage(Stages.Attack, -4, NONE_CAUSE);
    expect(unit.resolveStat(Stats.Attack, StatFlags.Attack)).toBe(52.5);
  });

  it('resets stages when the unit leaves the field', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);

    unit.addStage(Stages.Attack, 2, NONE_CAUSE);
    unit.leave();

    expect(unit.stages[Stages.Attack]).toBe(0);
  });
});

describe('type effectiveness and STAB', () => {
  it('doubles and halves damage by the type chart', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const fire = createUnit(battle, teamB, [Types.Fire]);
    const water = createUnit(battle, teamB, [Types.Water]);

    attacker.attack(fire, Moves.WaterGun, 40, Types.Water, MoveCategories.Special, 0);
    expect(160 - fire.health).toBeCloseTo(19.6 * 2);

    attacker.attack(water, Moves.WaterGun, 40, Types.Water, MoveCategories.Special, 0);
    expect(160 - water.health).toBeCloseTo(19.6 * 0.5);
  });

  it('immune targets fail the move at targeting', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const ghost = createUnit(battle, teamB, [Types.Ghost]);

    attacker.triggerMoveTarget(Moves.Tackle, unitTarget(ghost), 0);

    expect(ghost.health).toBe(160);
  });

  it('boosts same-type moves by 1.5', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const grass = createUnit(battle, teamA, [Types.Grass]);
    const defender = createUnit(battle, teamB);

    grass.attack(defender, Moves.VineWhip, 45, Types.Grass, MoveCategories.Physical, 0);

    expect(160 - defender.health).toBeCloseTo((0.44 * 45 + 2) * 1.5);
  });
});

describe('critical hits', () => {
  it('double the damage when the roll passes', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0); // crit always, damage range at 85%
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);

    attacker.attack(
      defender,
      Moves.Tackle,
      40,
      Types.Normal,
      MoveCategories.Physical,
      2, // MoveAttackFlags.Critical
    );

    expect(160 - defender.health).toBeCloseTo(19.6 * 2 * 0.85);
  });
});

describe('species mechanics', () => {
  it('applies stats, types, and appearance on species change', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);

    unit.setSpecies(Species.Bulbasaur);

    expect(unit.species).toBe(Species.Bulbasaur);
    expect(unit.appearance).toBe(Species.Bulbasaur);
    expect(unit.types.has(Types.Grass)).toBe(true);
    expect(unit.types.has(Types.Poison)).toBe(true);
    expect(unit.stats[StatsKind.Base][Stats.Attack]).toBe(49);

    unit.setAppearance(Species.Charmander);
    expect(unit.appearance).toBe(Species.Charmander);
    expect(unit.species).toBe(Species.Bulbasaur);
  });
});

describe('casting flow', () => {
  it('casts, resolves the move, and starts the cooldown', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);
    attacker.addMove(Moves.Tackle);

    attacker.cast(Moves.Tackle, unitTarget(defender));
    expect(attacker.casting).toBeDefined();
    expect(defender.health).toBe(160);

    // Base cast time is 104 frames at 60fps (~1733ms)
    battle.tick(1800);

    expect(attacker.casting).toBeUndefined();
    expect(defender.health).toBeCloseTo(160 - 19.6);

    // Tackle is now on cooldown (180 / 35 PP ~ 5143ms)
    expect(attacker.checkCanCast(Moves.Tackle, unitTarget(defender))).toBe(false);

    battle.tick(5200);
    expect(attacker.checkCanCast(Moves.Tackle, unitTarget(defender))).toBe(true);
  });

  it('priority moves cast faster', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);
    const target = unitTarget(defender);

    const tackle = attacker.checkMoveCastTime(Moves.Tackle, target);
    const quickAttack = attacker.checkMoveCastTime(Moves.QuickAttack, target);

    expect(quickAttack).toBeLessThan(tackle);
  });

  it('interruption stops the cast without resolving the move', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);
    attacker.addMove(Moves.Tackle);

    attacker.cast(Moves.Tackle, unitTarget(defender));
    battle.tick(500);
    attacker.interrupt();

    expect(attacker.casting).toBeUndefined();

    battle.tick(3000);
    expect(defender.health).toBe(160);
  });
});

describe('move delay', () => {
  it('resolves the visual delay from move data with listener overrides', () => {
    const { battle, teamA, teamB } = createBattle();
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    // Contact moves have no projectile: defaults to zero
    expect(unit.checkMoveDelay(Moves.Tackle, target)).toBe(0);

    // Projectile moves declare their flight time in data
    expect(unit.checkMoveDelay(Moves.Ember, target)).toBe(250);

    // The visual layer can nudge it per battle
    battle.on(BattleEvents.CheckUnitMoveDelay, EventPriority.Post, (event) => {
      event.duration += 250;
    });

    expect(unit.checkMoveDelay(Moves.Tackle, target)).toBe(250);
  });
});

describe('battle limits', () => {
  it('caps items and abilities at the default of one each', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);

    unit.addItem(Items.CheriBerry);
    unit.addItem(Items.OranBerry); // over the limit

    expect(unit.items[Items.CheriBerry]).toBe(true);
    expect(unit.items[Items.OranBerry]).toBeUndefined();

    unit.addAbility(Abilities.RunAway);
    unit.addAbility(Abilities.Limber); // over the limit

    expect(unit.abilities[Abilities.RunAway]).toBe(true);
    expect(unit.abilities[Abilities.Limber]).toBeUndefined();
  });

  it('honors configured limits', () => {
    const { battle, teamA } = createBattle('test-seed', { items: 2, abilities: 2 });
    const unit = createUnit(battle, teamA);

    unit.addItem(Items.CheriBerry);
    unit.addItem(Items.OranBerry);
    unit.addAbility(Abilities.RunAway);
    unit.addAbility(Abilities.Limber);

    expect(unit.items[Items.OranBerry]).toBe(true);
    expect(unit.abilities[Abilities.Limber]).toBe(true);
  });
});

describe('species abilities', () => {
  it('evolved species learn their pre-evolutions abilities', () => {
    // Vileplume's own set plus Gloom's Stench and Oddish's Run Away
    const vileplume = getSpeciesAbilities(Species.Vileplume);

    expect(vileplume.has(Abilities.EffectSpore)).toBe(true);
    expect(vileplume.has(Abilities.Chlorophyll)).toBe(true);
    expect(vileplume.has(Abilities.Stench)).toBe(true);
    expect(vileplume.has(Abilities.RunAway)).toBe(true);

    // Base species only know their own set
    const oddish = getSpeciesAbilities(Species.Oddish);

    expect(oddish.has(Abilities.Stench)).toBe(false);
    expect(oddish.size).toBe(2);
  });
});

describe('weather chip damage', () => {
  it('sandstorm chips a sixteenth of max health per interval', () => {
    const { battle, teamA, teamB } = createBattle();
    const unit = createUnit(battle, teamA);
    const rocky = createUnit(battle, teamB);
    rocky.types.add(Types.Rock);

    battle.setWeather(Weathers.Sandstorm);

    battle.tick(500);
    expect(unit.health).toBe(160);

    battle.tick(500);
    expect(unit.health).toBe(150);
    expect(rocky.health).toBe(160);

    battle.tick(1000);
    expect(unit.health).toBe(140);
  });

  it('hail chips everyone but Ice types', () => {
    const { battle, teamA, teamB } = createBattle();
    const unit = createUnit(battle, teamA);
    const icy = createUnit(battle, teamB);
    icy.types.add(Types.Ice);

    battle.setWeather(Weathers.Hail);
    battle.tick(1000);

    expect(unit.health).toBe(150);
    expect(icy.health).toBe(160);
  });

  it('stops chipping when the weather clears', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);

    battle.setWeather(Weathers.Sandstorm);
    battle.tick(1000);
    expect(unit.health).toBe(150);

    battle.setWeather(Weathers.None);
    battle.tick(1000);
    expect(unit.health).toBe(150);
  });

  it('team-local weather only chips exposed units', () => {
    const { battle, teamA, teamB } = createBattle();
    const exposed = createUnit(battle, teamA);
    const sheltered = createUnit(battle, teamB);

    teamA.setWeather(Weathers.Hail);
    battle.tick(1000);

    expect(exposed.health).toBe(150);
    expect(sheltered.health).toBe(160);
  });
});

describe('battle modes', () => {
  it('raid weather changes only affect the changing team', () => {
    const { battle, teamA, teamB } = createBattle('test-seed', undefined, BattleModes.Raid);
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    unit.setWeather(Weathers.Rain);

    expect(teamA.weather.current).toBe(Weathers.Rain);
    expect(battle.weather.current).toBe(Weathers.None);
    expect(unit.checkWeather()).toBe(Weathers.Rain);
    expect(enemy.checkWeather()).toBe(Weathers.None);
  });

  it('boss raid weather lands battle-wide', () => {
    const { battle, teamA, teamB } = createBattle('test-seed', undefined, BattleModes.Raid);
    const boss = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    boss.addAbility(Abilities.Boss);

    boss.setWeather(Weathers.Sandstorm);

    expect(battle.weather.current).toBe(Weathers.Sandstorm);
    expect(enemy.checkWeather()).toBe(Weathers.Sandstorm);
  });

  it('pvp weather changes are battle-wide', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);

    unit.setWeather(Weathers.Rain);

    expect(battle.weather.current).toBe(Weathers.Rain);
  });

  it('battle weather outranks team weather', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);

    teamA.weather.current = Weathers.Sunny;
    battle.setWeather(Weathers.Rain);

    expect(unit.checkWeather()).toBe(Weathers.Rain);
  });
});
