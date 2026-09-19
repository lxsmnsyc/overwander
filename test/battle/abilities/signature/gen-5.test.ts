// Snivy through Oshawott.

import { describe, expect, it } from 'vitest';
import { Stages, Stats, StatsKind } from '../../../../src/data/constants/stats';
import { Types } from '../../../../src/data/constants/types';
import Abilities from '../../../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../../../src/data/ids/moves';
import { Items } from '../../../../src/data/ids/items';
import { Genders, Species } from '../../../../src/data/ids/species';
import { Statuses, TeamStatuses } from '../../../../src/data/ids/status';
import { BattleEvents, EffectType, MoveTargetType } from '../../../../src/battle/events';
import type Unit from '../../../../src/battle/unit';
import {
  DOZE_SHARE,
  STORM_DASH_STEP,
} from '../../../../src/battle/abilities/signature/munna-to-blitzle';
import {
  HURRY_VENOM_SCALE,
  TAILOR_SCALE,
} from '../../../../src/battle/abilities/signature/sewaddle-to-petilil';
import {
  AFTERSHOCK_SHARE,
  TORQUE_SCALE,
  TORQUE_WIND_UP,
} from '../../../../src/battle/abilities/signature/roggenrola-to-drilbur';
import {
  GUARD_FACTOR,
  SPOTTER_ACCURACY,
} from '../../../../src/battle/abilities/signature/patrat-to-purrloin';
import {
  LOAD_BEARING_DEALT,
  LOAD_BEARING_TAKEN,
  RIPPLE_OUT_FRACTION,
} from '../../../../src/battle/abilities/signature/audino-to-sawk';
import {
  BLUE_BELT_SCALE,
  RED_BELT_SCALE,
} from '../../../../src/battle/abilities/signature/__create';
import {
  DEATH_ROLL_SCALE,
  DRY_SPELL_SCALE,
  GLANCING_BLOW_FRACTION,
  SLAB_SHARE,
} from '../../../../src/battle/abilities/signature/sandile-to-dwebble';
import {
  DEATH_MASK_STAGES,
  GANG_UP_STEP,
} from '../../../../src/battle/abilities/signature/scraggy-to-trubbish';
import {
  DIVISION_SHARE,
  FIXATION_SCALE,
} from '../../../../src/battle/abilities/signature/zorua-to-solosis';
import {
  MESHING_DEALT,
  MESHING_TAKEN,
  THORN_CURTAIN_SCALE,
} from '../../../../src/battle/abilities/signature/joltik-to-klink';
import { CONTACT_RECOIL_FRACTION } from '../../../../src/battle/abilities/__create';
import turns from '../../../../src/battle/turn';
import { createBattle, createUnit, pinRandom } from '../../harness';
import { act, dealDamage, resolveAttackDamage } from './helpers';

function unitTarget(unit: Unit): { readonly type: MoveTargetType.Unit; readonly unit: Unit } {
  return { type: MoveTargetType.Unit, unit } as const;
}

describe('the Unova starters', () => {
  it('slows what its first landed move hits, and nothing after that', () => {
    const { battle, teamA, teamB } = createBattle();
    const snake = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    snake.addAbility(Abilities.LeafOpening);
    snake.enter();
    target.enter();
    battle.tick(1);

    dealDamage(snake, target, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);

    expect(target.stages[Stages.Speed]).toBe(-1);

    // The opening is spent, so the second blow is an ordinary one
    dealDamage(snake, target, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);

    expect(target.stages[Stages.Speed]).toBe(-1);
  });

  it('puts half again behind its first landed move only', () => {
    const { battle, teamA, teamB } = createBattle();

    pinRandom(battle, 1);

    const boar = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    boar.addAbility(Abilities.EmberOpening);
    boar.enter();
    target.enter();
    battle.tick(1);

    const opened = dealDamage(
      boar,
      target,
      Moves.Tackle,
      40,
      Types.Normal,
      MoveCategories.Physical,
    );
    const ordinary = dealDamage(
      boar,
      target,
      Moves.Tackle,
      40,
      Types.Normal,
      MoveCategories.Physical,
    );

    expect(opened).toBeGreaterThan(ordinary);
    expect(opened / ordinary).toBeCloseTo(1.5, 1);
  });

  it('gets its shell up on its first landed move, once a fight', () => {
    const { battle, teamA, teamB } = createBattle();
    const otter = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    otter.addAbility(Abilities.ShellOpening);
    otter.enter();
    target.enter();
    battle.tick(1);

    dealDamage(otter, target, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);

    expect(otter.stages[Stages.Defense]).toBe(2);

    dealDamage(otter, target, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);

    expect(otter.stages[Stages.Defense]).toBe(2);
  });
});

