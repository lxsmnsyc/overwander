// Hisui's regional lines and Enamorus.

import { describe, expect, it } from 'vitest';
import { GENIE_SCALE } from '../../../../src/battle/abilities/signature/__create';
import {
  AFTERHAUNT_DURATION,
  SOUL_CLOAK_SCALE,
  VENOM_FEAST_SHARE,
  WATCHFIRE_SCALE,
} from '../../../../src/battle/abilities/signature/hisuian-forms';
import type Battle from '../../../../src/battle/core';
import { EffectType } from '../../../../src/battle/events';
import turns from '../../../../src/battle/turn';
import type Unit from '../../../../src/battle/unit';
import { unitTarget } from '../../../../src/battle/utils';
import { Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { Items } from '../../../../src/data/ids/items';
import { DamageFlags, MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Species } from '../../../../src/data/ids/species';
import { Statuses } from '../../../../src/data/ids/status';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { NONE_CAUSE, dealDamage } from './helpers';

type Blow = readonly [Moves, number, Types, MoveCategories];

const TACKLE: Blow = [Moves.Tackle, 40, Types.Normal, MoveCategories.Physical];
const EMBER: Blow = [Moves.Ember, 40, Types.Fire, MoveCategories.Special];
const MOONBLAST: Blow = [Moves.Moonblast, 95, Types.Fairy, MoveCategories.Special];
const FELL: Blow = [Moves.Tackle, 1000, Types.Normal, MoveCategories.Physical];

/** Long enough for any cast move to be wound up and then land */
const FLIGHT = 1000;

function max(unit: Unit): number {
  return unit.checkStat(Stats.HP, 0);
}

function land(battle: Battle): void {
  battle.tick(FLIGHT);
  battle.tick(FLIGHT);
}

/** A poison laid by somebody on the other side, so its residual bites */
function poison(victim: Unit, by: Unit): void {
  victim.addStatus(Statuses.Poisoned, { type: EffectType.Move, unit: by, move: Moves.PoisonGas });
}

describe('Watchfire', () => {
  it('casts its next move at an enemy going for a teammate 40% faster, once', () => {
    const { battle, teamA, teamB } = createBattle();
    const dog = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);

    pinRandom(battle, 1);
    dog.addAbility(Abilities.Watchfire);
    dog.addMove(Moves.Tackle);
    foe.addMove(Moves.Tackle);

    const base = dog.checkMoveCastTime(Moves.Tackle, unitTarget(foe));

    foe.cast(Moves.Tackle, unitTarget(mate));

    expect(dog.checkMoveCastTime(Moves.Tackle, unitTarget(foe))).toBeCloseTo(
      base * WATCHFIRE_SCALE,
      5,
    );
    // Only the enemy that went for its charge is marked
    expect(dog.checkMoveCastTime(Moves.Tackle, unitTarget(other))).toBe(base);

    dog.cast(Moves.Tackle, unitTarget(foe));

    expect(dog.casting?.time.duration).toBeCloseTo(base * WATCHFIRE_SCALE, 5);
    expect(dog.checkMoveCastTime(Moves.Tackle, unitTarget(foe))).toBe(base);
  });

  it('marks nobody for a cast aimed at itself', () => {
    const { battle, teamA, teamB } = createBattle();
    const dog = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    dog.addAbility(Abilities.Watchfire);
    foe.addMove(Moves.Tackle);

    const base = dog.checkMoveCastTime(Moves.Tackle, unitTarget(foe));

    foe.cast(Moves.Tackle, unitTarget(dog));

    expect(dog.checkMoveCastTime(Moves.Tackle, unitTarget(foe))).toBe(base);
  });
});

