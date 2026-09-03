import { describe, expect, it } from 'vitest';
import {
  BattleEvents,
  type CheckUnitAIMoveScoreEvent,
  type CheckUnitAIMoveUsableEvent,
  MoveTargetType,
} from '../../../src/battle/events';
import { beatUpStrikes } from '../../../src/battle/moves/beat-up';
import Abilities from '../../../src/data/ids/abilities';
import { PERISH_DURATION } from '../../../src/battle/status/perishing';
import type Unit from '../../../src/battle/unit';
import { MAX_STAGE, Stages, Stats, StatsKind } from '../../../src/data/constants/stats';
import { Types } from '../../../src/data/constants/types';
import { MoveTargetFlags, Moves } from '../../../src/data/ids/moves';
import { Statuses, TeamStatuses, Weathers } from '../../../src/data/ids/status';
import { MOVE_DELAY } from '../../../src/battle/mechanics/move';
import turns from '../../../src/battle/turn';
import { type BattleHarness, createBattle, createUnit, pinRandom } from '../harness';
import { BASE_SCORE } from '../../../src/battle/ai/score';
import { setupChooseMoveAI } from '../../../src/battle/ai/choose-move';
import { getMoveData } from '../../../src/data/moves';

function unitTarget(unit: Unit): { readonly type: MoveTargetType.Unit; readonly unit: Unit } {
  return { type: MoveTargetType.Unit, unit } as const;
}

const NONE_TARGET = { type: MoveTargetType.None } as const;

function usable(battle: BattleHarness['battle'], source: Unit, move: Moves, aim: Unit): boolean {
  const event: CheckUnitAIMoveUsableEvent = {
    id: 'CheckUnitAIMoveUsable',
    disabled: false,
    source,
    move,
    target: unitTarget(aim),
    usable: true,
  };

  battle.emit(BattleEvents.CheckUnitAIMoveUsable, event);
  return event.usable;
}

function score(battle: BattleHarness['battle'], source: Unit, move: Moves, aim: Unit): number {
  const event: CheckUnitAIMoveScoreEvent = {
    id: 'CheckUnitAIMoveScore',
    disabled: false,
    source,
    move,
    target: unitTarget(aim),
    score: BASE_SCORE,
  };

  battle.emit(BattleEvents.CheckUnitAIMoveScore, event);
  return event.score;
}

describe('the guards', () => {
  it('turns away what somebody else aims at the user', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const guard = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);

    guard.triggerMoveEffect(Moves.Protect, NONE_TARGET, 0);
    expect(guard.status[Statuses.Protected]).toBeDefined();

    attacker.triggerMoveTarget(Moves.Tackle, unitTarget(guard), 0);
    expect(guard.health).toBe(160);
  });

  it('fails when it is held twice over', () => {
    const { battle, teamA } = createBattle();
    const guard = createUnit(battle, teamA);

    guard.triggerMove(Moves.Protect, NONE_TARGET, 0);
    guard.triggerMoveEffect(Moves.Protect, NONE_TARGET, 0);
    guard.removeStatus(Statuses.Protected, { type: 0 });

    guard.triggerMove(Moves.Protect, NONE_TARGET, 0);
    guard.triggerMoveEffect(Moves.Protect, NONE_TARGET, 0);
    expect(guard.status[Statuses.Protected]).toBeUndefined();
  });

  it('keeps an enduring unit on its feet', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const brace = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);

    brace.setHealth(5);
    brace.triggerMoveEffect(Moves.Endure, NONE_TARGET, 0);
    attacker.triggerMoveTarget(Moves.Tackle, unitTarget(brace), 0);

    expect(brace.alive).toBe(true);
    expect(brace.health).toBe(1);
  });

  it('leaves False Swipe unable to finish anything off', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);

    defender.setHealth(3);
    attacker.triggerMoveTarget(Moves.FalseSwipe, unitTarget(defender), 0);

    expect(defender.alive).toBe(true);
    expect(defender.health).toBe(1);
  });
});

