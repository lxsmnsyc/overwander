import { describe, expect, it } from 'vitest';
import { chooseMove, setupChooseMoveAI } from '../../src/battle/ai/choose-move';
import { BattleModes } from '../../src/battle/core';
import setupIdleAI from '../../src/battle/ai/idle';
import { checkTeamUnit, checkUnitRating } from '../../src/battle/ai/rating';
import { BattleEvents, EffectType, MoveTargetType } from '../../src/battle/events';
import type Unit from '../../src/battle/unit';
import { EventPriority } from '../../src/core/event-emitter';
import Abilities from '../../src/data/ids/abilities';
import { Stages } from '../../src/data/constants/stats';
import { Types } from '../../src/data/constants/types';
import { MoveTargetPriorities, Moves } from '../../src/data/ids/moves';
import { Statuses } from '../../src/data/ids/status';
import { type BattleHarness, createBattle, createUnit, pinRandom } from './harness';

const NONE_CAUSE = { type: EffectType.None } as const;

function createAIBattle(mode?: BattleModes): BattleHarness {
  const harness = createBattle('test-seed', undefined, mode);
  setupChooseMoveAI(harness.battle);
  return harness;
}

describe('unit rating', () => {
  it('rates healthier units higher and penalizes statuses', () => {
    const { battle, teamA } = createBattle();
    const healthy = createUnit(battle, teamA);
    const hurt = createUnit(battle, teamA);
    const statused = createUnit(battle, teamA);
    hurt.setHealth(40);
    statused.addStatus(Statuses.Burned, NONE_CAUSE);

    const healthyRating = checkUnitRating(battle, healthy);

    expect(healthyRating).toBeGreaterThan(checkUnitRating(battle, hurt));
    expect(healthyRating).toBeGreaterThan(checkUnitRating(battle, statused));
  });

  it('picks the strongest and weakest team members with exclusion', () => {
    const { battle, teamA } = createBattle();
    const strong = createUnit(battle, teamA);
    const weak = createUnit(battle, teamA);
    weak.setHealth(20);

    expect(checkTeamUnit(battle, teamA, MoveTargetPriorities.Strongest)).toBe(strong);
    expect(checkTeamUnit(battle, teamA, MoveTargetPriorities.Weakest)).toBe(weak);
    expect(checkTeamUnit(battle, teamA, MoveTargetPriorities.Strongest, strong)).toBe(weak);
  });
});

