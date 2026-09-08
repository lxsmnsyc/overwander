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
  SOLID_CORE_PHYSICAL_SCALE,
  SOLID_CORE_SPECIAL_SCALE,
} from '../../../src/battle/abilities/signature/geodude-to-drowzee';
import {
  BLIND_RAGE_ACCURACY_SCALE,
  BLIND_RAGE_ATTACK_SCALE,
  CHASE_DOWN_SCALE,
  CHASE_DOWN_THRESHOLD,
  DIGEST_HEAL_FRACTION,
  DIGEST_THRESHOLD,
  DUST_STORM_MAX_STACKS,
  DUST_STORM_STEP,
  FUNGAL_BLOOM_FRACTION,
  HEADACHE_BURST_SCALE,
  HYPNOTIC_SPIRAL_CAST_SCALE,
  OVERHEAD_THROW_HEAVY_SCALE,
  OVERHEAD_THROW_LIGHT_SCALE,
  TELEPORT_GUARD_WINDOW,
  UNDERMINE_MAX_STACKS,
  UNDERMINE_STEP,
} from '../../../src/battle/abilities/signature/paras-to-tentacool';
import {
  BLOODTHIRST_DRAIN_SCALE,
  BLOODTHIRST_HEAL_SCALE,
  BROOD_FURY_FALLEN_SCALE,
  BROOD_FURY_HURT_SCALE,
  CURL_UP_MAX_STACKS,
  CURL_UP_STEP,
  DEEP_ROOTS_SCALE,
  LULLABY_POWER_SCALE,
  LULLABY_SLEEP_SCALE,
  NINE_TAILS_MAX_STACKS,
  NINE_TAILS_STEP,
  WARLORD_MAX_STACKS,
  WARLORD_STEP,
  WISHING_WELL_FRACTION,
} from '../../../src/battle/abilities/signature/sandshrew-to-oddish';
import type Battle from '../../../src/battle/core';
import {
  BattleEvents,
  EffectType,
  MoveTargetType,
  type UnitAttackEvent,
} from '../../../src/battle/events';
import type Unit from '../../../src/battle/unit';
import { Stats } from '../../../src/data/constants/stats';
import { Types } from '../../../src/data/constants/types';
import Abilities from '../../../src/data/ids/abilities';
import { Items } from '../../../src/data/ids/items';
import { MoveCategories, MoveTargets, Moves } from '../../../src/data/ids/moves';
import { Statuses } from '../../../src/data/ids/status';
import turns from '../../../src/battle/turn';
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

/** A synthetic blow, for the resolvers that answer questions about one */
function makeAttack(
  source: Unit,
  target: Unit,
  move: Moves,
  type: Types,
  category: MoveCategories,
): UnitAttackEvent {
  return {
    id: 'UnitAttack',
    disabled: false,
    source,
    target,
    move,
    value: 0,
    category,
    type,
    flags: 0,
    success: false,
  };
}

function resolveAttackStat(
  battle: Battle,
  parent: UnitAttackEvent,
  unit: Unit,
  stat: Stats,
  value: number,
): number {
  const event = {
    id: 'UnitAttackResolveStat',
    disabled: false,
    parent,
    unit,
    stat,
    value,
  };
  battle.emit(BattleEvents.UnitAttackResolveStat, event);
  return event.value;
}

/** Whether the blow lands once every listener has answered for it */
function rolled(battle: Battle, source: Unit, target: Unit, move: Moves): boolean {
  const event = {
    id: 'UnitTriggerMoveRollHit',
    disabled: false,
    parent: {
      id: 'UnitTriggerMove',
      disabled: false,
      source,
      move,
      target: { type: MoveTargetType.Unit, unit: target } as const,
      steps: 0,
    },
    hit: true,
  };
  battle.emit(BattleEvents.UnitTriggerMoveRollHit, event);
  return event.hit;
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

describe('Lullaby', () => {
  it('holds its own sleep longer and hits a sleeper harder', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Lullaby);

    const fromHolder = {
      type: EffectType.Ability,
      ability: Abilities.Lullaby,
      unit: holder,
    } as const;

    const bare = enemy.checkStatusDuration(Statuses.Sleeping, turns(3), NONE_CAUSE);

    expect(enemy.checkStatusDuration(Statuses.Sleeping, turns(3), fromHolder)).toBeCloseTo(
      bare * LULLABY_SLEEP_SCALE,
      5,
    );

    const parent = makeAttack(holder, enemy, Moves.Pound, Types.Normal, MoveCategories.Physical);

    expect(resolveAttackStat(battle, parent, holder, Stats.Attack, 100)).toBe(100);

    enemy.addStatus(Statuses.Sleeping, NONE_CAUSE);

    expect(resolveAttackStat(battle, parent, holder, Stats.Attack, 100)).toBeCloseTo(
      100 * LULLABY_POWER_SCALE,
      5,
    );
  });
});