describe('Curse', () => {
  it('trades a stage of Speed for Attack and Defense in anything but a Ghost', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA, [Types.Normal]);
    const defender = createUnit(battle, teamB);

    user.triggerMoveEffect(Moves.Curse, unitTarget(defender), 0);

    expect(user.stages[Stages.Attack]).toBe(1);
    expect(user.stages[Stages.Defense]).toBe(1);
    expect(user.stages[Stages.Speed]).toBe(-1);
    expect(defender.status[Statuses.Cursed]).toBeUndefined();
  });

  it('costs a Ghost half its health and bites when the target acts', () => {
    const { battle, teamA, teamB } = createBattle();
    const ghost = createUnit(battle, teamA, [Types.Ghost]);
    const defender = createUnit(battle, teamB);

    ghost.triggerMoveEffect(Moves.Curse, unitTarget(defender), 0);

    expect(ghost.health).toBe(80);
    expect(defender.status[Statuses.Cursed]).toBeDefined();

    defender.addMove(Moves.Tackle);
    defender.cast(Moves.Tackle, unitTarget(ghost));
    expect(defender.health).toBe(120); // a quarter of 160
  });
});

describe('Perish Song', () => {
  it('takes everything that heard it down when the count runs out', () => {
    const { battle, teamA, teamB } = createBattle();
    const singer = createUnit(battle, teamA);
    const listener = createUnit(battle, teamB);

    singer.triggerMoveEffect(Moves.PerishSong, unitTarget(listener), 0);
    expect(listener.status[Statuses.Perishing]).toBeDefined();

    battle.tick(PERISH_DURATION - 1);
    expect(listener.alive).toBe(true);

    battle.tick(2);
    expect(listener.alive).toBe(false);
  });

  it('never lands on a boss, whoever sang it', () => {
    const { battle, teamA, teamB } = createBattle();
    const singer = createUnit(battle, teamA);
    const boss = createUnit(battle, teamB);

    boss.addAbility(Abilities.Boss);
    singer.triggerMoveEffect(Moves.PerishSong, unitTarget(boss), 0);
    expect(boss.status[Statuses.Perishing]).toBeUndefined();

    // Its own song is refused too: a boss that knows the move would
    // otherwise sing itself to death
    boss.triggerMoveEffect(Moves.PerishSong, unitTarget(boss), 0);
    expect(boss.status[Statuses.Perishing]).toBeUndefined();

    battle.tick(PERISH_DURATION + 1);
    expect(boss.alive).toBe(true);
  });
});

describe('Destiny Bond', () => {
  it('takes whoever knocks the user out with it', () => {
    const { battle, teamA, teamB } = createBattle();
    const bonded = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);

    bonded.triggerMoveEffect(Moves.DestinyBond, NONE_TARGET, 0);
    bonded.setHealth(1);
    attacker.damage({ type: 0 }, bonded, 50, 0);

    expect(bonded.alive).toBe(false);
    expect(attacker.alive).toBe(false);
  });
});

describe('Belly Drum', () => {
  it('spends half the health and pins Attack at the top', () => {
    const { battle, teamA } = createBattle();
    const drummer = createUnit(battle, teamA);

    drummer.triggerMoveEffect(Moves.BellyDrum, NONE_TARGET, 0);

    expect(drummer.health).toBe(80);
    expect(drummer.stages[Stages.Attack]).toBe(MAX_STAGE);
  });
});

describe('Pain Split', () => {
  it('leaves both sides on the same health', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    user.setHealth(20);
    target.setHealth(160);
    user.triggerMoveEffect(Moves.PainSplit, unitTarget(target), 0);

    expect(user.health).toBe(90);
    expect(target.health).toBe(90);
  });
});

