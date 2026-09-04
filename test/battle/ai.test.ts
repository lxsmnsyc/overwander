import { describe, expect, it } from 'vitest';
import { chooseMove, setupChooseMoveAI } from '../../src/battle/ai/choose-move';
import { BattleModes } from '../../src/battle/core';
import setupIdleAI, { AI_REST_PERIOD } from '../../src/battle/ai/idle';
import { checkTeamUnit, checkUnitRating } from '../../src/battle/ai/rating';
import {
  BattleEvents,
  type CheckUnitAIMoveScoreEvent,
  type CheckUnitAIMoveUsableEvent,
  EffectType,
  type MoveTarget,
  MoveTargetType,
} from '../../src/battle/events';
import { BASE_SCORE, HEAL_BONUS, STEP_PENALTY, USELESS_PENALTY } from '../../src/battle/ai/score';
import type Unit from '../../src/battle/unit';
import { EventPriority } from '../../src/core/event-emitter';
import Abilities from '../../src/data/ids/abilities';
import { Stages } from '../../src/data/constants/stats';
import { Types } from '../../src/data/constants/types';
import { MoveTargetPriorities, Moves } from '../../src/data/ids/moves';
import { Items } from '../../src/data/ids/items';
import { Statuses, TeamStatuses, Weathers } from '../../src/data/ids/status';
import { type BattleHarness, createBattle, createUnit, pinRandom } from './harness';

const NONE_CAUSE = { type: EffectType.None } as const;