describe('Husk Burst', () => {
  it('casts Leech Seed on every enemy the first time it drops below half', () => {
    const { battle, teamA, teamB } = createBattle();
    const ball = createUnit(battle, teamA);
    const near = createUnit(battle, teamB);
    const far = createUnit(battle, teamB);

    pinRandom(battle, 0);
    ball.addAbility(Abilities.HuskBurst);

    near.damage(NONE_CAUSE, ball, 10, 0);
    battle.tick(FLIGHT);

    expect(near.status[Statuses.Seeding]).toBeUndefined();

    near.damage(NONE_CAUSE, ball, max(ball) / 2, 0);
    battle.tick(FLIGHT);

    for (const enemy of [near, far]) {
      const seed = enemy.status[Statuses.Seeding];

      expect(seed?.type).toBe(EffectType.Move);
      expect(seed?.type === EffectType.Move && seed.unit).toBe(ball);
    }

    // Spent: a second drop seeds nobody new
    near.removeStatus(Statuses.Seeding, NONE_CAUSE);
    ball.setHealth(max(ball));
    near.damage(NONE_CAUSE, ball, max(ball) / 2 + 1, 0);
    battle.tick(FLIGHT);

    expect(near.status[Statuses.Seeding]).toBeUndefined();
  });
});

describe('Venom Feast', () => {
  it('heals half of what poison costs the enemy side', () => {
    const { battle, teamA, teamB } = createBattle();
    const fish = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    fish.addAbility(Abilities.VenomFeast);
    fish.setHealth(max(fish) / 2);
    poison(foe, fish);

    battle.tick(turns(1));

    const lost = max(foe) - foe.health;

    expect(lost).toBeGreaterThan(0);
    expect(fish.health).toBeCloseTo(max(fish) / 2 + lost * VENOM_FEAST_SHARE, 5);
  });

  it('heals nothing from poison on its own side', () => {
    const { battle, teamA, teamB } = createBattle();
    const fish = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    fish.addAbility(Abilities.VenomFeast);
    fish.setHealth(max(fish) / 2);
    poison(mate, foe);

    battle.tick(turns(1));

    expect(mate.health).toBeLessThan(max(mate));
    expect(fish.health).toBe(max(fish) / 2);
  });
});

describe('Nerve Venom', () => {
  it('paralyses a poisoned target it touches and leaves the poison on', () => {
    const { battle, teamA, teamB } = createBattle();
    const cat = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const clean = createUnit(battle, teamB);

    pinRandom(battle, 0);
    cat.addAbility(Abilities.NerveVenom);
    poison(foe, cat);

    dealDamage(cat, foe, ...TACKLE);
    dealDamage(cat, clean, ...TACKLE);

    expect(foe.status[Statuses.Paralyzed]).toBeDefined();
    expect(foe.status[Statuses.Poisoned]).toBeDefined();
    expect(clean.status[Statuses.Paralyzed]).toBeUndefined();

    // Both keep working: the poison still bites and Speed is halved
    const standing = foe.health;
    battle.tick(turns(1));

    expect(foe.health).toBeLessThan(standing);
    expect(foe.checkStat(Stats.Speed, 0)).toBeLessThan(clean.checkStat(Stats.Speed, 0));
  });

  it('numbs nothing without contact, or when the roll misses', () => {
    const { battle, teamA, teamB } = createBattle();
    const cat = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 0);
    cat.addAbility(Abilities.NerveVenom);
    poison(foe, cat);

    dealDamage(cat, foe, ...EMBER);

    expect(foe.status[Statuses.Paralyzed]).toBeUndefined();

    pinRandom(battle, 0.3);
    dealDamage(cat, foe, ...TACKLE);

    expect(foe.status[Statuses.Paralyzed]).toBeUndefined();
  });
});