describe('Psych Up', () => {
  it('copies the target stages over the user own', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    target.addStage(Stages.Attack, 2, { type: 0 });
    target.addStage(Stages.Speed, -1, { type: 0 });
    user.triggerMoveEffect(Moves.PsychUp, unitTarget(target), 0);

    expect(user.stages[Stages.Attack]).toBe(2);
    expect(user.stages[Stages.Speed]).toBe(-1);
  });
});

describe('Heal Bell and Safeguard', () => {
  it('puts the whole party right', () => {
    const { battle, teamA } = createBattle();
    const ringer = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);

    mate.addStatus(Statuses.Poisoned, { type: 0 });
    ringer.triggerMoveEffect(Moves.HealBell, NONE_TARGET, 0);

    expect(mate.status[Statuses.Poisoned]).toBeUndefined();
  });

  it('keeps the other side from putting a status on', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const guard = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);

    guard.triggerMoveEffect(Moves.Safeguard, NONE_TARGET, 0);
    expect(guard.team.status[TeamStatuses.Safeguard]).toBeDefined();

    attacker.triggerMoveEffect(Moves.ThunderWave, unitTarget(guard), 0);
    expect(guard.status[Statuses.Paralyzed]).toBeUndefined();
  });
});

describe('the moves that read the fight', () => {
  it('hits harder the less health Flail has left', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    user.setHealth(160);
    expect(user.checkMovePower(Moves.Flail, unitTarget(target))).toBe(20);

    user.setHealth(4);
    expect(user.checkMovePower(Moves.Flail, unitTarget(target))).toBe(200);
  });

  it('reads friendship for Return and its mirror', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    user.friendship = 255;
    expect(user.checkMovePower(Moves.Return, unitTarget(target))).toBe(102);
    expect(user.checkMovePower(Moves.Frustration, unitTarget(target))).toBe(1);

    user.friendship = 0;
    expect(user.checkMovePower(Moves.Return, unitTarget(target))).toBe(1);
    expect(user.checkMovePower(Moves.Frustration, unitTarget(target))).toBe(102);
  });

  it('cuts through its own passes, doubling each time', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    // Four cuts in one cast, the way a Rollout rolls
    expect(user.checkMoveSteps(Moves.FuryCutter, unitTarget(target))).toBe(3);

    for (const [steps, expected] of [
      [3, 40],
      [2, 80],
      [1, 160],
      [0, 320],
    ] as const) {
      user.triggerMove(Moves.FuryCutter, unitTarget(target), steps);
      expect(user.checkMovePower(Moves.FuryCutter, unitTarget(target))).toBe(expected);
    }

    // And the next cast starts from the first cut again
    user.triggerMove(Moves.FuryCutter, unitTarget(target), 3);
    expect(user.checkMovePower(Moves.FuryCutter, unitTarget(target))).toBe(40);
  });

  it('rolls Rollout through its own passes, doubling each time', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    // Five passes in one cast rather than five casts in a row
    expect(user.checkMoveSteps(Moves.Rollout, unitTarget(target))).toBe(4);

    for (const [steps, expected] of [
      [4, 30],
      [3, 60],
      [2, 120],
      [1, 240],
      [0, 480],
    ] as const) {
      user.triggerMove(Moves.Rollout, unitTarget(target), steps);
      expect(user.checkMovePower(Moves.Rollout, unitTarget(target))).toBe(expected);
    }

    // And the next cast starts the roll over
    user.triggerMove(Moves.Rollout, unitTarget(target), 4);
    expect(user.checkMovePower(Moves.Rollout, unitTarget(target))).toBe(30);
  });

  it('doubles a Rollout again for the pokemon that curled up first', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    user.triggerMove(Moves.DefenseCurl, NONE_TARGET, 0);
    user.triggerMove(Moves.Rollout, unitTarget(target), 4);

    expect(user.checkMovePower(Moves.Rollout, unitTarget(target))).toBe(60);
  });

  it('gives Hidden Power a type off the genes', () => {
    const { battle, teamA } = createBattle();
    const user = createUnit(battle, teamA);

    for (const stat of [Stats.HP, Stats.Attack, Stats.Defense, Stats.Speed]) {
      user.setStat(StatsKind.Individual, stat, 31);
    }
    for (const stat of [Stats.SpecialAttack, Stats.SpecialDefense]) {
      user.setStat(StatsKind.Individual, stat, 30);
    }

    const type = user.checkMoveType(Moves.HiddenPower, NONE_TARGET);

    expect(type).not.toBe(Types.Normal);
    expect(type).not.toBe(Types.Unknown);
  });
});

