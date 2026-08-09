import { describe, expect, it } from 'vitest';
import type Battle from '../../src/battle/core';
import { BattleEvents, EffectType, MoveTargetType } from '../../src/battle/events';
import type Unit from '../../src/battle/unit';
import { Stages } from '../../src/data/constants/stats';
import { Types } from '../../src/data/constants/types';
import { Moves } from '../../src/data/ids/moves';
import { Statuses, TeamStatuses, Weathers } from '../../src/data/ids/status';
import { createBattle, createUnit, pinRandom } from './harness';

const NONE_CAUSE = { type: EffectType.None } as const;

function unitTarget(unit: Unit): { readonly type: MoveTargetType.Unit; readonly unit: Unit } {
  return { type: MoveTargetType.Unit, unit } as const;
}

const NONE_TARGET = { type: MoveTargetType.None } as const;

/**
 * With pinRandom(1): no critical hits, the damage range factor is 1,
 * and 100-accuracy moves connect. A neutral typeless hit with power P
 * between the standard harness units deals 0.44 * P + 2 damage.
 */
function plainDamage(power: number): number {
  return 0.44 * power + 2;
}

describe('hit moves', () => {
  it('plain damaging moves attack through the registry', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);

    attacker.triggerMoveEffect(Moves.Tackle, unitTarget(defender), 0);

    expect(defender.health).toBeCloseTo(160 - plainDamage(40));
  });

  it('status moves deal no damage', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);

    attacker.triggerMoveEffect(Moves.Growl, unitTarget(defender), 0);

    expect(defender.health).toBe(160);
    expect(defender.stages[Stages.Attack]).toBe(-1);
  });
});

describe('stage moves', () => {
  it('self stage moves boost the user', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);

    unit.triggerMoveEffect(Moves.SwordsDance, NONE_TARGET, 0);

    expect(unit.stages[Stages.Attack]).toBe(2);
  });
});

describe('status moves', () => {
  it('applies the configured status to the target', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);

    attacker.triggerMoveEffect(Moves.Toxic, unitTarget(defender), 0);

    expect(defender.status[Statuses.BadlyPoisoned]).toBeDefined();
  });

  it('applies self statuses to the user', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);

    unit.triggerMoveEffect(Moves.FocusEnergy, NONE_TARGET, 0);

    expect(unit.status[Statuses.FocusEnergy]).toBeDefined();
  });

  it('applies team statuses to the own team', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);

    unit.triggerMoveEffect(Moves.Reflect, NONE_TARGET, 0);

    expect(teamA.status[TeamStatuses.Reflect]).toBeDefined();
  });
});

describe('powder moves', () => {
  it('fail against Grass types', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const attacker = createUnit(battle, teamA);
    const grass = createUnit(battle, teamB, [Types.Grass]);
    const normal = createUnit(battle, teamB);

    attacker.triggerMoveTarget(Moves.SleepPowder, unitTarget(grass), 0);
    attacker.triggerMoveTarget(Moves.SleepPowder, unitTarget(normal), 0);

    expect(grass.status[Statuses.Sleeping]).toBeUndefined();
    expect(normal.status[Statuses.Sleeping]).toBeDefined();
  });
});

describe('Thunder Wave immunities', () => {
  it('fails against Ground types through the type chart', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const attacker = createUnit(battle, teamA);
    const ground = createUnit(battle, teamB, [Types.Ground]);

    attacker.triggerMoveTarget(Moves.ThunderWave, unitTarget(ground), 0);

    expect(ground.status[Statuses.Paralyzed]).toBeUndefined();
  });

  it('cannot paralyze Electric types', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const attacker = createUnit(battle, teamA);
    const electric = createUnit(battle, teamB, [Types.Electric]);

    attacker.triggerMoveTarget(Moves.ThunderWave, unitTarget(electric), 0);

    expect(electric.status[Statuses.Paralyzed]).toBeUndefined();
  });
});

