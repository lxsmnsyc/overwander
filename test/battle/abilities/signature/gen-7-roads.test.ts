// Pikipek through Grubbin.

import { describe, expect, it } from 'vitest';
import { Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import Team from '../../../../src/battle/team';
import { unitTarget } from '../../../../src/battle/utils';
import {
  SCORE_TO_SETTLE_SCALE,
  TRICKLE_CHARGE_LIMIT,
  TRICKLE_CHARGE_SHARE,
} from '../../../../src/battle/abilities/signature/pikipek-to-grubbin';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { dealDamage } from './helpers';

describe("Melemele's first roads", () => {
  it('gets 1 more strike into a multi-hit move', () => {
    const { battle, teamA, teamB } = createBattle();
    const bird = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    expect(bird.checkMoveHits(Moves.BulletSeed, unitTarget(foe), 2, 5)).toBe(2);

    bird.addAbility(Abilities.Drumroll);

    expect(bird.checkMoveHits(Moves.BulletSeed, unitTarget(foe), 2, 5)).toBe(3);
    expect(bird.checkMoveHits(Moves.BulletSeed, unitTarget(foe), 5, 5)).toBe(6);
    expect(bird.checkMoveHits(Moves.DoubleKick, unitTarget(foe), 2, 2)).toBe(3);
  });

  it('beats past the ceiling Skill Link sets', () => {
    const { battle, teamA, teamB } = createBattle();
    const bird = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    bird.addAbility(Abilities.SkillLink);

    expect(bird.checkMoveHits(Moves.BulletSeed, unitTarget(foe), 2, 5)).toBe(5);

    // Worn, since a fresh unit has a slot for one ability
    bird.wearAbility(Abilities.Drumroll);

    expect(bird.checkMoveHits(Moves.BulletSeed, unitTarget(foe), 2, 5)).toBe(6);
  });

  it('leaves a single-hit move at 1', () => {
    const { battle, teamA, teamB } = createBattle();
    const bird = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    bird.addAbility(Abilities.Drumroll);

    expect(bird.checkMoveHits(Moves.Peck, unitTarget(foe), 1, 1)).toBe(1);
  });

  it('hits harder against the last enemy to hit it, and only that one', () => {
    const { battle, teamA, teamB } = createBattle();
    const mongoose = createUnit(battle, teamA);
    const first = createUnit(battle, teamB);
    const second = createUnit(battle, teamB);

    pinRandom(battle, 1);
    mongoose.addAbility(Abilities.ScoreToSettle);
    mongoose.enter();
    first.enter();
    second.enter();

    const bare = mongoose.checkMovePower(Moves.Tackle, unitTarget(first)) ?? 0;

    expect(bare).toBeGreaterThan(0);
    expect(mongoose.checkMovePower(Moves.Tackle, unitTarget(first))).toBe(bare);

    dealDamage(first, mongoose, Moves.Tackle, 20, Types.Normal, MoveCategories.Physical);

    expect(mongoose.checkMovePower(Moves.Tackle, unitTarget(first))).toBeCloseTo(
      bare * SCORE_TO_SETTLE_SCALE,
      5,
    );
    expect(mongoose.checkMovePower(Moves.Tackle, unitTarget(second))).toBe(bare);

    // The grudge moves on to whoever hit it last
    dealDamage(second, mongoose, Moves.Tackle, 20, Types.Normal, MoveCategories.Physical);

    expect(mongoose.checkMovePower(Moves.Tackle, unitTarget(second))).toBeCloseTo(
      bare * SCORE_TO_SETTLE_SCALE,
      5,
    );
    expect(mongoose.checkMovePower(Moves.Tackle, unitTarget(first))).toBe(bare);
  });

  it('holds no grudge against a teammate', () => {
    const { battle, teamA, teamB } = createBattle();
    const mongoose = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    mongoose.addAbility(Abilities.ScoreToSettle);
    mongoose.enter();
    mate.enter();
    foe.enter();

    const bare = mongoose.checkMovePower(Moves.Tackle, unitTarget(mate)) ?? 0;

    dealDamage(mate, mongoose, Moves.Tackle, 20, Types.Normal, MoveCategories.Physical);

    expect(mongoose.checkMovePower(Moves.Tackle, unitTarget(mate))).toBe(bare);
  });

  it('charges on Electric moves landed by itself, a teammate and an enemy', () => {
    const { battle, allianceA, teamA, teamB } = createBattle();
    const grub = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const allyTeam = new Team(battle, allianceA);

    allianceA.addTeam(allyTeam);

    const ally = createUnit(battle, allyTeam);

    pinRandom(battle, 1);
    grub.enter();
    mate.enter();
    ally.enter();
    foe.enter();

    const bare = grub.checkStat(Stats.SpecialAttack, 0);
    const attack = grub.checkStat(Stats.Attack, 0);

    grub.addAbility(Abilities.TrickleCharge);

    expect(grub.checkStat(Stats.SpecialAttack, 0)).toBe(bare);

    // A move that is not Electric feeds nothing
    dealDamage(foe, mate, Moves.Tackle, 20, Types.Normal, MoveCategories.Physical);

    expect(grub.checkStat(Stats.SpecialAttack, 0)).toBe(bare);

    dealDamage(grub, foe, Moves.ThunderShock, 20, Types.Electric, MoveCategories.Special);

    expect(grub.checkStat(Stats.SpecialAttack, 0)).toBeCloseTo(
      bare * (1 + TRICKLE_CHARGE_SHARE),
      5,
    );

    dealDamage(mate, foe, Moves.ThunderShock, 20, Types.Electric, MoveCategories.Special);
    dealDamage(foe, ally, Moves.ThunderShock, 20, Types.Electric, MoveCategories.Special);

    expect(grub.checkStat(Stats.SpecialAttack, 0)).toBeCloseTo(
      bare * (1 + 3 * TRICKLE_CHARGE_SHARE),
      5,
    );
    // Only the stat it charges
    expect(grub.checkStat(Stats.Attack, 0)).toBe(attack);
  });

  it('stops charging at 1.5x', () => {
    const { battle, teamA, teamB } = createBattle();
    const grub = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    grub.enter();
    foe.enter();

    const bare = grub.checkStat(Stats.SpecialAttack, 0);

    grub.addAbility(Abilities.TrickleCharge);

    for (let count = 0; count < TRICKLE_CHARGE_LIMIT + 3; count++) {
      dealDamage(foe, grub, Moves.ThunderShock, 1, Types.Electric, MoveCategories.Special);
    }

    expect(grub.checkStat(Stats.SpecialAttack, 0)).toBeCloseTo(bare * 1.5, 5);
  });
});