describe('Future Sight', () => {
  it('lands after the cast rather than on it', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    user.triggerMoveTarget(Moves.FutureSight, unitTarget(target), 0);
    expect(target.health).toBe(160);

    battle.tick(turns(2));
    expect(target.health).toBeLessThan(160);
  });
});

describe('Spikes', () => {
  it('costs whatever walks in, and Rapid Spin sweeps them away', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const layer = createUnit(battle, teamA);
    const standing = createUnit(battle, teamB);
    const walking = createUnit(battle, teamB);

    layer.triggerMoveEffect(Moves.Spikes, { type: MoveTargetType.Team, team: teamB }, 0);
    // Already on the field: nothing is walked into
    expect(standing.health).toBe(160);

    walking.enter();
    expect(walking.health).toBe(140); // an eighth of 160

    standing.triggerMoveEffect(Moves.RapidSpin, unitTarget(layer), 0);
    walking.setHealth(160);
    walking.enter();
    expect(walking.health).toBe(160);
  });

  it('is worth laying whoever is standing about, and only stops when it is full', () => {
    const { battle, teamA, teamB } = createBattle();
    const layer = createUnit(battle, teamA);
    const target = { type: MoveTargetType.Team, team: teamB } as const;

    createUnit(battle, teamB);

    const spikesUsable = (): boolean => {
      const event: CheckUnitAIMoveUsableEvent = {
        id: 'CheckUnitAIMoveUsable',
        disabled: false,
        source: layer,
        move: Moves.Spikes,
        target,
        usable: true,
      };

      battle.emit(BattleEvents.CheckUnitAIMoveUsable, event);
      return event.usable;
    };

    // Everybody is on the field from the start, so there is no bench
    // to weigh: the depth is the whole of the question
    expect(spikesUsable()).toBe(true);

    for (let laid = 0; laid < 3; laid++) {
      layer.triggerMoveEffect(Moves.Spikes, target, 0);
    }
    expect(spikesUsable()).toBe(false);

    // Swept away is worth laying again
    createUnit(battle, teamB).triggerMoveEffect(Moves.RapidSpin, unitTarget(layer), 0);
    expect(spikesUsable()).toBe(true);
  });
});

describe('Thief', () => {
  it('walks off with what the target was holding', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const thief = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);

    holder.addItem(1);
    thief.triggerMoveTarget(Moves.Thief, unitTarget(holder), 0);

    expect(holder.items[1]).toBeFalsy();
    expect(thief.items[1]).toBe(true);
  });
});