describe('secondary effects', () => {
  it('roll their chance after the hit', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const unlucky = createUnit(battle, teamB);
    const lucky = createUnit(battle, teamB);

    pinRandom(battle, 0); // 30% paralysis always procs
    attacker.triggerMoveTarget(Moves.BodySlam, unitTarget(unlucky), 0);
    expect(unlucky.status[Statuses.Paralyzed]).toBeDefined();

    pinRandom(battle, 0.99); // hit still lands, proc fails
    attacker.triggerMoveTarget(Moves.BodySlam, unitTarget(lucky), 0);
    expect(lucky.status[Statuses.Paralyzed]).toBeUndefined();
  });
});

describe('Body Slam vs Minimize', () => {
  it('skips the accuracy check against minimized targets', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);
    defender.addStatus(Statuses.Minimized, NONE_CAUSE);

    expect(attacker.checkMoveAccuracy(Moves.BodySlam, unitTarget(defender))).toBeUndefined();
  });
});

describe('increased critical hit ratio', () => {
  it('raises the ratio for high-crit moves', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);

    for (const [move, expected] of [
      [Moves.Slash, 1],
      [Moves.Tackle, 0],
    ] as const) {
      const event = {
        id: 'UnitAttackCheckCriticalRatio',
        disabled: false,
        parent: {
          id: 'UnitAttack',
          disabled: false,
          source: attacker,
          target: defender,
          move,
          value: 0,
          category: 0,
          type: Types.Normal,
          flags: 0,
          success: false,
        },
        value: 0,
      };
      battle.emit(BattleEvents.UnitAttackCheckCriticalRatio, event);
      expect(event.value).toBe(expected);
    }
  });
});

describe('recoil moves', () => {
  it('damage the attacker by a fraction of the damage dealt', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);

    attacker.triggerMoveEffect(Moves.TakeDown, unitTarget(defender), 0);

    const dealt = plainDamage(90);
    expect(defender.health).toBeCloseTo(160 - dealt);
    expect(attacker.health).toBeCloseTo(160 - dealt / 4);
  });
});

describe('absorb moves', () => {
  it('heal the attacker for half the damage dealt', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);
    attacker.setHealth(100);

    attacker.triggerMoveEffect(Moves.MegaDrain, unitTarget(defender), 0);

    expect(attacker.health).toBeCloseTo(100 + plainDamage(40) / 2);
  });
});

describe('fixed damage moves', () => {
  it('deal their exact amounts', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);

    attacker.triggerMoveEffect(Moves.SeismicToss, unitTarget(defender), 0);
    expect(defender.health).toBe(110); // level 50

    attacker.triggerMoveEffect(Moves.DragonRage, unitTarget(defender), 0);
    expect(defender.health).toBe(70);
  });

  it('Super Fang halves current health, floored', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);

    attacker.triggerMoveEffect(Moves.SuperFang, unitTarget(defender), 0);
    expect(defender.health).toBe(80);

    attacker.triggerMoveEffect(Moves.SuperFang, unitTarget(defender), 0);
    expect(defender.health).toBe(40);
  });

  it('Fissure removes all current health', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);

    attacker.triggerMoveEffect(Moves.Fissure, unitTarget(defender), 0);

    expect(defender.health).toBe(0);
    expect(defender.alive).toBe(false);
  });

  it('Psywave scales with level and the roll', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0.5);
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);

    attacker.triggerMoveEffect(Moves.Psywave, unitTarget(defender), 0);

    // level 50 * randomRange(0.5, 1.5) with the roll pinned to 0.5 -> 50
    expect(defender.health).toBe(110);
  });
});

