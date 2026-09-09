import { describe, expect, it } from 'vitest';
import {
  BattleEvents,
  type CheckUnitAIMoveUsableEvent,
  type CheckUnitMovePowerEvent,
  EffectType,
  MoveTargetType,
} from '../../../src/battle/events';
import type Battle from '../../../src/battle/core';
import type Unit from '../../../src/battle/unit';
import { Stages, Stats } from '../../../src/data/constants/stats';
import { Types } from '../../../src/data/constants/types';
import { Items } from '../../../src/data/ids/items';
import { Moves } from '../../../src/data/ids/moves';
import { Statuses } from '../../../src/data/ids/status';
import Abilities from '../../../src/data/ids/abilities';
import { EventPriority } from '../../../src/core/event-emitter';
import turns from '../../../src/battle/turn';
import { toxicLayersUnder } from '../../../src/battle/moves/toxic-spikes';
import { stealableItem } from '../../../src/battle/utils';
import { createBattle, createUnit, pinRandom } from '../harness';

/** A plain cause, for the damage and heals these tests stage by hand */
const MOVE_CAUSE = { type: EffectType.None } as const;

function unitTarget(unit: Unit): { readonly type: MoveTargetType.Unit; readonly unit: Unit } {
  return { type: MoveTargetType.Unit, unit } as const;
}

const NONE_TARGET = { type: MoveTargetType.None } as const;

/** What a move is worth against this target right now */
function powerOf(battle: Battle, source: Unit, move: Moves, aim: Unit): number {
  const event: CheckUnitMovePowerEvent = {
    id: 'CheckMovePower',
    disabled: false,
    source,
    move,
    target: unitTarget(aim),
    power: 0,
  };

  battle.emit(BattleEvents.CheckUnitMovePower, event);
  return event.power ?? 0;
}

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

