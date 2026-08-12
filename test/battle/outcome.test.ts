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
 * How long the field has to stay decided before the result is called.
 * It is the mechanic's own three seconds, written here so a test can
 * step over it rather than guess at it
 */
const GRACE = 3000;

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
  it('settles once one side has nobody left, after the countdown', () => {
    const { battle, allianceA, teamA, teamB } = createSettledBattle();
    const winner = createUnit(battle, teamA);
    const loser = createUnit(battle, teamB);

    winner.addMove(Moves.Tackle);
    loser.addMove(Moves.Tackle);

    battle.tick(16);
    expect(battle.settled).toBe(false);

    winner.damage(NONE_CAUSE, loser, 999, 0);
    expect(loser.alive).toBe(false);

    // The knockout does not end it on its own: the last hit may still
    // be in the air, and the field is given a moment to change
    battle.tick(16);
    expect(battle.settled).toBe(false);

    battle.tick(GRACE);
    expect(battle.settled).toBe(true);
    expect(battle.winner).toBe(allianceA);
  });

  it('gives the field the whole countdown again if it comes back to life', () => {
    const { battle, allianceA, teamA, teamB } = createSettledBattle();
    const winner = createUnit(battle, teamA);
    const loser = createUnit(battle, teamB);

    loser.faint(winner);
    battle.tick(GRACE - 500);
    expect(battle.settled).toBe(false);

    // Somebody else joins the losing side before the count runs out,
    // and the fight is a fight again
    const relief = createUnit(battle, teamB);

    battle.tick(GRACE);
    expect(battle.settled).toBe(false);

    // When it goes down in its turn the count starts over rather than
    // finishing where it left off
    relief.faint(winner);
    battle.tick(GRACE - 500);
    expect(battle.settled).toBe(false);

    battle.tick(600);
    expect(battle.settled).toBe(true);
    expect(battle.winner).toBe(allianceA);
  });

  it('leaves a fight running while both sides are alive but stuck', () => {
    const { battle, teamA, teamB } = createSettledBattle();
    const left = createUnit(battle, teamA);
    const right = createUnit(battle, teamB);

    // Neither holds a move and one of them is asleep, so nothing may
    // happen for a long while. That is not a result: a side that
    // cannot act has not lost, and calling it settled ended fights
    // with both parties still standing on the field
    left.addStatus(Statuses.Sleeping, NONE_CAUSE);
    battle.tick(GRACE * 4);

    expect(battle.settled).toBe(false);
    expect(left.alive && right.alive).toBe(true);
  });

  it('calls a decided field whatever the survivor is winding up', () => {
    const { battle, allianceA, teamA, teamB } = createSettledBattle();
    const winner = createUnit(battle, teamA);
    const victim = createUnit(battle, teamB);

    victim.faint(winner);
    winner.casting = {
      move: Moves.Tackle,
      target: { type: MoveTargetType.Unit, unit: victim },
      time: { progress: 0, duration: 1000 },
    };

    battle.tick(GRACE);
    expect(battle.settled).toBe(true);
    expect(battle.winner).toBe(allianceA);
  });

  it('hands a mutual knockout in a raid to the party', () => {
    const { battle, boss, party } = createRaid();

    battle.tick(GRACE);
    expect(battle.settled).toBe(true);
    expect(battle.winner).toBe(party);
    expect(battle.winner).not.toBe(boss);
  });

  it('still calls a raid the boss survives a loss', () => {
    const { battle, boss, bossUnit, partyUnit } = createRaid({ standing: 'boss' });

    battle.tick(GRACE);
    expect(battle.settled).toBe(true);
    expect(battle.winner).toBe(boss);
    expect(bossUnit.alive).toBe(true);
    expect(partyUnit.alive).toBe(false);
  });

  it('calls a mutual knockout between players a draw', () => {
    const { battle, teamA, teamB } = createSettledBattle();
    const left = createUnit(battle, teamA);
    const right = createUnit(battle, teamB);

    left.faint(right);
    right.faint(left);

    battle.tick(GRACE);
    expect(battle.settled).toBe(true);
    expect(battle.winner).toBeNull();
  });
});

/**
 * A raid as the game builds one — boss side marked — with both sides
 * knocked out, or only the party, depending on what is being asked
 */
function createRaid(options: { standing?: 'boss' } = {}): {
  battle: ReturnType<typeof createRaidBattle>;
  boss: Alliance;
  party: Alliance;
  bossUnit: ReturnType<typeof createUnit>;
  partyUnit: ReturnType<typeof createUnit>;
} {
  const battle = createRaidBattle('raid-seed', { mode: BattleModes.Raid });

  setupOutcomeMechanics(battle);

  const boss = new Alliance(battle, true);
  const party = new Alliance(battle);
  const bossTeam = new Team(battle, boss);
  const partyTeam = new Team(battle, party);

  boss.addTeam(bossTeam);
  party.addTeam(partyTeam);

  const bossUnit = createUnit(battle, bossTeam);
  const partyUnit = createUnit(battle, partyTeam);

  partyUnit.faint(bossUnit);

  if (options.standing !== 'boss') {
    bossUnit.faint(partyUnit);
  }
  return { battle, boss, party, bossUnit, partyUnit };
}
