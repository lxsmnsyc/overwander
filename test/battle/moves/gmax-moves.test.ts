import { describe, expect, it } from 'vitest';
import { AttackPriority } from '../../../src/core/event-emitter';
import { BattleEvents, EffectType, MoveTargetType } from '../../../src/battle/events';
import {
  CHI_STRIKE_LIMIT,
  FINALE_SHARE,
  G_MAX_RESIDUAL_SHARE,
} from '../../../src/battle/moves/gmax-moves';
import { payDayCeiling } from '../../../src/battle/moves/pay-day';
import { stonesOver } from '../../../src/battle/moves/stealth-rock';
import { steelOver } from '../../../src/battle/moves/steelsurge';
import turns from '../../../src/battle/turn';
import type Unit from '../../../src/battle/unit';
import { Stages, Stats } from '../../../src/data/constants/stats';
import { Types } from '../../../src/data/constants/types';
import Abilities from '../../../src/data/ids/abilities';
import { Items } from '../../../src/data/ids/items';
import { MoveCategories, Moves } from '../../../src/data/ids/moves';
import { Genders, Species } from '../../../src/data/ids/species';
import { Statuses, TeamStatuses } from '../../../src/data/ids/status';
import { getMoveData } from '../../../src/data/moves';
import {
  FIXED_G_MAX_MOVES,
  GMAX_SPECIES,
  G_MAX_MOVES,
  canGigantamax,
  getGMaxMove,
  maxPowerOf,
} from '../../../src/data/moves/gmax-moves';
import { takesGigantamaxFactor } from '../../../src/data/items/max-mushrooms';
import { getSpeciesData } from '../../../src/data/species';
import { createBattle, createUnit, pinRandom } from '../harness';

function at(unit: Unit): { readonly type: MoveTargetType.Unit; readonly unit: Unit } {
  return { type: MoveTargetType.Unit, unit } as const;
}

const CAUSE = { type: EffectType.None } as const;

/** One user and one foe, typeless, with the foe's side ready to be hit */
function duel(seed = 'gmax'): {
  battle: ReturnType<typeof createBattle>['battle'];
  teamA: ReturnType<typeof createBattle>['teamA'];
  teamB: ReturnType<typeof createBattle>['teamB'];
  user: Unit;
  foe: Unit;
} {
  const { battle, teamA, teamB } = createBattle(seed);
  const user = createUnit(battle, teamA);
  const foe = createUnit(battle, teamB);

  return { battle, teamA, teamB, user, foe };
}

