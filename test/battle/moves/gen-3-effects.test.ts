import { describe, expect, it } from 'vitest';
import {
  BattleEvents,
  type CheckUnitAIMoveScoreEvent,
  type CheckUnitAIMoveUsableEvent,
  MoveTargetType,
} from '../../../src/battle/events';
import { BASE_SCORE } from '../../../src/battle/ai/score';
import { setupChooseMoveAI } from '../../../src/battle/ai/choose-move';
import type Unit from '../../../src/battle/unit';
import { Stages, Stats } from '../../../src/data/constants/stats';
import { Types } from '../../../src/data/constants/types';
import { Items } from '../../../src/data/ids/items';
import { Moves } from '../../../src/data/ids/moves';
import { Statuses, Weathers } from '../../../src/data/ids/status';
import Abilities from '../../../src/data/ids/abilities';
import turns from '../../../src/battle/turn';
import Biome from '../../../src/data/ids/biome';
import { groundMove, groundStatus } from '../../../src/battle/moves/ground';
import { getMoveData } from '../../../src/data/moves';
import type Battle from '../../../src/battle/core';
import { createBattle, createUnit, pinRandom } from '../harness';

function unitTarget(unit: Unit): { readonly type: MoveTargetType.Unit; readonly unit: Unit } {
  return { type: MoveTargetType.Unit, unit } as const;
}

const NONE_TARGET = { type: MoveTargetType.None } as const;

function usable(battle: Battle, source: Unit, move: Moves, aim: Unit): boolean {
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

describe('the moves that answer for what is happening around them', () => {
  it('spends a Fake Out on the one surprise a trip onto the field is worth', () => {
    const { battle, teamA, teamB } = createBattle();
    const bully = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    bully.addMove(Moves.FakeOut);
    bully.enter();
    expect(bully.checkCanCast(Moves.FakeOut, NONE_TARGET)).toBe(true);

    // Standing about does not spend it: nothing here has an opening
    // move, so nothing runs out on a clock
    battle.tick(turns(3));
    expect(bully.checkCanCast(Moves.FakeOut, NONE_TARGET)).toBe(true);

    bully.triggerMove(Moves.FakeOut, unitTarget(target), 0);
    expect(bully.checkCanCast(Moves.FakeOut, NONE_TARGET)).toBe(false);

    // And walking on again is a fresh entrance
    bully.enter();
    expect(bully.checkCanCast(Moves.FakeOut, NONE_TARGET)).toBe(true);
  });

  it('loses a Focus Punch to a hit taken while it is wound up, and pays a Revenge for one', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const puncher = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);

    puncher.addMove(Moves.FocusPunch);
    puncher.addMove(Moves.Revenge);
    puncher.cast(Moves.FocusPunch, unitTarget(attacker));
    expect(puncher.casting?.move).toBe(Moves.FocusPunch);

    attacker.triggerMoveTarget(Moves.Tackle, unitTarget(puncher), 0);
    // The concentration was the move: nothing is being cast now
    expect(puncher.casting).toBeUndefined();

    // And the hit it took is what the grudge move is worth double for
    const plain = attacker.checkMovePower(Moves.Revenge, unitTarget(puncher));

    expect(puncher.checkMovePower(Moves.Revenge, unitTarget(attacker))).toBe((plain ?? 0) * 2);
  });
});