describe('the three a walk out of the first town meets', () => {
  it('calls the shot for its whole team, against a target mid-move', () => {
    const { battle, teamA, teamB } = createBattle();
    const scout = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);
    const aim = unitTarget(target);

    scout.enter();
    ally.enter();
    target.enter();
    target.addMove(Moves.Tackle);

    const bare = ally.checkMoveAccuracy(Moves.Thunderbolt, aim) ?? 0;

    scout.addAbility(Abilities.Spotter);

    // Nothing is called while the target is doing nothing
    expect(ally.checkMoveAccuracy(Moves.Thunderbolt, aim)).toBe(bare);

    target.cast(Moves.Tackle, unitTarget(ally));
    battle.tick(1);

    expect(ally.checkMoveAccuracy(Moves.Thunderbolt, aim)).toBeCloseTo(bare * SPOTTER_ACCURACY, 5);
    // And the scout's own throws are called too
    expect(scout.checkMoveAccuracy(Moves.Thunderbolt, aim)).toBeCloseTo(bare * SPOTTER_ACCURACY, 5);
  });

  it('stands over a hurt teammate, and stands down once it is well', () => {
    const { battle, teamA, teamB } = createBattle();
    const dog = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);

    createUnit(battle, teamB).enter();
    dog.enter();
    ally.enter();
    dog.addAbility(Abilities.LoyalGuard);

    const defense = dog.checkStat(Stats.Defense, 0);
    const special = dog.checkStat(Stats.SpecialDefense, 0);

    ally.setHealth(Math.floor(ally.checkStat(Stats.HP, 0) / 4));

    expect(dog.checkStat(Stats.Defense, 0)).toBe(defense * GUARD_FACTOR);
    expect(dog.checkStat(Stats.SpecialDefense, 0)).toBe(special * GUARD_FACTOR);

    // Its own health is not what it is watching
    ally.setHealth(ally.checkStat(Stats.HP, 0));

    expect(dog.checkStat(Stats.Defense, 0)).toBe(defense);
  });

  it('takes an item with the first move it lands, once a fight', () => {
    const { battle, teamA, teamB } = createBattle();
    const cat = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);

    cat.enter();
    target.enter();
    other.enter();
    cat.addAbility(Abilities.CatBurglar);
    target.addItem(Items.Leftovers);
    other.addItem(Items.ShellBell);

    dealDamage(cat, target, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);

    expect(cat.hasItem(Items.Leftovers)).toBe(true);
    expect(target.hasItem(Items.Leftovers)).toBe(false);

    // One theft a fight: the second pokemon keeps what it is holding
    dealDamage(cat, other, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);

    expect(other.hasItem(Items.ShellBell)).toBe(true);
  });
});

describe('the three the second road holds', () => {
  it('banks the seconds it dozes and spends them as it acts', () => {
    const { battle, teamA, teamB } = createBattle();
    const dreamer = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    dreamer.enter();
    target.enter();
    dreamer.addAbility(Abilities.Doze);
    dreamer.addMove(Moves.Tackle);
    dreamer.setHealth(1);

    // Three idle seconds are banked, and nothing is paid until it acts
    battle.tick(3000);

    expect(dreamer.health).toBe(1);

    dreamer.cast(Moves.Tackle, unitTarget(target));
    battle.tick(1);

    const banked = Math.floor(dreamer.checkStat(Stats.HP, 0) * DOZE_SHARE * 3);

    expect(dreamer.health).toBe(1 + banked);
  });

  it('cannot miss anybody it has already landed a move on', () => {
    const { battle, teamA, teamB } = createBattle();
    const bird = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);

    bird.enter();
    target.enter();
    other.enter();
    bird.addAbility(Abilities.Homing);

    // The first throw at each of them is rolled for like anybody's
    expect(bird.checkMoveAccuracy(Moves.AirSlash, unitTarget(target))).toBeGreaterThan(0);

    dealDamage(bird, target, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);

    expect(bird.checkMoveAccuracy(Moves.AirSlash, unitTarget(target))).toBeUndefined();
    // Whoever it has not found yet is still a roll
    expect(bird.checkMoveAccuracy(Moves.AirSlash, unitTarget(other))).toBeGreaterThan(0);
  });

  it('hits harder for each stage of Speed it is running on', () => {
    const { battle, teamA, teamB } = createBattle();
    const zebra = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    zebra.enter();
    target.enter();
    zebra.addAbility(Abilities.StormDash);

    const bare = zebra.checkMovePower(Moves.Tackle, unitTarget(target)) ?? 0;

    zebra.addStage(Stages.Speed, 2, { type: EffectType.None });

    expect(zebra.checkMovePower(Moves.Tackle, unitTarget(target))).toBeCloseTo(
      bare * (1 + STORM_DASH_STEP * 2),
      5,
    );

    // A lost stage is not a cost: it only ever reads what it has gained
    zebra.addStage(Stages.Speed, -4, { type: EffectType.None });

    expect(zebra.checkMovePower(Moves.Tackle, unitTarget(target))).toBeCloseTo(bare, 5);
  });
});

