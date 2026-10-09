import { afterEach, describe, expect, it, vi } from 'vitest';
import { AttackPriority } from '../../src/core/event-emitter';
import type Battle from '../../src/battle/core';
import { BattleEvents, EffectType, MoveTargetType } from '../../src/battle/events';
import {
  DYNAMAX_ACTS,
  dynamax,
  dynamaxActsLeft,
  revertDynamax,
} from '../../src/battle/mechanics/dynamax';
import turns from '../../src/battle/turn';
import type Unit from '../../src/battle/unit';
import { packSlots } from '../../src/data/constants/slots';
import { Stages, Stats } from '../../src/data/constants/stats';
import { Types } from '../../src/data/constants/types';
import { Items } from '../../src/data/ids/items';
import { MoveCategories, Moves } from '../../src/data/ids/moves';
import { Species } from '../../src/data/ids/species';
import { Statuses, Terrains, Weathers } from '../../src/data/ids/status';
import * as gmax from '../../src/data/moves/gmax-moves';
import { maxPowerOf } from '../../src/data/moves/max-moves';
import { placesOf } from '../../src/components/battle/battle-canvas/field';
import { createBattle, createUnit, pinRandom } from './harness';

const NONE = { type: MoveTargetType.None } as const;

function at(unit: Unit): { readonly type: MoveTargetType.Unit; readonly unit: Unit } {
  return { type: MoveTargetType.Unit, unit };
}

/** Every move each unit actually threw, Max Moves included */
function watchThrows(battle: Battle): Map<Unit, Moves[]> {
  const thrown = new Map<Unit, Moves[]>();

  battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
    thrown.set(event.source, [...(thrown.get(event.source) ?? []), event.move]);
  });
  return thrown;
}

/** Cast a move of its own and wait for it to land */
function act(
  battle: Battle,
  unit: Unit,
  move: Moves,
  target = NONE as Parameters<Unit['cast']>[1],
): void {
  unit.addMove(move);
  unit.cast(move, target);
  battle.tick(turns(1));
}

