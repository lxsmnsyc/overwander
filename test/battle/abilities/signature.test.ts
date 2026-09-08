import { describe, expect, it } from 'vitest';
import { AttackPriority } from '../../../src/core/event-emitter';
import {
  AFTERBURN_MAX_STACKS,
  AFTERBURN_STEP,
  CHAIN_LIGHTNING_FRACTION,
  CONSTRICT_CAST_SCALE,
  NIBBLE_FRACTION,
  OVERPRESSURE_COOLDOWN_STEP,
  OVERPRESSURE_MAX_STACKS,
  OVERPRESSURE_POWER_SCALE,
  RELENTLESS_MAX_STACKS,
  RELENTLESS_STEP,
  SEED_CACHE_BANK_FRACTION,
  SEED_CACHE_CAP_FRACTION,
  SLIPSTREAM_SCALE,
  TWIN_STINGER_POWER_SCALE,
} from '../../../src/battle/abilities/signature/bulbasaur-to-pikachu';
import {
  BROOD_FURY_FALLEN_SCALE,
  BROOD_FURY_HURT_SCALE,
  CURL_UP_MAX_STACKS,
  CURL_UP_STEP,
  NINE_TAILS_MAX_STACKS,
  NINE_TAILS_STEP,
  WARLORD_MAX_STACKS,
  WARLORD_STEP,
  WISHING_WELL_FRACTION,
} from '../../../src/battle/abilities/signature/sandshrew-to-oddish';
import type Battle from '../../../src/battle/core';
import { BattleEvents, EffectType, MoveTargetType } from '../../../src/battle/events';
import type Unit from '../../../src/battle/unit';
import { Stats } from '../../../src/data/constants/stats';
import { Types } from '../../../src/data/constants/types';
import Abilities from '../../../src/data/ids/abilities';
import { MoveCategories, MoveTargets, Moves } from '../../../src/data/ids/moves';
import { Statuses } from '../../../src/data/ids/status';
import { createBattle, createUnit, pinRandom } from '../harness';

const NONE_CAUSE = { type: EffectType.None } as const;

/** Deterministic direct attack; returns the health lost by the target */
function dealDamage(
  attacker: ReturnType<typeof createUnit>,
  defender: ReturnType<typeof createUnit>,
  move: Moves,
  power: number,
  type: Types,
  category: MoveCategories,
): number {
  const before = defender.health;
  attacker.attack(defender, move, power, type, category, 0);
  return before - defender.health;
}

describe('Seed Cache', () => {
  it('banks a quarter of what it takes and spends it on a Grass move', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SeedCache);

    enemy.damage(NONE_CAUSE, holder, 40, 0);

    const spent = dealDamage(
      holder,
      enemy,
      Moves.VineWhip,
      45,
      Types.Grass,
      MoveCategories.Physical,
    );
    const plain = dealDamage(
      holder,
      enemy,
      Moves.VineWhip,
      45,
      Types.Grass,
      MoveCategories.Physical,
    );

    expect(spent - plain).toBeCloseTo(40 * SEED_CACHE_BANK_FRACTION, 5);
  });

  it('empties the bank once it is spent, and only Grass spends it', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SeedCache);

    enemy.damage(NONE_CAUSE, holder, 40, 0);

    const normal = dealDamage(
      holder,
      enemy,
      Moves.Tackle,
      40,
      Types.Normal,
      MoveCategories.Physical,
    );
    const plainNormal = dealDamage(
      holder,
      enemy,
      Moves.Tackle,
      40,
      Types.Normal,
      MoveCategories.Physical,
    );

    // A Normal move leaves the bank where it is
    expect(normal).toBeCloseTo(plainNormal, 5);

    const first = dealDamage(
      holder,
      enemy,
      Moves.VineWhip,
      45,
      Types.Grass,
      MoveCategories.Physical,
    );
    const second = dealDamage(
      holder,
      enemy,
      Moves.VineWhip,
      45,
      Types.Grass,
      MoveCategories.Physical,
    );

    expect(first - second).toBeCloseTo(40 * SEED_CACHE_BANK_FRACTION, 5);
  });

  it('fills no further than half its HP', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SeedCache);

    const maxHP = holder.checkStat(Stats.HP, 0);

    // Fed far past the cap, healed back each time so it survives
    for (let i = 0; i < 20; i += 1) {
      enemy.damage(NONE_CAUSE, holder, 100, 0);
      holder.setHealth(maxHP);
    }

    const spent = dealDamage(
      holder,
      enemy,
      Moves.VineWhip,
      45,
      Types.Grass,
      MoveCategories.Physical,
    );
    const plain = dealDamage(
      holder,
      enemy,
      Moves.VineWhip,
      45,
      Types.Grass,
      MoveCategories.Physical,
    );

    expect(spent - plain).toBeCloseTo(maxHP * SEED_CACHE_CAP_FRACTION, 5);
  });
});

