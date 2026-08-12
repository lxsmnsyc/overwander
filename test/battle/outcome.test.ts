import { describe, expect, it } from 'vitest';
import Alliance from '../../src/battle/alliance';
import { BattleModes } from '../../src/battle/core';
import { EffectType, MoveTargetType } from '../../src/battle/events';
import setupOutcomeMechanics from '../../src/battle/mechanics/outcome';
import createRaidBattle from '../../src/battle/setup';
import Team from '../../src/battle/team';
import { Moves } from '../../src/data/ids/moves';
import { Statuses } from '../../src/data/ids/status';
import { createBattle, createUnit } from './harness';

const NONE_CAUSE = { type: EffectType.None } as const;

/**
 * The harness leaves the outcome scan out, since most tests want a
 * battle that never settles under them
 */
function createSettledBattle(): ReturnType<typeof createBattle> {
  const harness = createBattle();

  setupOutcomeMechanics(harness.battle);
  return harness;
}

describe('outcome mechanics', () => {
  it('settles once one side has nobody left', () => {
    const { battle, allianceA, teamA, teamB } = createSettledBattle();
    const winner = createUnit(battle, teamA);
    const loser = createUnit(battle, teamB);

    winner.addMove(Moves.Tackle);
    loser.addMove(Moves.Tackle);

    // Both sides still standing and able to act
    battle.tick(16);
    expect(battle.settled).toBe(false);
    expect(battle.winner).toBeNull();

    winner.damage(NONE_CAUSE, loser, 999, 0);
    expect(loser.alive).toBe(false);

    // Nothing settles until the scan runs
    expect(battle.settled).toBe(false);

    battle.tick(16);
    expect(battle.settled).toBe(true);
    expect(battle.winner).toBe(allianceA);
  });

  it('waits for a cast already under way while both sides stand', () => {
    const { battle, teamA, teamB } = createSettledBattle();
    const caster = createUnit(battle, teamA);
    const waiting = createUnit(battle, teamB);

    // Neither holds a move, so nothing but the cast can happen — and
    // the cast may yet decide it, so the scan holds off
    caster.casting = {
      move: Moves.Tackle,
      target: { type: MoveTargetType.Unit, unit: waiting },
      time: { progress: 0, duration: 1000 },
    };

    battle.tick(16);
    expect(battle.settled).toBe(false);

    // It resolves, and the stalemate underneath it settles
    caster.casting = undefined;
    battle.tick(16);
    expect(battle.settled).toBe(true);
  });

  it('settles a decided field without waiting for the wind-up', () => {
    const { battle, allianceA, teamA, teamB } = createSettledBattle();
    const winner = createUnit(battle, teamA);
    const victim = createUnit(battle, teamB);

    victim.faint(winner);
    winner.casting = {
      move: Moves.Tackle,
      target: { type: MoveTargetType.Unit, unit: victim },
      time: { progress: 0, duration: 1000 },
    };

    // One side left standing is a decided fight whatever the survivor
    // is winding up. Waiting for the field to fall quiet is waiting
    // for something that may never come: a survivor with a move that
    // reaches its own side can buff an empty field for ever, and a
    // lobby of them is never all idle on the same tick
    battle.tick(16);
    expect(battle.settled).toBe(true);
    expect(battle.winner).toBe(allianceA);
  });

  it('settles a stalemate neither side can break', () => {
    const { battle, teamA, teamB } = createSettledBattle();
    const left = createUnit(battle, teamA);
    const right = createUnit(battle, teamB);

    // Both alive, neither holding a move: nothing can happen again
    battle.tick(16);

    expect(battle.settled).toBe(true);
    expect(battle.winner).toBeNull();
    expect(left.alive && right.alive).toBe(true);
  });

  it('hands a mutual knockout in a raid to the party', () => {
    // A raid battle as the game builds it, boss side marked
    const battle = createRaidBattle('raid-seed', { mode: BattleModes.Raid });
    const boss = new Alliance(battle, true);
    const party = new Alliance(battle);
    const bossTeam = new Team(battle, boss);
    const partyTeam = new Team(battle, party);

    boss.addTeam(bossTeam);
    party.addTeam(partyTeam);

    const bossUnit = createUnit(battle, bossTeam);
    const partyUnit = createUnit(battle, partyTeam);

    // Both sides go down together
    bossUnit.faint(partyUnit);
    partyUnit.faint(bossUnit);

    battle.tick(16);
    expect(battle.settled).toBe(true);
    expect(battle.winner).toBe(party);
  });

  it('calls a mutual knockout outside a raid a draw', () => {
    const { battle, teamA, teamB } = createSettledBattle();
    const left = createUnit(battle, teamA);
    const right = createUnit(battle, teamB);

    left.faint(right);
    right.faint(left);

    battle.tick(16);
    expect(battle.settled).toBe(true);
    expect(battle.winner).toBeNull();
  });

  it('counts a unit locked out of its moves as unable to act', () => {
    const { battle, allianceB, teamA, teamB } = createSettledBattle();
    const locked = createUnit(battle, teamA);
    const free = createUnit(battle, teamB);

    locked.addMove(Moves.Tackle);
    free.addMove(Moves.Tackle);
    battle.tick(16);
    expect(battle.settled).toBe(false);

    // A sleeping unit cannot act, but the other side still can, so
    // the battle carries on rather than settling
    locked.addStatus(Statuses.Sleeping, NONE_CAUSE);
    battle.tick(16);
    expect(battle.settled).toBe(false);

    // Once the only side that can act is alone in that, a knockout
    // still names the winner
    locked.faint(free);
    battle.tick(16);
    expect(battle.settled).toBe(true);
    expect(battle.winner).toBe(allianceB);
  });
});
