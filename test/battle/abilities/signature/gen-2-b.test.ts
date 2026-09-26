// Heracross through Celebi.

import { describe, expect, it } from 'vitest';
import {
  BULLY_SCALE,
  ESCORT_SCALE,
  MAGMA_TRAIL_FRACTION,
  MIND_FOG_SCALE,
  MOMENTUM_MAX_STACKS,
  MOMENTUM_STEP,
  RAINBOW_REKINDLING_FRACTION,
  SAND_RIDER_SCALE,
  SWEET_PAW_SHARE,
  TIMELINE_SPLIT_THRESHOLD,
} from '../../../../src/battle/abilities/signature/chikorita-to-celebi';
import { AttackPriority, EventPriority } from '../../../../src/core/event-emitter';
import { BattleEvents, EffectType, MoveTargetType } from '../../../../src/battle/events';
import { Stages, Stats } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { Items } from '../../../../src/data/ids/items';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Statuses, TeamStatuses, Weathers } from '../../../../src/data/ids/status';
import turns from '../../../../src/battle/turn';
import { layersUnder } from '../../../../src/battle/moves/spikes';
import { unitTarget } from '../../../../src/battle/utils';
import Team from '../../../../src/battle/team';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { NONE_CAUSE, act, resolveAttackDamage, rollMove } from './helpers';

describe('Hidden Den', () => {
  it('cannot be aimed at while a teammate is standing', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.HiddenDen);

    expect(enemy.checkMoveImmunity(Moves.Pound, unitTarget(holder), Types.Normal)).toBe(true);
    expect(enemy.checkMoveImmunity(Moves.Pound, unitTarget(mate), Types.Normal)).toBe(false);

    // Alone, there is nowhere left to hide
    mate.faint(enemy);

    expect(enemy.checkMoveImmunity(Moves.Pound, unitTarget(holder), Types.Normal)).toBe(false);
  });

  it('does not hide behind somebody else’s party', () => {
    const { battle, allianceA, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.HiddenDen);

    // A second party under the same banner, which is what a raid is:
    // allied, but not the pokemon standing beside it
    const allied = new Team(battle, allianceA);

    allianceA.addTeam(allied);
    createUnit(battle, allied);

    expect(enemy.checkMoveImmunity(Moves.Pound, unitTarget(holder), Types.Normal)).toBe(false);
  });
});

describe('Sand Rider', () => {
  it('cannot miss and is half covered while the sand blows', () => {
    const { battle, teamA, teamB } = createBattle();
    // The damage roll is pinned, so the two blows differ only by the cover
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SandRider);

    const atEnemy = { type: MoveTargetType.Unit, unit: enemy } as const;

    expect(holder.checkMoveAccuracy(Moves.FireBlast, atEnemy)).not.toBeUndefined();

    battle.setWeather(Weathers.Sandstorm);

    expect(holder.checkMoveAccuracy(Moves.FireBlast, atEnemy)).toBeUndefined();

    // The resolver works the damage out itself, so the cover is read
    // off a bare unit taking the same blow
    const bare = createUnit(battle, teamA);

    expect(resolveAttackDamage(battle, enemy, holder)).toBeCloseTo(
      resolveAttackDamage(battle, enemy, bare) * SAND_RIDER_SCALE,
      5,
    );
  });
});

describe('Bully', () => {
  it('hits harder at whatever has already been cowed', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Bully);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    expect(holder.checkMovePower(Moves.Pound, target)).toBe(40);

    enemy.addStage(Stages.Attack, -1, NONE_CAUSE);

    expect(holder.checkMovePower(Moves.Pound, target)).toBeCloseTo(40 * BULLY_SCALE, 5);
  });
});

describe('Last Barb', () => {
  it('casts Toxic at whoever finished it', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.LastBarb);

    holder.faint(enemy);
    // The cast move takes its own flight time to arrive
    battle.tick(turns(1));

    expect(enemy.status[Statuses.BadlyPoisoned]).not.toBeUndefined();
  });
});

describe('Fermenter', () => {
  it('brews a juice into a free hand as it moves', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    createUnit(battle, teamB);
    holder.addAbility(Abilities.Fermenter);

    expect(holder.items[Items.BerryJuice]).toBeUndefined();

    act(battle, holder);

    expect(holder.items[Items.BerryJuice]).not.toBeUndefined();
  });
});

