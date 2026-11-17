import { describe, expect, it } from 'vitest';
import type Battle from '../../src/battle/battle';
import { type MoveTarget, MoveTargetType } from '../../src/battle/events';
import type Unit from '../../src/battle/unit';
import Abilities from '../../src/data/ids/abilities';
import { Items } from '../../src/data/ids/items';
import { Moves } from '../../src/data/ids/moves';
import { createBattle, createUnit } from '../battle/harness';

interface Setup {
  battle: Battle;
  holder: Unit;
  enemy: Unit;
  target: MoveTarget;
}

function setup(item: Items, moves: Moves[]): Setup {
  const { battle, teamA, teamB } = createBattle();
  const holder = createUnit(battle, teamA);
  const enemy = createUnit(battle, teamB);

  for (const move of moves) {
    holder.addMove(move);
  }
  holder.addItem(item);

  return { battle, holder, enemy, target: { type: MoveTargetType.Unit, unit: enemy } as const };
}

describe('Ether', () => {
  it('halves the first cooldown that starts and is used up', () => {
    const { holder, target } = setup(Items.Ether, [Moves.Tackle, Moves.Growl]);
    const full = (() => {
      const probe = setup(Items.PokeBall, [Moves.Tackle]);

      probe.holder.startCooldown(Moves.Tackle, probe.target);
      return probe.holder.moves[Moves.Tackle]?.cooldown?.duration ?? 0;
    })();

    holder.startCooldown(Moves.Tackle, target);

    expect(holder.moves[Moves.Tackle]?.cooldown?.duration).toBeCloseTo(full / 2);
    expect(holder.items[Items.Ether]).toBeUndefined();

    // Once a battle: the next cooldown runs in full
    holder.startCooldown(Moves.Growl, target);
    expect(holder.moves[Moves.Growl]?.cooldown?.duration).toBeGreaterThan(0);
  });
});

describe('Max Ether', () => {
  it('clears the first cooldown that starts and is used up', () => {
    const { holder, target } = setup(Items.MaxEther, [Moves.Tackle]);

    holder.startCooldown(Moves.Tackle, target);

    expect(holder.checkCanCast(Moves.Tackle, target)).toBe(true);
    expect(holder.moves[Moves.Tackle]?.cooldown).toBeUndefined();
    expect(holder.items[Items.MaxEther]).toBeUndefined();
  });

  it('is not a berry, so an enemy Unnerve does not stop it', () => {
    const { battle, holder, enemy, target } = setup(Items.MaxEther, [Moves.Tackle]);

    enemy.addAbility(Abilities.Unnerve);
    enemy.enter();
    holder.enter();
    battle.tick(1);

    holder.startCooldown(Moves.Tackle, target);

    expect(holder.moves[Moves.Tackle]?.cooldown).toBeUndefined();
    expect(holder.items[Items.MaxEther]).toBeUndefined();
  });

  it('is stopped by Unnerve where a Leppa Berry is, to show the check is live', () => {
    const { battle, holder, enemy, target } = setup(Items.LeppaBerry, [Moves.Tackle]);

    enemy.addAbility(Abilities.Unnerve);
    enemy.enter();
    holder.enter();
    battle.tick(1);

    holder.startCooldown(Moves.Tackle, target);

    expect(holder.moves[Moves.Tackle]?.cooldown).toBeDefined();
    expect(holder.items[Items.LeppaBerry]).toBeDefined();
  });
});

describe('Elixir', () => {
  it('waits until every move is cooling down, then halves them all', () => {
    const { holder, target } = setup(Items.Elixir, [Moves.Tackle, Moves.Growl]);

    holder.startCooldown(Moves.Tackle, target);

    const first = holder.moves[Moves.Tackle]?.cooldown?.duration ?? 0;

    expect(holder.items[Items.Elixir]).toBeDefined();
    expect(first).toBeGreaterThan(0);

    holder.startCooldown(Moves.Growl, target);

    expect(holder.items[Items.Elixir]).toBeUndefined();
    expect(holder.moves[Moves.Tackle]?.cooldown?.duration).toBeCloseTo(first / 2);
    expect(holder.moves[Moves.Growl]?.cooldown).toBeDefined();
  });
});

describe('Max Elixir', () => {
  it('waits until every move is cooling down, then clears them all', () => {
    const { holder, target } = setup(Items.MaxElixir, [Moves.Tackle, Moves.Growl]);

    holder.startCooldown(Moves.Tackle, target);

    expect(holder.items[Items.MaxElixir]).toBeDefined();
    expect(holder.moves[Moves.Tackle]?.cooldown).toBeDefined();

    holder.startCooldown(Moves.Growl, target);

    expect(holder.items[Items.MaxElixir]).toBeUndefined();
    expect(holder.moves[Moves.Tackle]?.cooldown).toBeUndefined();
    expect(holder.moves[Moves.Growl]?.cooldown).toBeUndefined();
  });
});