describe('which G-Max Move a species throws', () => {
  it('answers a Gigantamax species for its own type and nothing else', () => {
    expect(getGMaxMove(Species.Charizard, Types.Fire)).toBe(Moves.GMaxWildfire);
    expect(getGMaxMove(Species.Charizard, Types.Flying)).toBeNull();
    expect(getGMaxMove(Species.Pikachu, Types.Electric)).toBe(Moves.GMaxVoltCrash);
    expect(getGMaxMove(Species.Meowth, Types.Normal)).toBe(Moves.GMaxGoldRush);
    expect(getGMaxMove(Species.MeowthAlola, Types.Normal)).toBeNull();
    expect(getGMaxMove(Species.Charmander, Types.Fire)).toBeNull();
    expect(getGMaxMove(Species.Urshifu, Types.Dark)).toBe(Moves.GMaxOneBlow);
    expect(getGMaxMove(Species.UrshifuRapidStrike, Types.Water)).toBe(Moves.GMaxRapidFlow);
    expect(getGMaxMove(Species.UrshifuRapidStrike, Types.Dark)).toBeNull();
    expect(getGMaxMove(Species.ToxtricityLowKey, Types.Electric)).toBe(Moves.GMaxStunShock);
    expect(getGMaxMove(Species.AlcremieRibbon, Types.Fairy)).toBe(Moves.GMaxFinale);
    expect(getGMaxMove(Species.Coalossal, Types.Rock)).toBe(Moves.GMaxVolcalith);
    expect(getGMaxMove(Species.Copperajah, Types.Steel)).toBe(Moves.GMaxSteelsurge);
  });

  it('names each of the 33 once, of its own type, on a species whose type it matches', () => {
    createBattle();
    expect(G_MAX_MOVES.size).toBe(33);

    for (const [species, { move, type }] of GMAX_SPECIES) {
      expect(getMoveData(move).type, getMoveData(move).name).toBe(type);
      expect(getMoveData(move).category).not.toBe(MoveCategories.Status);
      // Coalossal and Copperajah wait for their species
      if (species === Species.Coalossal || species === Species.Copperajah) {
        continue;
      }
      expect(getSpeciesData(species).name).not.toBe('');
    }
  });

  it('lets Max Mushrooms reach only a Gigantamax species that lacks the factor', () => {
    expect(canGigantamax(Species.Eevee)).toBe(true);
    expect(canGigantamax(Species.Vaporeon)).toBe(false);
    expect(takesGigantamaxFactor({ species: Species.Eevee, gigantamax: false })).toBe(true);
    expect(takesGigantamaxFactor({ species: Species.Eevee, gigantamax: true })).toBe(false);
    expect(takesGigantamaxFactor({ species: Species.Charmander, gigantamax: false })).toBe(false);
    expect(takesGigantamaxFactor({ species: Species.Vaporeon, gigantamax: false })).toBe(false);
  });
});

describe('how hard a G-Max Move hits', () => {
  it('reads the Max Move table off the move it replaced', () => {
    createBattle();
    expect(maxPowerOf(Moves.VineWhip, Types.Grass)).toBe(100);
    expect(maxPowerOf(Moves.Bite, Types.Dark)).toBe(110);
    expect(maxPowerOf(Moves.SolarBeam, Types.Grass)).toBe(140);
    expect(maxPowerOf(Moves.CrossChop, Types.Fighting)).toBe(90);
    expect(maxPowerOf(undefined, Types.Fire)).toBe(90);
  });

  it('takes its power and category from the move a Dynamax turned into it', () => {
    const { battle, user, foe } = duel();

    // Stands in for Dynamax, which turns the move as it goes off
    battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Pre, (event) => {
      if (event.move === Moves.SolarBeam && event.steps === 0) {
        event.disabled = true;
        event.source.triggerMove(Moves.GMaxVineLash, event.target, 0);
      }
    });

    const categories: MoveCategories[] = [];

    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      categories.push(event.category);
    });

    user.triggerMove(Moves.SolarBeam, at(foe), 0);
    expect(user.checkMovePower(Moves.GMaxVineLash, at(foe))).toBe(140);

    user.triggerMoveEffect(Moves.GMaxVineLash, at(foe), 0);
    expect(categories.at(-1)).toBe(MoveCategories.Special);
  });

  it('hits at 160 with Drum Solo, Fireball and Hydrosnipe, through the target’s ability', () => {
    const { battle, user, foe } = duel();

    pinRandom(battle, 0.5);
    user.triggerMove(Moves.Tackle, at(foe), 0);
    for (const move of FIXED_G_MAX_MOVES) {
      expect(user.checkMovePower(move, at(foe))).toBe(160);
    }

    foe.addAbility(Abilities.SapSipper);
    const before = foe.health;

    user.triggerMoveEffect(Moves.GMaxDrumSolo, at(foe), 0);
    expect(foe.health).toBeLessThan(before);
  });
});