describe('Heave', () => {
  it('throws each enemy off the field the first time it lands one', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    createUnit(battle, teamB);
    holder.addAbility(Abilities.Heave);

    const casts: Moves[] = [];
    battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
      if (event.source === holder) {
        casts.push(event.move);
      }
    });

    // A contact move lands, and the throw follows it
    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(casts).toEqual([Moves.Whirlwind]);

    // The same enemy is not thrown twice
    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(casts).toEqual([Moves.Whirlwind]);
  });

  it('leaves a move that never touched it alone', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Heave);

    let cast = false;
    battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
      cast = cast || event.source === holder;
    });

    holder.attack(enemy, Moves.WaterGun, 40, Types.Water, MoveCategories.Special, 0);

    expect(cast).toBe(false);
  });
});

describe('Sharp Claw', () => {
  it('opens the target up with every touch', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SharpClaw);

    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(enemy.stages[Stages.Defense]).toBe(-1);

    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);

    expect(enemy.stages[Stages.Defense]).toBe(-2);

    // Nothing that keeps its distance cuts anything
    holder.attack(enemy, Moves.WaterGun, 40, Types.Water, MoveCategories.Special, 0);

    expect(enemy.stages[Stages.Defense]).toBe(-2);
  });
});

describe('Sweet Paw', () => {
  it('licks back a share of what its paws deal', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.SweetPaw);

    const maxHP = holder.checkStat(Stats.HP, 0);
    holder.setHealth(maxHP / 2);

    holder.damage({ type: EffectType.Move, move: Moves.Pound, unit: holder }, enemy, 40, 0);

    expect(holder.health).toBeCloseTo(maxHP / 2 + 40 * SWEET_PAW_SHARE, 5);

    // A move that never touched the target gives nothing back
    holder.setHealth(maxHP / 2);
    holder.damage({ type: EffectType.Move, move: Moves.WaterGun, unit: holder }, enemy, 40, 0);

    expect(holder.health).toBeCloseTo(maxHP / 2, 5);
  });
});

describe('Magma Trail', () => {
  it('burns only what it has actually reached', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const burned = createUnit(battle, teamB);
    const untouched = createUnit(battle, teamB);
    holder.addAbility(Abilities.MagmaTrail);

    const maxHP = burned.checkStat(Stats.HP, 0);

    // Nothing before it connects
    act(battle, burned);

    expect(burned.health).toBe(maxHP);

    holder.attack(burned, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);
    burned.setHealth(maxHP);

    act(battle, burned);

    expect(burned.health).toBeCloseTo(maxHP - maxHP * MAGMA_TRAIL_FRACTION, 5);

    // The one it never touched walks over clean ground, and so does
    // its own side
    act(battle, untouched);
    act(battle, ally);

    expect(untouched.health).toBe(untouched.checkStat(Stats.HP, 0));
    expect(ally.health).toBe(ally.checkStat(Stats.HP, 0));
  });
});

describe('Icebreaker', () => {
  it('tears the screens down as it swings', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Icebreaker);

    const screen = { type: EffectType.None } as const;
    teamB.addStatus(TeamStatuses.Reflect, screen);
    teamB.addStatus(TeamStatuses.LightScreen, screen);

    holder.triggerMove(Moves.Pound, unitTarget(enemy), 0);
    battle.tick(turns(1));

    expect(teamB.status[TeamStatuses.Reflect]).toBeUndefined();
    expect(teamB.status[TeamStatuses.LightScreen]).toBeUndefined();
  });

  it('leaves the screens up when it misses or aims a status move', () => {
    const { battle, teamA, teamB } = createBattle();
    // Past Mega Punch's 85 accuracy, so the swing misses
    pinRandom(battle, 0.99);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Icebreaker);

    const screen = { type: EffectType.None } as const;
    teamB.addStatus(TeamStatuses.Reflect, screen);
    teamB.addStatus(TeamStatuses.LightScreen, screen);

    holder.triggerMove(Moves.MegaPunch, unitTarget(enemy), 0);
    battle.tick(turns(1));
    holder.triggerMove(Moves.Growl, unitTarget(enemy), 0);
    battle.tick(turns(1));

    expect(enemy.health).toBe(enemy.checkStat(Stats.HP, 0));
    expect(teamB.status[TeamStatuses.Reflect]).toBeDefined();
    expect(teamB.status[TeamStatuses.LightScreen]).toBeDefined();
  });

  it('hits through the screens it tears down', () => {
    const screened = createBattle();
    const bare = createBattle();
    const damage: number[] = [];

    for (const [index, { battle, teamA, teamB }] of [screened, bare].entries()) {
      pinRandom(battle, 0);
      const holder = createUnit(battle, teamA);
      const enemy = createUnit(battle, teamB);
      holder.addAbility(Abilities.Icebreaker);

      if (index === 0) {
        teamB.addStatus(TeamStatuses.Reflect, { type: EffectType.None });
      }

      holder.triggerMove(Moves.Pound, unitTarget(enemy), 0);
      battle.tick(turns(1));
      damage.push(enemy.checkStat(Stats.HP, 0) - enemy.health);
    }

    expect(damage[0]).toBeGreaterThan(0);
    expect(damage[0]).toBeCloseTo(damage[1], 5);
  });
});