describe('multi-hit moves', () => {
  function countStrikes(battle: Battle): () => number {
    let strikes = 0;
    battle.on(BattleEvents.UnitAttack, 2, () => {
      strikes += 1;
    });
    return () => strikes;
  }

  it('strike repeatedly on a delay', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0.5); // 3 hits
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);
    const strikes = countStrikes(battle);

    attacker.triggerMoveEffect(Moves.FuryAttack, unitTarget(defender), 0);
    expect(strikes()).toBe(1);

    battle.tick(250);
    expect(strikes()).toBe(2);

    battle.tick(250);
    expect(strikes()).toBe(3);

    battle.tick(250);
    expect(strikes()).toBe(3);
  });

  it('Twineedle always strikes twice', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0.5);
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);
    const strikes = countStrikes(battle);

    attacker.triggerMoveEffect(Moves.Twineedle, unitTarget(defender), 0);
    battle.tick(250);
    battle.tick(250);

    expect(strikes()).toBe(2);
  });

  it('interruption cancels the remaining strikes', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0.5);
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);
    const strikes = countStrikes(battle);

    attacker.triggerMoveEffect(Moves.FuryAttack, unitTarget(defender), 0);
    attacker.interrupt();
    battle.tick(250);
    battle.tick(250);

    expect(strikes()).toBe(1);
  });
});

describe('charge moves', () => {
  it('Skull Bash boosts defense on the charge step and hits on release', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);

    attacker.triggerMoveEffect(Moves.SkullBash, unitTarget(defender), 1);
    expect(attacker.stages[Stages.Defense]).toBe(1);
    expect(defender.health).toBe(160);

    attacker.triggerMoveEffect(Moves.SkullBash, unitTarget(defender), 0);
    expect(defender.health).toBeCloseTo(160 - plainDamage(130));
  });
});

describe('semi-invulnerable moves', () => {
  it('Dig hides the user from ordinary attacks', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const digger = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    digger.triggerMoveEffect(Moves.Dig, unitTarget(enemy), 1);
    expect(digger.status[Statuses.Invulnerable]).toBeDefined();

    enemy.triggerMoveTarget(Moves.Tackle, unitTarget(digger), 0);
    expect(digger.health).toBe(160);

    digger.triggerMoveEffect(Moves.Dig, unitTarget(enemy), 0);
    expect(digger.status[Statuses.Invulnerable]).toBeUndefined();
  });

  it('Earthquake reaches a digging target for double damage', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const digger = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    digger.triggerMoveEffect(Moves.Dig, unitTarget(enemy), 1);
    enemy.triggerMoveTarget(Moves.Earthquake, unitTarget(digger), 0);

    expect(digger.health).toBeCloseTo(160 - plainDamage(100) * 2);
  });

  it('Gust reaches a flying target for double damage', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const flyer = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    flyer.triggerMoveEffect(Moves.Fly, unitTarget(enemy), 1);
    enemy.triggerMoveTarget(Moves.Gust, unitTarget(flyer), 0);

    expect(flyer.health).toBeCloseTo(160 - plainDamage(40) * 2);
  });
});

describe('weather accuracy', () => {
  it('Thunder never misses in rain and drops to 50 in sun', () => {
    const { battle, teamA, teamB } = createBattle();
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    const target = unitTarget(enemy);

    expect(unit.checkMoveAccuracy(Moves.Thunder, target)).toBe(70);

    teamA.weather.current = Weathers.Rain;
    expect(unit.checkMoveAccuracy(Moves.Thunder, target)).toBeUndefined();

    teamA.weather.current = Weathers.Sunny;
    expect(unit.checkMoveAccuracy(Moves.Thunder, target)).toBe(50);
  });

  it('Blizzard never misses in hail', () => {
    const { battle, teamA, teamB } = createBattle();
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    teamA.weather.current = Weathers.Hail;

    expect(unit.checkMoveAccuracy(Moves.Blizzard, unitTarget(enemy))).toBeUndefined();
  });
});