/** Knock a unit from full to just under half */
function dropBelowHalf(unit: Unit): void {
  unit.setHealth(unit.checkStat(Stats.HP, 0) / 2 - 1);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Dynamax', () => {
  it('grows a band holder the first time it drops below 1/2 HP, doubling max and current HP', () => {
    const { battle, teamA } = createBattle();
    const giant = createUnit(battle, teamA);
    const max = giant.checkStat(Stats.HP, 0);

    giant.addItem(Items.DynamaxBand);
    giant.setHealth(max / 2);
    expect(giant.dynamaxed).toBe(false);

    giant.setHealth(max / 2 - 10);

    expect(giant.dynamaxed).toBe(true);
    expect(giant.checkStat(Stats.HP, 0)).toBe(max * 2);
    expect(giant.health).toBe(max - 20);
    expect(dynamaxActsLeft(giant)).toBe(DYNAMAX_ACTS);
  });

  it('grows nobody without the band', () => {
    const { battle, teamA } = createBattle();
    const plain = createUnit(battle, teamA);

    dropBelowHalf(plain);

    expect(plain.dynamaxed).toBe(false);
  });

  it('grows one pokemon a side a fight', () => {
    const { battle, teamA, teamB } = createBattle();
    const first = createUnit(battle, teamA);
    const second = createUnit(battle, teamA);
    const rival = createUnit(battle, teamB);

    for (const unit of [first, second, rival]) {
      unit.addItem(Items.DynamaxBand);
    }
    dropBelowHalf(first);
    dropBelowHalf(second);
    dropBelowHalf(rival);

    expect(first.dynamaxed).toBe(true);
    expect(second.dynamaxed).toBe(false);
    // The other side has its own
    expect(rival.dynamaxed).toBe(true);

    // Shrunk and dropped again, the side's is still spent
    revertDynamax(first);
    first.setHealth(first.checkStat(Stats.HP, 0));
    dropBelowHalf(first);
    expect(first.dynamaxed).toBe(false);
  });

  it('never grows a pokemon holding a Mega Stone or a Z-Crystal, nor a Mega', () => {
    const { battle, teamA, teamB } = createBattle('test-seed', undefined, packSlots(1, 2, 4));
    const stone = createUnit(battle, teamA);
    const crystal = createUnit(battle, teamB);
    const { battle: other, teamA: otherTeam } = createBattle();
    const mega = createUnit(other, otherTeam);

    // Room for the band beside the stone or the crystal
    stone.setSlots(packSlots(1, 2, 4));
    crystal.setSlots(packSlots(1, 2, 4));
    stone.addItem(Items.DynamaxBand);
    stone.addItem(Items.Gengarite);
    crystal.addItem(Items.DynamaxBand);
    crystal.addItem(Items.FiriumZ);
    mega.setSpecies(Species.GengarMega);
    mega.setHealth(mega.checkStat(Stats.HP, 0));
    mega.addItem(Items.DynamaxBand);
    dropBelowHalf(stone);
    dropBelowHalf(crystal);
    dropBelowHalf(mega);

    expect(stone.items[Items.Gengarite]).toBe(true);
    expect(crystal.items[Items.FiriumZ]).toBe(true);
    expect(stone.dynamaxed).toBe(false);
    expect(crystal.dynamaxed).toBe(false);
    expect(mega.dynamaxed).toBe(false);
  });

  it('shrinks back after exactly 3 of its own moves, keeping its share of HP', () => {
    const { battle, teamA, teamB } = createBattle();
    const giant = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const max = giant.checkStat(Stats.HP, 0);

    dynamax(giant);
    giant.setHealth(max);
    act(battle, giant, Moves.Growl, at(foe));
    act(battle, giant, Moves.Leer, at(foe));
    expect(giant.dynamaxed).toBe(true);
    expect(dynamaxActsLeft(giant)).toBe(1);

    act(battle, giant, Moves.TailWhip, at(foe));

    expect(giant.dynamaxed).toBe(false);
    expect(giant.checkStat(Stats.HP, 0)).toBe(max);
    // Half of a doubled pool is half of the plain one
    expect(giant.health).toBe(max / 2);
  });

  it('stays grown for the whole fight in the permanent mode', () => {
    const { battle, teamA, teamB } = createBattle();
    const boss = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    dynamax(boss, { permanent: true });
    for (const move of [Moves.Growl, Moves.Leer, Moves.TailWhip, Moves.SandAttack, Moves.Harden]) {
      act(battle, boss, move, at(foe));
    }

    expect(boss.dynamaxed).toBe(true);
    expect(dynamaxActsLeft(boss)).toBe(Infinity);
  });

  it('throws each damaging move as its Max Move, at the Max power and the move’s own category', () => {
    const { battle, teamA, teamB } = createBattle();
    const giant = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const thrown = watchThrows(battle);
    const attacks: { move: Moves; category: MoveCategories }[] = [];

    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      attacks.push({ move: event.move, category: event.category });
    });
    pinRandom(battle, 0.5);
    dynamax(giant);
    act(battle, giant, Moves.Flamethrower, at(foe));

    expect(thrown.get(giant)).toEqual([Moves.MaxFlare]);
    expect(attacks).toEqual([{ move: Moves.MaxFlare, category: MoveCategories.Special }]);
    // Flamethrower's 90 is 130 as a Max Move, and Fighting reads the lower table
    expect(giant.checkMovePower(Moves.MaxFlare, at(foe))).toBe(130);
    expect(maxPowerOf(Moves.CloseCombat)).toBe(95);
    expect(maxPowerOf(Moves.LowKick)).toBe(100);
    expect(maxPowerOf(Moves.GrassKnot)).toBe(130);
  });

  it('throws a status move as Max Guard', () => {
    const { battle, teamA, teamB } = createBattle();
    const giant = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const thrown = watchThrows(battle);

    dynamax(giant);
    act(battle, giant, Moves.Growl, at(foe));

    expect(thrown.get(giant)).toEqual([Moves.MaxGuard]);
    expect(foe.stages[Stages.Attack]).toBe(0);
  });

  it('leaves a move an ability throws for it as itself', () => {
    const { battle, teamA, teamB } = createBattle();
    const giant = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const thrown = watchThrows(battle);

    dynamax(giant);
    giant.triggerMove(Moves.Growl, at(foe), 0);
    battle.tick(turns(1));

    expect(thrown.get(giant)).toEqual([Moves.Growl]);
  });

  it('throws its G-Max Move in place of the Max Move when it has the factor', () => {
    const { battle, teamA, teamB } = createBattle();
    const giant = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const thrown = watchThrows(battle);

    giant.setSpecies(Species.Charizard);
    giant.setHealth(giant.checkStat(Stats.HP, 0));
    giant.gigantamax = true;
    dynamax(giant);
    act(battle, giant, Moves.Flamethrower, at(foe));
    expect(giant.checkMovePower(Moves.GMaxWildfire, at(foe))).toBe(maxPowerOf(Moves.Flamethrower));
    act(battle, giant, Moves.AirSlash, at(foe));

    // Only its Fire moves turn G-Max; the rest stay Max Moves
    expect(thrown.get(giant)).toEqual([Moves.GMaxWildfire, Moves.MaxAirstream]);
  });

  it('keeps a fixed G-Max Move at 160 whatever it replaced', () => {
    const { battle, teamA, teamB } = createBattle();
    const giant = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const thrown = watchThrows(battle);

    giant.setSpecies(Species.Cinderace);
    giant.setHealth(giant.checkStat(Stats.HP, 0));
    giant.gigantamax = true;
    dynamax(giant);
    act(battle, giant, Moves.Ember, at(foe));

    expect(thrown.get(giant)).toEqual([Moves.GMaxFireball]);
    expect(giant.checkMovePower(Moves.GMaxFireball, at(foe))).toBe(160);
  });

  it('throws a plain Max Move without the factor, G-Max line or not', () => {
    expect(gmax.getGMaxMove(Species.Charizard, Types.Fire)).toBe(Moves.GMaxWildfire);
    const { battle, teamA, teamB } = createBattle();
    const giant = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const thrown = watchThrows(battle);

    giant.setSpecies(Species.Charizard);
    dynamax(giant);
    act(battle, giant, Moves.Flamethrower, at(foe));

    expect(thrown.get(giant)).toEqual([Moves.MaxFlare]);
  });

  it('calls up weather and lays terrain', () => {
    const { battle, teamA, teamB } = createBattle();
    const giant = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    dynamax(giant, { permanent: true });
    act(battle, giant, Moves.Flamethrower, at(foe));
    expect(giant.checkWeather()).toBe(Weathers.Sunny);

    act(battle, giant, Moves.Thunderbolt, at(foe));
    expect(giant.checkTerrain()).toBe(Terrains.Electric);
  });

  it('drops every foe a stage, and raises its whole side a stage', () => {
    const { battle, teamA, teamB } = createBattle();
    const giant = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);

    dynamax(giant, { permanent: true });
    act(battle, giant, Moves.Tackle, at(foe));
    expect(foe.stages[Stages.Speed]).toBe(-1);
    expect(other.stages[Stages.Speed]).toBe(-1);

    act(battle, giant, Moves.KarateChop, at(foe));
    expect(giant.stages[Stages.Attack]).toBe(1);
    expect(mate.stages[Stages.Attack]).toBe(1);
    expect(foe.stages[Stages.Attack]).toBe(0);
  });

  it('blocks a Max Move with Max Guard, where Protect lets it through', () => {
    const { battle, teamA, teamB } = createBattle();
    const giant = createUnit(battle, teamA);
    const guard = createUnit(battle, teamB);
    const protect = createUnit(battle, teamB);
    const full = guard.checkStat(Stats.HP, 0);

    dynamax(giant, { permanent: true });
    guard.triggerMove(Moves.MaxGuard, NONE, 0);
    protect.triggerMove(Moves.Protect, NONE, 0);
    battle.tick(500);
    expect(guard.status[Statuses.Protected]).toBeDefined();

    act(battle, giant, Moves.Tackle, at(guard));
    act(battle, giant, Moves.Pound, at(protect));

    expect(guard.health).toBe(full);
    expect(protect.health).toBeLessThan(full);
  });

  it('shrugs off flinching, OHKO and weight moves, holds and being sent away', () => {
    const { battle, teamA, teamB } = createBattle();
    const giant = createUnit(battle, teamA);
    const bench = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const cause = { type: EffectType.Move, move: Moves.Bite, unit: foe } as const;

    teamA.removeUnit(bench);
    dynamax(giant, { permanent: true });

    giant.addStatus(Statuses.Flinched, cause);
    expect(giant.status[Statuses.Flinched]).toBeUndefined();
    for (const move of [
      Moves.Fissure,
      Moves.LowKick,
      Moves.HeavySlam,
      Moves.Roar,
      Moves.Disable,
      Moves.Encore,
      Moves.Torment,
      Moves.Instruct,
    ]) {
      expect(foe.checkMoveImmunity(move, at(giant), Types.Normal), `move ${move}`).toBe(true);
    }

    giant.forceSwitch(bench, { type: EffectType.Move, move: Moves.DragonTail, unit: foe });
    giant.forceSwitch(bench, { type: EffectType.Item, item: Items.RedCard, unit: foe });
    expect(teamA.units.has(giant)).toBe(true);
  });

  it('is never held to one move by a Choice item', () => {
    const { battle, teamA, teamB } = createBattle();
    const giant = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const thrown = watchThrows(battle);

    giant.addItem(Items.ChoiceBand);
    dynamax(giant, { permanent: true });
    act(battle, giant, Moves.Tackle, at(foe));
    act(battle, giant, Moves.Ember, at(foe));

    expect(thrown.get(giant)).toEqual([Moves.MaxStrike, Moves.MaxFlare]);
  });

  it('takes 2x from Behemoth Blade, Behemoth Bash and Dynamax Cannon', () => {
    const { battle, teamA, teamB } = createBattle();
    const giant = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    for (const move of [Moves.BehemothBlade, Moves.BehemothBash, Moves.DynamaxCannon]) {
      const plain = foe.checkMovePower(move, at(giant)) ?? 0;

      dynamax(giant);
      expect(foe.checkMovePower(move, at(giant))).toBe(plain * 2);
      revertDynamax(giant);
    }
  });

  it('stands in the middle of its team while it lasts, the rest ringed round it', () => {
    const { battle, teamA } = createBattle();
    const first = createUnit(battle, teamA);
    const giant = createUnit(battle, teamA);
    const third = createUnit(battle, teamA);
    const centre = { x: 10, z: 4 };
    const units = [first, giant, third];

    const before = placesOf(units, centre, 6);
    expect(before[1]).not.toEqual(centre);

    dynamax(giant);
    const during = placesOf(units, centre, 6);
    expect(during[1]).toEqual(centre);
    for (const ringed of [during[0], during[2]]) {
      expect(Math.hypot(ringed.x - centre.x, ringed.z - centre.z)).toBeGreaterThan(6);
    }

    revertDynamax(giant);
    expect(placesOf(units, centre, 6)).toEqual(before);
  });
});