describe('Bloodthirst', () => {
  it('drinks deeper and eats worse', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Bloodthirst);

    expect(holder.checkDrain(enemy, 20)).toBeCloseTo(20 * BLOODTHIRST_DRAIN_SCALE, 5);

    holder.setHealth(10);
    holder.heal(NONE_CAUSE, holder, 20, 0);

    expect(holder.health).toBeCloseTo(10 + 20 * BLOODTHIRST_HEAL_SCALE, 5);

    // A drain is not one of the heals it is bad at
    holder.setHealth(10);
    holder.heal({ type: EffectType.Move, move: Moves.MegaDrain, unit: holder }, holder, 20, 0);

    expect(holder.health).toBeCloseTo(30, 5);
  });
});

describe('Deep Roots', () => {
  it('braces what lands on it mid-cast and refuses a flinch', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.DeepRoots);

    const parent = makeAttack(enemy, holder, Moves.Pound, Types.Normal, MoveCategories.Physical);

    // Standing free: no roots, and a flinch would land
    expect(resolveAttackStat(battle, parent, enemy, Stats.Attack, 100)).toBe(100);
    expect(holder.checkStatusImmunity(Statuses.Flinched, NONE_CAUSE)).toBe(false);

    battle.emit(BattleEvents.UnitCast, {
      id: 'UnitCast',
      disabled: false,
      source: holder,
      move: Moves.SolarBeam,
      target: { type: MoveTargetType.Unit, unit: enemy },
    });

    expect(holder.casting).not.toBeUndefined();
    expect(resolveAttackStat(battle, parent, enemy, Stats.Attack, 100)).toBeCloseTo(
      100 * DEEP_ROOTS_SCALE,
      5,
    );
    expect(holder.checkStatusImmunity(Statuses.Flinched, NONE_CAUSE)).toBe(true);
  });
});

describe('Fungal Bloom', () => {
  it('feeds on every status it lands on an enemy', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.FungalBloom);

    const maxHP = holder.checkStat(Stats.HP, 0);
    holder.setHealth(maxHP / 2);

    enemy.addStatus(Statuses.Poisoned, {
      type: EffectType.Move,
      move: Moves.PoisonPowder,
      unit: holder,
    });

    expect(holder.health).toBeCloseTo(maxHP / 2 + maxHP * FUNGAL_BLOOM_FRACTION, 5);

    // A status it puts on itself feeds it nothing
    holder.setHealth(maxHP / 2);
    holder.addStatus(Statuses.Poisoned, {
      type: EffectType.Move,
      move: Moves.Toxic,
      unit: holder,
    });

    expect(holder.health).toBeCloseTo(maxHP / 2, 5);
  });
});

describe('Dust Storm', () => {
  it('reads every ailing enemy, up to what the dust can cover', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    holder.addAbility(Abilities.DustStorm);

    const enemies = [
      createUnit(battle, teamB),
      createUnit(battle, teamB),
      createUnit(battle, teamB),
      createUnit(battle, teamB),
      createUnit(battle, teamB),
    ];
    const bare = holder.checkStat(Stats.SpecialAttack, 0);

    expect(bare).toBeGreaterThan(0);

    enemies.forEach((enemy, index) => {
      enemy.addStatus(Statuses.Poisoned, NONE_CAUSE);

      expect(holder.checkStat(Stats.SpecialAttack, 0)).toBeCloseTo(
        bare * (1 + DUST_STORM_STEP * Math.min(DUST_STORM_MAX_STACKS, index + 1)),
        5,
      );
    });
  });

  it('reads nothing off its own side', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    holder.addAbility(Abilities.DustStorm);

    const bare = holder.checkStat(Stats.SpecialAttack, 0);
    ally.addStatus(Statuses.Poisoned, NONE_CAUSE);

    expect(holder.checkStat(Stats.SpecialAttack, 0)).toBe(bare);
  });
});