describe('Rest', () => {
  it('fully heals, cures, and puts the user to sleep', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);
    unit.setHealth(50);
    unit.addStatus(Statuses.Poisoned, NONE_CAUSE);

    unit.triggerMoveEffect(Moves.Rest, NONE_TARGET, 0);

    expect(unit.health).toBe(160);
    expect(unit.status[Statuses.Poisoned]).toBeUndefined();
    expect(unit.status[Statuses.Sleeping]).toBeDefined();
  });
});

describe('Hyper Beam', () => {
  it('locks the user into a recharge after a hit', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const defender = createUnit(battle, teamB);
    attacker.addMove(Moves.Tackle);

    attacker.triggerMoveEffect(Moves.HyperBeam, unitTarget(defender), 0);

    expect(defender.health).toBeCloseTo(160 - plainDamage(150));
    expect(attacker.status[Statuses.Recharging]).toBeDefined();
    expect(attacker.checkCanCast(Moves.Tackle, unitTarget(defender))).toBe(false);

    battle.tick(1000);

    expect(attacker.status[Statuses.Recharging]).toBeUndefined();
    expect(attacker.checkCanCast(Moves.Tackle, unitTarget(defender))).toBe(true);
  });
});

describe('Substitute', () => {
  it('costs a quarter of max health and absorbs hits and statuses', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    holder.triggerMoveEffect(Moves.Substitute, NONE_TARGET, 0);
    expect(holder.health).toBe(120);
    expect(holder.status[Statuses.Substituted]).toBeDefined();

    // Direct hits are absorbed by the substitute (40 HP)
    enemy.triggerMoveEffect(Moves.Tackle, unitTarget(holder), 0);
    expect(holder.health).toBe(120);

    // Enemy statuses are blocked
    pinRandom(battle, 0);
    enemy.triggerMoveTarget(Moves.ThunderWave, unitTarget(holder), 0);
    expect(holder.status[Statuses.Paralyzed]).toBeUndefined();

    // Enough damage breaks the substitute
    pinRandom(battle, 1);
    enemy.triggerMoveEffect(Moves.Tackle, unitTarget(holder), 0);
    enemy.triggerMoveEffect(Moves.Tackle, unitTarget(holder), 0);
    expect(holder.status[Statuses.Substituted]).toBeUndefined();
    expect(holder.health).toBe(120);
  });
});

describe('Counter', () => {
  it('returns double the last physical hit taken', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    enemy.triggerMoveEffect(Moves.Tackle, unitTarget(holder), 0);
    holder.triggerMoveEffect(Moves.Counter, unitTarget(enemy), 0);

    expect(enemy.health).toBeCloseTo(160 - plainDamage(40) * 2);
  });

  it('fails without a stored hit', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    holder.triggerMoveEffect(Moves.Counter, unitTarget(enemy), 0);

    expect(enemy.health).toBe(160);
  });
});

describe('Mirror Move', () => {
  it('copies the last move the target used', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const copier = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    enemy.triggerMove(Moves.Tackle, unitTarget(copier), 0);
    expect(copier.health).toBeCloseTo(160 - plainDamage(40));

    copier.triggerMoveEffect(Moves.MirrorMove, unitTarget(enemy), 0);
    expect(enemy.health).toBeCloseTo(160 - plainDamage(40));
  });
});

describe('Bide', () => {
  it('returns double the damage stored while biding', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    holder.triggerMoveEffect(Moves.Bide, unitTarget(enemy), 1);
    expect(holder.status[Statuses.Biding]).toBeDefined();

    enemy.triggerMoveEffect(Moves.Tackle, unitTarget(holder), 0);
    enemy.triggerMoveEffect(Moves.Tackle, unitTarget(holder), 0);

    holder.triggerMoveEffect(Moves.Bide, unitTarget(enemy), 0);

    expect(enemy.health).toBeCloseTo(160 - plainDamage(40) * 4);
  });

  it('fails when no damage was stored', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    holder.triggerMoveEffect(Moves.Bide, unitTarget(enemy), 1);
    holder.triggerMoveEffect(Moves.Bide, unitTarget(enemy), 0);

    expect(enemy.health).toBe(160);
  });
});