describe('the locks', () => {
  it('holds a target on the field', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const held = createUnit(battle, teamB);

    holder.triggerMoveEffect(Moves.MeanLook, unitTarget(held), 0);

    expect(held.status[Statuses.Cornered]).toBeDefined();
    expect(held.checkEscape()).toBe(false);
  });

  it('stretches the wait on the move Spite lands on', () => {
    const { battle, teamA, teamB } = createBattle();
    const spiteful = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    target.addMove(Moves.Tackle);
    target.triggerMove(Moves.Tackle, unitTarget(spiteful), 0);
    target.startCooldown(Moves.Tackle, unitTarget(spiteful));

    const before = target.moves[Moves.Tackle]?.cooldown?.duration ?? 0;

    spiteful.triggerMoveEffect(Moves.Spite, unitTarget(target), 0);

    expect(target.moves[Moves.Tackle]?.cooldown?.duration).toBe(before * 4);
  });

  it('points a Ghost out so Normal reaches it', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const pointer = createUnit(battle, teamA);
    const ghost = createUnit(battle, teamB, [Types.Ghost]);

    expect(pointer.checkMoveImmunity(Moves.Tackle, unitTarget(ghost), Types.Normal)).toBe(true);

    pointer.triggerMoveEffect(Moves.Foresight, unitTarget(ghost), 0);

    expect(ghost.status[Statuses.Identified]).toBeDefined();
    expect(pointer.checkMoveImmunity(Moves.Tackle, unitTarget(ghost), Types.Normal)).toBe(false);
  });

  it('takes the aim off the next move after a Lock-On', () => {
    const { battle, teamA, teamB } = createBattle();
    const sniper = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    expect(sniper.checkMoveAccuracy(Moves.Blizzard, unitTarget(target))).toBeGreaterThan(0);

    sniper.triggerMoveEffect(Moves.LockOn, unitTarget(target), 0);

    expect(sniper.checkMoveAccuracy(Moves.Blizzard, unitTarget(target))).toBeUndefined();
    // Spent on the one move: the next is aimed the ordinary way
    expect(sniper.checkMoveAccuracy(Moves.Blizzard, unitTarget(target))).toBeGreaterThan(0);
  });
});

describe('the copies', () => {
  it('sketches the move over Sketch itself', () => {
    const { battle, teamA, teamB } = createBattle();
    const artist = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    artist.addMove(Moves.Sketch);
    target.addMove(Moves.Surf);
    target.triggerMove(Moves.Surf, unitTarget(artist), 0);

    artist.triggerMoveEffect(Moves.Sketch, unitTarget(target), 0);

    expect(artist.moves[Moves.Sketch]).toBeUndefined();
    expect(artist.moves[Moves.Surf]).toBeDefined();
  });

  it('turns into something that stands up to the last move it saw', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA, [Types.Normal]);
    const target = createUnit(battle, teamB);

    target.addMove(Moves.Ember);
    target.triggerMoveTarget(Moves.Ember, unitTarget(user), 0);

    user.triggerMoveEffect(Moves.Conversion2, unitTarget(target), 0);

    expect(user.types.has(Types.Normal)).toBe(false);
    expect(user.types.size).toBe(1);
  });

  it('returns a special hit through Mirror Coat', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const user = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);

    attacker.triggerMoveTarget(Moves.WaterGun, unitTarget(user), 0);

    const dealt = 160 - user.health;

    user.triggerMoveEffect(Moves.MirrorCoat, unitTarget(attacker), 0);

    expect(160 - attacker.health).toBeCloseTo(dealt * 2);
  });
});

describe('the moves that only work asleep', () => {
  it('refuses Snore to a unit that is awake', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    // Awake, the move never fires at all
    user.triggerMove(Moves.Snore, unitTarget(target), 0);
    battle.tick(MOVE_DELAY);
    expect(target.health).toBe(160);

    user.addStatus(Statuses.Sleeping, { type: 0 });
    user.triggerMove(Moves.Snore, unitTarget(target), 0);
    battle.tick(MOVE_DELAY);
    expect(target.health).toBeLessThan(160);
  });
});

describe('Baton Pass', () => {
  it('hands the stages to whoever comes in', () => {
    const { battle, teamA, teamB } = createBattle();
    const passer = createUnit(battle, teamA);
    const weaker = createUnit(battle, teamA);
    const stronger = createUnit(battle, teamA);

    createUnit(battle, teamB);
    weaker.setHealth(20);
    passer.addStage(Stages.Attack, 2, { type: 0 });
    passer.triggerMoveEffect(Moves.BatonPass, NONE_TARGET, 0);

    // The baton goes to the best of the bench, not to whoever is next
    expect(stronger.stages[Stages.Attack]).toBe(2);
    expect(weaker.stages[Stages.Attack]).toBe(0);
  });
});

