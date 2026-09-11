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
import { MoveCategories, Moves } from '../../../src/data/ids/moves';
import { Statuses, TeamStatuses } from '../../../src/data/ids/status';
import Abilities from '../../../src/data/ids/abilities';
import { Genders } from '../../../src/data/ids/species';
import { EventPriority } from '../../../src/core/event-emitter';
import turns from '../../../src/battle/turn';
import { toxicLayersUnder } from '../../../src/battle/moves/toxic-spikes';
import { layersUnder } from '../../../src/battle/moves/spikes';
import { stonesOver } from '../../../src/battle/moves/stealth-rock';
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

  it('lands a U-turn on the way out rather than on its way off the field', () => {
    const { battle, teamA, teamB } = createBattle();
    const leaver = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    leaver.enter();
    target.enter();

    const whole = target.health;

    // The first step is the blow
    leaver.triggerMoveEffect(Moves.UTurn, unitTarget(target), 1);
    battle.tick(1);

    expect(target.health).toBeLessThan(whole);
    // Still standing there: nothing has swapped yet
    expect(leaver.status[Statuses.Switching]).toBeUndefined();

    const hurt = target.health;

    // The second is the walk off the field, which costs the target
    // nothing more
    leaver.triggerMoveEffect(Moves.UTurn, unitTarget(target), 0);
    battle.tick(1);

    expect(target.health).toBe(hurt);
    expect(leaver.status[Statuses.Switching]).toBeDefined();
    expect(mate.status[Statuses.Switching]).toBeDefined();
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

  it('finds nothing to take hold of on a raid boss', () => {
    const { battle, teamA, teamB } = createBattle();
    const sower = createUnit(battle, teamA);
    const boss = createUnit(battle, teamB);

    sower.enter();
    boss.enter();
    boss.addAbility(Abilities.Boss);
    boss.addAbility(Abilities.Levitate);

    const pool = boss.checkStat(Stats.HP, 0);

    sower.triggerMoveEffect(Moves.WorrySeed, unitTarget(boss), 0);
    sower.triggerMoveEffect(Moves.GastroAcid, unitTarget(boss), 0);
    battle.tick(1);

    // Nothing taken, nothing put in its place, and the pool the raid
    // is built around still stands
    expect(boss.hasAbility(Abilities.Boss)).toBe(true);
    expect(boss.hasAbility(Abilities.Levitate)).toBe(true);
    expect(boss.hasAbility(Abilities.Insomnia)).toBe(false);
    expect(boss.checkStat(Stats.HP, 0)).toBe(pool);
  });

  it('refuses a stage swap at either end of a raid boss', () => {
    const { battle, teamA, teamB } = createBattle();
    const swapper = createUnit(battle, teamA);
    const boss = createUnit(battle, teamB);

    swapper.enter();
    boss.enter();
    boss.addAbility(Abilities.Boss);

    boss.addStage(Stages.Attack, 2, MOVE_CAUSE);
    swapper.addStage(Stages.SpecialAttack, -2, MOVE_CAUSE);
    battle.tick(1);

    swapper.triggerMoveEffect(Moves.HeartSwap, unitTarget(boss), 0);
    boss.triggerMoveEffect(Moves.PowerSwap, unitTarget(swapper), 0);
    battle.tick(1);

    // A boss turns away the half that would cost it anything, so a
    // swap that landed would copy rather than trade
    expect(boss.stages[Stages.Attack]).toBe(2);
    expect(swapper.stages[Stages.Attack]).toBe(0);
    expect(swapper.stages[Stages.SpecialAttack]).toBe(-2);
    expect(usable(battle, swapper, Moves.GuardSwap, boss)).toBe(false);
  });

  it('holds nothing on a raid boss', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const boss = createUnit(battle, teamB);
    const plain = createUnit(battle, teamB);

    holder.enter();
    boss.enter();
    plain.enter();
    boss.addAbility(Abilities.Boss);
    boss.addMove(Moves.Tackle);
    plain.addMove(Moves.Tackle);

    for (const held of [boss, plain]) {
      for (const move of [Moves.Taunt, Moves.Torment, Moves.Imprison]) {
        holder.triggerMoveEffect(move, unitTarget(held), 0);
      }
      held.triggerMove(Moves.Tackle, unitTarget(holder), 0);
      battle.tick(turns(1));
      holder.triggerMoveEffect(Moves.Encore, unitTarget(held), 0);
      battle.tick(1);
    }

    // The same four land on anything that is not a boss
    expect(plain.status[Statuses.Taunted]).toBeDefined();
    expect(plain.status[Statuses.Tormented]).toBeDefined();
    expect(plain.status[Statuses.Imprisoned]).toBeDefined();
    expect(plain.status[Statuses.Encored]).toBeDefined();

    expect(boss.status[Statuses.Taunted]).toBeUndefined();
    expect(boss.status[Statuses.Tormented]).toBeUndefined();
    expect(boss.status[Statuses.Imprisoned]).toBeUndefined();
    expect(boss.status[Statuses.Encored]).toBeUndefined();

    // And the AI is told rather than left to spend a cast finding out
    expect(usable(battle, holder, Moves.Taunt, boss)).toBe(false);
    expect(usable(battle, holder, Moves.Encore, boss)).toBe(false);
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

  it('bites for an ailment and a flinch at once, with a fang', () => {
    const { battle, teamA, teamB } = createBattle();
    const biter = createUnit(battle, teamA);
    const bitten = createUnit(battle, teamB);

    biter.enter();
    bitten.enter();

    // Both rolls come up: a fang carries two secondaries, and the
    // shared resolver only has room for one of them
    pinRandom(battle, 0);
    biter.attack(bitten, Moves.FireFang, 10, Types.Fire, MoveCategories.Physical, 0);
    battle.tick(1);

    expect(bitten.status[Statuses.Burned]).not.toBeNull();
    expect(bitten.status[Statuses.Flinched]).not.toBeNull();
  });

  it("answers for the user's own wound with an Avalanche", () => {
    const { battle, teamA, teamB } = createBattle();
    const avenger = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    avenger.enter();
    target.enter();

    const plain = powerOf(battle, avenger, Moves.Avalanche, target);

    target.attack(avenger, Moves.Tackle, 10, Types.Normal, MoveCategories.Physical, 0);
    battle.tick(1);

    // Hurt inside the window, so the answer comes back twice as hard
    expect(powerOf(battle, avenger, Moves.Avalanche, target)).toBe(plain * 2);

    // And the window closes
    battle.tick(turns(2));
    expect(powerOf(battle, avenger, Moves.Avalanche, target)).toBe(plain);
  });
  it('turns every wind-up round while the Trick Room stands, and leaves cooldowns alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const caster = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    caster.enter();
    target.enter();

    const quick = caster.checkMoveCastTime(Moves.BulletPunch, unitTarget(target));
    const plain = caster.checkMoveCastTime(Moves.Tackle, unitTarget(target));
    const slow = caster.checkMoveCastTime(Moves.Avalanche, unitTarget(target));
    const wait = caster.checkMoveCooldown(Moves.BulletPunch, unitTarget(target));

    expect(quick).toBeLessThan(plain);
    expect(slow).toBeGreaterThan(plain);

    caster.triggerMoveEffect(Moves.TrickRoom, NONE_TARGET, 0);
    battle.tick(1);

    // The quick jab is now the slow one and the long answer snaps out
    expect(caster.checkMoveCastTime(Moves.BulletPunch, unitTarget(target))).toBeGreaterThan(plain);
    expect(caster.checkMoveCastTime(Moves.Avalanche, unitTarget(target))).toBeLessThan(plain);
    expect(caster.checkMoveCastTime(Moves.Tackle, unitTarget(target))).toBe(plain);

    // Speed still decides how often a move comes round
    expect(caster.checkMoveCooldown(Moves.BulletPunch, unitTarget(target))).toBe(wait);

    // A second casting takes the room down rather than holding it open
    caster.triggerMoveEffect(Moves.TrickRoom, NONE_TARGET, 0);
    battle.tick(1);
    expect(caster.checkMoveCastTime(Moves.BulletPunch, unitTarget(target))).toBe(quick);
  });

  it('costs a flyer double what Stealth Rock costs anything else', () => {
    const { battle, teamA, teamB } = createBattle();
    const layer = createUnit(battle, teamA);
    const walker = createUnit(battle, teamB);
    const bird = createUnit(battle, teamB, [Types.Normal, Types.Flying]);

    layer.enter();
    layer.triggerMoveEffect(Moves.StealthRock, { type: MoveTargetType.Team, team: teamB }, 0);
    battle.tick(1);
    expect(stonesOver(teamB)).toBe(true);

    walker.enter();
    bird.enter();

    const walked = walker.checkStat(Stats.HP, 0) - walker.health;
    const flew = bird.checkStat(Stats.HP, 0) - bird.health;

    expect(walked).toBeGreaterThan(0);
    expect(flew).toBeCloseTo(walked * 2, 0);
  });

  it('blows both sides clear with Defog and takes the screens off the target side', () => {
    const { battle, teamA, teamB } = createBattle();
    const blower = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    blower.enter();
    target.enter();

    target.triggerMoveEffect(Moves.Spikes, { type: MoveTargetType.Team, team: teamA }, 0);
    blower.triggerMoveEffect(Moves.ToxicSpikes, { type: MoveTargetType.Team, team: teamB }, 0);
    blower.triggerMoveEffect(Moves.StealthRock, { type: MoveTargetType.Team, team: teamB }, 0);
    teamB.addStatus(TeamStatuses.Reflect, MOVE_CAUSE);
    battle.tick(1);

    expect(layersUnder(teamA)).toBe(1);
    expect(toxicLayersUnder(teamB)).toBe(1);

    blower.triggerMoveEffect(Moves.Defog, unitTarget(target), 0);
    battle.tick(1);

    // The gale does not stop at the halfway line
    expect(layersUnder(teamA)).toBe(0);
    expect(toxicLayersUnder(teamB)).toBe(0);
    expect(stonesOver(teamB)).toBe(false);
    expect(teamB.status[TeamStatuses.Reflect]).toBeUndefined();
  });

  it('charms two stages out of the opposite gender and nothing out of its own', () => {
    const { battle, teamA, teamB } = createBattle();
    const charmer = createUnit(battle, teamA);
    const charmed = createUnit(battle, teamB);
    const unmoved = createUnit(battle, teamB);

    charmer.enter();
    charmed.enter();
    unmoved.enter();
    charmer.setGender(Genders.Male);
    charmed.setGender(Genders.Female);
    unmoved.setGender(Genders.Male);

    expect(usable(battle, charmer, Moves.Captivate, charmed)).toBe(true);
    expect(usable(battle, charmer, Moves.Captivate, unmoved)).toBe(false);

    charmer.triggerMoveEffect(Moves.Captivate, unitTarget(charmed), 0);
    charmer.triggerMoveEffect(Moves.Captivate, unitTarget(unmoved), 0);
    battle.tick(1);

    expect(charmed.stages[Stages.SpecialAttack]).toBe(-2);
    expect(unmoved.stages[Stages.SpecialAttack]).toBe(0);
  });

  it('throws Judgment as the Plate in hand', () => {
    const { battle, teamA, teamB } = createBattle();
    const caster = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    caster.enter();
    target.enter();

    // Nothing in hand is a plain Normal move
    expect(caster.checkMoveType(Moves.Judgment, unitTarget(target))).toBe(Types.Normal);

    caster.addItem(Items.FlamePlate);
    expect(caster.checkMoveType(Moves.Judgment, unitTarget(target))).toBe(Types.Fire);
  });

  it('eats the berry a Bug Bite lands on', () => {
    const { battle, teamA, teamB } = createBattle();
    const biter = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);

    biter.enter();
    holder.enter();
    holder.addItem(Items.OranBerry);

    biter.attack(holder, Moves.BugBite, 1, Types.Bug, MoveCategories.Physical, 0);
    battle.tick(1);

    expect(holder.items[Items.OranBerry]).toBeUndefined();
  });

  it('ties Grass Knot to what the target weighs', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const light = createUnit(battle, teamB);
    const heavy = createUnit(battle, teamB);

    light.setWeight(5);
    heavy.setWeight(250);

    expect(attacker.checkMovePower(Moves.GrassKnot, unitTarget(light))).toBe(20);
    expect(attacker.checkMovePower(Moves.GrassKnot, unitTarget(heavy))).toBe(120);
  });

  it('spends the dancer on a teammate standing beside it', () => {
    const { battle, teamA, teamB } = createBattle();
    const dancer = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);

    createUnit(battle, teamB).enter();
    dancer.enter();
    ally.enter();

    ally.damage(MOVE_CAUSE, ally, ally.checkStat(Stats.HP, 0) / 2, 0);
    ally.addStatus(Statuses.Burned, MOVE_CAUSE);
    ally.addMove(Moves.Tackle);
    ally.startCooldown(Moves.Tackle, NONE_TARGET);
    battle.tick(1);

    dancer.triggerMoveEffect(Moves.HealingWish, unitTarget(ally), 0);
    battle.tick(1);

    // The wish pays for health and the burn, and the dancer is gone
    expect(ally.health).toBe(ally.checkStat(Stats.HP, 0));
    expect(ally.status[Statuses.Burned]).toBeUndefined();
    expect(dancer.alive).toBe(false);

    // What it does not pay for is the wait, which the dance does
    expect(ally.moves[Moves.Tackle]?.cooldown).toBeDefined();

    const second = createUnit(battle, teamA);

    second.enter();
    second.triggerMoveEffect(Moves.LunarDance, unitTarget(ally), 0);
    battle.tick(1);

    expect(ally.moves[Moves.Tackle]?.cooldown).toBeUndefined();
    expect(second.alive).toBe(false);
  });

  it('strikes through a guard on the way back from Shadow Force', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const striker = createUnit(battle, teamA);
    const guard = createUnit(battle, teamB);

    striker.enter();
    guard.enter();

    // Off the field on the first step, so nothing reaches it
    striker.triggerMoveEffect(Moves.ShadowForce, unitTarget(guard), 1);
    expect(striker.status[Statuses.Invulnerable]).toBeDefined();

    guard.triggerMoveEffect(Moves.Protect, NONE_TARGET, 0);
    expect(guard.status[Statuses.Protected]).toBeDefined();

    const whole = guard.health;

    striker.triggerMoveTarget(Moves.ShadowForce, unitTarget(guard), 0);

    // The blow landed and the guard did not survive being walked through
    expect(guard.health).toBeLessThan(whole);
    expect(guard.status[Statuses.Protected]).toBeUndefined();
  });

  it('grips hardest on a target with everything left', () => {
    const { battle, teamA, teamB } = createBattle();
    const gripper = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    gripper.enter();
    target.enter();

    expect(powerOf(battle, gripper, Moves.CrushGrip, target)).toBe(120);

    target.damage(MOVE_CAUSE, target, target.checkStat(Stats.HP, 0) / 2, 0);
    battle.tick(1);

    expect(powerOf(battle, gripper, Moves.CrushGrip, target)).toBe(60);
  });
});