describe('the three the first cave holds', () => {
  it('shocks whoever leaves it standing on 1 HP', () => {
    const { battle, teamA, teamB } = createBattle();
    const ore = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);

    ore.enter();
    attacker.enter();
    // Sturdy is what usually leaves it on 1 HP, and is in its own
    // pool. It is worn rather than added, so it costs no slot
    ore.wearAbility(Abilities.Sturdy);
    ore.addAbility(Abilities.Aftershock);

    const full = attacker.checkStat(Stats.HP, 0);

    dealDamage(attacker, ore, Moves.Tackle, 999, Types.Normal, MoveCategories.Physical);

    expect(ore.health).toBe(1);
    expect(full - attacker.health).toBe(Math.floor(full * AFTERSHOCK_SHARE));
  });

  it('leaves the mark of its nose on an enemy as it arrives', () => {
    const { battle, teamA, teamB } = createBattle();
    const bat = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    bat.setGender(Genders.Female);
    enemy.setGender(Genders.Male);
    bat.addAbility(Abilities.HeartMark);
    enemy.enter();
    bat.enter();
    battle.tick(turns(1));

    expect(enemy.status[Statuses.Infatuated]).toBeDefined();
  });

  it('spins the drill up: harder blows for a longer wind-up', () => {
    const { battle, teamA, teamB } = createBattle();
    const mole = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);
    const aim = unitTarget(target);

    mole.enter();
    target.enter();

    const power = mole.checkMovePower(Moves.DrillRun, aim) ?? 0;
    const wind = mole.checkMoveCastTime(Moves.DrillRun, aim);

    mole.addAbility(Abilities.Torque);

    expect(mole.checkMovePower(Moves.DrillRun, aim)).toBeCloseTo(power * TORQUE_SCALE, 5);
    expect(mole.checkMoveCastTime(Moves.DrillRun, aim)).toBeCloseTo(wind * TORQUE_WIND_UP, 5);
  });
});

describe('the four the forest holds', () => {
  it('dresses its worst hurt teammate, and only that one', () => {
    const { battle, teamA, teamB } = createBattle();
    const tailor = createUnit(battle, teamA);
    const hurt = createUnit(battle, teamA);
    const well = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);

    tailor.addAbility(Abilities.Tailor);
    hurt.enter();
    well.enter();
    attacker.enter();
    hurt.setHealth(Math.floor(hurt.checkStat(Stats.HP, 0) / 4));
    tailor.enter();
    battle.tick(1);

    const dressed = dealDamage(
      attacker,
      hurt,
      Moves.Tackle,
      40,
      Types.Normal,
      MoveCategories.Physical,
    );
    const bare = dealDamage(
      attacker,
      well,
      Moves.Tackle,
      40,
      Types.Normal,
      MoveCategories.Physical,
    );

    expect(dressed / bare).toBeCloseTo(TAILOR_SCALE, 1);
  });

  it('makes its own poison bite harder than anybody else', () => {
    const { battle, teamA, teamB } = createBattle();
    const centipede = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const bitten = createUnit(battle, teamB);
    const other = createUnit(battle, teamB);

    centipede.enter();
    plain.enter();
    bitten.enter();
    other.enter();
    centipede.addAbility(Abilities.HurryVenom);

    bitten.addStatus(Statuses.Poisoned, {
      type: EffectType.Move,
      move: Moves.PoisonSting,
      unit: centipede,
    });
    other.addStatus(Statuses.Poisoned, {
      type: EffectType.Move,
      move: Moves.PoisonSting,
      unit: plain,
    });

    const bittenWhole = bitten.health;
    const otherWhole = other.health;

    battle.tick(turns(1));

    expect((bittenWhole - bitten.health) / (otherWhole - other.health)).toBeCloseTo(
      HURRY_VENOM_SCALE,
      1,
    );
  });

  it('puts its powder on a Grass type, and never misses with it', () => {
    const { battle, teamA, teamB } = createBattle();
    const cotton = createUnit(battle, teamA);
    const grass = createUnit(battle, teamB);

    cotton.enter();
    grass.enter();
    grass.types.clear();
    grass.types.add(Types.Grass);

    const aim = unitTarget(grass);

    // Modern mechanics: powder does nothing to a Grass type
    expect(cotton.checkMoveImmunity(Moves.StunSpore, aim, Types.Grass)).toBe(true);

    cotton.addAbility(Abilities.SporeDrift);

    expect(cotton.checkMoveImmunity(Moves.StunSpore, aim, Types.Grass)).toBe(false);
    expect(cotton.checkMoveAccuracy(Moves.StunSpore, aim)).toBeUndefined();
    // Anything that is not powder is thrown as anybody throws it
    expect(cotton.checkMoveAccuracy(Moves.RazorLeaf, aim)).toBeGreaterThan(0);
  });

  it('hands its teammates whatever a dance gives it', () => {
    const { battle, teamA, teamB } = createBattle();
    const dancer = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);

    createUnit(battle, teamB).enter();
    dancer.enter();
    ally.enter();
    dancer.addAbility(Abilities.PollenWaltz);

    dancer.addStage(Stages.SpecialAttack, 1, {
      type: EffectType.Move,
      move: Moves.QuiverDance,
      unit: dancer,
    });

    expect(dancer.stages[Stages.SpecialAttack]).toBe(1);
    expect(ally.stages[Stages.SpecialAttack]).toBe(1);

    // Only a dance, and only what it gains
    dancer.addStage(Stages.Attack, 1, {
      type: EffectType.Move,
      move: Moves.Growth,
      unit: dancer,
    });

    expect(ally.stages[Stages.Attack]).toBe(0);
  });
});