describe('Stockpile and what spends it', () => {
  it('fills the store over its own steps, one charge a step', () => {
    const { battle, teamA, teamB } = createBattle();
    const hoarder = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    // Three steps, which is three charges in one cast
    expect(hoarder.checkMoveSteps(Moves.Stockpile, NONE_TARGET)).toBe(2);
    expect(hoarder.checkMovePower(Moves.SpitUp, unitTarget(target))).toBe(0);

    hoarder.triggerMoveEffect(Moves.Stockpile, NONE_TARGET, 2);
    expect(hoarder.checkMovePower(Moves.SpitUp, unitTarget(target))).toBe(100);
    // The stages come with the charges, a pair at a time
    expect(hoarder.checkStage(Stages.Defense, 0)).toBe(1);

    hoarder.triggerMoveEffect(Moves.Stockpile, NONE_TARGET, 1);
    hoarder.triggerMoveEffect(Moves.Stockpile, NONE_TARGET, 0);
    expect(hoarder.checkMovePower(Moves.SpitUp, unitTarget(target))).toBe(300);
    expect(hoarder.checkStage(Stages.Defense, 0)).toBe(3);
    expect(hoarder.checkStage(Stages.SpecialDefense, 0)).toBe(3);

    // And a full store takes nothing more
    hoarder.triggerMoveEffect(Moves.Stockpile, NONE_TARGET, 2);
    expect(hoarder.checkMovePower(Moves.SpitUp, unitTarget(target))).toBe(300);
  });

  it('keeps what an interrupted cast managed to put away', () => {
    const { battle, teamA, teamB } = createBattle();
    const hoarder = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    hoarder.triggerMoveEffect(Moves.Stockpile, NONE_TARGET, 2);
    hoarder.interrupt();

    expect(hoarder.checkMovePower(Moves.SpitUp, unitTarget(target))).toBe(100);
  });

  it('does not read the banking as a wind-up worth avoiding', () => {
    const { battle, teamA } = createBattle();

    // The chooser is what charges a move for its steps, so it is what
    // the hand-back has to be weighed against
    setupChooseMoveAI(battle);

    const hoarder = createUnit(battle, teamA);
    const scoreOf = (move: Moves): number => {
      const event: CheckUnitAIMoveScoreEvent = {
        id: 'CheckUnitAIMoveScore',
        disabled: false,
        source: hoarder,
        move,
        target: NONE_TARGET,
        score: BASE_SCORE,
      };

      battle.emit(BattleEvents.CheckUnitAIMoveScore, event);
      return event.score;
    };

    // Every step of a Stockpile does something, so it is worth what a
    // one-cast set-up move is worth rather than paying for its steps
    expect(scoreOf(Moves.Stockpile)).toBe(scoreOf(Moves.Harden));
  });

  it('swallows what was stored and nothing more', () => {
    const { battle, teamA } = createBattle();
    const hoarder = createUnit(battle, teamA);

    hoarder.setHealth(40);
    hoarder.triggerMoveEffect(Moves.Stockpile, NONE_TARGET, 0);
    hoarder.triggerMoveEffect(Moves.Swallow, NONE_TARGET, 0);
    // One charge is a quarter of the pool
    expect(hoarder.health).toBe(40 + hoarder.checkStat(Stats.HP, 0) * 0.25);

    const held = hoarder.health;

    hoarder.triggerMoveEffect(Moves.Swallow, NONE_TARGET, 0);
    expect(hoarder.health).toBe(held);
  });
});