describe('Beat Up', () => {
  it('strikes once for every healthy pokemon in the party', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    expect(beatUpStrikes(user)).toBe(3);

    mate.addStatus(Statuses.Burned, { type: 0 });
    expect(beatUpStrikes(user)).toBe(2);
    expect(target.alive).toBe(true);
  });
});

describe('Pursuit', () => {
  it('catches the target on its way out, at double the power', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const chaser = createUnit(battle, teamA);
    const leaving = createUnit(battle, teamB);
    const replacement = createUnit(battle, teamB);

    chaser.addMove(Moves.Pursuit);
    chaser.cast(Moves.Pursuit, unitTarget(leaving));
    expect(chaser.casting).toBeDefined();

    // The swap is what finishes the chase: the cast is spent before
    // the target is swapped out from under it
    leaving.forceSwitch(replacement);
    expect(chaser.casting).toBeUndefined();

    battle.tick(MOVE_DELAY);

    // 40 power doubled, struck at the one leaving rather than at
    // whoever took the spot
    expect(160 - leaving.health).toBeCloseTo(0.44 * 80 + 2);
    expect(replacement.health).toBe(160);
  });

  it('spends itself at once on a target already walking', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const chaser = createUnit(battle, teamA);
    const walking = createUnit(battle, teamB);

    walking.addStatus(Statuses.Switching, { type: 0 });
    chaser.addMove(Moves.Pursuit);
    chaser.cast(Moves.Pursuit, unitTarget(walking));

    expect(chaser.casting).toBeUndefined();
  });
});

describe('Sketch', () => {
  it('keeps what it drew, for the fight to report', () => {
    const { battle, teamA, teamB } = createBattle();
    const artist = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    artist.addMove(Moves.Sketch);
    target.addMove(Moves.Surf);
    target.triggerMove(Moves.Surf, unitTarget(artist), 0);
    artist.triggerMoveEffect(Moves.Sketch, unitTarget(target), 0);

    expect(artist.sketched).toBe(Moves.Surf);
  });

  it('draws one move a fight, whatever calls it after', () => {
    const { battle, teamA, teamB } = createBattle();
    const artist = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    artist.addMove(Moves.Sketch);
    target.addMove(Moves.Surf);
    target.triggerMove(Moves.Surf, unitTarget(artist), 0);
    artist.triggerMoveEffect(Moves.Sketch, unitTarget(target), 0);

    // Sketch is spent, so the effect draws nothing however it is
    // reached: Metronome, Mirror Move and Sleep Talk all call moves
    // their user does not have to own
    target.addMove(Moves.Ember);
    target.triggerMove(Moves.Ember, unitTarget(artist), 0);
    artist.triggerMoveEffect(Moves.Sketch, unitTarget(target), 0);

    expect(artist.moves[Moves.Ember]).toBeUndefined();
    expect(artist.sketched).toBe(Moves.Surf);
  });

  it('is not a move Mimic will borrow', () => {
    const { battle, teamA, teamB } = createBattle();
    const thief = createUnit(battle, teamA);
    const artist = createUnit(battle, teamB);

    thief.addMove(Moves.Mimic);
    artist.addMove(Moves.Surf);
    artist.addMove(Moves.Sketch);
    artist.triggerMove(Moves.Surf, unitTarget(thief), 0);
    artist.triggerMove(Moves.Sketch, unitTarget(thief), 0);

    thief.triggerMoveEffect(Moves.Mimic, unitTarget(artist), 0);

    // The Surf under it, not the Sketch on top: a borrowed Sketch
    // would be a free permanent copy
    expect(thief.moves[Moves.Sketch]).toBeUndefined();
    expect(thief.moves[Moves.Surf]).toBeDefined();
  });
});