describe('the rest of what the forest holds', () => {
  it('keeps a teammate standing on 1 HP, once each and never itself', () => {
    const { battle, teamA, teamB } = createBattle();
    const audino = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const attacker = createUnit(battle, teamB);

    audino.addAbility(Abilities.Ward);
    audino.enter();
    mate.enter();
    attacker.enter();
    mate.setHealth(5);
    audino.setHealth(5);

    attacker.attack(mate, Moves.Tackle, 400, Types.Normal, MoveCategories.Physical, 0);
    expect(mate.health).toBe(1);
    expect(mate.alive).toBe(true);

    // The second blow is not covered: one ward each
    attacker.attack(mate, Moves.Tackle, 400, Types.Normal, MoveCategories.Physical, 0);
    expect(mate.alive).toBe(false);

    // The holder never wards itself
    attacker.attack(audino, Moves.Tackle, 400, Types.Normal, MoveCategories.Physical, 0);
    expect(audino.alive).toBe(false);
  });

  it('carries the beam while it is healthy and swings it once it is not', () => {
    const { battle, teamA, teamB } = createBattle();
    const timburr = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    timburr.addAbility(Abilities.LoadBearing);
    timburr.enter();
    plain.enter();
    foe.enter();

    const covered = resolveAttackDamage(battle, foe, timburr);
    const bare = resolveAttackDamage(battle, foe, plain);

    expect(covered / bare).toBeCloseTo(LOAD_BEARING_TAKEN, 2);

    // Nothing extra out of it while the beam is still up
    expect(resolveAttackDamage(battle, timburr, foe)).toBeCloseTo(
      resolveAttackDamage(battle, plain, foe),
      2,
    );

    timburr.setHealth(Math.floor(timburr.checkStat(Stats.HP, 0) / 4));

    const dropped = resolveAttackDamage(battle, foe, timburr);
    const swung = resolveAttackDamage(battle, timburr, foe);

    expect(dropped).toBeCloseTo(bare, 2);
    expect(swung / resolveAttackDamage(battle, plain, foe)).toBeCloseTo(LOAD_BEARING_DEALT, 2);
  });

  it('shakes every other enemy for a quarter of what it dealt', () => {
    const { battle, teamA, teamB } = createBattle();
    const toad = createUnit(battle, teamA);
    const hit = createUnit(battle, teamB);
    const beside = createUnit(battle, teamB);

    pinRandom(battle, 1);
    toad.addAbility(Abilities.RippleOut);
    toad.enter();
    hit.enter();
    beside.enter();

    const whole = beside.health;
    const dealt = dealDamage(toad, hit, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);

    expect(dealt).toBeGreaterThan(0);
    expect(whole - beside.health).toBeCloseTo(dealt * RIPPLE_OUT_FRACTION, 0);
  });

  it('has the throw cover its whole team, the holder included', () => {
    const { battle, teamA, teamB } = createBattle();
    const throh = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const spare = createUnit(battle, teamB);

    pinRandom(battle, 1);
    throh.addAbility(Abilities.RedBelt);
    throh.enter();
    mate.enter();
    foe.enter();
    spare.enter();

    const guarded = resolveAttackDamage(battle, foe, mate);
    const onHolder = resolveAttackDamage(battle, foe, throh);
    const plain = resolveAttackDamage(battle, foe, spare);

    expect(guarded).toBeCloseTo(onHolder, 2);
    expect(guarded / plain).toBeCloseTo(RED_BELT_SCALE, 2);
  });

  it('has the strike arm its whole team, the holder included', () => {
    const { battle, teamA, teamB } = createBattle();
    const sawk = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const spare = createUnit(battle, teamB);

    pinRandom(battle, 1);
    sawk.addAbility(Abilities.BlueBelt);
    sawk.enter();
    mate.enter();
    foe.enter();
    spare.enter();

    const armed = resolveAttackDamage(battle, mate, foe);
    const fromHolder = resolveAttackDamage(battle, sawk, foe);
    const plain = resolveAttackDamage(battle, foe, spare);

    expect(armed).toBeCloseTo(fromHolder, 2);
    expect(armed / plain).toBeCloseTo(BLUE_BELT_SCALE, 2);
  });
});

