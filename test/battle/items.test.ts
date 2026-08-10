import { describe, expect, it } from 'vitest';
import { EffectType, MoveTargetType } from '../../src/battle/events';
import type Unit from '../../src/battle/unit';
import Abilities from '../../src/data/ids/abilities';
import { Items } from '../../src/data/ids/items';
import { MoveCategories, Moves } from '../../src/data/ids/moves';
import { Statuses } from '../../src/data/ids/status';
import { GEM_FACTOR } from '../../src/battle/items/gems';
import { LIFE_ORB_FACTOR, LIFE_ORB_RECOIL, ORB_DELAY } from '../../src/battle/items/orbs';
import { Stats } from '../../src/data/constants/stats';
import { Types } from '../../src/data/constants/types';
import { getMoveData } from '../../src/data/moves';
import { createBattle, createUnit } from './harness';

const NONE_CAUSE = { type: EffectType.None } as const;

function moveCause(
  unit: Unit,
  move = Moves.Tackle,
): { readonly type: EffectType.Move; readonly move: Moves; readonly unit: Unit } {
  return { type: EffectType.Move, move, unit } as const;
}

describe('status-cure berries', () => {
  it('cure the matching status and are consumed', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    holder.addItem(Items.CheriBerry);

    holder.addStatus(Statuses.Paralyzed, moveCause(attacker));

    expect(holder.status[Statuses.Paralyzed]).toBeUndefined();
    expect(holder.items[Items.CheriBerry]).toBeUndefined();
  });

  it('ignore statuses they do not cure', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    holder.addItem(Items.CheriBerry);

    holder.addStatus(Statuses.Poisoned, moveCause(attacker));

    expect(holder.status[Statuses.Poisoned]).toBeDefined();
    expect(holder.items[Items.CheriBerry]).toBe(true);
  });

  it('Lum Berry cures anything', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    holder.addItem(Items.LumBerry);

    holder.addStatus(Statuses.Burned, moveCause(attacker, Moves.Ember));

    expect(holder.status[Statuses.Burned]).toBeUndefined();
    expect(holder.items[Items.LumBerry]).toBeUndefined();
  });
});

describe('healing berries', () => {
  it('Sitrus Berry restores a quarter of max health at half health', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addItem(Items.SitrusBerry);

    holder.setHealth(100); // above half: no trigger
    expect(holder.items[Items.SitrusBerry]).toBe(true);

    holder.setHealth(80); // at half: eats

    expect(holder.health).toBe(120);
    expect(holder.items[Items.SitrusBerry]).toBeUndefined();
  });

  it('Oran Berry restores a flat amount once', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addItem(Items.OranBerry);

    holder.setHealth(50);

    expect(holder.health).toBe(60);
    expect(holder.items[Items.OranBerry]).toBeUndefined();
  });
});

describe('Leppa Berry', () => {
  it('clears the move cooldown as it starts', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addMove(Moves.Tackle);
    holder.addItem(Items.LeppaBerry);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    holder.startCooldown(Moves.Tackle, target);

    expect(holder.checkCanCast(Moves.Tackle, target)).toBe(true);
    expect(holder.items[Items.LeppaBerry]).toBeUndefined();
  });
});

describe('spent items', () => {
  it('remembers what left the unit and nothing it still holds', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const eater = createUnit(battle, teamB);
    const keeper = createUnit(battle, teamB);
    eater.addItem(Items.CheriBerry);
    keeper.addItem(Items.CheriBerry);

    eater.addStatus(Statuses.Paralyzed, moveCause(attacker));

    expect([...eater.consumed]).toStrictEqual([Items.CheriBerry]);
    expect(keeper.consumed.size).toBe(0);
  });

  it('leaves a berry that could not be eaten unspent', () => {
    const { battle, teamA, teamB } = createBattle();
    const unnerver = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    unnerver.addAbility(Abilities.Unnerve);
    unnerver.enter();
    holder.addItem(Items.CheriBerry);

    holder.addStatus(Statuses.Paralyzed, moveCause(unnerver));

    expect(holder.items[Items.CheriBerry]).toBe(true);
    expect(holder.consumed.size).toBe(0);
  });
});