describe('Coral Bloom', () => {
  it('passes what it takes in on to the ally that needs it', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const hurt = createUnit(battle, teamA);
    const fine = createUnit(battle, teamA);
    createUnit(battle, teamB);
    holder.addAbility(Abilities.CoralBloom);

    const maxHP = holder.checkStat(Stats.HP, 0);
    holder.setHealth(maxHP / 2);
    hurt.setHealth(maxHP / 4);

    holder.heal(NONE_CAUSE, holder, 20, 0);

    expect(holder.health).toBeCloseTo(maxHP / 2 + 20, 5);
    expect(hurt.health).toBeCloseTo(maxHP / 4 + 20, 5);
    // Only the neediest branch, and never twice over
    expect(fine.health).toBe(maxHP);
  });
});

describe('Ricochet', () => {
  it('strikes another standing enemy when a single-target move misses', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const missed = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);

    holder.addAbility(Abilities.Ricochet);
    // Every roll against the first enemy misses
    battle.on(BattleEvents.UnitTriggerMoveRollHit, EventPriority.Post, (event) => {
      if (event.parent.target.type === MoveTargetType.Unit && event.parent.target.unit === missed) {
        event.hit = false;
      }
    });
    holder.triggerMove(Moves.Tackle, unitTarget(missed), 0);
    battle.tick(1000);

    expect(missed.health).toBe(missed.checkStat(Stats.HP, 0));
    expect(other.health).toBeLessThan(other.checkStat(Stats.HP, 0));
  });

  it('does nothing with no other enemy standing', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const missed = createUnit(battle, teamB);
    const mate = createUnit(battle, teamA);

    holder.addAbility(Abilities.Ricochet);
    battle.on(BattleEvents.UnitTriggerMoveRollHit, EventPriority.Post, (event) => {
      event.hit = false;
    });
    holder.triggerMove(Moves.Tackle, unitTarget(missed), 0);
    battle.tick(1000);

    expect(missed.health).toBe(missed.checkStat(Stats.HP, 0));
    // Never glances onto its own side
    expect(mate.health).toBe(mate.checkStat(Stats.HP, 0));
  });
});

describe('Delivery', () => {
  it('puts a juice in the hands of whoever needs it as it arrives', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const hurt = createUnit(battle, teamA);
    const fine = createUnit(battle, teamA);
    createUnit(battle, teamB);
    holder.addAbility(Abilities.Delivery);

    hurt.setHealth(hurt.checkStat(Stats.HP, 0) / 4);

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });

    expect(hurt.items[Items.BerryJuice]).not.toBeUndefined();
    expect(fine.items[Items.BerryJuice]).toBeUndefined();
    // The parcel is never for itself
    expect(holder.items[Items.BerryJuice]).toBeUndefined();
  });
});

describe('Escort', () => {
  it('spreads its wing over everybody else in its party', () => {
    const { battle, allianceA, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    const bare = mate.checkStat(Stats.SpecialDefense, 0);

    holder.addAbility(Abilities.Escort);

    expect(mate.checkStat(Stats.SpecialDefense, 0)).toBeCloseTo(bare * ESCORT_SCALE, 5);
    // Not itself, and not the far side
    expect(holder.checkStat(Stats.SpecialDefense, 0)).toBeCloseTo(bare, 5);
    expect(enemy.checkStat(Stats.SpecialDefense, 0)).toBeCloseTo(bare, 5);

    // And not a party it merely happens to be allied with
    const allied = new Team(battle, allianceA);

    allianceA.addTeam(allied);

    const stranger = createUnit(battle, allied);

    expect(stranger.checkStat(Stats.SpecialDefense, 0)).toBeCloseTo(bare, 5);
  });
});

describe('Steelmolt', () => {
  it('sheds a layer only as a hit takes it past 3/4 and past 1/2 HP', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Steelmolt);

    const whole = holder.checkStat(Stats.HP, 0);
    const hit = (to: number): void => {
      enemy.damage(
        { type: EffectType.Move, move: Moves.Pound, unit: enemy },
        holder,
        holder.health - Math.floor(whole * to),
        0,
      );
      // The cast move takes its own flight time to arrive
      battle.tick(turns(1));
    };

    // A scratch above the first mark sheds nothing
    hit(0.9);
    expect(layersUnder(teamB)).toBe(0);

    hit(0.7);
    expect(layersUnder(teamB)).toBe(1);

    // Still between the marks, however many hits land
    hit(0.6);
    hit(0.55);
    expect(layersUnder(teamB)).toBe(1);

    hit(0.4);
    expect(layersUnder(teamB)).toBe(2);
    expect(layersUnder(teamA)).toBe(0);
  });

  it('sheds both layers from one hit that crosses both marks', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Steelmolt);

    const whole = holder.checkStat(Stats.HP, 0);

    enemy.damage(
      { type: EffectType.Move, move: Moves.Pound, unit: enemy },
      holder,
      Math.ceil(whole * 0.6),
      0,
    );
    battle.tick(turns(1));

    expect(layersUnder(teamB)).toBe(2);
  });
});