describe('the elemental monkeys', () => {
  it('burns every enemy the first time a blow takes it under half, once a fight', () => {
    const { battle, teamA, teamB } = createBattle();
    const pansear = createUnit(battle, teamA);
    const near = createUnit(battle, teamB);
    const far = createUnit(battle, teamB);

    pansear.addAbility(Abilities.EmberTuft);
    pansear.enter();
    near.enter();
    far.enter();

    // Above half it keeps the tuft
    near.attack(pansear, Moves.Tackle, 1, Types.Normal, MoveCategories.Physical, 0);
    expect(near.status[Statuses.Burned]).toBeFalsy();

    pansear.setHealth(Math.floor(pansear.checkStat(Stats.HP, 0) * 0.6));
    near.attack(pansear, Moves.Tackle, 60, Types.Normal, MoveCategories.Physical, 0);

    expect(near.status[Statuses.Burned]).toBeTruthy();
    expect(far.status[Statuses.Burned]).toBeTruthy();

    // Spent: a second enemy arriving later gets nothing
    const late = createUnit(battle, teamB);

    late.enter();
    near.attack(pansear, Moves.Tackle, 10, Types.Normal, MoveCategories.Physical, 0);
    expect(late.status[Statuses.Burned]).toBeFalsy();
  });

  it('seeds every enemy instead, and a Grass type shrugs the seed off', () => {
    const { battle, teamA, teamB } = createBattle();
    const pansage = createUnit(battle, teamA);
    const plain = createUnit(battle, teamB);
    const grass = createUnit(battle, teamB);

    pansage.addAbility(Abilities.LeafCrown);
    pansage.enter();
    plain.enter();
    grass.enter();
    grass.types.clear();
    grass.types.add(Types.Grass);

    pansage.setHealth(Math.floor(pansage.checkStat(Stats.HP, 0) * 0.6));
    plain.attack(pansage, Moves.Tackle, 60, Types.Normal, MoveCategories.Physical, 0);

    expect(plain.status[Statuses.Seeding]).toBeTruthy();

    // A Grass type shrugs a seed off however it arrives, the same way
    // a Fire type shrugs off an Ember Tuft
    expect(grass.status[Statuses.Seeding]).toBeFalsy();
  });

  it('traps every enemy in a whirlpool instead, which costs them as it runs', () => {
    const { battle, teamA, teamB } = createBattle();
    const panpour = createUnit(battle, teamA);
    const near = createUnit(battle, teamB);
    const far = createUnit(battle, teamB);

    panpour.addAbility(Abilities.GeyserTail);
    panpour.enter();
    near.enter();
    far.enter();

    panpour.setHealth(Math.floor(panpour.checkStat(Stats.HP, 0) * 0.6));
    near.attack(panpour, Moves.Tackle, 60, Types.Normal, MoveCategories.Physical, 0);

    expect(near.status[Statuses.Trapped]).toBeTruthy();
    expect(far.status[Statuses.Trapped]).toBeTruthy();

    // The trap keeps costing, which is what a burn and a seed do too
    const whole = far.health;

    battle.tick(turns(1));
    expect(far.health).toBeLessThan(whole);
  });
});

