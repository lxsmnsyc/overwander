import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { asCatchSnapshot } from '../../src/auth/catch-snapshot';
import {
  BALM_EVERY,
  BALM_SHARE,
  NOBLE_BURST_EVERY,
  NOBLE_BURST_WINDUP,
  NOBLE_STAGGER_DAMAGE,
  NOBLE_THRESHOLDS,
  balmsLeft,
  burstEffectOf,
} from '../../src/battle/abilities/noble';
import { PROTECTED_ABILITIES } from '../../src/battle/abilities/special';
import { BattleEvents, EffectType, MoveTargetType } from '../../src/battle/events';
import { stonesOver } from '../../src/battle/moves/stealth-rock';
import { STAGGER_DURATION } from '../../src/battle/status/staggered';
import turns from '../../src/battle/turn';
import type Unit from '../../src/battle/unit';
import { AttackPriority, EventPriority } from '../../src/core/event-emitter';
import registerGameData from '../../src/data';
import { getAbilityData } from '../../src/data/abilities';
import { SPECIAL_ABILITIES } from '../../src/data/constants/slots';
import { Stages, Stats } from '../../src/data/constants/stats';
import { Types } from '../../src/data/constants/types';
import Abilities from '../../src/data/ids/abilities';
import { MoveCategories, Moves } from '../../src/data/ids/moves';
import { Items } from '../../src/data/ids/items';
import { Species } from '../../src/data/ids/species';
import { Statuses, TeamStatuses } from '../../src/data/ids/status';
import { CANON_BURSTS, FRENZY_MOVES, getNobleBurst } from '../../src/data/moves/frenzy-moves';
import { BOSS_ALLIANCE, PLAYER_ALLIANCE, createRaidBossTeam } from '../../src/overworld/raid';
import { type RaidBattle, countDefeated, createRaidBattle } from '../../src/overworld/raid-battle';