describe('switch-out moves', () => {
  function recordSwitches(battle: Battle): { source: Unit; target: Unit }[] {
    const switches: { source: Unit; target: Unit }[] = [];
    battle.on(BattleEvents.UnitSwitch, 2, (event) => {
      switches.push({ source: event.source, target: event.target });
    });
    return switches;
  }

  it('Whirlwind drags in the weakest unit, bypassing traps', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const active = createUnit(battle, teamB);
    const strong = createUnit(battle, teamB);
    const weak = createUnit(battle, teamB);
    weak.setHealth(20);
    active.addStatus(Statuses.Trapped, NONE_CAUSE);

    const switches = recordSwitches(battle);

    attacker.triggerMoveEffect(Moves.Whirlwind, unitTarget(active), 0);

    expect(switches).toHaveLength(1);
    expect(switches[0].source).toBe(active);
    expect(switches[0].target).toBe(weak);
    expect(switches[0].target).not.toBe(strong);
  });

  it('Teleport brings in the strongest unit but respects traps', () => {
    const { battle, teamA } = createBattle();
    const active = createUnit(battle, teamA);
    const strong = createUnit(battle, teamA);
    const weak = createUnit(battle, teamA);
    weak.setHealth(20);

    const switches = recordSwitches(battle);

    active.triggerMoveEffect(Moves.Teleport, NONE_TARGET, 0);
    expect(switches).toHaveLength(1);
    expect(switches[0].source).toBe(active);
    expect(switches[0].target).toBe(strong);

    // A trapped user cannot teleport out
    strong.addStatus(Statuses.Trapped, NONE_CAUSE);
    strong.triggerMoveEffect(Moves.Teleport, NONE_TARGET, 0);
    expect(switches).toHaveLength(1);
  });
});

describe('Solar Beam', () => {
  it('skips the charge step in the sun and weakens in rain', () => {
    const { battle, teamA, teamB } = createBattle();
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    const target = unitTarget(enemy);

    expect(unit.checkMoveSteps(Moves.SolarBeam, target)).toBe(1);

    teamA.weather.current = Weathers.Sunny;
    expect(unit.checkMoveSteps(Moves.SolarBeam, target)).toBe(0);

    teamA.weather.current = Weathers.Rain;
    expect(unit.checkMovePower(Moves.SolarBeam, target)).toBe(60);
  });
});

describe('Light Screen', () => {
  it('reduces special damage for the team', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 1);
    const attacker = createUnit(battle, teamA);
    const guarded = createUnit(battle, teamB);

    guarded.triggerMoveEffect(Moves.LightScreen, NONE_TARGET, 0);
    expect(teamB.status[TeamStatuses.LightScreen]).toBeDefined();

    attacker.triggerMoveEffect(Moves.Ember, unitTarget(guarded), 0);
    expect(160 - guarded.health).toBeCloseTo(19.6 * (2732 / 4096));
  });
});

describe('Minimize', () => {
  it('raises evasion by two and marks the user minimized', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);

    unit.triggerMoveEffect(Moves.Minimize, NONE_TARGET, 0);

    expect(unit.stages[Stages.Evasion]).toBe(2);
    expect(unit.status[Statuses.Minimized]).toBeDefined();
  });
});

describe('Metronome', () => {
  it('calls a random registered move', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0); // first registered move: Tackle
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    unit.triggerMoveEffect(Moves.Metronome, unitTarget(enemy), 0);

    // Tackle lands (crit at pin 0, 85% range roll)
    expect(160 - enemy.health).toBeCloseTo(19.6 * 2 * 0.85);
  });
});

