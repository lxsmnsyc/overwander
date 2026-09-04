import { describe, expect, it } from 'vitest';
import type Battle from '../../../src/battle/core';
import type { MoveTarget } from '../../../src/battle/events';
import { BattleEvents, EffectType, MoveTargetType } from '../../../src/battle/events';
import type Unit from '../../../src/battle/unit';
import { Types } from '../../../src/data/constants/types';
import Abilities from '../../../src/data/ids/abilities';
import { Moves } from '../../../src/data/ids/moves';
import { Statuses } from '../../../src/data/ids/status';
import { createBattle, createUnit } from '../harness';

const NONE_CAUSE = { type: EffectType.None } as const;

/** What the AI asks before it scores a move at all. */
function usable(battle: Battle, source: Unit, move: Moves, target: MoveTarget): boolean {
  const event = {
    id: 'CheckUnitAIMoveUsable',
    disabled: false,
    source,
    move,
    target,
    usable: true,
  };

  battle.emit(BattleEvents.CheckUnitAIMoveUsable, event);
  return event.usable;
}

describe('Queenly Majesty', () => {
  it('turns away a move that cuts ahead of the queue', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    holder.addAbility(Abilities.QueenlyMajesty);

    const target = { type: MoveTargetType.Unit, unit: holder } as const;

    // Quick Attack is priority +1; Tackle waits its turn like anything
    expect(attacker.checkMoveImmunity(Moves.QuickAttack, target, Types.Normal)).toBe(true);
    expect(attacker.checkMoveImmunity(Moves.Tackle, target, Types.Normal)).toBe(false);
  });

  it('covers the whole side, and never the caster', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    const ally = createUnit(battle, teamB);
    holder.addAbility(Abilities.QueenlyMajesty);

    expect(
      attacker.checkMoveImmunity(
        Moves.QuickAttack,
        { type: MoveTargetType.Unit, unit: ally },
        Types.Normal,
      ),
    ).toBe(true);

    // Its own side is not shut out of its own queue
    expect(
      holder.checkMoveImmunity(
        Moves.QuickAttack,
        { type: MoveTargetType.Unit, unit: ally },
        Types.Normal,
      ),
    ).toBe(false);
  });
});

describe('Comatose', () => {
  it('takes no status at all, sleep included', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.Comatose);

    for (const status of [
      Statuses.Sleeping,
      Statuses.Burned,
      Statuses.Paralyzed,
      Statuses.Poisoned,
      Statuses.BadlyPoisoned,
      Statuses.Frozen,
    ]) {
      holder.addStatus(status, NONE_CAUSE);
      expect(holder.status[status], `${status} landed on a comatose unit`).toBeUndefined();
    }
  });

  it('puts the unit in a sleep of its own that nothing lifts', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.Comatose);

    expect(holder.status[Statuses.Comatose]).toBeDefined();

    // Not a status condition, so a cure walks straight past it
    holder.cure(NONE_CAUSE);
    expect(holder.status[Statuses.Comatose]).toBeDefined();

    // And not a move lock either: it casts exactly as an awake unit
    // beside it does
    const awake = createUnit(battle, teamA);
    const target = { type: MoveTargetType.Unit, unit: awake } as const;

    holder.addMove(Moves.Tackle);
    awake.addMove(Moves.Tackle);

    expect(awake.checkCanCast(Moves.Tackle, target)).toBe(true);
    expect(holder.checkCanCast(Moves.Tackle, target)).toBe(true);

    // Where a real sleep would have stopped it
    awake.addStatus(Statuses.Sleeping, NONE_CAUSE);
    expect(awake.checkCanCast(Moves.Tackle, target)).toBe(false);
  });

  it('is a sleeper to whatever hunts one', () => {
    const { battle, teamA, teamB } = createBattle();
    const hunter = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    holder.addAbility(Abilities.Comatose);

    const target = { type: MoveTargetType.Unit, unit: holder } as const;

    // Dream Eater and Nightmare both want a sleeper and now find one
    expect(usable(battle, hunter, Moves.DreamEater, target)).toBe(true);
    expect(usable(battle, hunter, Moves.Nightmare, target)).toBe(true);

    // And it can cast the two moves only a sleeper can
    expect(usable(battle, holder, Moves.Snore, target)).toBe(true);
  });

  it('loses the sleep with the ability', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.Comatose);
    holder.removeAbility(Abilities.Comatose);

    expect(holder.status[Statuses.Comatose]).toBeUndefined();
  });
});
