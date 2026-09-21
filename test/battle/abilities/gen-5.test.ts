import { describe, expect, it } from 'vitest';
import { Stages } from '../../../src/data/constants/stats';
import { Types } from '../../../src/data/constants/types';
import Abilities from '../../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../../src/data/ids/moves';
import { Species } from '../../../src/data/ids/species';
import { MoveTargetType } from '../../../src/battle/events';
import turns from '../../../src/battle/turn';
import { createBattle, createUnit, pinRandom } from '../harness';
import { dealDamage } from './signature/helpers';

describe('Victory Star', () => {
  it('lifts the aim of its whole team, itself included', () => {
    const { battle, teamA, teamB } = createBattle();
    const star = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    star.enter();
    mate.enter();
    enemy.enter();

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;
    const bare = mate.checkMoveAccuracy(Moves.FocusBlast, target);

    star.addAbility(Abilities.VictoryStar);

    expect(mate.checkMoveAccuracy(Moves.FocusBlast, target)).toBeCloseTo((bare ?? 0) * 1.1, 5);
    expect(star.checkMoveAccuracy(Moves.FocusBlast, target)).toBeCloseTo((bare ?? 0) * 1.1, 5);
  });

  it('leaves the enemy side aiming as it was', () => {
    const { battle, teamA, teamB } = createBattle();
    const star = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    star.enter();
    enemy.enter();

    const target = { type: MoveTargetType.Unit, unit: star } as const;
    const bare = enemy.checkMoveAccuracy(Moves.FocusBlast, target);

    star.addAbility(Abilities.VictoryStar);

    expect(enemy.checkMoveAccuracy(Moves.FocusBlast, target)).toBe(bare);
  });
});

describe('Dancer', () => {
  it('copies a dance somebody else used, and sharpens itself with it', () => {
    const { battle, teamA, teamB } = createBattle();
    const lead = createUnit(battle, teamA);
    const copier = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    pinRandom(battle, 1);
    copier.addAbility(Abilities.Dancer);
    lead.enter();
    copier.enter();
    enemy.enter();

    lead.triggerMoveTarget(Moves.SwordsDance, { type: MoveTargetType.Unit, unit: lead }, 0);
    battle.tick(turns(1));

    // A dance aimed at the dancer is re-aimed at the copier, so the
    // copy sharpens the one that copied rather than the one it copied
    expect(lead.stages[Stages.Attack]).toBe(2);
    expect(copier.stages[Stages.Attack]).toBe(2);
  });

  it('does not copy its own dance', () => {
    const { battle, teamA, teamB } = createBattle();
    const copier = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    pinRandom(battle, 1);
    copier.addAbility(Abilities.Dancer);
    copier.enter();
    enemy.enter();

    copier.triggerMoveTarget(Moves.SwordsDance, { type: MoveTargetType.Unit, unit: copier }, 0);
    battle.tick(turns(1));

    expect(copier.stages[Stages.Attack]).toBe(2);
  });

  it('leaves Rain Dance alone, which is not a dance', () => {
    const { battle, teamA, teamB } = createBattle();
    const lead = createUnit(battle, teamA);
    const copier = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    pinRandom(battle, 1);
    copier.addAbility(Abilities.Dancer);
    lead.enter();
    copier.enter();
    enemy.enter();

    lead.triggerMoveTarget(Moves.RainDance, { type: MoveTargetType.None }, 0);
    battle.tick(turns(1));

    expect(copier.stages[Stages.Attack]).toBe(0);
  });
});

describe('Relic Song', () => {
  it('turns a Meloetta over, and turns it back', () => {
    const { battle, teamA, teamB } = createBattle();
    const singer = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    pinRandom(battle, 1);
    singer.setSpecies(Species.Meloetta);
    singer.enter();
    enemy.enter();

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    singer.triggerMoveTarget(Moves.RelicSong, target, 0);
    battle.tick(turns(1));
    expect(singer.species).toBe(Species.MeloettaPirouette);

    singer.triggerMoveTarget(Moves.RelicSong, target, 0);
    battle.tick(turns(1));
    expect(singer.species).toBe(Species.Meloetta);
  });

  it('leaves anybody else that sings it in the shape they were', () => {
    const { battle, teamA, teamB } = createBattle();
    const singer = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    pinRandom(battle, 1);
    singer.setSpecies(Species.Jigglypuff);
    singer.enter();
    enemy.enter();

    singer.triggerMoveTarget(Moves.RelicSong, { type: MoveTargetType.Unit, unit: enemy }, 0);
    battle.tick(turns(1));

    expect(singer.species).toBe(Species.Jigglypuff);
  });
});

describe('Fur Coat', () => {
  it('turns a physical blow and leaves a special one alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const stag = createUnit(battle, teamA);
    const bare = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    stag.addAbility(Abilities.FurCoat);
    stag.enter();
    bare.enter();
    foe.enter();

    const hit = (target: typeof stag, category: MoveCategories): number =>
      dealDamage(foe, target, Moves.Swift, 40, Types.Normal, category);

    expect(hit(stag, MoveCategories.Physical) / hit(bare, MoveCategories.Physical)).toBeCloseTo(
      0.5,
      1,
    );
    expect(hit(stag, MoveCategories.Special)).toBeCloseTo(hit(bare, MoveCategories.Special), 5);
  });
});