describe('choose move', () => {
  it('prefers the damaging move and the killable target', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    const healthy = createUnit(battle, teamB);
    const dying = createUnit(battle, teamB);
    dying.setHealth(5);
    unit.addMove(Moves.Tackle);
    unit.addMove(Moves.Growl);

    const choice = chooseMove(battle, unit);

    expect(choice?.move).toBe(Moves.Tackle);
    expect(choice?.target.type === MoveTargetType.Unit && choice.target.unit).toBe(dying);
    expect(healthy.health).toBe(160); // scoring never applies damage
  });

  it('focuses fire on the higher-rated threat', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    const weakened = createUnit(battle, teamB);
    const threat = createUnit(battle, teamB);
    // Same health and defenses (equal damage bonus), lower rating
    weakened.addStage(Stages.Attack, -6, NONE_CAUSE);
    unit.addMove(Moves.Tackle);

    const choice = chooseMove(battle, unit);

    expect(choice?.target.type === MoveTargetType.Unit && choice.target.unit).toBe(threat);
  });

  it('avoids moves the target is immune to', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    createUnit(battle, teamB, [Types.Ghost]);
    unit.addMove(Moves.Tackle);
    unit.addMove(Moves.Growl);

    const choice = chooseMove(battle, unit);

    expect(choice?.move).toBe(Moves.Growl);
  });

  it('refuses a move whose prerequisite is unmet', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    unit.addMove(Moves.DreamEater);

    // Dream Eater has nothing to eat while the target is awake, so
    // the unit is left with nothing to cast rather than a move that
    // would resolve to "but it failed!"
    expect(chooseMove(battle, unit)).toBeUndefined();

    enemy.addStatus(Statuses.Sleeping, NONE_CAUSE);

    expect(chooseMove(battle, unit)?.move).toBe(Moves.DreamEater);
  });

  it('refuses Counter with no hit to return', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    unit.addMove(Moves.Counter);

    expect(chooseMove(battle, unit)).toBeUndefined();

    enemy.damage({ type: EffectType.Move, unit: enemy, move: Moves.Tackle }, unit, 10, 0);

    expect(chooseMove(battle, unit)?.move).toBe(Moves.Counter);
  });

  it('refuses a status the target already carries', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    unit.addMove(Moves.ThunderWave);

    expect(chooseMove(battle, unit)?.move).toBe(Moves.ThunderWave);

    enemy.addStatus(Statuses.Paralyzed, NONE_CAUSE);

    expect(chooseMove(battle, unit)).toBeUndefined();
  });

  it('picks nothing when there is nothing left to aim at', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    // One of each kind that reaches the far side: a single target, and
    // one that resolves its own targets when it fires
    unit.addMove(Moves.Tackle);
    unit.addMove(Moves.Earthquake);

    expect(chooseMove(battle, unit)).toBeDefined();

    unit.damage(NONE_CAUSE, enemy, 9999, 0);

    // A move with nothing to aim at used to be offered with nothing
    // named, which a unit will happily wind up, land on empty air and
    // do again for the rest of the fight
    expect(chooseMove(battle, unit)).toBeUndefined();
  });

  it('still buffs itself with the field empty', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    unit.addMove(Moves.SwordsDance);

    unit.damage(NONE_CAUSE, enemy, 9999, 0);

    // What reaches its own side always has the user to reach, so the
    // rule above is about who the move is for rather than about
    // whether anybody is left at all
    expect(chooseMove(battle, unit)?.move).toBe(Moves.SwordsDance);
  });

  it('skips moves on cooldown', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    unit.addMove(Moves.Tackle);
    unit.addMove(Moves.Growl);

    unit.startCooldown(Moves.Tackle, {
      type: MoveTargetType.Unit,
      unit: enemy,
    });

    const choice = chooseMove(battle, unit);

    expect(choice?.move).toBe(Moves.Growl);
  });

  it('prefers friendly stage boosts during raid battles', () => {
    const { battle, teamA, teamB } = createAIBattle(BattleModes.Raid);
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    createUnit(battle, teamB);
    unit.addMove(Moves.Tackle);
    unit.addMove(Moves.SwordsDance);

    const choice = chooseMove(battle, unit);

    expect(choice?.move).toBe(Moves.SwordsDance);

    // Maxed out: the boost turns useless and the attack wins again
    unit.stages[Stages.Attack] = 6;

    expect(chooseMove(battle, unit)?.move).toBe(Moves.Tackle);
  });

  it('leaves the setting up to the party', () => {
    const { battle, teamA, teamB } = createAIBattle(BattleModes.Raid);
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    createUnit(battle, teamB);
    unit.addMove(Moves.Tackle);
    unit.addMove(Moves.SwordsDance);

    expect(chooseMove(battle, unit)?.move).toBe(Moves.SwordsDance);

    // A boss is the clock the lobby is racing rather than a side that
    // has to survive a long fight, and its casts are doubled — one
    // spent winding up a buff is one handed to the party
    unit.addAbility(Abilities.Boss);

    expect(chooseMove(battle, unit)?.move).toBe(Moves.Tackle);
  });

  it('sees through the abilities its own ability ignores', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    const floater = createUnit(battle, teamB);
    floater.addAbility(Abilities.Levitate);
    unit.addMove(Moves.BoneClub);

    // Ground cannot reach something airborne, so there is nothing
    // worth casting at it
    expect(chooseMove(battle, unit)).toBeUndefined();

    // Mold Breaker resolves its moves as though the target had no
    // ability at all, and the AI is asked through the same brackets
    // the move itself resolves through — otherwise the holder refuses
    // the one move its ability exists to let it use
    unit.addAbility(Abilities.MoldBreaker);

    expect(chooseMove(battle, unit)?.move).toBe(Moves.BoneClub);
  });

  /**
   * What an ability does to a move is worked out by the ability, next
   * to the effect itself — the AI keeps no list of what anything else
   * on the field does. These are the five that change what a good
   * pick is, and each one is asked the same way the effect is
   */
  describe('ability interactions', () => {
    /**
     * The target the AI settled on, or undefined when it took a pass
     */
    function chosenTarget(battle: BattleHarness['battle'], unit: Unit): Unit | undefined {
      const target = chooseMove(battle, unit)?.target;

      return target?.type === MoveTargetType.Unit ? target.unit : undefined;
    }

    it('will not pick a move Damp forbids', () => {
      const { battle, teamA, teamB } = createAIBattle();
      pinRandom(battle, 0.99);
      const unit = createUnit(battle, teamA);
      const enemy = createUnit(battle, teamB);
      unit.addMove(Moves.SelfDestruct);

      expect(chooseMove(battle, unit)?.move).toBe(Moves.SelfDestruct);

      // Damp tracks who is on the field, so the holder has to arrive
      enemy.addAbility(Abilities.Damp);
      enemy.enter();

      // The cast would be refused every tick, so picking it is a tick
      // spent on nothing — for ever, since nothing about it changes
      expect(chooseMove(battle, unit)).toBeUndefined();
    });

    it('drains away from Liquid Ooze', () => {
      const { battle, teamA, teamB } = createAIBattle();
      pinRandom(battle, 0.99);
      const unit = createUnit(battle, teamA);
      const plain = createUnit(battle, teamB);
      const ooze = createUnit(battle, teamB);
      ooze.addAbility(Abilities.LiquidOoze);
      unit.addMove(Moves.Absorb);

      // The two are identical but for the ability, and the pinned
      // random breaks a tie towards the *second* of them — so landing
      // on the first is the penalty and nothing else
      expect(chosenTarget(battle, unit)).toBe(plain);
    });

    it('keeps its statuses away from Synchronize', () => {
      const { battle, teamA, teamB } = createAIBattle();
      pinRandom(battle, 0.99);
      const unit = createUnit(battle, teamA);
      const plain = createUnit(battle, teamB);
      const mirror = createUnit(battle, teamB);
      mirror.addAbility(Abilities.Synchronize);
      unit.addMove(Moves.ThunderWave);

      // Paralysing it would paralyse the user back, so the tie the
      // pinned random would have given the holder goes the other way
      expect(chosenTarget(battle, unit)).toBe(plain);
    });

    it('will not poison what Magic Guard makes immune to poison', () => {
      const { battle, teamA, teamB } = createAIBattle();
      pinRandom(battle, 0.99);
      const unit = createUnit(battle, teamA);
      const guarded = createUnit(battle, teamB);
      unit.addMove(Moves.Toxic);

      expect(chooseMove(battle, unit)?.move).toBe(Moves.Toxic);

      // The status still lands; the only thing it does does not
      guarded.addAbility(Abilities.MagicGuard);

      expect(chooseMove(battle, unit)).toBeUndefined();
    });

    it('would rather not touch what punishes touching', () => {
      const { battle, teamA, teamB } = createAIBattle();
      pinRandom(battle, 0.99);
      const unit = createUnit(battle, teamA);
      const plain = createUnit(battle, teamB);
      const shocking = createUnit(battle, teamB);
      shocking.addAbility(Abilities.Static);
      // Tackle makes contact; Absorb does not
      unit.addMove(Moves.Tackle);

      expect(chosenTarget(battle, unit)).toBe(plain);

      // A move that keeps its distance has nothing to fear from it,
      // so the field is level again and the tie falls back to the
      // pinned random — which picks the holder
      unit.removeMove(Moves.Tackle);
      unit.addMove(Moves.Absorb);

      expect(chosenTarget(battle, unit)).toBe(shocking);
    });
  });

  it('does not favor stage boosts outside raids', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    createUnit(battle, teamB);
    unit.addMove(Moves.Tackle);
    unit.addMove(Moves.SwordsDance);

    const choice = chooseMove(battle, unit);

    expect(choice?.move).toBe(Moves.Tackle);
  });
});