describe("Sinnoh's moves", () => {
  it('puts a roosting flyer on the ground, and lets it back up', () => {
    const { battle, teamA, teamB } = createBattle();
    const bird = createUnit(battle, teamA, [Types.Normal, Types.Flying]);
    const other = createUnit(battle, teamB);

    bird.enter();
    other.enter();
    bird.damage(MOVE_CAUSE, bird, bird.checkStat(Stats.HP, 0) / 2, 0);

    const hurt = bird.health;

    bird.triggerMoveEffect(Moves.Roost, NONE_TARGET, 0);
    battle.tick(1);

    // The heal landed and the bird is down while it rests
    expect(bird.health).toBeGreaterThan(hurt);
    expect(bird.status[Statuses.Roosting]).not.toBeNull();

    // And it is back on the wing once the rest is over
    battle.tick(turns(2));
    expect(bird.status[Statuses.Roosting]).toBeUndefined();
  });

  it('reads a Dark type with Miracle Eye without opening it to everything', () => {
    const { battle, teamA, teamB } = createBattle();
    const seer = createUnit(battle, teamA);
    const dark = createUnit(battle, teamB, [Types.Dark]);

    seer.enter();
    dark.enter();
    seer.triggerMoveEffect(Moves.MiracleEye, unitTarget(dark), 0);
    battle.tick(1);

    expect(dark.status[Statuses.MindRead]).not.toBeNull();
    // Foresight's own mark is a different one, so neither move stands
    // in for the other
    expect(dark.status[Statuses.Identified]).toBeUndefined();

    // Nothing is worth reading twice
    expect(usable(battle, seer, Moves.MiracleEye, dark)).toBe(false);
  });

  it('swaps Attack and Defense over for a Power Trick, and back again', () => {
    const { battle, teamA, teamB } = createBattle();
    const tricked = createUnit(battle, teamA);

    createUnit(battle, teamB).enter();
    tricked.enter();

    const attack = tricked.checkStat(Stats.Attack, 0);
    const defense = tricked.checkStat(Stats.Defense, 0);

    tricked.triggerMoveEffect(Moves.PowerTrick, NONE_TARGET, 0);
    battle.tick(1);
    expect(tricked.checkStat(Stats.Attack, 0)).toBe(defense);
    expect(tricked.checkStat(Stats.Defense, 0)).toBe(attack);

    // Casting it again is what puts them back
    tricked.triggerMoveEffect(Moves.PowerTrick, NONE_TARGET, 0);
    battle.tick(1);
    expect(tricked.checkStat(Stats.Attack, 0)).toBe(attack);
  });

  it('refuses every heal while Heal Block holds', () => {
    const { battle, teamA, teamB } = createBattle();
    const blocker = createUnit(battle, teamA);
    const blocked = createUnit(battle, teamB);

    blocker.enter();
    blocked.enter();
    blocked.damage(MOVE_CAUSE, blocked, blocked.checkStat(Stats.HP, 0) / 2, 0);

    blocker.triggerMoveEffect(Moves.HealBlock, unitTarget(blocked), 0);
    battle.tick(1);
    expect(blocked.status[Statuses.HealBlocked]).not.toBeNull();

    const hurt = blocked.health;

    blocked.heal(MOVE_CAUSE, blocked, 50, 0);
    expect(blocked.health).toBe(hurt);

    // And it wears off rather than being taken off
    battle.tick(turns(6));
    expect(blocked.status[Statuses.HealBlocked]).toBeUndefined();
    blocked.heal(MOVE_CAUSE, blocked, 50, 0);
    expect(blocked.health).toBeGreaterThan(hurt);
  });

  it('hands an ailment over with Psycho Shift, and keeps none of it', () => {
    const { battle, teamA, teamB } = createBattle();
    const sick = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    sick.enter();
    target.enter();
    sick.addStatus(Statuses.Burned, MOVE_CAUSE);
    expect(sick.status[Statuses.Burned]).not.toBeNull();

    sick.triggerMoveEffect(Moves.PsychoShift, unitTarget(target), 0);
    battle.tick(1);

    expect(target.status[Statuses.Burned]).not.toBeNull();
    expect(sick.status[Statuses.Burned]).toBeUndefined();
  });

  it('takes a berry off a target with Pluck and gets what it was worth', () => {
    const { battle, teamA, teamB } = createBattle();
    const bird = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);

    bird.enter();
    holder.enter();
    holder.addItem(Items.OranBerry);

    bird.attack(holder, Moves.Pluck, 1, Types.Flying, 0, 0);
    battle.tick(1);

    // The berry is off the target either way: eaten is eaten
    expect(holder.items[Items.OranBerry]).toBeUndefined();
  });

  it('leaves nothing to throw once a Fling has been thrown', () => {
    const { battle, teamA, teamB } = createBattle();
    const thrower = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    thrower.enter();
    target.enter();

    // Nothing in hand is nothing to throw
    expect(usable(battle, thrower, Moves.Fling, target)).toBe(false);

    thrower.addItem(Items.OranBerry);
    expect(usable(battle, thrower, Moves.Fling, target)).toBe(true);

    thrower.attack(target, Moves.Fling, 1, Types.Dark, 0, 0);
    battle.tick(1);
    expect(thrower.items[Items.OranBerry]).toBeUndefined();
  });

  it('presses two stages onto one stat with Acupressure', () => {
    const { battle, teamA, teamB } = createBattle();
    const presser = createUnit(battle, teamA);

    createUnit(battle, teamB).enter();
    presser.enter();
    pinRandom(battle, 0);

    presser.triggerMoveEffect(Moves.Acupressure, unitTarget(presser), 0);
    battle.tick(1);

    // The first point on the list at a pinned roll, two stages of it
    expect(presser.stages[Stages.Attack]).toBe(2);
  });

  it('doubles the whole side up while a Tailwind is behind it', () => {
    const { battle, teamA, teamB } = createBattle();
    const caster = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const other = createUnit(battle, teamB);

    caster.enter();
    other.enter();

    const before = mate.checkStat(Stats.Speed, 0);
    const enemy = other.checkStat(Stats.Speed, 0);

    caster.triggerMoveEffect(Moves.Tailwind, { type: MoveTargetType.Team, team: teamA }, 0);
    battle.tick(1);

    // Everybody on that side, whether or not they were on the field
    expect(mate.checkStat(Stats.Speed, 0)).toBe(before * 2);
    // And nobody on the other
    expect(other.checkStat(Stats.Speed, 0)).toBe(enemy);

    battle.tick(turns(4));
    expect(mate.checkStat(Stats.Speed, 0)).toBe(before);
  });

  it('only lands a Sucker Punch on a target that is already swinging', () => {
    const { battle, teamA, teamB } = createBattle();
    const puncher = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    puncher.enter();
    target.enter();
    target.addMove(Moves.Tackle);

    // Nothing to catch: the target is standing still
    expect(usable(battle, puncher, Moves.SuckerPunch, target)).toBe(false);

    target.cast(Moves.Tackle, unitTarget(puncher));
    expect(usable(battle, puncher, Moves.SuckerPunch, target)).toBe(true);
  });

  it('waits for a Last Resort until everything else has been out', () => {
    const { battle, teamA, teamB } = createBattle();
    const desperate = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    desperate.enter();
    target.enter();
    desperate.addMove(Moves.LastResort);
    desperate.addMove(Moves.Tackle);
    desperate.addMove(Moves.Growl);

    expect(usable(battle, desperate, Moves.LastResort, target)).toBe(false);

    desperate.triggerMove(Moves.Tackle, unitTarget(target), 0);
    expect(usable(battle, desperate, Moves.LastResort, target)).toBe(false);

    // Everything else has been out now, so the resort is there
    desperate.triggerMove(Moves.Growl, unitTarget(target), 0);
    expect(usable(battle, desperate, Moves.LastResort, target)).toBe(true);
  });

  it('trades stages across the field with a Power Swap, and makes none', () => {
    const { battle, teamA, teamB } = createBattle();
    const swapper = createUnit(battle, teamA);
    const built = createUnit(battle, teamB);

    swapper.enter();
    built.enter();
    built.addStage(Stages.Attack, 2, MOVE_CAUSE);
    swapper.addStage(Stages.SpecialAttack, 1, MOVE_CAUSE);

    swapper.triggerMoveEffect(Moves.PowerSwap, unitTarget(built), 0);
    battle.tick(1);

    expect(swapper.stages[Stages.Attack]).toBe(2);
    expect(built.stages[Stages.Attack]).toBe(0);
    expect(built.stages[Stages.SpecialAttack]).toBe(1);
    expect(swapper.stages[Stages.SpecialAttack]).toBe(0);

    // The defences were never on the table
    expect(swapper.stages[Stages.Defense]).toBe(0);
  });

  it('answers a target for what it has built, with Punishment', () => {
    const { battle, teamA, teamB } = createBattle();
    const punisher = createUnit(battle, teamA);
    const built = createUnit(battle, teamB);

    punisher.enter();
    built.enter();

    const plain = powerOf(battle, punisher, Moves.Punishment, built);

    built.addStage(Stages.Attack, 2, MOVE_CAUSE);
    expect(powerOf(battle, punisher, Moves.Punishment, built)).toBeGreaterThan(plain);

    // Stages it has lost are not stages it answers for
    const other = createUnit(battle, teamB);

    other.enter();
    other.addStage(Stages.Attack, -2, MOVE_CAUSE);
    expect(powerOf(battle, punisher, Moves.Punishment, other)).toBe(plain);
  });

  it('poisons whatever walks onto Toxic Spikes, and a Poison type takes them up', () => {
    const { battle, teamA, teamB } = createBattle();
    const layer = createUnit(battle, teamA);
    const walker = createUnit(battle, teamB);
    const cleaner = createUnit(battle, teamB, [Types.Poison]);

    layer.enter();
    layer.triggerMoveEffect(Moves.ToxicSpikes, { type: MoveTargetType.Team, team: teamB }, 0);
    battle.tick(1);

    walker.enter();
    expect(walker.status[Statuses.Poisoned]).not.toBeNull();

    // The Poison type sweeps them rather than standing in them
    cleaner.enter();
    expect(cleaner.status[Statuses.Poisoned]).toBeUndefined();
    expect(toxicLayersUnder(teamB)).toBe(0);
  });

  it('keeps a magnet-risen unit off the ground for a while', () => {
    const { battle, teamA, teamB } = createBattle();
    const risen = createUnit(battle, teamA);

    createUnit(battle, teamB).enter();
    risen.enter();
    expect(risen.checkGrounded()).toBe(true);

    risen.triggerMoveEffect(Moves.MagnetRise, NONE_TARGET, 0);
    battle.tick(1);
    expect(risen.checkGrounded()).toBe(false);

    battle.tick(turns(6));
    expect(risen.checkGrounded()).toBe(true);
  });

  it('takes one ability with a Gastro Acid rather than every one', () => {
    const { battle, teamA, teamB } = createBattle();
    const souring = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    souring.enter();
    target.enter();
    target.addAbility(Abilities.Levitate);

    // Counted rather than read off the record: a unit with room for
    // several would lose all of them to a move that swept the list,
    // and one removal is the whole of what this move does
    let taken = 0;

    battle.on(BattleEvents.UnitRemoveAbility, EventPriority.Post, () => {
      taken += 1;
    });

    souring.triggerMoveEffect(Moves.GastroAcid, unitTarget(target), 0);
    battle.tick(1);

    expect(taken).toBe(1);
    expect(target.hasAbility(Abilities.Levitate)).toBe(false);
  });

  it('puts Insomnia in the place a Worry Seed took, and nowhere else', () => {
    const { battle, teamA, teamB } = createBattle();
    const sower = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    sower.enter();
    target.enter();
    target.addAbility(Abilities.Levitate);

    let taken = 0;

    battle.on(BattleEvents.UnitRemoveAbility, EventPriority.Post, () => {
      taken += 1;
    });

    sower.triggerMoveEffect(Moves.WorrySeed, unitTarget(target), 0);
    battle.tick(1);

    expect(taken).toBe(1);
    expect(target.hasAbility(Abilities.Insomnia)).toBe(true);
    expect(target.hasAbility(Abilities.Levitate)).toBe(false);
  });

  it('draws the stolen item at random rather than off the top of the bag', () => {
    const { battle, teamA, teamB } = createBattle();
    const thief = createUnit(battle, teamA);
    const victim = createUnit(battle, teamB);

    thief.enter();
    victim.enter();
    // Written into the bag rather than added, since an ordinary unit
    // has room for one and this is the case the draw is for
    victim.items[Items.OranBerry] = true;
    victim.items[Items.SitrusBerry] = true;

    // Either end of the bag is reachable, so which of two held items
    // a thief walks off with is the roll's decision and not the
    // order they happened to go in
    pinRandom(battle, 0);
    const first = stealableItem(victim);

    pinRandom(battle, 0.99);
    const last = stealableItem(victim);

    expect(first).not.toBeUndefined();
    expect(last).not.toBe(first);

    // And a roll of exactly 1, which a pinned RNG hands out, still
    // points inside the bag
    pinRandom(battle, 1);
    expect(stealableItem(victim)).toBe(last);
  });
});