describe('Undermine', () => {
  it('leaves a target taking more from everybody, up to the cap', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Undermine);

    const maxHP = enemy.checkStat(Stats.HP, 0);
    const fromAlly = makeAttack(ally, enemy, Moves.Pound, Types.Normal, MoveCategories.Physical);

    expect(resolveAttackStat(battle, fromAlly, ally, Stats.Attack, 100)).toBe(100);

    for (let passes = 1; passes <= UNDERMINE_MAX_STACKS + 2; passes += 1) {
      holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);
      enemy.setHealth(maxHP);

      // The ally profits from the digging as much as the digger does
      expect(resolveAttackStat(battle, fromAlly, ally, Stats.Attack, 100)).toBeCloseTo(
        100 * (1 + UNDERMINE_STEP * Math.min(UNDERMINE_MAX_STACKS, passes)),
        5,
      );
    }
  });
});

describe('Cutpurse', () => {
  it('takes an item once from each enemy', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Cutpurse);

    enemy.addItem(Items.OranBerry);

    expect(enemy.items[Items.OranBerry]).not.toBeUndefined();

    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(enemy.items[Items.OranBerry]).toBeUndefined();

    // Pockets already turned out stay empty: a second item is safe
    enemy.setHealth(enemy.checkStat(Stats.HP, 0));
    enemy.addItem(Items.OranBerry);

    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(enemy.items[Items.OranBerry]).not.toBeUndefined();
  });
});

describe('Headache Burst', () => {
  it('comes on at half health and takes the misses out of Psychic moves', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.HeadacheBurst);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;
    const bare = holder.checkStat(Stats.SpecialAttack, 0);

    expect(holder.checkMoveAccuracy(Moves.Psybeam, target)).not.toBeUndefined();

    holder.setHealth(holder.checkStat(Stats.HP, 0) / 2);

    expect(holder.checkStat(Stats.SpecialAttack, 0)).toBeCloseTo(bare * HEADACHE_BURST_SCALE, 5);
    expect(holder.checkMoveAccuracy(Moves.Psybeam, target)).toBeUndefined();

    // A move of another type still has to land the ordinary way
    expect(holder.checkMoveAccuracy(Moves.WaterGun, target)).not.toBeUndefined();
  });
});

describe('Blind Rage', () => {
  it('swings harder, aims worse, and refuses every heal', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.BlindRage);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;
    const bareAttack = createUnit(battle, teamB).checkStat(Stats.Attack, 0);

    expect(holder.checkStat(Stats.Attack, 0)).toBeCloseTo(bareAttack * BLIND_RAGE_ATTACK_SCALE, 5);
    expect(holder.checkMoveAccuracy(Moves.Pound, target)).toBeCloseTo(
      100 * BLIND_RAGE_ACCURACY_SCALE,
      5,
    );

    holder.setHealth(10);
    holder.heal(NONE_CAUSE, holder, 50, 0);

    expect(holder.health).toBe(10);
  });
});

describe('Chase Down', () => {
  it('hits quarry harder and will not let it leave', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.ChaseDown);

    const parent = makeAttack(holder, enemy, Moves.Pound, Types.Normal, MoveCategories.Physical);

    expect(resolveAttackStat(battle, parent, holder, Stats.Attack, 100)).toBe(100);
    expect(enemy.checkEscape()).toBe(true);

    enemy.setHealth(enemy.checkStat(Stats.HP, 0) * CHASE_DOWN_THRESHOLD);

    expect(resolveAttackStat(battle, parent, holder, Stats.Attack, 100)).toBeCloseTo(
      100 * CHASE_DOWN_SCALE,
      5,
    );
    expect(enemy.checkEscape()).toBe(false);
  });
});