describe('the holds Hoenn puts on a move set', () => {
  it('taunts a pokemon out of everything that does no damage', () => {
    const { battle, teamA, teamB } = createBattle();
    const talker = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    target.addMove(Moves.SwordsDance);
    target.addMove(Moves.Tackle);
    talker.triggerMoveEffect(Moves.Taunt, unitTarget(target), 0);

    expect(target.status[Statuses.Taunted]).toBeDefined();
    expect(target.checkCanCast(Moves.SwordsDance, NONE_TARGET)).toBe(false);
    expect(target.checkCanCast(Moves.Tackle, unitTarget(talker))).toBe(true);
  });

  it('torments a pokemon out of the move it just used', () => {
    const { battle, teamA, teamB } = createBattle();
    const talker = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    target.addMove(Moves.Tackle);
    target.addMove(Moves.Growl);
    target.triggerMove(Moves.Tackle, unitTarget(talker), 0);
    talker.triggerMoveEffect(Moves.Torment, unitTarget(target), 0);

    expect(target.checkCanCast(Moves.Tackle, unitTarget(talker))).toBe(false);
    expect(target.checkCanCast(Moves.Growl, unitTarget(talker))).toBe(true);
  });

  it('seals what the imprisoner also knows, and nothing else', () => {
    const { battle, teamA, teamB } = createBattle();
    const jailer = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    jailer.addMove(Moves.Tackle);
    target.addMove(Moves.Tackle);
    target.addMove(Moves.Growl);
    jailer.triggerMoveEffect(Moves.Imprison, unitTarget(target), 0);

    expect(target.checkCanCast(Moves.Tackle, unitTarget(jailer))).toBe(false);
    expect(target.checkCanCast(Moves.Growl, unitTarget(jailer))).toBe(true);
  });

  it('puts a yawned-at pokemon to sleep when the yawn catches up', () => {
    const { battle, teamA, teamB } = createBattle();
    const yawner = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    yawner.triggerMoveEffect(Moves.Yawn, unitTarget(target), 0);
    expect(target.status[Statuses.Drowsy]).toBeDefined();
    expect(target.status[Statuses.Sleeping]).toBeUndefined();

    battle.tick(turns(2));
    expect(target.status[Statuses.Drowsy]).toBeUndefined();
    expect(target.status[Statuses.Sleeping]).toBeDefined();
  });

  it('shouts for as long as the Uproar runs, and no longer', () => {
    const { battle, teamA, teamB } = createBattle();
    const shouter = createUnit(battle, teamA);
    const sleeper = createUnit(battle, teamB);

    // It is a rampage: three hits over, like a Thrash
    expect(shouter.checkMoveSteps(Moves.Uproar, unitTarget(sleeper))).toBe(2);

    sleeper.addStatus(Statuses.Sleeping, { type: 0 });
    shouter.triggerMove(Moves.Uproar, unitTarget(sleeper), 2);

    expect(shouter.status[Statuses.Uproaring]).toBeDefined();
    expect(sleeper.status[Statuses.Sleeping]).toBeUndefined();

    // Nothing goes under while it is going on
    sleeper.addStatus(Statuses.Sleeping, { type: 0 });
    expect(sleeper.status[Statuses.Sleeping]).toBeUndefined();

    // The last hit is where the noise stops
    shouter.triggerMove(Moves.Uproar, unitTarget(sleeper), 0);
    expect(shouter.status[Statuses.Uproaring]).toBeUndefined();

    sleeper.addStatus(Statuses.Sleeping, { type: 0 });
    expect(sleeper.status[Statuses.Sleeping]).toBeDefined();
  });

  it('leaves the shouter clear-headed, unlike the rampages beside it', () => {
    const { battle, teamA, teamB } = createBattle();
    const shouter = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    shouter.triggerMoveEffect(Moves.Uproar, unitTarget(target), 0);
    expect(shouter.status[Statuses.Confused]).toBeUndefined();
  });
});

describe('what a move reads off the fight', () => {
  it('doubles a Facade for the pokemon fighting through something', () => {
    const { battle, teamA, teamB } = createBattle();
    const burned = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);
    const plain = burned.checkMovePower(Moves.Facade, unitTarget(target)) ?? 0;

    burned.addStatus(Statuses.Burned, { type: 0 });
    expect(burned.checkMovePower(Moves.Facade, unitTarget(target))).toBe(plain * 2);
  });

  it('scales Eruption off what is left of the user', () => {
    const { battle, teamA, teamB } = createBattle();
    const erupter = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    expect(erupter.checkMovePower(Moves.Eruption, unitTarget(target))).toBe(150);

    erupter.setHealth(erupter.checkStat(Stats.HP, 0) / 2);
    expect(erupter.checkMovePower(Moves.Eruption, unitTarget(target))).toBe(75);
  });

  it('gives a Weather Ball the sky it is thrown under', () => {
    const { battle, teamA, teamB } = createBattle();
    const thrower = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    expect(thrower.checkMoveType(Moves.WeatherBall, unitTarget(target))).toBe(Types.Normal);
    expect(thrower.checkMovePower(Moves.WeatherBall, unitTarget(target))).toBe(50);

    thrower.setWeather(Weathers.Rain, turns(5));
    expect(thrower.checkMoveType(Moves.WeatherBall, unitTarget(target))).toBe(Types.Water);
    expect(thrower.checkMovePower(Moves.WeatherBall, unitTarget(target))).toBe(100);
  });

  it('spends a Charge on the next Electric move and nothing else', () => {
    const { battle, teamA, teamB } = createBattle();
    const charger = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    charger.addMove(Moves.ThunderShock);
    charger.addMove(Moves.Tackle);
    charger.triggerMoveEffect(Moves.Charge, NONE_TARGET, 0);

    const plainTackle = charger.checkMovePower(Moves.Tackle, unitTarget(target)) ?? 0;

    expect(charger.checkMovePower(Moves.ThunderShock, unitTarget(target))).toBe(80);
    expect(charger.checkMovePower(Moves.Tackle, unitTarget(target))).toBe(plainTackle);

    charger.triggerMove(Moves.ThunderShock, unitTarget(target), 0);
    expect(charger.checkMovePower(Moves.ThunderShock, unitTarget(target))).toBe(40);
  });

  it('halves what a sport is thrown against, while it lasts', () => {
    const { battle, teamA, teamB } = createBattle();
    const dancer = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    dancer.addMove(Moves.ThunderShock);
    dancer.triggerMoveEffect(Moves.MudSport, NONE_TARGET, 0);
    expect(dancer.checkMovePower(Moves.ThunderShock, unitTarget(target))).toBe(20);

    battle.tick(turns(5));
    expect(dancer.checkMovePower(Moves.ThunderShock, unitTarget(target))).toBe(40);
  });

  it('levels the two sides with an Endeavor', () => {
    const { battle, teamA, teamB } = createBattle();
    const desperate = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    pinRandom(battle, 1);
    desperate.setHealth(20);
    desperate.triggerMoveTarget(Moves.Endeavor, unitTarget(target), 0);

    expect(target.health).toBe(20);
  });
});