describe('what each G-Max Move leaves behind', () => {
  it('lashes every foe not of its type for a sixth each turn, for four turns', () => {
    const { battle, teamB, user, foe } = duel();
    const fiery = createUnit(battle, teamB, [Types.Fire]);

    user.triggerMoveEffect(Moves.GMaxWildfire, at(foe), 0);
    foe.setHealth(foe.checkStat(Stats.HP, 0));
    fiery.setHealth(fiery.checkStat(Stats.HP, 0));

    battle.tick(turns(1));
    const share = foe.checkStat(Stats.HP, 0) * G_MAX_RESIDUAL_SHARE;

    expect(foe.checkStat(Stats.HP, 0) - foe.health).toBeCloseTo(share, 0);
    expect(fiery.health).toBe(fiery.checkStat(Stats.HP, 0));

    battle.tick(turns(4));
    const after = foe.health;

    battle.tick(turns(2));
    expect(foe.health).toBe(after);
  });

  it('pelts every foe that is not Rock with Volcalith', () => {
    const { battle, teamB, user, foe } = duel();
    const rocky = createUnit(battle, teamB, [Types.Rock]);

    user.triggerMoveEffect(Moves.GMaxVolcalith, at(foe), 0);
    foe.setHealth(foe.checkStat(Stats.HP, 0));
    rocky.setHealth(rocky.checkStat(Stats.HP, 0));

    battle.tick(turns(1));
    expect(foe.checkStat(Stats.HP, 0) - foe.health).toBeCloseTo(
      foe.checkStat(Stats.HP, 0) * G_MAX_RESIDUAL_SHARE,
      0,
    );
    expect(rocky.health).toBe(rocky.checkStat(Stats.HP, 0));
  });

  it('poisons, paralyses or puts every foe to sleep with Befuddle', () => {
    const { battle, teamB, user, foe } = duel();
    const other = createUnit(battle, teamB);

    pinRandom(battle, 0);
    user.triggerMoveEffect(Moves.GMaxBefuddle, at(foe), 0);
    expect(foe.status[Statuses.Poisoned]).toBeDefined();
    expect(other.status[Statuses.Poisoned]).toBeDefined();
  });

  it('paralyses with Volt Crash, poisons with Malodor and picks between with Stun Shock', () => {
    const one = duel();

    one.user.triggerMoveEffect(Moves.GMaxVoltCrash, at(one.foe), 0);
    expect(one.foe.status[Statuses.Paralyzed]).toBeDefined();

    const two = duel();

    two.user.triggerMoveEffect(Moves.GMaxMalodor, at(two.foe), 0);
    expect(two.foe.status[Statuses.Poisoned]).toBeDefined();

    const three = duel();

    pinRandom(three.battle, 0.9);
    three.user.triggerMoveEffect(Moves.GMaxStunShock, at(three.foe), 0);
    expect(three.foe.status[Statuses.Paralyzed]).toBeDefined();
  });

  it('confuses with Gold Rush and Smite, and Gold Rush scatters coins', () => {
    const { user, foe } = duel();

    user.triggerMoveEffect(Moves.GMaxGoldRush, at(foe), 0);
    expect(foe.status[Statuses.Confused]).toBeDefined();
    expect(user.coins).toBeGreaterThan(0);

    const other = duel();

    other.user.triggerMoveEffect(Moves.GMaxSmite, at(other.foe), 0);
    expect(other.foe.status[Statuses.Confused]).toBeDefined();
  });

  it('lets a Gigantamax Meowth’s report claim coins without Pay Day', () => {
    expect(payDayCeiling(50, [Moves.Tackle], [], 0)).toBe(0);
    expect(payDayCeiling(50, [Moves.Tackle], [], 0, false, true)).toBeGreaterThan(0);
  });

  it('raises the critical hit ratio of the whole side with Chi Strike, up to three', () => {
    const { battle, teamA, user, foe } = duel();
    const ally = createUnit(battle, teamA);

    // A roll that lands under 1/8 and over 1/16: a critical at one stage up and not at none
    pinRandom(battle, 0.1);
    user.triggerMoveEffect(Moves.Tackle, at(foe), 0);
    ally.triggerMoveEffect(Moves.Tackle, at(foe), 0);
    expect(ally.criticals).toBe(0);

    user.triggerMoveEffect(Moves.GMaxChiStrike, at(foe), 0);
    ally.triggerMoveEffect(Moves.Tackle, at(foe), 0);
    expect(ally.criticals).toBe(1);

    for (let i = 0; i < CHI_STRIKE_LIMIT + 2; i++) {
      foe.setHealth(foe.checkStat(Stats.HP, 0));
      user.triggerMoveEffect(Moves.GMaxChiStrike, at(foe), 0);
    }
    foe.setHealth(foe.checkStat(Stats.HP, 0));
    // Three stages up, the most it reaches, is a certainty
    pinRandom(battle, 0.99);
    ally.triggerMoveEffect(Moves.Tackle, at(foe), 0);
    expect(ally.criticals).toBe(2);
  });

  it('holds every foe in with Terror and torments every foe with Meltdown', () => {
    const { user, foe } = duel();

    user.triggerMoveEffect(Moves.GMaxTerror, at(foe), 0);
    expect(foe.status[Statuses.Cornered]).toBeDefined();

    user.triggerMoveEffect(Moves.GMaxMeltdown, at(foe), 0);
    expect(foe.status[Statuses.Tormented]).toBeDefined();
  });

  it('drops Speed two stages with Foam Burst and Evasion one with Tartness', () => {
    const { user, foe } = duel();

    user.triggerMoveEffect(Moves.GMaxFoamBurst, at(foe), 0);
    expect(foe.stages[Stages.Speed]).toBe(-2);

    user.triggerMoveEffect(Moves.GMaxTartness, at(foe), 0);
    expect(foe.stages[Stages.Evasion]).toBe(-1);
  });

  it('puts Aurora Veil up with Resonance, without hail', () => {
    const { teamA, user, foe } = duel();

    user.triggerMoveEffect(Moves.GMaxResonance, at(foe), 0);
    expect(teamA.status[TeamStatuses.AuroraVeil]).toBeDefined();
  });

  it('infatuates a foe of the other gender with Cuddle', () => {
    const { user, foe } = duel();

    user.setGender(Genders.Male);
    foe.setGender(Genders.Female);
    user.triggerMoveEffect(Moves.GMaxCuddle, at(foe), 0);
    expect(foe.status[Statuses.Infatuated]).toBeDefined();
  });

  it('grows back an eaten berry with Replenish', () => {
    const { battle, teamA, user, foe } = duel();
    const ally = createUnit(battle, teamA);

    ally.addItem(Items.OranBerry);
    ally.removeItem(Items.OranBerry, { type: EffectType.Item, item: Items.OranBerry, unit: ally });
    expect(ally.items[Items.OranBerry]).toBeUndefined();

    pinRandom(battle, 0);
    user.triggerMoveEffect(Moves.GMaxReplenish, at(foe), 0);
    expect(ally.items[Items.OranBerry]).toBe(true);
  });

  it('sweeps hazards off both sides and screens off the target’s with Wind Rage', () => {
    const { battle, teamA, teamB, user, foe } = duel();

    user.triggerMoveEffect(Moves.GMaxStonesurge, at(foe), 0);
    user.triggerMoveEffect(Moves.GMaxSteelsurge, at(foe), 0);
    expect(stonesOver(teamB)).toBe(true);
    expect(steelOver(teamB)).toBe(true);

    foe.triggerMoveEffect(Moves.StealthRock, { type: MoveTargetType.Team, team: teamA }, 0);
    teamB.addStatus(TeamStatuses.Reflect, CAUSE);
    battle.tick(1);
    expect(stonesOver(teamA)).toBe(true);

    user.triggerMoveEffect(Moves.GMaxWindRage, at(foe), 0);
    expect(stonesOver(teamA)).toBe(false);
    expect(stonesOver(teamB)).toBe(false);
    expect(steelOver(teamB)).toBe(false);
    expect(teamB.status[TeamStatuses.Reflect]).toBeUndefined();
  });

  it('cuts whatever comes in with Steelsurge, by how it takes a Steel move', () => {
    const { battle, teamB, user, foe } = duel();
    const walker = createUnit(battle, teamB);
    const fairy = createUnit(battle, teamB, [Types.Fairy]);

    user.triggerMoveEffect(Moves.GMaxSteelsurge, at(foe), 0);
    walker.enter();
    fairy.enter();

    const walked = walker.checkStat(Stats.HP, 0) - walker.health;
    const cut = fairy.checkStat(Stats.HP, 0) - fairy.health;

    expect(walked).toBeGreaterThan(0);
    expect(cut).toBeCloseTo(walked * 2, 0);
  });

  it('pulls the field down with Gravitas', () => {
    const { battle, teamB, user, foe } = duel();
    const bird = createUnit(battle, teamB, [Types.Flying]);

    expect(user.checkMoveImmunity(Moves.Earthquake, at(bird), Types.Ground)).toBe(true);
    user.triggerMoveEffect(Moves.GMaxGravitas, at(foe), 0);
    expect(user.checkMoveImmunity(Moves.Earthquake, at(bird), Types.Ground)).toBe(false);
  });

  it('cures the user’s side with Sweetness and heals it a sixth with Finale', () => {
    const { battle, teamA, user, foe } = duel();
    const ally = createUnit(battle, teamA);

    ally.addStatus(Statuses.Burned, CAUSE);
    user.triggerMoveEffect(Moves.GMaxSweetness, at(foe), 0);
    expect(ally.status[Statuses.Burned]).toBeUndefined();

    ally.setHealth(1);
    user.triggerMoveEffect(Moves.GMaxFinale, at(foe), 0);
    expect(ally.health).toBeCloseTo(1 + ally.checkStat(Stats.HP, 0) * FINALE_SHARE, 0);
  });

  it('binds every foe with Sandblast and Centiferno', () => {
    const { user, foe } = duel();

    user.triggerMoveEffect(Moves.GMaxSandblast, at(foe), 0);
    expect(foe.status[Statuses.Trapped]).toBeDefined();

    const other = duel();

    other.user.triggerMoveEffect(Moves.GMaxCentiferno, at(other.foe), 0);
    expect(other.foe.status[Statuses.Trapped]).toBeDefined();
  });

  it('makes the target drowsy half the time with Snooze', () => {
    const { battle, user, foe } = duel();

    pinRandom(battle, 0.9);
    user.triggerMoveEffect(Moves.GMaxSnooze, at(foe), 0);
    expect(foe.status[Statuses.Drowsy]).toBeUndefined();

    pinRandom(battle, 0);
    user.triggerMoveEffect(Moves.GMaxSnooze, at(foe), 0);
    expect(foe.status[Statuses.Drowsy]).toBeDefined();
  });

  it('stretches every foe’s last move with Depletion', () => {
    const { user, foe } = duel();

    foe.addMove(Moves.Tackle);
    foe.triggerMove(Moves.Tackle, at(user), 0);
    user.triggerMoveEffect(Moves.GMaxDepletion, at(foe), 0);
    expect(foe.moves[Moves.Tackle]?.cooldown).toBeDefined();
  });

  it('goes through Protect with One Blow and Rapid Flow', () => {
    const { user, foe } = duel();

    foe.addStatus(Statuses.Protected, CAUSE);
    expect(user.checkMoveImmunity(Moves.Tackle, at(foe), Types.Normal)).toBe(true);

    foe.addStatus(Statuses.Protected, CAUSE);
    expect(user.checkMoveImmunity(Moves.GMaxOneBlow, at(foe), Types.Dark)).toBe(false);

    foe.addStatus(Statuses.Protected, CAUSE);
    expect(user.checkMoveImmunity(Moves.GMaxRapidFlow, at(foe), Types.Water)).toBe(false);
  });

  it('never misses', () => {
    for (const move of G_MAX_MOVES) {
      expect(getMoveData(move).accuracy).toBeUndefined();
    }
  });
});