describe('what a move may be aimed at on the caster’s own side', () => {
  it('catches the caster’s own side in what shakes the whole field', () => {
    for (const move of [Moves.Earthquake, Moves.Surf, Moves.Explosion, Moves.SelfDestruct]) {
      const flags = getMoveData(move).target;

      expect(flags & MoveTargetFlags.Own, getMoveData(move).name).toBeTruthy();
    }
  });

  it('drops a stat on a teammate only where Contrary turns it round', () => {
    const { battle, teamA } = createBattle();
    const caster = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const contrary = createUnit(battle, teamA);

    contrary.addAbility(Abilities.Contrary);

    expect(usable(battle, caster, Moves.Screech, plain)).toBe(false);
    expect(usable(battle, caster, Moves.Screech, contrary)).toBe(true);
  });

  it('flatters a teammate only where the confusion cannot land', () => {
    const { battle, teamA, teamB } = createBattle();
    const caster = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const steady = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    steady.addAbility(Abilities.OwnTempo);

    expect(usable(battle, caster, Moves.Swagger, plain)).toBe(false);
    expect(usable(battle, caster, Moves.Swagger, steady)).toBe(true);
    // And the far side is the other way round: the muddling is the point
    expect(usable(battle, caster, Moves.Swagger, enemy)).toBe(true);
  });

  it('reads a hit landing on its own side as a cost', () => {
    const { battle, teamA, teamB } = createBattle();

    setupChooseMoveAI(battle);

    const caster = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    caster.addMove(Moves.Present);
    expect(score(battle, caster, Moves.Present, ally)).toBeLessThan(
      score(battle, caster, Moves.Present, enemy),
    );
  });

  it('hands a Present to the teammate that needs feeding', () => {
    const { battle, teamA } = createBattle();
    const caster = createUnit(battle, teamA);
    const whole = createUnit(battle, teamA);
    const hurt = createUnit(battle, teamA);

    hurt.setHealth(20);
    expect(score(battle, caster, Moves.Present, hurt)).toBeGreaterThan(
      score(battle, caster, Moves.Present, whole),
    );
  });

  it('takes a teammate’s body only when it is the better one', () => {
    const { battle, teamA } = createBattle();
    const copier = createUnit(battle, teamA);
    const weaker = createUnit(battle, teamA);
    const stronger = createUnit(battle, teamA);

    expect(getMoveData(Moves.Transform).target & MoveTargetFlags.Own).toBeTruthy();

    stronger.addStage(Stages.Attack, 2, { type: 0 });
    weaker.addStage(Stages.Attack, -2, { type: 0 });

    expect(score(battle, copier, Moves.Transform, stronger)).toBeGreaterThan(BASE_SCORE);
    expect(score(battle, copier, Moves.Transform, weaker)).toBeLessThan(BASE_SCORE);
    expect(score(battle, copier, Moves.Transform, copier)).toBeLessThan(BASE_SCORE);
  });

  it('sketches a move off a teammate as readily as off an enemy', () => {
    const { battle, teamA } = createBattle();
    const artist = createUnit(battle, teamA);
    const friend = createUnit(battle, teamA);

    expect(getMoveData(Moves.Sketch).target & MoveTargetFlags.Own).toBeTruthy();

    artist.addMove(Moves.Sketch);
    friend.addMove(Moves.Tackle);
    friend.triggerMove(Moves.Tackle, unitTarget(artist), 0);

    expect(usable(battle, artist, Moves.Sketch, friend)).toBe(true);

    artist.addMove(Moves.Tackle);
    expect(usable(battle, artist, Moves.Sketch, friend)).toBe(false);
  });

  it('copies the teammate who has built the most', () => {
    const { battle, teamA } = createBattle();
    const caster = createUnit(battle, teamA);
    const quiet = createUnit(battle, teamA);
    const swept = createUnit(battle, teamA);

    swept.addStage(Stages.Attack, 2, { type: 0 });
    expect(score(battle, caster, Moves.PsychUp, swept)).toBeGreaterThan(
      score(battle, caster, Moves.PsychUp, quiet),
    );
  });

  it('splits its pain with the teammate that can spare it', () => {
    const { battle, teamA } = createBattle();
    const caster = createUnit(battle, teamA);
    const whole = createUnit(battle, teamA);
    const hurt = createUnit(battle, teamA);

    caster.setHealth(20);
    hurt.setHealth(60);
    expect(score(battle, caster, Moves.PainSplit, whole)).toBeGreaterThan(
      score(battle, caster, Moves.PainSplit, hurt),
    );
  });
});

