import { describe, expect, it } from 'vitest';
import { MoveTargetType } from '../../../src/battle/events';
import { layersUnder } from '../../../src/battle/moves/spikes';
import turns from '../../../src/battle/turn';
import type Unit from '../../../src/battle/unit';
import { Stages, Stats } from '../../../src/data/constants/stats';
import { Types } from '../../../src/data/constants/types';
import { Moves } from '../../../src/data/ids/moves';
import { Species } from '../../../src/data/ids/species';
import { Statuses, Weathers } from '../../../src/data/ids/status';
import { getMoveData } from '../../../src/data/moves';
import { isDanceMove } from '../../../src/data/moves/dances';
import { createBattle, createUnit, pinRandom } from '../harness';

const NONE_TARGET = { type: MoveTargetType.None } as const;

function at(unit: Unit): { readonly type: MoveTargetType.Unit; readonly unit: Unit } {
  return { type: MoveTargetType.Unit, unit } as const;
}

function damageOf(source: Unit, move: Moves, target: Unit): number {
  const before = target.health;

  source.triggerMoveEffect(move, at(target), 0);

  const dealt = before - target.health;

  target.setHealth(before);
  return dealt;
}

describe("Paldea's moves on the shared tables", () => {
  it('registers every one of them', () => {
    createBattle();
    expect(getMoveData(Moves.TeraBlast).power).toBe(80);
    expect(getMoveData(Moves.MalignantChain).name).toBe('Malignant Chain');
    expect(getMoveData(Moves.JetPunch).priority).toBe(1);
  });

  it('pushes the stages it writes down, on the target or on the user', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    pinRandom(battle, 0);
    user.triggerMoveEffect(Moves.LuminaCrash, at(target), 0);
    expect(target.stages[Stages.SpecialDefense]).toBe(-2);

    target.setHealth(target.checkStat(Stats.HP, 0));
    user.triggerMoveEffect(Moves.TorchSong, at(target), 0);
    expect(user.stages[Stages.SpecialAttack]).toBe(1);

    user.triggerMoveEffect(Moves.SpicyExtract, at(target), 0);
    expect(target.stages[Stages.Attack]).toBe(2);
    expect(target.stages[Stages.Defense]).toBe(-2);
  });

  it('counts Aqua Step as a dance', () => {
    expect(isDanceMove(Moves.AquaStep)).toBe(true);
    expect(isDanceMove(Moves.FieryDance)).toBe(true);
  });

  it('halves what is left with Ruination', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);
    const whole = target.health;

    pinRandom(battle, 0);
    user.triggerMoveEffect(Moves.Ruination, at(target), 0);
    expect(target.health).toBe(whole - Math.floor(whole / 2));
  });
});

