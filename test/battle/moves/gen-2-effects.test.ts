import { describe, expect, it } from 'vitest';
import { MoveTargetType } from '../../../src/battle/events';
import { beatUpStrikes } from '../../../src/battle/moves/beat-up';
import { getEncoredMove } from '../../../src/battle/status/encored';
import { PERISH_DURATION } from '../../../src/battle/status/perishing';
import type Unit from '../../../src/battle/unit';
import { MAX_STAGE, Stages, Stats, StatsKind } from '../../../src/data/constants/stats';
import { Types } from '../../../src/data/constants/types';
import { Moves } from '../../../src/data/ids/moves';
import { Statuses, TeamStatuses } from '../../../src/data/ids/status';
import { MOVE_DELAY } from '../../../src/battle/mechanics/move';
import turns from '../../../src/battle/turn';
import { createBattle, createUnit, pinRandom } from '../harness';

function unitTarget(unit: Unit): { readonly type: MoveTargetType.Unit; readonly unit: Unit } {
  return { type: MoveTargetType.Unit, unit } as const;
}

const NONE_TARGET = { type: MoveTargetType.None } as const;

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

  it('doubles Fury Cutter while it keeps landing, and stops at the cap', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    expect(user.checkMovePower(Moves.FuryCutter, unitTarget(target))).toBe(40);

    for (const expected of [80, 160, 320, 320]) {
      user.triggerMove(Moves.FuryCutter, unitTarget(target), 0);
      expect(user.checkMovePower(Moves.FuryCutter, unitTarget(target))).toBe(expected);
    }

    // Anything else breaks the streak
    user.triggerMove(Moves.Tackle, unitTarget(target), 0);
    expect(user.checkMovePower(Moves.FuryCutter, unitTarget(target))).toBe(40);
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

    user.triggerMoveEffect(Moves.FutureSight, unitTarget(target), 0);
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

  it('encores the move the target last used', () => {
    const { battle, teamA, teamB } = createBattle();
    const singer = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    target.addMove(Moves.Tackle);
    target.triggerMove(Moves.Tackle, unitTarget(singer), 0);
    singer.triggerMoveEffect(Moves.Encore, unitTarget(target), 0);

    expect(target.status[Statuses.Encored]).toBeDefined();
    expect(getEncoredMove(target)).toBe(Moves.Tackle);
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

    user.triggerMoveTarget(Moves.Snore, unitTarget(target), 0);
    expect(target.health).toBe(160);

    user.addStatus(Statuses.Sleeping, { type: 0 });
    user.triggerMoveTarget(Moves.Snore, unitTarget(target), 0);
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

    // 40 power doubled, and the walk is no shelter from this one
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
});