function createAIBattle(mode?: BattleModes): BattleHarness {
  const harness = createBattle('test-seed', mode);
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
    // the unit swings instead of casting a move that would resolve to
    // "but it failed!". The swing is what every unit is fielded with,
    // and it is what "declined everything else" looks like now
    expect(chooseMove(battle, unit)?.move).toBe(Moves.Attack);

    enemy.addStatus(Statuses.Sleeping, NONE_CAUSE);

    expect(chooseMove(battle, unit)?.move).toBe(Moves.DreamEater);
  });

  it('refuses Counter with no hit to return', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    unit.addMove(Moves.Counter);

    expect(chooseMove(battle, unit)?.move).toBe(Moves.Attack);

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

    expect(chooseMove(battle, unit)?.move).toBe(Moves.Attack);
  });

  it('is not what every cooldown at once means either', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    const target = { type: MoveTargetType.Unit as const, unit: enemy };
    unit.addMove(Moves.Tackle);

    // Nothing left to swing with either, which is as close as waiting
    // gets to being shut out without being it. The unit stands there
    // for the moment the cooldowns take rather than opening a vein
    unit.startCooldown(Moves.Tackle, target);
    unit.startCooldown(Moves.Attack, target);

    expect(chooseMove(battle, unit)).toBeUndefined();
  });

  it('struggles when nothing it knows can reach anybody', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    // A Normal type swings Normal, so its move set and its swing are
    // shut out by the same immunity: a full move set that reaches
    // nothing is still nothing to do
    const unit = createUnit(battle, teamA, [Types.Normal]);
    createUnit(battle, teamB, [Types.Ghost]);
    unit.addMove(Moves.Tackle);

    expect(chooseMove(battle, unit)?.move).toBe(Moves.Struggle);
  });

  it('leaves a boss standing rather than let it struggle', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA, [Types.Normal]);
    createUnit(battle, teamB, [Types.Ghost]);
    unit.addMove(Moves.Tackle);
    unit.addAbility(Abilities.Boss);

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
    expect(chooseMove(battle, unit)?.move).toBe(Moves.Attack);

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
      expect(chooseMove(battle, unit)?.move).toBe(Moves.Attack);
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

      expect(chooseMove(battle, unit)?.move).toBe(Moves.Attack);
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

  it('rests before it acts again', () => {
    const { battle, teamA, teamB } = createIdleBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    enemy.setHealth(100_000);
    unit.addMove(Moves.Tackle);

    let clock = 0;
    let finished: number | null = null;
    const gaps: number[] = [];

    battle.on(BattleEvents.UnitFinishCast, EventPriority.Post, () => {
      finished = clock;
    });
    battle.on(BattleEvents.UnitCast, EventPriority.Post, () => {
      if (finished != null) {
        gaps.push(clock - finished);
      }
    });

    unit.enter();
    // Small steps, so the gap is measured rather than jumped over
    for (let step = 0; step < 600; step += 1) {
      clock += 50;
      battle.tick(50);
    }

    expect(gaps.length, 'it cast again at all').toBeGreaterThan(0);
    // Every gap covers the rest. The move's own delay sits inside it
    // too, so this is a floor rather than the exact wait
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(AI_REST_PERIOD);
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

describe('Attack', () => {
  it('is what a pokemon does while its own moves are cooling', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    unit.addMove(Moves.Tackle);

    // With something castable it throws that, every time
    expect(chooseMove(battle, unit)?.move).toBe(Moves.Tackle);

    unit.startCooldown(Moves.Tackle, { type: MoveTargetType.Unit, unit: enemy });

    const choice = chooseMove(battle, unit);

    expect(choice?.move).toBe(Moves.Attack);
    expect(choice?.target.type === MoveTargetType.Unit && choice.target.unit).toBe(enemy);
  });

  it('leaves a pokemon with nothing at all to Struggle', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);

    createUnit(battle, teamB);
    unit.addMove(Moves.Tackle);
    // Disabled is not cooling: a pokemon shut out of its move set has
    // nothing coming back, which is the state Struggle is for. The
    // swing counts as a move it has, so shutting it out means
    // shutting that out too — which is what Disable on the swing, or
    // anything that empties a move set, comes to
    unit.disableMove(Moves.Tackle);

    expect(chooseMove(battle, unit)?.move).toBe(Moves.Attack);

    unit.disableMove(Moves.Attack);

    expect(chooseMove(battle, unit)?.move).toBe(Moves.Struggle);
  });

  it('is thrown as whatever the pokemon is made of', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    unit.types.clear();
    unit.types.add(Types.Fire);
    unit.types.add(Types.Flying);

    // The first of them: a Charizard swings Fire rather than typeless
    expect(unit.checkMoveType(Moves.Attack, target)).toBe(Types.Fire);

    // Read off the unit rather than off the species, so anything that
    // changes what it is changes what it swings with
    unit.types.clear();
    unit.types.add(Types.Rock);
    expect(unit.checkMoveType(Moves.Attack, target)).toBe(Types.Rock);

    // Nothing to be made of leaves it as registered: typeless
    unit.types.clear();
    expect(unit.checkMoveType(Moves.Attack, target)).toBe(Types.Unknown);

    // And nothing here touches an ordinary move
    expect(unit.checkMoveType(Moves.Tackle, target)).toBe(Types.Normal);
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

    // The swing goes with it: every unit is fielded carrying one, so
    // "every move shut off" is one more move than it used to be
    unit.disableMove(Moves.Tackle);
    unit.disableMove(Moves.Attack);

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
    // fight killing itself while it waited. It swings instead
    unit.startCooldown(Moves.Tackle, { type: MoveTargetType.Unit, unit: enemy });

    expect(chooseMove(battle, unit)?.move).toBe(Moves.Attack);
  });

  it('is cast, lands and is paid for, through the ordinary pipeline', () => {
    // The one that matters: Struggle is in nobody's move set, so
    // every step of the cast — the usability check, the trigger, the
    // cooldown that is never started — walks a path where
    // `unit.moves[move]` is undefined
    const harness = createBattle();
    setupChooseMoveAI(harness.battle);
    setupIdleAI(harness.battle);

    const { battle, teamA, teamB } = harness;
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    enemy.setHealth(100_000);
    unit.addMove(Moves.Tackle);
    unit.disableMove(Moves.Tackle);
    // Including the swing every unit is fielded with, or it would
    // spend the fight throwing that instead
    unit.disableMove(Moves.Attack);
    unit.enter();

    for (let frame = 0; frame < 40; frame++) {
      battle.tick(250);
    }

    // It hit something, and it cost a quarter of its own health per
    // go — four of them and the unit has struggled itself down
    expect(enemy.health).toBeLessThan(100_000);
    expect(unit.health).toBeLessThan(160);
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

describe('weighing a move', () => {
  /**
   * What the scoring listeners make of one move against one target,
   * without the chooser's enumeration in the way
   */
  function scoreMove(
    battle: BattleHarness['battle'],
    source: Unit,
    move: Moves,
    target: MoveTarget,
  ): number {
    const event: CheckUnitAIMoveScoreEvent = {
      id: 'CheckUnitAIMoveScore',
      disabled: false,
      source,
      move,
      target,
      score: BASE_SCORE,
    };
    battle.emit(BattleEvents.CheckUnitAIMoveScore, event);
    return event.score;
  }

  /** Whether the move is offered at all against this target */
  function usableMove(
    battle: BattleHarness['battle'],
    source: Unit,
    move: Moves,
    target: MoveTarget,
  ): boolean {
    const event: CheckUnitAIMoveUsableEvent = {
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

  it('will not put up a veil the side already has', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    createUnit(battle, teamB);
    const target: MoveTarget = { type: MoveTargetType.None };

    // Safeguard rides the same table as the screens, so one rule
    // covers all four
    for (const move of [Moves.Reflect, Moves.LightScreen, Moves.Mist, Moves.Safeguard]) {
      expect(usableMove(battle, unit, move, target), 'fresh').toBe(true);
    }

    for (const status of [
      TeamStatuses.Reflect,
      TeamStatuses.LightScreen,
      TeamStatuses.Mist,
      TeamStatuses.Safeguard,
    ]) {
      teamA.addStatus(status, NONE_CAUSE);
    }

    for (const move of [Moves.Reflect, Moves.LightScreen, Moves.Mist, Moves.Safeguard]) {
      expect(usableMove(battle, unit, move, target), 'already up').toBe(false);
    }
  });

  it('will not sing a Perish Song into a raid', () => {
    const target: MoveTarget = { type: MoveTargetType.None };

    const open = createAIBattle();
    const singer = createUnit(open.battle, open.teamA);
    createUnit(open.battle, open.teamB);

    expect(usableMove(open.battle, singer, Moves.PerishSong, target)).toBe(true);

    // A boss refuses the song, so in a raid the only side still
    // counting down is the party
    const raid = createAIBattle(BattleModes.Raid);
    const partyMember = createUnit(raid.battle, raid.teamA);
    const boss = createUnit(raid.battle, raid.teamB);

    boss.addAbility(Abilities.Boss);

    expect(usableMove(raid.battle, partyMember, Moves.PerishSong, target)).toBe(false);
    expect(usableMove(raid.battle, boss, Moves.PerishSong, target)).toBe(false);
  });

  it('will not call up a sky that answers to nobody', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    createUnit(battle, teamB);
    const target: MoveTarget = { type: MoveTargetType.None };

    expect(usableMove(battle, unit, Moves.SunnyDay, target)).toBe(true);

    // A primal sky is one the move cannot change, the way a sky
    // already out is
    battle.setWeather(Weathers.HeavyRain);

    expect(usableMove(battle, unit, Moves.SunnyDay, target)).toBe(false);
  });

  it('sees a stage held rather than only one pinned', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    const target: MoveTarget = { type: MoveTargetType.Unit, unit: enemy };

    const open = scoreMove(battle, unit, Moves.Screech, target);

    // Mist answers the engine's own can-this-stage-move question, so
    // the AI reads it without keeping a list of what blocks a stage
    enemy.team.addStatus(TeamStatuses.Mist, NONE_CAUSE);

    expect(open - scoreMove(battle, unit, Moves.Screech, target)).toBe(USELESS_PENALTY);
  });

  it('does not eat the target berry it asks about', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);
    // Chilan answers a Normal blow, which is what Tackle is
    holder.addItem(Items.ChilanBerry);
    unit.addMove(Moves.Tackle);

    chooseMove(battle, unit);

    expect(holder.items[Items.ChilanBerry]).toBeDefined();
    expect(holder.health).toBe(160);
  });

  it('counts what a fixed-damage move takes off', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    createUnit(battle, teamB);
    unit.removeMove(Moves.Attack);
    unit.addMove(Moves.SeismicToss);
    unit.addMove(Moves.Growl);

    // Seismic Toss carries no power at all, so a reading that went by
    // the move data would call it a move that does nothing
    expect(chooseMove(battle, unit)?.move).toBe(Moves.SeismicToss);
  });

  it('counts every strike of a multi-hit move', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    unit.removeMove(Moves.Attack);
    unit.addMove(Moves.Twineedle);
    unit.addMove(Moves.PinMissile);
    // Same type, same power: what separates them is that Pin Missile
    // averages three strikes to Twineedle's two, and this is a pool
    // only three of them empty
    enemy.setHealth(30);

    expect(chooseMove(battle, unit)?.move).toBe(Moves.PinMissile);
  });

  it('weighs a move by how often it lands', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    const target: MoveTarget = { type: MoveTargetType.Unit, unit: enemy };

    const unaided = scoreMove(battle, unit, Moves.Fissure, target);

    unit.addStage(Stages.Accuracy, 6, NONE_CAUSE);

    expect(scoreMove(battle, unit, Moves.Fissure, target)).toBeGreaterThan(unaided);
  });

  it('finishes rather than chips, even from behind a wind-up', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    unit.removeMove(Moves.Attack);
    unit.addMove(Moves.SolarBeam);
    unit.addMove(Moves.Tackle);
    // Low enough that Solar Beam kills and Tackle takes most of what
    // is left, which is the widest a chip can score
    enemy.setHealth(24);

    // The step Solar Beam spends charging is a real cost, but never
    // enough of one to make leaving the target standing look better
    expect(chooseMove(battle, unit)?.move).toBe(Moves.SolarBeam);
  });

  it('pays for the step a move spends winding up', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    const target: MoveTarget = { type: MoveTargetType.Unit, unit: enemy };

    const windingUp = scoreMove(battle, unit, Moves.SolarBeam, target);

    // The sun is what lets Solar Beam skip its charge
    battle.setWeather(Weathers.Sunny);

    expect(scoreMove(battle, unit, Moves.SolarBeam, target)).toBe(windingUp + STEP_PENALTY);
  });

  it('leaves a stage alone once it is pinned', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    unit.removeMove(Moves.Attack);
    unit.addMove(Moves.Growl);
    unit.addMove(Moves.TailWhip);
    enemy.addStage(Stages.Attack, -6, NONE_CAUSE);

    // Growl has nowhere left to push, so the other debuff wins
    expect(chooseMove(battle, unit)?.move).toBe(Moves.TailWhip);
  });

  it('will not clear a field it is the one winning', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    // Targetless, so the rating-aware focus on a named enemy stays
    // out of what is being measured
    const target: MoveTarget = { type: MoveTargetType.None };

    unit.addStage(Stages.Attack, 6, NONE_CAUSE);

    const ahead = scoreMove(battle, unit, Moves.Haze, target);

    unit.addStage(Stages.Attack, -6, NONE_CAUSE);
    enemy.addStage(Stages.Attack, 6, NONE_CAUSE);

    expect(scoreMove(battle, unit, Moves.Haze, target)).toBe(ahead + USELESS_PENALTY);
  });

  it('spends its life only when there is little left of it', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    createUnit(battle, teamB);
    // Targetless, so the rating-aware focus on a named enemy stays
    // out of what is being measured
    const target: MoveTarget = { type: MoveTargetType.None };

    const healthy = scoreMove(battle, unit, Moves.Explosion, target);

    unit.setHealth(20);

    expect(scoreMove(battle, unit, Moves.Explosion, target)).toBeGreaterThan(healthy);
  });

  it('heals by what the heal would put back', () => {
    const { battle, teamA, teamB } = createAIBattle();
    pinRandom(battle, 0.99);
    const unit = createUnit(battle, teamA);
    createUnit(battle, teamB);
    // Targetless, so the rating-aware focus on a named enemy stays
    // out of what is being measured
    const target: MoveTarget = { type: MoveTargetType.None };

    // Recover restores half a pool, so a unit missing a tenth of one
    // is throwing most of it away
    expect(scoreMove(battle, unit, Moves.Recover, target)).toBe(BASE_SCORE - USELESS_PENALTY);

    unit.setHealth(60);

    expect(scoreMove(battle, unit, Moves.Recover, target)).toBe(BASE_SCORE + HEAL_BONUS);
  });
});