/** The unit reaching for a move, which is when a residual is paid */
function act(battle: Battle, unit: Unit): void {
  battle.emit(BattleEvents.UnitCast, {
    id: 'UnitCast',
    disabled: false,
    source: unit,
    move: Moves.Tackle,
    target: { type: MoveTargetType.None },
  });
}

/** One resolved use of a move, landed or missed */
function rollMove(battle: Battle, source: Unit, target: Unit, move: Moves, hit: boolean): void {
  battle.emit(BattleEvents.UnitTriggerMoveRollHit, {
    id: 'UnitTriggerMoveRollHit',
    disabled: false,
    parent: {
      id: 'UnitTriggerMove',
      disabled: false,
      source,
      move,
      target: { type: MoveTargetType.Unit, unit: target },
      steps: 0,
    },
    hit,
  });
}

describe('Afterburn', () => {
  it('shortens the wind-up by a step for each Fire move it lands', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Afterburn);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;
    const bare = holder.checkMoveCastTime(Moves.Flamethrower, target);

    expect(bare).toBeGreaterThan(0);

    for (let landed = 1; landed <= AFTERBURN_MAX_STACKS; landed += 1) {
      rollMove(battle, holder, enemy, Moves.Flamethrower, true);

      expect(holder.checkMoveCastTime(Moves.Flamethrower, target)).toBeCloseTo(
        bare * (1 - AFTERBURN_STEP * landed),
        5,
      );
    }

    // Past the cap it holds where it is
    rollMove(battle, holder, enemy, Moves.Flamethrower, true);

    expect(holder.checkMoveCastTime(Moves.Flamethrower, target)).toBeCloseTo(
      bare * (1 - AFTERBURN_STEP * AFTERBURN_MAX_STACKS),
      5,
    );
  });

  it('is blown out by a miss or by a move of another type', () => {
    const { battle, teamA, teamB } = createBattle();
    // 100 accuracy is the ceiling, so a pinned roll misses anything short of it
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Afterburn);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;
    const bare = holder.checkMoveCastTime(Moves.Flamethrower, target);

    rollMove(battle, holder, enemy, Moves.Flamethrower, true);
    rollMove(battle, holder, enemy, Moves.FireBlast, false);

    expect(holder.checkMoveCastTime(Moves.Flamethrower, target)).toBe(bare);

    rollMove(battle, holder, enemy, Moves.Flamethrower, true);
    rollMove(battle, holder, enemy, Moves.Tackle, true);

    expect(holder.checkMoveCastTime(Moves.Flamethrower, target)).toBe(bare);
  });

  it('comes back on the field with the flame it started with', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Afterburn);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;
    const bare = holder.checkMoveCastTime(Moves.Flamethrower, target);

    rollMove(battle, holder, enemy, Moves.Flamethrower, true);

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });

    expect(holder.checkMoveCastTime(Moves.Flamethrower, target)).toBe(bare);
  });
});