describe('the encore', () => {
  it('plays the move the target last landed again', () => {
    const { battle, teamA, teamB } = createBattle();
    const singer = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    target.addMove(Moves.Tackle);
    target.triggerMove(Moves.Tackle, unitTarget(singer), 0);
    battle.tick(MOVE_DELAY);

    const struck = singer.health;

    singer.triggerMoveEffect(Moves.Encore, unitTarget(target), 2);
    battle.tick(MOVE_DELAY);

    expect(target.status[Statuses.Encored]).toBeDefined();
    expect(singer.health).toBeLessThan(struck);
  });

  it('runs one repeat per step', () => {
    expect(getMoveData(Moves.Encore).steps).toBe(2);
  });

  it('has nothing to call for when the target has landed nothing', () => {
    const { battle, teamA, teamB } = createBattle();
    const singer = createUnit(battle, teamA);
    const quiet = createUnit(battle, teamB);
    const sung = createUnit(battle, teamB);

    sung.addMove(Moves.Tackle);
    sung.triggerMove(Moves.Tackle, unitTarget(singer), 0);
    battle.tick(MOVE_DELAY);

    expect(usable(battle, singer, Moves.Encore, quiet)).toBe(false);
    expect(usable(battle, singer, Moves.Encore, sung)).toBe(true);
  });

  it('refuses a second encore over the first', () => {
    const { battle, teamA, teamB } = createBattle();
    const singer = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    target.addMove(Moves.Tackle);
    target.triggerMove(Moves.Tackle, unitTarget(singer), 0);
    battle.tick(MOVE_DELAY);
    singer.triggerMoveEffect(Moves.Encore, unitTarget(target), 2);

    expect(usable(battle, singer, Moves.Encore, target)).toBe(false);
  });

  it('will not play back a move that winds up', () => {
    const { battle, teamA, teamB } = createBattle();
    const singer = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    target.addMove(Moves.Rollout);
    target.triggerMove(Moves.Rollout, unitTarget(singer), 4);
    battle.tick(MOVE_DELAY);

    const struck = singer.health;

    expect(usable(battle, singer, Moves.Encore, target)).toBe(false);

    singer.triggerMoveEffect(Moves.Encore, unitTarget(target), 2);
    battle.tick(MOVE_DELAY);

    // A lone trigger of a roll reads as its last pass, which is the
    // reason nothing is played back here
    expect(singer.health).toBe(struck);
  });

  it('plays back a Solar Beam that no longer winds up', () => {
    const { battle, teamA, teamB } = createBattle();
    const singer = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    battle.setWeather(Weathers.Sunny, turns(5));
    target.addMove(Moves.SolarBeam);
    target.triggerMove(Moves.SolarBeam, unitTarget(singer), 0);
    battle.tick(MOVE_DELAY);

    expect(usable(battle, singer, Moves.Encore, target)).toBe(true);
  });

  it('is sung to a teammate rather than across the field', () => {
    const { battle, teamA, teamB } = createBattle();
    const singer = createUnit(battle, teamA);
    const friend = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    expect(getMoveData(Moves.Encore).target & MoveTargetFlags.Own).toBeTruthy();
    expect(score(battle, singer, Moves.Encore, friend)).toBeGreaterThan(
      score(battle, singer, Moves.Encore, enemy),
    );
  });
});