describe('what Hoenn does to what a pokemon is holding', () => {
  it('knocks an item out of the target’s hands', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const striker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);

    holder.addItem(Items.Leftovers);
    striker.triggerMoveTarget(Moves.KnockOff, unitTarget(holder), 0);

    expect(holder.items[Items.Leftovers]).toBeFalsy();
    // Knocked away rather than pocketed
    expect(striker.items[Items.Leftovers]).toBeFalsy();
  });

  it('swaps hands with a Trick', () => {
    const { battle, teamA, teamB } = createBattle();
    const trickster = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);

    trickster.addItem(Items.ChoiceBand);
    holder.addItem(Items.Leftovers);
    trickster.triggerMoveEffect(Moves.Trick, unitTarget(holder), 0);

    expect(trickster.items[Items.Leftovers]).toBe(true);
    expect(holder.items[Items.ChoiceBand]).toBe(true);
  });
});

describe('what Hoenn does to abilities', () => {
  it('copies the target’s ability with Role Play', () => {
    const { battle, teamA, teamB } = createBattle();
    const mimic = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    mimic.addAbility(Abilities.Overgrow);
    target.addAbility(Abilities.Blaze);
    mimic.triggerMoveEffect(Moves.RolePlay, unitTarget(target), 0);

    expect(mimic.abilities[Abilities.Blaze]).toBe(true);
    expect(mimic.abilities[Abilities.Overgrow]).toBeFalsy();
    // The target keeps its own
    expect(target.abilities[Abilities.Blaze]).toBe(true);
  });

  it('trades abilities with a Skill Swap', () => {
    const { battle, teamA, teamB } = createBattle();
    const swapper = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    swapper.addAbility(Abilities.Overgrow);
    target.addAbility(Abilities.Blaze);
    swapper.triggerMoveEffect(Moves.SkillSwap, unitTarget(target), 0);

    expect(swapper.abilities[Abilities.Blaze]).toBe(true);
    expect(target.abilities[Abilities.Overgrow]).toBe(true);
  });
});