describe('Overpressure', () => {
  it('drives Water moves harder', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Overpressure);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;
    const water = holder.checkMovePower(Moves.WaterGun, target);
    const other = holder.checkMovePower(Moves.Tackle, target);

    expect(water).toBeCloseTo(40 * OVERPRESSURE_POWER_SCALE, 5);
    expect(other).toBe(40);
  });

  it('fouls its cooldowns with every shot that lands, and vents on another type', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Overpressure);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;
    const bare = holder.checkMoveCooldown(Moves.WaterGun, target);

    expect(bare).toBeGreaterThan(0);

    for (let landed = 1; landed <= OVERPRESSURE_MAX_STACKS; landed += 1) {
      rollMove(battle, holder, enemy, Moves.WaterGun, true);

      expect(holder.checkMoveCooldown(Moves.WaterGun, target)).toBeCloseTo(
        bare * (1 + OVERPRESSURE_COOLDOWN_STEP * landed),
        5,
      );
    }

    // Past the cap the fouling holds where it is
    rollMove(battle, holder, enemy, Moves.WaterGun, true);

    expect(holder.checkMoveCooldown(Moves.WaterGun, target)).toBeCloseTo(
      bare * (1 + OVERPRESSURE_COOLDOWN_STEP * OVERPRESSURE_MAX_STACKS),
      5,
    );

    rollMove(battle, holder, enemy, Moves.Tackle, true);

    expect(holder.checkMoveCooldown(Moves.WaterGun, target)).toBe(bare);
  });

  it('leaves the cannons clean when a shot misses', () => {
    const { battle, teamA, teamB } = createBattle();
    // 100 accuracy is the ceiling, so a pinned roll misses anything short of it
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Overpressure);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;
    const bare = holder.checkMoveCooldown(Moves.WaterGun, target);

    rollMove(battle, holder, enemy, Moves.HydroPump, false);

    expect(holder.checkMoveCooldown(Moves.WaterGun, target)).toBe(bare);
  });
});

describe('Slipstream', () => {
  it('shortens every wind-up on the field, the enemy included', () => {
    const plain = createBattle();
    const bare = createUnit(plain.battle, plain.teamA).checkMoveCastTime(Moves.Flamethrower, {
      type: MoveTargetType.None,
    });

    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Slipstream);

    const target = { type: MoveTargetType.None } as const;

    expect(holder.checkMoveCastTime(Moves.Flamethrower, target)).toBeCloseTo(
      bare * SLIPSTREAM_SCALE,
      5,
    );
    expect(enemy.checkMoveCastTime(Moves.Flamethrower, target)).toBeCloseTo(
      bare * SLIPSTREAM_SCALE,
      5,
    );
  });
});

describe('Nibble', () => {
  it('takes a bite on top of every move that lands', () => {
    const plain = createBattle();
    pinRandom(plain.battle, 1);
    const plainHolder = createUnit(plain.battle, plain.teamA);
    const plainEnemy = createUnit(plain.battle, plain.teamB);
    const bare = dealDamage(
      plainHolder,
      plainEnemy,
      Moves.Tackle,
      40,
      Types.Normal,
      MoveCategories.Physical,
    );

    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Nibble);

    const bitten = dealDamage(
      holder,
      enemy,
      Moves.Tackle,
      40,
      Types.Normal,
      MoveCategories.Physical,
    );

    expect(bitten - bare).toBeCloseTo(enemy.checkStat(Stats.HP, 0) * NIBBLE_FRACTION, 5);
  });
});

describe('Powder Burst', () => {
  it('widens a status move it aims at one enemy over the whole far side', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    createUnit(battle, teamB);
    holder.addAbility(Abilities.PowderBurst);

    // A status move aimed at one enemy is recast at nobody, which is
    // what fans it out over the enemy side
    expect(holder.checkMoveTargeting(Moves.SleepPowder).target).toBe(MoveTargets.None);

    // An attacking move still picks its one target
    expect(holder.checkMoveTargeting(Moves.Tackle).target).toBe(MoveTargets.Unit);
  });
});

describe('Twin Stinger', () => {
  it('lands a physical move twice at reduced power', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.TwinStinger);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    expect(holder.checkMovePower(Moves.Tackle, target)).toBeCloseTo(
      40 * TWIN_STINGER_POWER_SCALE,
      5,
    );

    let landed = 0;
    battle.on(BattleEvents.UnitAttack, AttackPriority.Cleanup, (event) => {
      if (event.source === holder && event.success) {
        landed += 1;
      }
    });

    holder.attack(enemy, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(landed).toBe(2);
  });

  it('leaves special moves and moves that already strike several times alone', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.TwinStinger);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    expect(holder.checkMovePower(Moves.Ember, target)).toBe(40);
    expect(holder.checkMovePower(Moves.DoubleSlap, target)).toBe(15);

    let landed = 0;
    battle.on(BattleEvents.UnitAttack, AttackPriority.Cleanup, (event) => {
      if (event.source === holder && event.success) {
        landed += 1;
      }
    });

    holder.attack(enemy, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);

    expect(landed).toBe(1);
  });
});