describe('Afterhaunt', () => {
  it('lingers on 1 HP out of reach and still fighting, then falls', () => {
    const { battle, teamA, teamB } = createBattle();
    const fox = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    fox.addAbility(Abilities.Afterhaunt);
    fox.addMove(Moves.Tackle);
    foe.addMove(Moves.Tackle);

    dealDamage(foe, fox, ...FELL);

    expect(fox.alive).toBe(true);
    expect(fox.health).toBe(1);

    // Untouchable: neither a blow nor indirect damage lands
    dealDamage(foe, fox, ...TACKLE);
    foe.damage(NONE_CAUSE, fox, 10, DamageFlags.Indirect);

    expect(fox.health).toBe(1);

    // Still fighting, while a cast at it finds nothing to hit
    fox.cast(Moves.Tackle, unitTarget(foe));
    foe.cast(Moves.Tackle, unitTarget(fox));
    land(battle);

    expect(foe.health).toBeLessThan(max(foe));
    expect(fox.health).toBe(1);
    expect(fox.alive).toBe(true);

    battle.tick(AFTERHAUNT_DURATION);

    expect(fox.alive).toBe(false);
  });

  it('lingers only once per fight', () => {
    const { battle, teamA, teamB } = createBattle();
    const fox = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    fox.addAbility(Abilities.Afterhaunt);

    dealDamage(foe, fox, ...FELL);
    battle.tick(AFTERHAUNT_DURATION);

    expect(fox.alive).toBe(false);

    fox.revive(max(fox));
    dealDamage(foe, fox, ...FELL);

    expect(fox.alive).toBe(false);
  });
});

describe('Soul Cloak', () => {
  it('takes the next blow at 1/2 after a teammate faints, one cloak at a time', () => {
    const { battle, teamA, teamB } = createBattle();
    const fish = createUnit(battle, teamA);
    const first = createUnit(battle, teamA);
    const second = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    fish.addAbility(Abilities.SoulCloak);

    const bare = dealDamage(foe, fish, ...TACKLE);

    dealDamage(foe, first, ...FELL);
    dealDamage(foe, second, ...FELL);

    expect(first.alive).toBe(false);
    expect(second.alive).toBe(false);

    fish.setHealth(max(fish));

    expect(dealDamage(foe, fish, ...TACKLE)).toBeCloseTo(bare * SOUL_CLOAK_SCALE, 0);

    fish.setHealth(max(fish));

    // Two souls were one cloak
    expect(dealDamage(foe, fish, ...TACKLE)).toBe(bare);
  });

  it('is not wrapped by a fallen enemy', () => {
    const { battle, teamA, teamB } = createBattle();
    const fish = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);

    pinRandom(battle, 1);
    fish.addAbility(Abilities.SoulCloak);

    const bare = dealDamage(foe, fish, ...TACKLE);

    dealDamage(fish, other, ...FELL);
    fish.setHealth(max(fish));

    expect(dealDamage(foe, fish, ...TACKLE)).toBe(bare);
  });
});

describe('Bloomfall', () => {
  it("lifts its team's Fairy moves to 1.3x and nothing else", () => {
    const { battle, teamA, teamB } = createBattle();
    const spring = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);

    const fairy = dealDamage(mate, foe, ...MOONBLAST);
    foe.setHealth(max(foe));
    const plain = dealDamage(mate, foe, ...EMBER);
    foe.setHealth(max(foe));

    spring.addAbility(Abilities.Bloomfall);

    expect(dealDamage(mate, foe, ...MOONBLAST)).toBeCloseTo(fairy * GENIE_SCALE, 0);
    foe.setHealth(max(foe));
    expect(dealDamage(mate, foe, ...EMBER)).toBe(plain);
  });

  it('shows Enamorus holding the Reveal Glass in its Therian shape, with Overcoat', () => {
    const { battle, teamA } = createBattle();
    const spring = createUnit(battle, teamA);
    spring.setSpecies(Species.Enamorus);
    spring.addAbility(Abilities.Bloomfall);
    spring.addItem(Items.RevealGlass);

    spring.enter();

    expect(spring.species).toBe(Species.EnamorusTherian);
    expect(spring.hasAbility(Abilities.Overcoat)).toBe(true);
    expect(spring.hasAbility(Abilities.Bloomfall)).toBe(true);
  });
});