describe('the moves that stand in somebody else’s way', () => {
  it('turns a cast already winding up onto whoever called for it', () => {
    const { battle, teamA, teamB } = createBattle();
    const guard = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);

    attacker.addMove(Moves.Tackle);
    attacker.cast(Moves.Tackle, unitTarget(ally));
    expect(attacker.casting?.target).toEqual(unitTarget(ally));

    guard.triggerMoveEffect(Moves.FollowMe, NONE_TARGET, 0);
    expect(attacker.casting?.target).toEqual(unitTarget(guard));
  });

  it('turns what is aimed afterwards as well, while it holds', () => {
    const { battle, teamA, teamB } = createBattle();
    const guard = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);

    attacker.addMove(Moves.Tackle);
    guard.triggerMoveEffect(Moves.FollowMe, NONE_TARGET, 0);
    attacker.cast(Moves.Tackle, unitTarget(ally));

    expect(attacker.casting?.target).toEqual(unitTarget(guard));

    // And it is a spell rather than a standing rule
    attacker.stopCast();
    battle.tick(turns(2));
    attacker.cast(Moves.Tackle, unitTarget(ally));
    expect(attacker.casting?.target).toEqual(unitTarget(ally));
  });

  it('turns a status move back on whoever cast it', () => {
    const { battle, teamA, teamB } = createBattle();
    const coated = createUnit(battle, teamA);
    const caster = createUnit(battle, teamB);

    coated.triggerMoveEffect(Moves.MagicCoat, NONE_TARGET, 0);
    caster.triggerMoveTarget(Moves.ThunderWave, unitTarget(coated), 0);

    expect(coated.status[Statuses.Paralyzed]).toBeUndefined();
    expect(caster.status[Statuses.Paralyzed]).toBeDefined();
    // The coat is spent on the one move it turned
    expect(coated.status[Statuses.Coated]).toBeUndefined();
  });

  it('takes a self-cast move out of somebody else’s hands', () => {
    const { battle, teamA, teamB } = createBattle();
    const thief = createUnit(battle, teamA);
    const caster = createUnit(battle, teamB);

    thief.triggerMoveEffect(Moves.Snatch, NONE_TARGET, 0);
    caster.triggerMoveTarget(Moves.SwordsDance, unitTarget(caster), 0);

    expect(thief.checkStage(Stages.Attack, 0)).toBe(2);
    expect(caster.checkStage(Stages.Attack, 0)).toBe(0);
  });
});

describe('the moves that are paid for later', () => {
  it('heals whoever is standing there when a Wish lands', () => {
    const { battle, teamA } = createBattle();
    const wisher = createUnit(battle, teamA);

    wisher.setHealth(20);
    wisher.triggerMoveEffect(Moves.Wish, NONE_TARGET, 0);
    expect(wisher.health).toBe(20);

    battle.tick(turns(2));
    expect(wisher.health).toBe(20 + wisher.checkStat(Stats.HP, 0) * 0.5);
  });

  it('roots a pokemon down: it heals as it acts and cannot leave', () => {
    const { battle, teamA, teamB } = createBattle();
    const rooted = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    rooted.addMove(Moves.Tackle);
    rooted.setHealth(20);
    rooted.triggerMoveEffect(Moves.Ingrain, NONE_TARGET, 0);
    expect(rooted.checkEscape()).toBe(false);

    rooted.cast(Moves.Tackle, unitTarget(target));
    expect(rooted.health).toBe(20 + rooted.checkStat(Stats.HP, 0) / 16);
  });

  it('breaks the screens before it hits', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const breaker = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    target.triggerMoveEffect(Moves.Reflect, NONE_TARGET, 0);
    breaker.triggerMoveTarget(Moves.BrickBreak, unitTarget(target), 0);

    expect(target.team.status[0]).toBeUndefined();
  });

  it('takes the user down with a Memento', () => {
    const { battle, teamA, teamB } = createBattle();
    const parting = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    parting.triggerMoveEffect(Moves.Memento, unitTarget(target), 0);

    expect(target.checkStage(Stages.Attack, 0)).toBe(-2);
    expect(target.checkStage(Stages.SpecialAttack, 0)).toBe(-2);
    expect(parting.alive).toBe(false);
  });
});

