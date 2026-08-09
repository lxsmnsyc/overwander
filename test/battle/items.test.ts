import { describe, expect, it } from 'vitest';
import { EffectType, MoveTargetType } from '../../src/battle/events';
import type Unit from '../../src/battle/unit';
import Abilities from '../../src/data/ids/abilities';
import { Items } from '../../src/data/ids/items';
import { Moves } from '../../src/data/ids/moves';
import { Statuses } from '../../src/data/ids/status';
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