describe('Disable', () => {
  it('fails when the target is idle and has not used a move', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0.99);
    const attacker = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);
    target.addMove(Moves.Tackle);

    attacker.triggerMoveTarget(Moves.Disable, unitTarget(target), 0);

    expect(target.moves[Moves.Tackle]?.disabled).toBe(false);
  });

  it('falls back to the last used move', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0.99);
    const attacker = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);
    target.addMove(Moves.Growl);

    target.cast(Moves.Growl, unitTarget(attacker));
    battle.tick(1800); // finish the cast; target is idle again

    attacker.triggerMoveTarget(Moves.Disable, unitTarget(target), 0);

    expect(target.moves[Moves.Growl]?.disabled).toBe(true);
  });

  it('releases after the duration, even for single-move units', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0.99);
    const attacker = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);
    target.addMove(Moves.Tackle);

    target.cast(Moves.Tackle, unitTarget(attacker));
    attacker.triggerMoveTarget(Moves.Disable, unitTarget(target), 0);

    expect(target.moves[Moves.Tackle]?.disabled).toBe(true);

    battle.tick(5000);

    expect(target.moves[Moves.Tackle]?.disabled).toBe(false);
  });

  it('interrupts and disables the move being cast', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0.99);
    const attacker = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);
    target.addMove(Moves.Tackle);
    target.cast(Moves.Tackle, unitTarget(attacker));

    expect(target.casting).toBeDefined();

    attacker.triggerMoveTarget(Moves.Disable, unitTarget(target), 0);

    expect(target.casting).toBeUndefined();
    expect(target.moves[Moves.Tackle]?.disabled).toBe(true);
  });
});

describe('Haze', () => {
  it('resets the stat stages of every unit on both sides', () => {
    const { battle, teamA, teamB } = createBattle();
    const user = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    user.addStage(Stages.Attack, 2, NONE_CAUSE);
    enemy.addStage(Stages.Defense, -3, NONE_CAUSE);

    user.triggerMoveEffect(Moves.Haze, NONE_TARGET, 0);

    expect(user.stages[Stages.Attack]).toBe(0);
    expect(enemy.stages[Stages.Defense]).toBe(0);
  });
});

describe('semi-invulnerable positional statuses', () => {
  it('Fly holds the Floating status during its airborne step', () => {
    const { battle, teamA, teamB } = createBattle();
    const unit = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    unit.triggerMoveEffect(Moves.Fly, unitTarget(enemy), 1);

    expect(unit.status[Statuses.Invulnerable]).toBeDefined();
    expect(unit.status[Statuses.Floating]).toBeDefined();

    // Airborne: Ground moves cannot reach it
    expect(enemy.checkMoveImmunity(Moves.Earthquake, unitTarget(unit), Types.Ground)).toBe(true);

    unit.triggerMoveEffect(Moves.Fly, unitTarget(enemy), 0);

    expect(unit.status[Statuses.Invulnerable]).toBeUndefined();
    expect(unit.status[Statuses.Floating]).toBeUndefined();
  });

  it('the Floating status alone grants Ground immunity, Grounded revokes it', () => {
    const { battle, teamA, teamB } = createBattle();
    const attacker = createUnit(battle, teamA);
    const balloon = createUnit(battle, teamB);

    expect(attacker.checkMoveImmunity(Moves.Earthquake, unitTarget(balloon), Types.Ground)).toBe(
      false,
    );

    balloon.addStatus(Statuses.Floating, NONE_CAUSE);
    expect(attacker.checkMoveImmunity(Moves.Earthquake, unitTarget(balloon), Types.Ground)).toBe(
      true,
    );

    balloon.addStatus(Statuses.Grounded, NONE_CAUSE);
    expect(attacker.checkMoveImmunity(Moves.Earthquake, unitTarget(balloon), Types.Ground)).toBe(
      false,
    );
  });
});

describe('Amnesia', () => {
  it('sharply raises the user special defense', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);

    unit.triggerMoveEffect(Moves.Amnesia, NONE_TARGET, 0);

    expect(unit.stages[Stages.SpecialDefense]).toBe(2);
  });
});