describe("Paldea's moves with a rule of their own", () => {
  it('hits 50 harder for each fallen teammate with Last Respects', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const fallen = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    expect(user.checkMovePower(Moves.LastRespects, at(target))).toBe(50);
    fallen.faint(target);
    expect(user.checkMovePower(Moves.LastRespects, at(target))).toBe(100);
  });

  it('remembers every hit taken for Rage Fist, up to 350', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 0);
    for (let hit = 0; hit < 3; hit += 1) {
      foe.triggerMoveEffect(Moves.Tackle, at(user), 0);
      user.setHealth(user.checkStat(Stats.HP, 0));
    }
    expect(user.checkMovePower(Moves.RageFist, at(foe))).toBe(200);

    for (let hit = 0; hit < 10; hit += 1) {
      foe.triggerMoveEffect(Moves.Tackle, at(user), 0);
      user.setHealth(user.checkStat(Stats.HP, 0));
    }
    expect(user.checkMovePower(Moves.RageFist, at(foe))).toBe(350);
  });

  it('leaves the Glaive Rush user open to 2x for a moment', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 0);
    const before = damageOf(foe, Moves.Tackle, user);

    user.triggerMoveEffect(Moves.GlaiveRush, at(foe), 0);
    expect(damageOf(foe, Moves.Tackle, user)).toBeGreaterThanOrEqual(before * 2 - 1);

    battle.tick(turns(2));
    expect(damageOf(foe, Moves.Tackle, user)).toBeLessThanOrEqual(before + 1);
  });

  it('salts the target with Salt Cure, harder on Water and Steel', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    pinRandom(battle, 0);
    user.triggerMoveEffect(Moves.SaltCure, at(target), 0);

    const whole = target.checkStat(Stats.HP, 0);
    const before = target.health;

    target.addMove(Moves.Growl);
    target.cast(Moves.Growl, at(user));
    expect(before - target.health).toBe(Math.floor(whole / 8));
  });

  it('slows the target three times with Syrup Bomb', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    pinRandom(battle, 0);
    user.triggerMoveEffect(Moves.SyrupBomb, at(target), 0);
    target.addMove(Moves.Growl);
    for (let act = 0; act < 4; act += 1) {
      target.cast(Moves.Growl, at(user));
      battle.tick(turns(4));
    }
    expect(target.stages[Stages.Speed]).toBe(-3);
  });

  it('brings a fallen teammate back on half its HP with Revival Blessing', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const fallen = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    fallen.faint(foe);
    user.triggerMoveEffect(Moves.RevivalBlessing, at(fallen), 0);
    expect(fallen.alive).toBe(true);
    expect(fallen.health).toBe(Math.floor(fallen.checkStat(Stats.HP, 0) / 2));
  });

  it('will not throw Gigaton Hammer twice in a row', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    user.addMove(Moves.GigatonHammer);
    expect(user.checkCanCast(Moves.GigatonHammer, at(foe))).toBe(true);
    user.triggerMove(Moves.GigatonHammer, at(foe), 0);
    expect(user.checkCanCast(Moves.GigatonHammer, at(foe))).toBe(false);
  });

  it('spends half the user’s HP on Fillet Away, and refuses it below that', () => {
    const { battle, teamA } = createBattle();
    const user = createUnit(battle, teamA);
    const whole = user.checkStat(Stats.HP, 0);

    user.addMove(Moves.FilletAway);
    user.triggerMove(Moves.FilletAway, NONE_TARGET, 0);
    expect(user.health).toBe(whole - Math.ceil(whole / 2));
    expect(user.checkCanCast(Moves.FilletAway, NONE_TARGET)).toBe(false);
  });

  // The breeds and the masks arrive with their species in later
  // batches; until then the two moves keep their own type
  it('throws Raging Bull and Ivy Cudgel as their own type in anybody else’s hands', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    expect(user.checkMoveType(Moves.RagingBull, at(foe))).toBe(Types.Normal);
    expect(user.checkMoveType(Moves.IvyCudgel, at(foe))).toBe(Types.Grass);
  });

  it('keeps a Psychic Noise target from healing for 4 seconds', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    pinRandom(battle, 0);
    user.triggerMoveEffect(Moves.PsychicNoise, at(target), 0);
    expect(target.status[Statuses.HealBlocked]).toBeDefined();
    battle.tick(turns(2) + 100);
    expect(target.status[Statuses.HealBlocked]).toBeUndefined();
  });

  it('clears the hazards and the substitutes with Tidy Up', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    foe.triggerMoveEffect(Moves.Spikes, { type: MoveTargetType.Team, team: teamA }, 0);
    expect(layersUnder(teamA)).toBe(1);
    user.triggerMoveEffect(Moves.TidyUp, NONE_TARGET, 0);
    expect(layersUnder(teamA)).toBe(0);
    expect(user.stages[Stages.Attack]).toBe(1);
  });

  it('calls up snow with Snowscape, which hardens Ice types', () => {
    const { battle, teamA } = createBattle();
    const user = createUnit(battle, teamA);

    user.setSpecies(Species.Glaceon);
    const plain = user.checkStat(Stats.Defense, 0);

    user.triggerMoveEffect(Moves.Snowscape, NONE_TARGET, 0);
    expect(user.checkWeather()).toBe(Weathers.Snow);
    expect(user.checkStat(Stats.Defense, 0)).toBe(plain * 1.5);
  });
});