describe('Pack Howl', () => {
  it('lifts every teammate as it arrives, and nobody else', () => {
    const { battle, allianceA, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.PackHowl);

    // Another party under the same banner, which is what a raid lobby
    // is: allied, but not the pack
    const allied = new Team(battle, allianceA);

    allianceA.addTeam(allied);

    const stranger = createUnit(battle, allied);

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });

    expect(mate.stages[Stages.Attack]).toBe(1);
    expect(holder.stages[Stages.Attack]).toBe(0);
    expect(stranger.stages[Stages.Attack]).toBe(0);
    expect(enemy.stages[Stages.Attack]).toBe(0);
  });
});

describe('Momentum', () => {
  it('rolls harder for every blow that has landed', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Momentum);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    expect(holder.checkMovePower(Moves.Pound, target)).toBe(40);

    for (let landed = 1; landed <= MOMENTUM_MAX_STACKS; landed += 1) {
      rollMove(battle, holder, enemy, Moves.Pound, true);

      expect(holder.checkMovePower(Moves.Pound, target)).toBeCloseTo(
        40 * (1 + MOMENTUM_STEP * landed),
        5,
      );
    }

    // Past the cap it holds where it is
    rollMove(battle, holder, enemy, Moves.Pound, true);

    expect(holder.checkMovePower(Moves.Pound, target)).toBeCloseTo(
      40 * (1 + MOMENTUM_STEP * MOMENTUM_MAX_STACKS),
      5,
    );

    // Taking the field again starts the roll over
    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });

    expect(holder.checkMovePower(Moves.Pound, target)).toBe(40);
  });
});

describe('Mind Fog', () => {
  it('dulls what the far side can think with', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    const bare = enemy.checkStat(Stats.SpecialAttack, 0);

    holder.addAbility(Abilities.MindFog);

    expect(enemy.checkStat(Stats.SpecialAttack, 0)).toBeCloseTo(bare * MIND_FOG_SCALE, 5);
    expect(ally.checkStat(Stats.SpecialAttack, 0)).toBeCloseTo(bare, 5);
    expect(enemy.checkStat(Stats.Attack, 0)).toBeCloseTo(bare, 5);
  });
});

describe('Palette', () => {
  it('paints its moves the colour of whatever last hit it', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Palette);

    const target = { type: MoveTargetType.Unit, unit: enemy } as const;

    expect(holder.checkMoveType(Moves.Pound, target)).toBe(Types.Normal);

    enemy.attack(holder, Moves.WaterGun, 40, Types.Water, MoveCategories.Special, 0);

    expect(holder.checkMoveType(Moves.Pound, target)).toBe(Types.Water);

    // Whatever lands next repaints it
    enemy.attack(holder, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);

    expect(holder.checkMoveType(Moves.Pound, target)).toBe(Types.Fire);
  });
});

describe('Cowbell', () => {
  it('rings the team clean as it arrives', () => {
    const { battle, teamA, teamB } = createBattle();
    pinRandom(battle, 0);
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Cowbell);

    ally.addStatus(Statuses.Burned, NONE_CAUSE);
    enemy.addStatus(Statuses.Burned, NONE_CAUSE);

    battle.emit(BattleEvents.UnitEntersField, {
      id: 'UnitEntersField',
      disabled: false,
      source: holder,
      reactivation: false,
    });
    // The cast move takes its own flight time to arrive
    battle.tick(turns(1));

    expect(ally.status[Statuses.Burned]).toBeUndefined();
    expect(enemy.status[Statuses.Burned]).not.toBeUndefined();
  });
});