beforeAll(() => {
  registerGameData();
  // Starting a fight starts its frame clock, which a test drives by hand
  vi.stubGlobal('requestAnimationFrame', () => 0);
  vi.stubGlobal('cancelAnimationFrame', () => undefined);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

interface NobleRaid extends RaidBattle {
  noble: Unit;
  player: Unit;
}

const TRAIT = 0x13579bdf;

/** A Noble against one party of one, its lead packing `balms` */
function nobleRaid(species: Species, balms = 0): NobleRaid {
  const boss = createRaidBossTeam(species, TRAIT, false, false, false, false, true);
  const built = createRaidBattle('noble-seed', [
    { player: '', alliance: BOSS_ALLIANCE, catches: boss },
    {
      player: 'trainer',
      alliance: PLAYER_ALLIANCE,
      catches: [
        {
          ...createRaidBossTeam(Species.Snorlax, TRAIT, false, false)[0],
          caught: 'mine',
          // A raid-sized pool of its own, so it lives through a burst
          // and shows what the burst left on it
          abilities: [Abilities.TotemAlly],
          ...(balms > 0 ? { balms } : {}),
        },
      ],
    },
  ]);

  built.battle.initialize();
  built.battle.start();

  const noble = [...(built.units.get(BOSS_ALLIANCE) ?? [])][0];
  const player = [...(built.units.get(PLAYER_ALLIANCE) ?? [])][0];

  return { ...built, noble, player };
}

/** Drain the Noble's Frenzy to a share of it */
function hitTo(raid: NobleRaid, share: number): void {
  const hit = { type: EffectType.Move, move: Moves.Tackle, unit: raid.player } as const;
  const target = Math.floor(raid.noble.checkStat(Stats.HP, 0) * share);

  raid.player.damage(hit, raid.noble, raid.noble.health - target, 0);
}

/** Tick until the test holds, a tenth of a second at a time, answering how long that took */
function tickUntil(raid: NobleRaid, test: () => boolean, limit = turns(60)): number {
  let spent = 0;

  for (; spent < limit && !test(); spent += 100) {
    raid.battle.tick(100);
  }
  return spent;
}

/** Every Balm that landed on the Noble, by how much it soothed */
function balmsOn(raid: NobleRaid): number[] {
  const soothed: number[] = [];

  raid.battle.on(BattleEvents.UnitDamage, AttackPriority.Cleanup, (event) => {
    if (event.cause.type === EffectType.Item && event.cause.item === Items.Balm) {
      soothed.push(event.value);
    }
  });
  return soothed;
}

/** One blow of a burst on the player, worked out the way a landing would */
function burstOn(raid: NobleRaid, move: Moves): void {
  const target = { type: MoveTargetType.Unit, unit: raid.player } as const;

  raid.noble.attack(
    raid.player,
    move,
    raid.noble.checkMovePower(move, target) ?? 100,
    raid.noble.checkMoveType(move, target),
    MoveCategories.Physical,
    0,
  );
}

describe('the Noble mark', () => {
  it('is a protected, special mark nobody catches', () => {
    expect(PROTECTED_ABILITIES.has(Abilities.Noble)).toBe(true);
    expect(SPECIAL_ABILITIES.has(Abilities.Noble)).toBe(true);
    expect(getAbilityData(Abilities.Noble).description).toMatch(/\.$/);
  });

  it('stages the Noble as a boss carrying its own burst', () => {
    const { noble } = nobleRaid(Species.Kleavor);

    expect(noble.hasAbility(Abilities.Boss)).toBe(true);
    expect(noble.hasAbility(Abilities.Noble)).toBe(true);
    expect(noble.moves[Moves.FrenzyStoneAxe]).toBeDefined();
  });

  it('gives each canon Noble a burst of its own and every other the plain one', () => {
    expect(new Set(CANON_BURSTS.values()).size).toBe(5);
    expect(getNobleBurst(Species.AvaluggHisui)).toBe(Moves.FrenzyIceberg);
    expect(getNobleBurst(Species.Charizard)).toBe(Moves.FrenzyBurst);
  });
});

describe('the Frenzy gauge', () => {
  it('never lets the Noble faint: an empty Frenzy calms it off the field', () => {
    const raid = nobleRaid(Species.Kleavor);
    let fainted = false;

    raid.battle.on(BattleEvents.UnitFaints, EventPriority.Post, () => {
      fainted = true;
    });
    hitTo(raid, 0);

    expect(fainted).toBe(false);
    expect(raid.noble.health).toBe(0);
    expect(raid.noble.team.units.has(raid.noble)).toBe(false);
    // Still counted as the side the party put down
    expect(countDefeated(raid, 'trainer')).toBe(1);

    tickUntil(raid, () => raid.battle.settled);
    expect(raid.battle.winner).toBe(raid.alliances.get(PLAYER_ALLIANCE));
  });

  it('staggers at each threshold, unable to act', () => {
    const raid = nobleRaid(Species.Kleavor);

    for (const share of NOBLE_THRESHOLDS) {
      hitTo(raid, share - 0.01);
      expect(raid.noble.status[Statuses.Staggered], String(share)).toBeDefined();
      expect(raid.noble.checkCanCast(Moves.Attack, { type: MoveTargetType.None })).toBe(false);

      raid.battle.tick(STAGGER_DURATION - 200);
      expect(raid.noble.status[Statuses.Staggered], String(share)).toBeDefined();
      raid.battle.tick(300);
      expect(raid.noble.status[Statuses.Staggered]).toBeUndefined();
    }
  });

  it('reels on through a second stagger landing on the first', () => {
    const raid = nobleRaid(Species.Kleavor);

    hitTo(raid, NOBLE_THRESHOLDS[0] - 0.01);
    raid.battle.tick(STAGGER_DURATION / 2);
    hitTo(raid, NOBLE_THRESHOLDS[1] - 0.01);
    raid.battle.tick(STAGGER_DURATION / 2 + 200);

    expect(raid.noble.status[Statuses.Staggered]).toBeDefined();
  });

  it('takes the stagger damage from every attack while staggered', () => {
    const raid = nobleRaid(Species.Kleavor);
    const taken: number[] = [];

    raid.battle.random = () => 0.5;
    raid.battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      taken.push(event.value);
    });

    const blow = (): void => {
      raid.player.attack(raid.noble, Moves.Tackle, 40, Types.Normal, MoveCategories.Physical, 0);
    };

    blow();
    hitTo(raid, NOBLE_THRESHOLDS[0] - 0.01);
    blow();

    expect(taken[1] / taken[0]).toBeCloseTo(NOBLE_STAGGER_DAMAGE);
  });

  it('staggers once for a blow past two thresholds, and never again on the way back up', () => {
    const raid = nobleRaid(Species.Kleavor);
    let staggers = 0;

    raid.battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
      if (event.status === Statuses.Staggered) {
        staggers += 1;
      }
    });
    hitTo(raid, 0.4);
    raid.battle.tick(STAGGER_DURATION + 100);
    raid.noble.setHealth(raid.noble.checkStat(Stats.HP, 0));
    hitTo(raid, 0.45);

    expect(staggers).toBe(1);
  });
});