describe('gems', () => {
  it('lifts one hit of its own type and is spent landing it', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);
    const target = { type: MoveTargetType.Unit, unit: defender } as const;
    const fire = getMoveData(Moves.Ember).power ?? 0;

    attacker.addItem(Items.FireGem);

    // Half again while it is held — and asking is not using: the AI
    // rates moves it never throws, and must not eat the gem doing it
    expect(attacker.checkMovePower(Moves.Ember, target)).toBeCloseTo(fire * GEM_FACTOR, 5);
    expect(attacker.items[Items.FireGem]).toBe(true);

    // A move of another type neither gains from it nor spends it
    attacker.attack(defender, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);
    expect(attacker.items[Items.FireGem]).toBe(true);

    attacker.attack(defender, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);

    // Landed, so it is gone — and what a unit spends comes off the
    // catch record when the battle ends
    expect(attacker.items[Items.FireGem]).toBeUndefined();
    expect([...attacker.consumed]).toStrictEqual([Items.FireGem]);
    expect(attacker.checkMovePower(Moves.Ember, target)).toBe(fire);
  });
});

describe('orbs', () => {
  it('pays for a Life Orb blow out of the one throwing it', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);
    const target = { type: MoveTargetType.Unit, unit: defender } as const;
    const tackle = getMoveData(Moves.Tackle).power ?? 0;
    const maxHealth = attacker.checkStat(Stats.HP, 0);

    attacker.addItem(Items.LifeOrb);

    expect(attacker.checkMovePower(Moves.Tackle, target)).toBeCloseTo(tackle * LIFE_ORB_FACTOR, 5);

    attacker.attack(defender, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    // A tenth of itself for the blow, and the orb stays: it is not
    // spent, it is simply what carrying one costs
    expect(attacker.health).toBe(maxHealth - Math.floor(maxHealth * LIFE_ORB_RECOIL));
    expect(attacker.items[Items.LifeOrb]).toBe(true);
  });

  it('burns and poisons whoever carries the affliction orbs', () => {
    const { battle, teamA, teamB } = createBattle();
    const burned = createUnit(battle, teamA);
    const poisoned = createUnit(battle, teamB);
    const plain = createUnit(battle, teamA);

    burned.addItem(Items.FlameOrb);
    poisoned.addItem(Items.ToxicOrb);

    // It takes a few seconds of carrying something that was never
    // safe to carry
    battle.tick(ORB_DELAY - 1);
    expect(burned.status[Statuses.Burned]).toBeUndefined();

    battle.tick(1);

    expect(burned.status[Statuses.Burned]).toBeDefined();
    expect(poisoned.status[Statuses.BadlyPoisoned]).toBeDefined();
    // Carrying nothing costs nothing
    expect(plain.status[Statuses.Burned]).toBeUndefined();
  });
});

describe('Unnerve', () => {
  it('prevents enemies from eating berries while up', () => {
    const { battle, teamA, teamB } = createBattle();
    const unnerver = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    const ally = createUnit(battle, teamA);
    unnerver.addAbility(Abilities.Unnerve);
    unnerver.enter();
    holder.addItem(Items.CheriBerry);
    ally.addItem(Items.CheriBerry);

    // The enemy of the Unnerve holder keeps its berry uneaten
    holder.addStatus(Statuses.Paralyzed, moveCause(unnerver));
    expect(holder.status[Statuses.Paralyzed]).toBeDefined();
    expect(holder.items[Items.CheriBerry]).toBe(true);

    // Unnerve does not affect its own side
    ally.addStatus(Statuses.Paralyzed, NONE_CAUSE);
    expect(ally.status[Statuses.Paralyzed]).toBeUndefined();
    expect(ally.items[Items.CheriBerry]).toBeUndefined();
  });

  it('berries trigger again once the Unnerve unit is gone', () => {
    const { battle, teamA, teamB } = createBattle();
    const unnerver = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    unnerver.addAbility(Abilities.Unnerve);
    unnerver.enter();
    holder.addItem(Items.SitrusBerry);

    holder.setHealth(80);
    expect(holder.items[Items.SitrusBerry]).toBe(true);

    attacker.damage(NONE_CAUSE, unnerver, 999, 0);

    holder.setHealth(79);
    expect(holder.health).toBe(119);
    expect(holder.items[Items.SitrusBerry]).toBeUndefined();
  });
});

describe('Gluttony', () => {
  it('eats pinch berries at a doubled threshold', () => {
    const { battle, teamA } = createBattle();
    const glutton = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    glutton.addAbility(Abilities.Gluttony);
    glutton.addItem(Items.SitrusBerry);
    plain.addItem(Items.SitrusBerry);

    // Above the normal 50% threshold but under Gluttony's doubled one
    glutton.setHealth(120);
    plain.setHealth(120);

    expect(glutton.items[Items.SitrusBerry]).toBeUndefined(); // eaten
    expect(glutton.health).toBe(160); // 120 + 160 / 4
    expect(plain.items[Items.SitrusBerry]).toBe(true); // still held
  });
});