describe('the desert families', () => {
  it('bites harder on a throat it already has hold of', () => {
    const { battle, teamA, teamB } = createBattle();
    const croc = createUnit(battle, teamA);
    const held = createUnit(battle, teamB);
    const fresh = createUnit(battle, teamB);

    pinRandom(battle, 1);
    croc.addAbility(Abilities.DeathRoll);
    croc.enter();
    held.enter();
    fresh.enter();

    // The first bite on each is worth the ordinary amount
    const first = dealDamage(croc, held, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);
    const other = dealDamage(croc, fresh, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);

    expect(first).toBeCloseTo(other, 0);

    const second = dealDamage(croc, held, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);

    expect(second / first).toBeCloseTo(DEATH_ROLL_SCALE, 1);
  });

  it('still lands a quarter of a move that missed', () => {
    const { battle, teamA, teamB } = createBattle();
    const doll = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    doll.addAbility(Abilities.GlancingBlow);
    doll.enter();
    plain.enter();
    foe.enter();

    // What the same move is worth when it lands, off a unit without it
    const landed = dealDamage(plain, foe, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);
    const whole = foe.health;

    battle.emit(BattleEvents.UnitTriggerMoveMissed, {
      id: 'UnitTriggerMoveMissed',
      disabled: false,
      parent: {
        id: 'UnitTriggerMove',
        disabled: false,
        source: doll,
        move: Moves.Tackle,
        target: { type: MoveTargetType.Unit, unit: foe },
        steps: 0,
      },
    });

    const glanced = whole - foe.health;

    expect(glanced).toBeGreaterThan(0);
    expect(glanced / landed).toBeCloseTo(GLANCING_BLOW_FRACTION, 1);

    // Somebody without it loses nothing to a miss
    const before = foe.health;

    battle.emit(BattleEvents.UnitTriggerMoveMissed, {
      id: 'UnitTriggerMoveMissed',
      disabled: false,
      parent: {
        id: 'UnitTriggerMove',
        disabled: false,
        source: plain,
        move: Moves.Tackle,
        target: { type: MoveTargetType.Unit, unit: foe },
        steps: 0,
      },
    });

    expect(foe.health).toBe(before);
  });

  it('is at its best under a sky doing nothing, and drinks while it is', () => {
    const { battle, teamA, teamB } = createBattle();
    const cactus = createUnit(battle, teamA);
    const plain = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    cactus.addAbility(Abilities.DrySpell);
    cactus.enter();
    plain.enter();
    foe.enter();

    expect(
      resolveAttackDamage(battle, cactus, foe) / resolveAttackDamage(battle, plain, foe),
    ).toBeCloseTo(DRY_SPELL_SCALE, 2);

    cactus.setHealth(Math.floor(cactus.checkStat(Stats.HP, 0) / 2));

    const hurt = cactus.health;

    act(battle, cactus);
    expect(cactus.health).toBeGreaterThan(hurt);
  });

  it('lets the slab take a fixed share of it before any of it lands', () => {
    const { battle, teamA, teamB } = createBattle();
    const crustle = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    crustle.addAbility(Abilities.Slab);
    crustle.enter();
    foe.enter();

    const whole = crustle.health;
    const slab = crustle.checkStat(Stats.HP, 0) * SLAB_SHARE;

    // The slab is a pool, so a small hit is taken whole by the rock
    foe.damage({ type: EffectType.None }, crustle, slab / 2, 0);
    expect(crustle.health).toBe(whole);

    // The rest of the slab goes, and what is left over reaches Crustle
    foe.damage({ type: EffectType.None }, crustle, slab, 0);
    expect(whole - crustle.health).toBeCloseTo(slab / 2, 0);
  });

  it('sits a Darmanitan down below half and stands it back up above', () => {
    const { battle, teamA, teamB } = createBattle();
    const darmanitan = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    darmanitan.setSpecies(Species.Darmanitan);
    darmanitan.setHealth(darmanitan.checkStat(Stats.HP, 0));
    darmanitan.addAbility(Abilities.ZenMode);
    darmanitan.enter();
    foe.enter();

    expect(darmanitan.species).toBe(Species.Darmanitan);

    foe.damage({ type: EffectType.None }, darmanitan, darmanitan.health * 0.6, 0);

    expect(darmanitan.species).toBe(Species.DarmanitanZen);
    // The shape brings its own stats and its second type with it
    expect(darmanitan.types.has(Types.Psychic)).toBe(true);

    darmanitan.heal({ type: EffectType.None }, darmanitan, darmanitan.checkStat(Stats.HP, 0), 0);

    expect(darmanitan.species).toBe(Species.Darmanitan);
    expect(darmanitan.types.has(Types.Psychic)).toBe(false);
  });
});