describe('Relentless', () => {
  it('presses one target harder each time it lands, and starts over on another', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const first = createUnit(battle, teamB);
    const second = createUnit(battle, teamB);
    holder.addAbility(Abilities.Relentless);

    const atFirst = { type: MoveTargetType.Unit, unit: first } as const;
    const atSecond = { type: MoveTargetType.Unit, unit: second } as const;

    expect(holder.checkMovePower(Moves.Tackle, atFirst)).toBe(40);

    for (let landed = 1; landed <= RELENTLESS_MAX_STACKS + 1; landed += 1) {
      holder.attack(first, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);
      first.setHealth(first.checkStat(Stats.HP, 0));

      expect(holder.checkMovePower(Moves.Tackle, atFirst)).toBeCloseTo(
        40 * (1 + RELENTLESS_STEP * Math.min(RELENTLESS_MAX_STACKS, landed)),
        5,
      );

      // Nothing carries over to anybody else
      expect(holder.checkMovePower(Moves.Tackle, atSecond)).toBe(40);
    }

    holder.attack(second, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(holder.checkMovePower(Moves.Tackle, atFirst)).toBe(40);
  });
});

describe('Constrict', () => {
  it('corners what it touches and slows what that target reaches for next', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Constrict);

    const target = { type: MoveTargetType.None } as const;
    const bare = enemy.checkMoveCastTime(Moves.Flamethrower, target);

    holder.attack(enemy, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(enemy.status[Statuses.Cornered]).not.toBeUndefined();
    expect(enemy.checkEscape()).toBe(false);
    expect(enemy.checkMoveCastTime(Moves.Flamethrower, target)).toBeCloseTo(
      bare * CONSTRICT_CAST_SCALE,
      5,
    );

    // The coils only hold the one cast
    battle.emit(BattleEvents.UnitCast, {
      id: 'UnitCast',
      disabled: false,
      source: enemy,
      move: Moves.Flamethrower,
      target,
    });

    expect(enemy.checkMoveCastTime(Moves.Flamethrower, target)).toBe(bare);
  });

  it('needs contact to catch anything', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Constrict);

    holder.attack(enemy, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);

    expect(enemy.status[Statuses.Cornered]).toBeUndefined();
  });
});

describe('Chain Lightning', () => {
  it('arcs a third of the blow to the next enemy along', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const struck = createUnit(battle, teamB);
    const next = createUnit(battle, teamB);
    holder.addAbility(Abilities.ChainLightning);

    const before = next.health;
    const dealt = dealDamage(
      holder,
      struck,
      Moves.ThunderShock,
      40,
      Types.Electric,
      MoveCategories.Special,
    );

    expect(before - next.health).toBeCloseTo(dealt * CHAIN_LIGHTNING_FRACTION, 5);
  });

  it('does not arc off a move of another type', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const struck = createUnit(battle, teamB);
    const next = createUnit(battle, teamB);
    holder.addAbility(Abilities.ChainLightning);

    const before = next.health;

    dealDamage(holder, struck, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);

    expect(next.health).toBe(before);
  });
});

describe('Curl Up', () => {
  it('rolls tighter with every hit and spends the roll on the next physical move', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.CurlUp);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;
    const bareDefense = holder.checkStat(Stats.Defense, 0);
    const maxHP = holder.checkStat(Stats.HP, 0);

    for (let taken = 1; taken <= CURL_UP_MAX_STACKS + 2; taken += 1) {
      enemy.damage(NONE_CAUSE, holder, 1, 0);
      holder.setHealth(maxHP);

      const curled = Math.min(CURL_UP_MAX_STACKS, taken);

      expect(holder.checkStat(Stats.Defense, 0)).toBeCloseTo(
        bareDefense * (1 + CURL_UP_STEP * curled),
        5,
      );
      expect(holder.checkMovePower(Moves.Tackle, target)).toBeCloseTo(
        40 * (1 + CURL_UP_STEP * curled),
        5,
      );
    }

    // A special move leaves the roll where it is
    holder.attack(enemy, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);

    expect(holder.checkStat(Stats.Defense, 0)).toBeCloseTo(
      bareDefense * (1 + CURL_UP_STEP * CURL_UP_MAX_STACKS),
      5,
    );

    holder.attack(enemy, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(holder.checkStat(Stats.Defense, 0)).toBe(bareDefense);
    expect(holder.checkMovePower(Moves.Tackle, target)).toBe(40);
  });
});