describe('the moves that read the ground', () => {
  it('takes the type of the biome the fight is being had in', () => {
    const swamp = createBattle('ground-swamp');

    swamp.battle.biome = Biome.Swamp;

    const lurker = createUnit(swamp.battle, swamp.teamA, [Types.Normal]);

    lurker.triggerMoveEffect(Moves.Camouflage, NONE_TARGET, 0);
    expect([...lurker.types]).toEqual([Types.Poison]);
  });

  it('falls back to open ground where the fight is nowhere in particular', () => {
    const { battle, teamA } = createBattle();
    const lurker = createUnit(battle, teamA, [Types.Fire]);

    lurker.triggerMoveEffect(Moves.Camouflage, NONE_TARGET, 0);
    expect([...lurker.types]).toEqual([Types.Normal]);
  });

  it('throws what the ground has to throw', () => {
    const glacier = createBattle('ground-glacier');

    glacier.battle.biome = Biome.Glacier;
    expect(groundMove(glacier.battle)).toBe(Moves.IcyWind);
    expect(groundStatus(glacier.battle)).toBe(Statuses.Frozen);

    const forest = createBattle('ground-forest');

    forest.battle.biome = Biome.TemperateForest;
    expect(groundMove(forest.battle)).toBe(Moves.RazorLeaf);
    expect(groundStatus(forest.battle)).toBe(Statuses.Sleeping);

    // And nowhere in particular throws a Swift
    const nowhere = createBattle('ground-nowhere');

    expect(groundMove(nowhere.battle)).toBe(Moves.Swift);
  });

  it('lands the ground’s own status with a Secret Power', () => {
    const desert = createBattle('ground-desert');

    desert.battle.biome = Biome.Desert;
    pinRandom(desert.battle, 0);

    const striker = createUnit(desert.battle, desert.teamA);
    const target = createUnit(desert.battle, desert.teamB);

    striker.triggerMoveTarget(Moves.SecretPower, unitTarget(target), 0);
    expect(target.status[Statuses.Paralyzed]).toBeDefined();
  });
});

describe('the moves the johto branch changed under them', () => {
  it('rolls an Ice Ball through its own passes, doubling each time', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    expect(user.checkMoveSteps(Moves.IceBall, unitTarget(target))).toBe(4);

    for (const [steps, expected] of [
      [4, 30],
      [3, 60],
      [2, 120],
      [1, 240],
      [0, 480],
    ] as const) {
      user.triggerMove(Moves.IceBall, unitTarget(target), steps);
      expect(user.checkMovePower(Moves.IceBall, unitTarget(target))).toBe(expected);
    }
  });

  it('doubles an Ice Ball again for the pokemon that curled up first', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    user.triggerMove(Moves.DefenseCurl, unitTarget(user), 0);
    user.triggerMove(Moves.IceBall, unitTarget(target), 4);

    expect(user.checkMovePower(Moves.IceBall, unitTarget(target))).toBe(60);
  });

  it('teeters everything else on the field, its own side included', () => {
    const { battle, teamA, teamB } = createBattle();
    const dancer = createUnit(battle, teamA);
    const friend = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    battle.emit(BattleEvents.UnitTriggerMoveEnd, {
      id: 'UnitTriggerMoveEnd',
      disabled: false,
      source: dancer,
      move: Moves.TeeterDance,
      target: NONE_TARGET,
      steps: 0,
    });

    expect(friend.status[Statuses.Confused]).toBeDefined();
    expect(enemy.status[Statuses.Confused]).toBeDefined();
    expect(dancer.status[Statuses.Confused]).toBeUndefined();
  });

  it('flatters a teammate only where the confusion cannot land', () => {
    const { battle, teamA, teamB } = createBattle();
    const caster = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const steady = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    steady.addAbility(Abilities.OwnTempo);

    expect(usable(battle, caster, Moves.Flatter, plain)).toBe(false);
    expect(usable(battle, caster, Moves.Flatter, steady)).toBe(true);
    expect(usable(battle, caster, Moves.Flatter, enemy)).toBe(true);
  });

  it('drops a stat on a teammate only where Contrary turns it round', () => {
    const { battle, teamA } = createBattle();
    const caster = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const contrary = createUnit(battle, teamA);

    contrary.addAbility(Abilities.Contrary);

    for (const move of [Moves.Tickle, Moves.FeatherDance, Moves.MetalSound, Moves.FakeTears]) {
      expect(usable(battle, caster, move, plain), getMoveData(move).name).toBe(false);
      expect(usable(battle, caster, move, contrary), getMoveData(move).name).toBe(true);
    }
  });
});