describe('the old city and the back alleys', () => {
  it('hits harder for each teammate still standing with it', () => {
    const { battle, teamA, teamB } = createBattle();
    const scrafty = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    scrafty.addAbility(Abilities.GangUp);
    scrafty.enter();
    mate.enter();
    foe.enter();

    const backed = resolveAttackDamage(battle, scrafty, foe);

    foe.attack(mate, Moves.Tackle, 900, Types.Normal, MoveCategories.Physical, 0);
    expect(mate.alive).toBe(false);

    const alone = resolveAttackDamage(battle, scrafty, foe);

    expect(backed / alone).toBeCloseTo(1 + GANG_UP_STEP, 2);
  });

  it('keeps hazards off its own ground and sweeps what is already there', () => {
    const { battle, teamA, teamB } = createBattle();
    const sigilyph = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    foe.enter();

    const cause = { type: EffectType.None } as const;

    // Down before the guardian takes the field
    teamA.addStatus(TeamStatuses.Spikes, cause);
    expect(teamA.status[TeamStatuses.Spikes]).toBeTruthy();

    sigilyph.addAbility(Abilities.WardCircle);
    sigilyph.enter();

    expect(teamA.status[TeamStatuses.Spikes]).toBeFalsy();

    // And nothing may be laid while it stands
    teamA.addStatus(TeamStatuses.ToxicSpikes, cause);
    expect(teamA.status[TeamStatuses.ToxicSpikes]).toBeFalsy();

    // The enemy side is untouched
    teamB.addStatus(TeamStatuses.Spikes, cause);
    expect(teamB.status[TeamStatuses.Spikes]).toBeTruthy();
  });

  it('takes 2 stages of its best stat off whoever finished a teammate', () => {
    const { battle, teamA, teamB } = createBattle();
    const yamask = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const killer = createUnit(battle, teamB);

    yamask.addAbility(Abilities.DeathMask);
    yamask.enter();
    mate.enter();
    killer.enter();

    // Attack is its highest, so that is what the mask takes
    killer.setStat(StatsKind.Base, Stats.Attack, 200);
    killer.attack(mate, Moves.Tackle, 900, Types.Normal, MoveCategories.Physical, 0);

    expect(mate.alive).toBe(false);
    expect(killer.stages[Stages.Attack]).toBe(-DEATH_MASK_STAGES);
  });

  it('drops Toxic Spikes on the enemy side as it turns up', () => {
    const { battle, teamA, teamB } = createBattle();
    const trubbish = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    foe.enter();
    trubbish.addAbility(Abilities.Litterbug);
    trubbish.enter();
    battle.tick(turns(1));

    expect(teamB.status[TeamStatuses.ToxicSpikes]).toBeTruthy();
    expect(teamA.status[TeamStatuses.ToxicSpikes]).toBeFalsy();
  });

  it('spreads Mummy onto whoever touches it, in place of what they had', () => {
    const { battle, teamA, teamB } = createBattle();
    const yamask = createUnit(battle, teamA);
    const toucher = createUnit(battle, teamB);

    yamask.addAbility(Abilities.Mummy);
    toucher.addAbility(Abilities.Guts);
    yamask.enter();
    toucher.enter();

    toucher.attack(yamask, Moves.Tackle, 10, Types.Normal, MoveCategories.Physical, 0);

    expect(toucher.hasAbility(Abilities.Mummy)).toBe(true);
    expect(toucher.hasAbility(Abilities.Guts)).toBe(false);
  });

  it('marks whoever reaches into the coffin to go down with it', () => {
    const { battle, teamA, teamB } = createBattle();
    const cofagrigus = createUnit(battle, teamA);
    const robber = createUnit(battle, teamB);

    cofagrigus.addAbility(Abilities.PerishBody);
    cofagrigus.enter();
    robber.enter();

    robber.attack(cofagrigus, Moves.Tackle, 10, Types.Normal, MoveCategories.Physical, 0);

    expect(robber.status[Statuses.Perishing]).toBeTruthy();
    expect(cofagrigus.status[Statuses.Perishing]).toBeTruthy();
  });
});