describe('Brood Fury', () => {
  it('rises for a hurt ally and stays up once one has fallen', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.BroodFury);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    expect(holder.checkMovePower(Moves.Tackle, target)).toBe(40);

    ally.setHealth(ally.checkStat(Stats.HP, 0) / 2);

    expect(holder.checkMovePower(Moves.Tackle, target)).toBeCloseTo(40 * BROOD_FURY_HURT_SCALE, 5);

    ally.faint(enemy);

    expect(holder.checkMovePower(Moves.Tackle, target)).toBeCloseTo(
      40 * BROOD_FURY_FALLEN_SCALE,
      5,
    );
  });

  it('is nothing to a mother fighting alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.BroodFury);

    holder.setHealth(1);
    enemy.setHealth(1);

    expect(holder.checkMovePower(Moves.Tackle, { type: MoveTargetType.Unit, unit: enemy })).toBe(
      40,
    );
  });
});

describe('Warlord', () => {
  it('pays for variety and stops paying for repetition', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Warlord);

    const atEnemy = { type: MoveTargetType.Unit, unit: enemy } as const;

    holder.attack(enemy, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);
    enemy.setHealth(enemy.checkStat(Stats.HP, 0));

    // The move it just used is the one worth nothing extra
    expect(holder.checkMovePower(Moves.Tackle, atEnemy)).toBe(40);
    expect(holder.checkMovePower(Moves.Scratch, atEnemy)).toBeCloseTo(40 * (1 + WARLORD_STEP), 5);

    for (const move of [Moves.Scratch, Moves.Pound, Moves.Peck, Moves.Bite, Moves.Lick]) {
      holder.attack(enemy, move, 40, Types.Normal, MoveCategories.Physical, 0);
      enemy.setHealth(enemy.checkStat(Stats.HP, 0));
    }

    expect(holder.checkMovePower(Moves.Tackle, atEnemy)).toBeCloseTo(
      40 * (1 + WARLORD_STEP * WARLORD_MAX_STACKS),
      5,
    );

    // Landing the same move twice puts it back to nothing
    holder.attack(enemy, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);
    holder.attack(enemy, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(holder.checkMovePower(Moves.Scratch, atEnemy)).toBe(40);
  });
});

describe('Wishing Well', () => {
  it('heals the ally furthest from full each time it acts, never itself', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    const hurt = createUnit(battle, teamA);
    const scratched = createUnit(battle, teamA);
    holder.addAbility(Abilities.WishingWell);

    const maxHP = hurt.checkStat(Stats.HP, 0);
    holder.setHealth(1);
    hurt.setHealth(maxHP / 4);
    scratched.setHealth(maxHP - 1);

    act(battle, holder);

    expect(hurt.health).toBeCloseTo(maxHP / 4 + maxHP * WISHING_WELL_FRACTION, 5);
    expect(scratched.health).toBe(maxHP - 1);
    expect(holder.health).toBe(1);
  });
});

describe('Nine Tails', () => {
  it('buys Special Attack with every hit it survives, up to nine', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.NineTails);

    const bare = holder.checkStat(Stats.SpecialAttack, 0);
    const maxHP = holder.checkStat(Stats.HP, 0);

    for (let taken = 1; taken <= NINE_TAILS_MAX_STACKS + 2; taken += 1) {
      enemy.damage(NONE_CAUSE, holder, 1, 0);
      holder.setHealth(maxHP);

      expect(holder.checkStat(Stats.SpecialAttack, 0)).toBeCloseTo(
        bare * (1 + NINE_TAILS_STEP * Math.min(NINE_TAILS_MAX_STACKS, taken)),
        5,
      );
    }
  });
});