describe('the risen beasts', () => {
  const RISEN = [
    { name: 'Risen Thunder', ability: Abilities.RisenThunder, stage: Stages.Speed },
    { name: 'Risen Flame', ability: Abilities.RisenFlame, stage: Stages.Attack },
    { name: 'Risen Tide', ability: Abilities.RisenTide, stage: Stages.Defense },
  ];

  for (const { name, ability, stage } of RISEN) {
    it(`gets ${name} back up once, cured and a stage sharper`, () => {
      const { battle, teamA, teamB } = createBattle();
      const holder = createUnit(battle, teamA);
      const enemy = createUnit(battle, teamB);
      holder.addAbility(ability);
      holder.addStatus(Statuses.Burned, NONE_CAUSE);

      const maxHP = holder.checkStat(Stats.HP, 0);

      enemy.damage({ type: EffectType.Move, move: Moves.Pound, unit: enemy }, holder, maxHP * 2, 0);

      expect(holder.alive).toBe(true);
      expect(holder.health).toBe(1);
      expect(holder.status[Statuses.Burned]).toBeUndefined();
      expect(holder.stages[stage]).toBe(1);

      // The tower burns once: the next one finishes it
      holder.setHealth(maxHP);
      enemy.damage({ type: EffectType.Move, move: Moves.Pound, unit: enemy }, holder, maxHP * 2, 0);

      expect(holder.alive).toBe(false);
    });
  }
});

describe('Tyrant', () => {
  it('holds the far side down where it is', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.Tyrant);

    enemy.addStage(Stages.Attack, 2, NONE_CAUSE);

    expect(enemy.stages[Stages.Attack]).toBe(0);

    // Drops still land on them, and its own side builds as it likes
    enemy.addStage(Stages.Attack, -1, NONE_CAUSE);
    ally.addStage(Stages.Attack, 2, NONE_CAUSE);

    expect(enemy.stages[Stages.Attack]).toBe(-1);
    expect(ally.stages[Stages.Attack]).toBe(2);
  });
});

describe('Silver Aegis', () => {
  it('holds an ally up through the blow that would finish it', () => {
    const { battle, teamA, teamB } = createBattle();
    const guardian = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    guardian.addAbility(Abilities.SilverAegis);

    const blow = { type: EffectType.Move, move: Moves.Pound, unit: enemy } as const;
    const maxHP = ally.checkStat(Stats.HP, 0);

    enemy.damage(blow, ally, maxHP * 2, 0);

    expect(ally.alive).toBe(true);
    expect(ally.health).toBe(1);

    // One shield, and the guardian never held it over itself
    ally.setHealth(maxHP);
    enemy.damage(blow, ally, maxHP * 2, 0);

    expect(ally.alive).toBe(false);
    expect(guardian.alive).toBe(true);

    enemy.damage(blow, guardian, guardian.checkStat(Stats.HP, 0) * 2, 0);

    expect(guardian.alive).toBe(false);
  });
});

describe('Rainbow Rekindling', () => {
  it('puts the first ally that falls back on its feet', () => {
    const { battle, teamA, teamB } = createBattle();
    const phoenix = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const second = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    phoenix.addAbility(Abilities.RainbowRekindling);

    ally.faint(enemy);

    expect(ally.alive).toBe(true);
    expect(ally.health).toBeCloseTo(ally.checkStat(Stats.HP, 0) * RAINBOW_REKINDLING_FRACTION, 5);

    // The rainbow comes once
    second.faint(enemy);

    expect(second.alive).toBe(false);
  });
});

describe('Timeline Split', () => {
  it('steps back to before it was worn down', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);
    holder.addAbility(Abilities.TimelineSplit);

    holder.addStage(Stages.Attack, 2, NONE_CAUSE);
    holder.addStage(Stages.Defense, -2, NONE_CAUSE);
    holder.addStage(Stages.Speed, -1, NONE_CAUSE);
    holder.addStatus(Statuses.Burned, NONE_CAUSE);

    const maxHP = holder.checkStat(Stats.HP, 0);

    // Still above the line: nothing splits yet
    enemy.damage(NONE_CAUSE, holder, maxHP * 0.2, 0);

    expect(holder.stages[Stages.Defense]).toBe(-2);

    enemy.damage(NONE_CAUSE, holder, maxHP * (1 - TIMELINE_SPLIT_THRESHOLD), 0);

    expect(holder.stages[Stages.Defense]).toBe(0);
    expect(holder.stages[Stages.Speed]).toBe(0);
    // What it built for itself is its own doing and stays
    expect(holder.stages[Stages.Attack]).toBe(2);
    expect(holder.status[Statuses.Burned]).toBeUndefined();

    // Once per battle
    holder.addStage(Stages.Defense, -1, NONE_CAUSE);
    enemy.damage(NONE_CAUSE, holder, 1, 0);

    expect(holder.stages[Stages.Defense]).toBe(-1);
  });
});