describe('idle AI', () => {
  function createIdleBattle(): BattleHarness {
    const harness = createBattle();
    setupChooseMoveAI(harness.battle);
    setupIdleAI(harness.battle);
    return harness;
  }

  it('idle units pick a move and start casting on tick', () => {
    const { battle, teamA, teamB } = createIdleBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    createUnit(battle, teamB);
    unit.addMove(Moves.Tackle);

    unit.enter();
    battle.tick(16);

    expect(unit.casting).toBeDefined();
    expect(unit.casting?.move).toBe(Moves.Tackle);
  });

  it('keeps acting after a move resolves', () => {
    const { battle, teamA, teamB } = createIdleBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    // A pool nothing in this test can empty, so the fight lasts long
    // enough for a second cast
    enemy.setHealth(100_000);
    unit.addMove(Moves.Tackle);

    let casts = 0;

    battle.on(BattleEvents.UnitCast, EventPriority.Post, () => {
      casts++;
    });

    unit.enter();

    // Ten seconds: a cast (about 1.7s), the cooldown Tackle's PP buys
    // (about 5.1s) and the next cast, with room to spare. A move that
    // resolves in the frame it triggers used to leave its user pending
    // forever, so this is the assertion that the unit comes back
    for (let frame = 0; frame < 40; frame++) {
      battle.tick(250);
    }

    expect(casts).toBeGreaterThan(1);
  });

  it('locked units stay put', () => {
    const { battle, teamA, teamB } = createIdleBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    createUnit(battle, teamB);
    unit.addMove(Moves.Tackle);

    unit.enter();
    unit.addStatus(Statuses.Sleeping, NONE_CAUSE);
    battle.tick(16);

    expect(unit.casting).toBeUndefined();
  });
});

describe('Struggle', () => {
  it('is what is left when every move is shut off', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    unit.addMove(Moves.Tackle);

    // With something to throw, it throws that
    expect(chooseMove(battle, unit)?.move).toBe(Moves.Tackle);

    unit.disableMove(Moves.Tackle);

    const choice = chooseMove(battle, unit);

    expect(choice?.move).toBe(Moves.Struggle);
    expect(choice?.target.type === MoveTargetType.Unit && choice.target.unit).toBe(enemy);
  });

  it('is not what a cooldown means', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    unit.addMove(Moves.Tackle);

    // A move that is cooling is a move the unit still has: struggling
    // in the gaps between cooldowns would have every pokemon in every
    // fight killing itself while it waited
    unit.startCooldown(Moves.Tackle, { type: MoveTargetType.Unit, unit: enemy });

    expect(chooseMove(battle, unit)).toBeUndefined();
  });

  it('can be cast without being a move the unit knows', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    expect(unit.moves[Moves.Struggle]).toBeUndefined();
    expect(unit.checkCanCast(Moves.Struggle, { type: MoveTargetType.Unit, unit: enemy })).toBe(
      true,
    );
  });
});