describe('the Frenzy bursts', () => {
  it('telegraphs its burst on a cadence, then lands it on the party', () => {
    const raid = nobleRaid(Species.Kleavor);
    const landed: Moves[] = [];

    raid.battle.on(BattleEvents.UnitAttack, AttackPriority.Cleanup, (event) => {
      if (FRENZY_MOVES.has(event.move) && event.success) {
        landed.push(event.move);
      }
    });
    const waited = tickUntil(raid, () => raid.noble.casting?.move === Moves.FrenzyStoneAxe);
    const cast = raid.noble.casting;

    expect(cast?.move).toBe(Moves.FrenzyStoneAxe);
    expect(cast?.time.duration).toBe(NOBLE_BURST_WINDUP);
    // Not before the first cadence has run out
    expect(waited).toBeGreaterThanOrEqual(NOBLE_BURST_EVERY);
    expect(landed).toEqual([]);

    raid.battle.tick(NOBLE_BURST_WINDUP + 600);
    expect(landed).toEqual([Moves.FrenzyStoneAxe]);
  });

  it('is turned away by a guard raised during the windup', () => {
    const raid = nobleRaid(Species.Kleavor);
    const landed: boolean[] = [];

    raid.battle.on(BattleEvents.UnitAttack, AttackPriority.Cleanup, (event) => {
      if (FRENZY_MOVES.has(event.move)) {
        landed.push(event.success);
      }
    });
    tickUntil(raid, () => raid.noble.casting?.move === Moves.FrenzyStoneAxe);
    // Up late in the windup, the way a party reading it would raise it
    raid.battle.tick(1000);
    raid.player.triggerMove(
      Moves.WideGuard,
      { type: MoveTargetType.Team, team: raid.player.team },
      0,
    );
    raid.battle.tick(NOBLE_BURST_WINDUP + 600);

    expect(landed).not.toContain(true);
    expect(stonesOver(raid.player.team)).toBe(false);
  });

  it('is cut off by a stagger, and waits a whole cadence after it', () => {
    const raid = nobleRaid(Species.Kleavor);

    tickUntil(raid, () => raid.noble.casting?.move === Moves.FrenzyStoneAxe);
    hitTo(raid, NOBLE_THRESHOLDS[0] - 0.01);

    expect(raid.noble.casting).toBeUndefined();
  });

  it("leaves each canon Noble's mark on the party", () => {
    const kleavor = nobleRaid(Species.Kleavor);

    burstOn(kleavor, Moves.FrenzyStoneAxe);
    expect(stonesOver(kleavor.player.team)).toBe(true);

    const arcanine = nobleRaid(Species.ArcanineHisui);

    arcanine.battle.random = () => 0.01;
    burstOn(arcanine, Moves.FrenzyWildfire);
    expect(arcanine.player.team.status[TeamStatuses.SeaOfFire]).toBeDefined();
    expect(arcanine.player.status[Statuses.Burned]).toBeDefined();

    const lilligant = nobleRaid(Species.LilligantHisui);

    burstOn(lilligant, Moves.FrenzyPetalStorm);
    expect(lilligant.player.stages[Stages.Speed]).toBe(-1);

    const avalugg = nobleRaid(Species.AvaluggHisui);

    avalugg.battle.random = () => 0.01;
    burstOn(avalugg, Moves.FrenzyIceberg);
    expect(avalugg.player.status[Statuses.Flinched]).toBeDefined();

    const electrode = nobleRaid(Species.ElectrodeHisui);
    const before = electrode.player.health;

    burstOn(electrode, Moves.FrenzyBlast);
    expect(electrode.player.health).toBeLessThan(before);
    expect(electrode.noble.alive).toBe(true);
    expect(electrode.noble.health).toBe(electrode.noble.checkStat(Stats.HP, 0));
  });

  it('throws the plain burst in its own type, leaving what the table says', () => {
    const fire = nobleRaid(Species.Charizard);
    const target = { type: MoveTargetType.Unit, unit: fire.player } as const;

    expect(fire.noble.checkMoveType(Moves.FrenzyBurst, target)).toBe(Types.Fire);
    fire.battle.random = () => 0.01;
    burstOn(fire, Moves.FrenzyBurst);
    expect(fire.player.status[Statuses.Burned]).toBeDefined();

    const water = nobleRaid(Species.Blastoise);

    burstOn(water, Moves.FrenzyBurst);
    expect(water.player.stages[Stages.Speed]).toBe(-1);

    // Every type answers something, the table's gaps a Defense drop
    for (const type of [Types.Ground, Types.Dragon, Types.Stellar]) {
      expect(burstEffectOf(type).chance).toBeGreaterThan(0);
    }
  });
});

describe('Balms', () => {
  it('reads what a party packed off its lead', () => {
    const [lead] = createRaidBossTeam(Species.Snorlax, TRAIT, false, false);

    expect(asCatchSnapshot({ ...lead, balms: 3 }).balms).toBe(3);
    expect(asCatchSnapshot(lead).balms).toBeUndefined();
  });

  it('soothes a share of the Frenzy, one Balm every cooldown', () => {
    const raid = nobleRaid(Species.Kleavor, 3);
    const max = raid.noble.checkStat(Stats.HP, 0);
    const soothed = balmsOn(raid);

    raid.battle.tick(BALM_EVERY - 100);
    expect(soothed).toEqual([]);
    expect(balmsLeft(raid.player.team)).toBe(3);

    raid.battle.tick(200);
    expect(soothed).toHaveLength(1);
    expect(soothed[0]).toBeCloseTo(max * BALM_SHARE);
    expect(balmsLeft(raid.player.team)).toBe(2);

    // Not again until the cooldown has run its course, and never past what was packed
    raid.battle.tick(BALM_EVERY - 300);
    expect(soothed).toHaveLength(1);
    tickUntil(raid, () => false, BALM_EVERY * 4);
    expect(soothed).toHaveLength(3);
    expect(balmsLeft(raid.player.team)).toBe(0);
  });

  it('throws none for a party that packed none', () => {
    const raid = nobleRaid(Species.Kleavor);
    const soothed = balmsOn(raid);

    raid.battle.tick(BALM_EVERY * 2);
    expect(balmsLeft(raid.player.team)).toBe(0);
    expect(soothed).toEqual([]);
  });
});