describe('what Route 5 holds', () => {
  it('lets the first super effective blow pass through it, once a fight', () => {
    const { battle, teamA, teamB } = createBattle();
    const zorua = createUnit(battle, teamA, [Types.Grass]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    zorua.addAbility(Abilities.Bluff);
    zorua.enter();
    foe.enter();

    const whole = zorua.health;

    // Fire into Grass is super effective, so the trick answers it
    foe.attack(zorua, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);
    expect(zorua.health).toBe(whole);

    // Spent: the next one lands
    foe.attack(zorua, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);
    expect(zorua.health).toBeLessThan(whole);
  });

  it('does not spend the bluff on a blow that was not super effective', () => {
    const { battle, teamA, teamB } = createBattle();
    const zorua = createUnit(battle, teamA, [Types.Grass]);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    zorua.addAbility(Abilities.Bluff);
    zorua.enter();
    foe.enter();

    foe.attack(zorua, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);

    const hurt = zorua.health;

    expect(hurt).toBeLessThan(zorua.checkStat(Stats.HP, 0));

    // Still there for the one it is meant for
    foe.attack(zorua, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);
    expect(zorua.health).toBe(hurt);
  });

  it('sweeps both sides of the field as it arrives', () => {
    const { battle, teamA, teamB } = createBattle();
    const cinccino = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const cause = { type: EffectType.None } as const;

    foe.enter();
    teamA.addStatus(TeamStatuses.StealthRock, cause);
    teamB.addStatus(TeamStatuses.Spikes, cause);

    cinccino.addAbility(Abilities.CleanSweep);
    cinccino.enter();

    expect(teamA.status[TeamStatuses.StealthRock]).toBeFalsy();
    expect(teamB.status[TeamStatuses.Spikes]).toBeFalsy();
  });

  it('has the pair aim what its team throws and spread what its team takes', () => {
    const { battle, teamA, teamB } = createBattle();
    const gothita = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const failing = createUnit(battle, teamB);
    const whole = createUnit(battle, teamB);

    pinRandom(battle, 1);
    gothita.addAbility(Abilities.Fixation);
    gothita.enter();
    mate.enter();
    failing.enter();
    whole.enter();
    failing.setHealth(Math.floor(failing.checkStat(Stats.HP, 0) / 4));

    const onFailing = resolveAttackDamage(battle, mate, failing);
    const onWhole = resolveAttackDamage(battle, mate, whole);

    expect(onFailing / onWhole).toBeCloseTo(FIXATION_SCALE, 2);
  });

  it('takes a quarter of what is aimed at a teammate', () => {
    const { battle, teamA, teamB } = createBattle();
    const solosis = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    solosis.addAbility(Abilities.Division);
    solosis.enter();
    mate.enter();
    foe.enter();

    const cellWhole = solosis.health;
    const mateWhole = mate.health;

    foe.damage({ type: EffectType.None }, mate, 100, 0);

    const shared = cellWhole - solosis.health;

    expect(shared).toBeCloseTo(100 * DIVISION_SHARE, 0);
    expect(mateWhole - mate.health).toBeCloseTo(100 - shared, 0);
  });

  it('dresses a Zorua as the teammate at the back until something lands', () => {
    const { battle, teamA, teamB } = createBattle();
    const zorua = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    zorua.setSpecies(Species.Zorua);
    zorua.setHealth(zorua.checkStat(Stats.HP, 0));
    mate.setSpecies(Species.Minccino);
    mate.setHealth(mate.checkStat(Stats.HP, 0));
    zorua.addAbility(Abilities.Illusion);
    mate.enter();
    zorua.enter();
    foe.enter();

    expect(zorua.appearance).toBe(Species.Minccino);
    // What it is never moved, only what it looks like
    expect(zorua.species).toBe(Species.Zorua);

    foe.attack(zorua, Moves.Tackle, 10, Types.Normal, MoveCategories.Physical, 0);

    expect(zorua.appearance).toBe(Species.Zorua);
  });
});

describe('the charged cave', () => {
  it('feeds on any bolt that lands, whoever threw it', () => {
    const { battle, teamA, teamB } = createBattle();
    const joltik = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    joltik.addAbility(Abilities.StaticFeed);
    joltik.enter();
    mate.enter();
    foe.enter();
    joltik.setHealth(Math.floor(joltik.checkStat(Stats.HP, 0) / 2));

    const hurt = joltik.health;

    // A bolt between two other units still counts
    foe.attack(mate, Moves.ThunderShock, 40, Types.Electric, MoveCategories.Special, 0);
    expect(joltik.health).toBeGreaterThan(hurt);

    const fed = joltik.health;

    // Anything that is not Electric feeds it nothing
    foe.attack(mate, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);
    expect(joltik.health).toBe(fed);
  });

  it('puts the spikes between a contact move and its teammates', () => {
    const { battle, teamA, teamB } = createBattle();
    const ferroseed = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);
    const spare = createUnit(battle, teamB);

    pinRandom(battle, 1);
    ferroseed.addAbility(Abilities.ThornCurtain);
    ferroseed.enter();
    mate.enter();
    foe.enter();
    spare.enter();

    const covered = dealDamage(foe, mate, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);
    const bare = dealDamage(foe, spare, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical);

    expect(covered / bare).toBeCloseTo(THORN_CURTAIN_SCALE, 1);
  });

  it('is worth nothing to a gear with nothing to turn against', () => {
    const { battle, teamA, teamB } = createBattle();
    const klink = createUnit(battle, teamA);
    const mate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    pinRandom(battle, 1);
    klink.addAbility(Abilities.Meshing);
    klink.enter();
    mate.enter();
    foe.enter();

    const meshedOut = resolveAttackDamage(battle, klink, foe);
    const meshedIn = resolveAttackDamage(battle, foe, klink);

    foe.attack(mate, Moves.Tackle, 900, Types.Normal, MoveCategories.Physical, 0);
    expect(mate.alive).toBe(false);

    const aloneOut = resolveAttackDamage(battle, klink, foe);
    const aloneIn = resolveAttackDamage(battle, foe, klink);

    expect(meshedOut / aloneOut).toBeCloseTo(MESHING_DEALT, 2);
    expect(meshedIn / aloneIn).toBeCloseTo(MESHING_TAKEN, 2);
  });

  it('answers a touch with the spikes, the way Rough Skin does', () => {
    const { battle, teamA, teamB } = createBattle();
    const ferroseed = createUnit(battle, teamA);
    const toucher = createUnit(battle, teamB);

    ferroseed.addAbility(Abilities.IronBarbs);
    ferroseed.enter();
    toucher.enter();

    const whole = toucher.health;

    toucher.attack(ferroseed, Moves.Tackle, 10, Types.Normal, MoveCategories.Physical, 0);

    expect(whole - toucher.health).toBeCloseTo(
      toucher.checkStat(Stats.HP, 0) * CONTACT_RECOIL_FRACTION,
      0,
    );
  });
});