describe('Hypnotic Spiral', () => {
  it('slows the next cast of whoever touches it', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.HypnoticSpiral);

    const target = { type: MoveTargetType.None } as const;
    const bare = enemy.checkMoveCastTime(Moves.Flamethrower, target);

    // A ranged move leaves the spiral out of reach
    enemy.attack(holder, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);

    expect(enemy.checkMoveCastTime(Moves.Flamethrower, target)).toBe(bare);

    enemy.attack(holder, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(enemy.checkMoveCastTime(Moves.Flamethrower, target)).toBeCloseTo(
      bare * HYPNOTIC_SPIRAL_CAST_SCALE,
      5,
    );

    battle.emit(BattleEvents.UnitCast, {
      id: 'UnitCast',
      disabled: false,
      source: enemy,
      move: Moves.Flamethrower,
      target,
    });

    expect(enemy.checkMoveCastTime(Moves.Flamethrower, target)).toBe(bare);
  });
});

describe('Teleport Guard', () => {
  it('blinks away from one attack, then has to gather itself', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.TeleportGuard);

    // The blow that would have landed does not
    rollMove(battle, enemy, holder, Moves.Pound, true);

    // The next one lands: the blink is spent
    const second = rolled(battle, enemy, holder, Moves.Pound);

    expect(second).toBe(true);

    battle.tick(TELEPORT_GUARD_WINDOW);

    expect(rolled(battle, enemy, holder, Moves.Pound)).toBe(false);
  });
});

describe('Overhead Throw', () => {
  it('throws a heavier target harder than a lighter one', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const heavy = createUnit(battle, teamB);
    const light = createUnit(battle, teamB);
    holder.addAbility(Abilities.OverheadThrow);

    holder.setWeight(100);
    heavy.setWeight(200);
    light.setWeight(50);

    const atHeavy = makeAttack(holder, heavy, Moves.Pound, Types.Normal, MoveCategories.Physical);
    const atLight = makeAttack(holder, light, Moves.Pound, Types.Normal, MoveCategories.Physical);
    const ranged = makeAttack(holder, heavy, Moves.Ember, Types.Fire, MoveCategories.Special);

    expect(resolveAttackStat(battle, atHeavy, holder, Stats.Attack, 100)).toBeCloseTo(
      100 * OVERHEAD_THROW_HEAVY_SCALE,
      5,
    );
    expect(resolveAttackStat(battle, atLight, holder, Stats.Attack, 100)).toBeCloseTo(
      100 * OVERHEAD_THROW_LIGHT_SCALE,
      5,
    );

    // Nothing it does not get its hands on
    expect(resolveAttackStat(battle, ranged, holder, Stats.SpecialAttack, 100)).toBe(100);
  });
});

describe('Digest', () => {
  it('feeds on a target that is nearly finished', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Digest);

    const maxHP = holder.checkStat(Stats.HP, 0);
    holder.setHealth(maxHP / 2);

    // A healthy target is no meal
    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(holder.health).toBeCloseTo(maxHP / 2, 5);

    enemy.setHealth(enemy.checkStat(Stats.HP, 0) * DIGEST_THRESHOLD);
    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(holder.health).toBeCloseTo(maxHP / 2 + maxHP * DIGEST_HEAL_FRACTION, 5);
  });
});

describe('Tentacle Grasp', () => {
  it('holds whatever it has touched while it stands', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    const untouched = createUnit(battle, teamB);
    holder.addAbility(Abilities.TentacleGrasp);

    expect(enemy.checkEscape()).toBe(true);

    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(enemy.checkEscape()).toBe(false);
    expect(untouched.checkEscape()).toBe(true);

    // The grip goes with the holder
    holder.faint(enemy);

    expect(enemy.checkEscape()).toBe(true);
  });
});

describe('Solid Core', () => {
  it('shrugs off physical blows and eats special ones', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SolidCore);

    const physical = makeAttack(enemy, holder, Moves.Pound, Types.Normal, MoveCategories.Physical);
    const special = makeAttack(enemy, holder, Moves.Ember, Types.Fire, MoveCategories.Special);

    expect(resolveAttackStat(battle, physical, enemy, Stats.Attack, 100)).toBeCloseTo(
      100 * SOLID_CORE_PHYSICAL_SCALE,
      5,
    );
    expect(resolveAttackStat(battle, special, enemy, Stats.SpecialAttack, 100)).toBeCloseTo(
      100 * SOLID_CORE_SPECIAL_SCALE,
      5,
    );

    // Its own defensive stat is left alone
    expect(resolveAttackStat(battle, physical, holder, Stats.Defense, 100)).toBe(100);
  });
});
