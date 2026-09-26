import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import registerBiomeSpawns, { BIOME_NAMES, isMythicalSpecies } from '../../src/data/biome';
import registerAbilities from '../../src/data/abilities';
import { TYPE_NAMES, Types } from '../../src/data/constants/types';
import { isOpenSea } from '../../src/data/ids/biome';
import type Biome from '../../src/data/ids/biome';
import { Species } from '../../src/data/ids/species';
import registerItems from '../../src/data/items';
import { registerMoves } from '../../src/data/moves';
import Npc from '../../src/data/overworld/npc';
import {
  getRegisteredSpecies,
  getSpeciesData,
  isBaseForm,
  registerSpecies,
} from '../../src/data/species';
import Awards from '../../src/data/ids/awards';
import Regions from '../../src/data/ids/regions';
import { REGIONS, getRegionSpan, getSpeciesRegion } from '../../src/data/species/regions';
import {
  ACHIEVEMENT_LINES,
  ACHIEVEMENT_TRAINERS,
  ACHIEVEMENT_TYPES,
  AchievementLine,
  AchievementTier,
  LINE_DEEDS,
  LINE_NAMES,
  LINE_TIERS,
  TRAINER_TIERS,
  TYPE_TIERS,
  deriveAchievements,
  tierOf,
} from '../../src/data/achievements';
import {
  LadderTitle,
  getTitleName,
  lineTitle,
  professorTitle,
  titleProfessor,
  titleTrainer,
  trainerTitle,
  typeTitle,
} from '../../src/data/ids/titles';
import {
  BIOME_TRAINERS,
  TRAINER_BASE_NAMES,
  TRAINER_CHARSETS,
  TRAINER_CLASSES,
  TRAINER_NAMES,
  TRAINER_QUOTES,
  TRAINER_REGIONS,
  TRAINER_TRADE,
  TRAINER_TRADES,
  TRAINER_TYPES,
  TrainerClass,
  getBiomeTrainers,
  getTradeClasses,
  getTrainerPool,
  isAceTrainer,
} from '../../src/data/overworld/trainers';
import { Metric, Landmark as QuestLandmark } from '../../src/auth/quest-record';
import {
  DAILY_SLOTS,
  dailyWindow,
  getDailyQuests,
  getWeeklyHunt,
  weeklyWindow,
} from '../../src/data/quests/rotations';
import {
  CHAINS,
  CHAIN_ORDER,
  QUESTS,
  QUEST_ORDER,
  QuestRewardKind,
  type Quests,
  RequirementKind,
  getQuestData,
  prerequisiteOf,
  successorOf,
} from '../../src/data/quests';
import {
  DEX_QUEST_BASE,
  REGION_DEXES,
  dexChainId,
  dexQuestId,
  getDexChain,
  getDexQuests,
  getDexRegions,
} from '../../src/data/quests/dex';

// Registry-only tests: no battle is involved, the data just has to
// be registered (re-registration is an idempotent map overwrite)
registerMoves();
registerAbilities();
registerSpecies();
registerItems();
registerBiomeSpawns();

describe('achievements', () => {
  it('prices every line in 4 ascending tiers', () => {
    for (const line of ACHIEVEMENT_LINES) {
      expect(LINE_NAMES[line].length).toBeGreaterThan(0);
      expect(LINE_DEEDS[line].length).toBeGreaterThan(0);

      const tiers = LINE_TIERS[line];

      expect(tiers).toHaveLength(4);
      for (let at = 1; at < tiers.length; at++) {
        expect(tiers[at]).toBeGreaterThan(tiers[at - 1]);
      }
    }
    expect(new Set(ACHIEVEMENT_TYPES).size).toBe(15);
    for (let at = 1; at < TYPE_TIERS.length; at++) {
      expect(TYPE_TIERS[at]).toBeGreaterThan(TYPE_TIERS[at - 1]);
    }
    expect(new Set(ACHIEVEMENT_TRAINERS).size).toBe(ACHIEVEMENT_TRAINERS.length);
    for (let at = 1; at < TRAINER_TIERS.length; at++) {
      expect(TRAINER_TIERS[at]).toBeGreaterThan(TRAINER_TIERS[at - 1]);
    }
  });

  it('reads a tier off the thresholds, edges included', () => {
    const tiers: [number, number, number, number] = [10, 50, 250, 1000];

    expect(tierOf(0, tiers)).toBe(AchievementTier.None);
    expect(tierOf(9, tiers)).toBe(AchievementTier.None);
    expect(tierOf(10, tiers)).toBe(AchievementTier.Bronze);
    expect(tierOf(249, tiers)).toBe(AchievementTier.Silver);
    expect(tierOf(250, tiers)).toBe(AchievementTier.Gold);
    expect(tierOf(999, tiers)).toBe(AchievementTier.Gold);
    expect(tierOf(1000, tiers)).toBe(AchievementTier.Platinum);
  });

  it('derives standings from the counters, types through the registry', () => {
    const counters: Map<Metric, Map<number, number>> = new Map([
      [
        Metric.Catches,
        new Map<number, number>([
          [Species.Magikarp, 12],
          [Species.Gastly, 40],
        ]),
      ],
      [
        Metric.NpcVisits,
        new Map<number, number>([
          [Npc.Breeder, 3],
          [Npc.Groomer, 4],
        ]),
      ],
      [
        Metric.Landmarks,
        new Map<number, number>([
          [QuestLandmark.Cache, 20],
          [QuestLandmark.Portal, 10],
        ]),
      ],
      [Metric.Purifies, new Map<number, number>([[0, 3]])],
      [
        Metric.TrainerWins,
        new Map<number, number>([
          [TrainerClass.BugCatcher, 4],
          [TrainerClass.AceTrainer, 1],
        ]),
      ],
    ]);
    const derived = deriveAchievements(counters);

    // 52 catches in all; the types split them, dual-type Gastly
    // counting for both of its
    expect(derived.lines.get(AchievementLine.Collector)?.count).toBe(52);
    expect(derived.lines.get(AchievementLine.Collector)?.tier).toBe(AchievementTier.Silver);
    expect(derived.lines.get(AchievementLine.Collector)?.next).toBe(250);
    expect(derived.types.get(Types.Water)?.count).toBe(12);
    expect(derived.types.get(Types.Ghost)?.count).toBe(40);
    expect(derived.types.get(Types.Ghost)?.tier).toBe(AchievementTier.Bronze);
    expect(derived.types.get(Types.Poison)?.count).toBe(40);
    expect(derived.types.get(Types.Fire)?.count).toBe(0);

    // The narrowed lines read their own params, not the totals
    expect(derived.lines.get(AchievementLine.Socialite)?.count).toBe(7);
    expect(derived.lines.get(AchievementLine.Matchmaker)?.count).toBe(3);
    expect(derived.lines.get(AchievementLine.Matchmaker)?.tier).toBe(AchievementTier.Bronze);
    expect(derived.lines.get(AchievementLine.Forager)?.count).toBe(30);
    expect(derived.lines.get(AchievementLine.Wayfinder)?.count).toBe(10);
    expect(derived.lines.get(AchievementLine.Wayfinder)?.tier).toBe(AchievementTier.Silver);
    expect(derived.lines.get(AchievementLine.Purifier)?.count).toBe(3);
    // A class is counted on its own: beating Bug Catchers says
    // nothing about Swimmers
    expect(derived.trainers.get(TrainerClass.BugCatcher)?.count).toBe(4);
    expect(derived.trainers.get(TrainerClass.BugCatcher)?.tier).toBe(AchievementTier.Bronze);
    expect(derived.trainers.get(TrainerClass.AceTrainer)?.tier).toBe(AchievementTier.None);
    expect(derived.trainers.get(TrainerClass.Swimmer)?.count).toBe(0);

    // Platinum has nothing further to reach
    expect(
      deriveAchievements(new Map([[Metric.Friends, new Map<number, number>([[0, 50]])]])).lines.get(
        AchievementLine.Confidant,
      )?.next,
    ).toBeNull();
  });

  it('counts a trade’s regions on one line and dresses them apart', () => {
    // Both Swimmers are the same trade, so the wins add up to one
    // line and one title
    expect(TRAINER_TRADE[TrainerClass.JohtoSwimmer]).toBe(TrainerClass.Swimmer);
    expect(getTradeClasses(TrainerClass.Swimmer)).toEqual([
      TrainerClass.Swimmer,
      TrainerClass.JohtoSwimmer,
      TrainerClass.HoennSwimmer,
      TrainerClass.SinnohSwimmer,
      TrainerClass.UnovaSwimmer,
    ]);
    expect(TRAINER_TRADES).not.toContain(TrainerClass.JohtoSwimmer);
    expect(ACHIEVEMENT_TRAINERS).toEqual(TRAINER_TRADES);

    const beaten = new Map<Metric, Map<number, number>>([
      [
        Metric.TrainerWins,
        new Map([
          [TrainerClass.Swimmer, 2],
          [TrainerClass.JohtoSwimmer, 2],
        ]),
      ],
    ]);
    const standings = deriveAchievements(beaten);

    // Four between them is the trade's Bronze, which neither reached
    // alone
    expect(standings.trainers.get(TrainerClass.Swimmer)?.count).toBe(4);
    expect(standings.trainers.get(TrainerClass.Swimmer)?.tier).toBe(AchievementTier.Bronze);
    // The coats are the class' own, and two wins dress nobody
    expect(standings.variants.get(TrainerClass.Swimmer)?.count).toBe(2);
    expect(standings.variants.get(TrainerClass.Swimmer)?.tier).toBe(AchievementTier.None);
    expect(standings.variants.get(TrainerClass.JohtoSwimmer)?.count).toBe(2);
    // A trade only one region has counts the way it always did
    expect(getTradeClasses(TrainerClass.Channeler)).toEqual([TrainerClass.Channeler]);
  });

  it('names a trade twice over by the region it is met in', () => {
    // The mainline's own name, and the region after it only where
    // both regions put the same trade on the road
    expect(TRAINER_NAMES[TrainerClass.Swimmer]).toBe('Swimmer (Kanto)');
    expect(TRAINER_NAMES[TrainerClass.JohtoSwimmer]).toBe('Swimmer (Johto)');
    expect(TRAINER_BASE_NAMES[TrainerClass.JohtoSwimmer]).toBe('Swimmer');
    // A trade only one region has keeps the plain name
    expect(TRAINER_NAMES[TrainerClass.Sage]).toBe('Sage');
    expect(TRAINER_NAMES[TrainerClass.Channeler]).toBe('Channeler');
    // And no two classes read as the same person
    expect(new Set(TRAINER_CLASSES.map((one) => TRAINER_NAMES[one])).size).toBe(
      TRAINER_CLASSES.length,
    );
  });

  it('puts somebody of Johto’s on the road for every type it grows', () => {
    const johto: [TrainerClass, Types][] = [
      [TrainerClass.Sage, Types.Grass],
      [TrainerClass.Skier, Types.Ice],
      [TrainerClass.Scientist, Types.Steel],
      [TrainerClass.JohtoPokeManiac, Types.Dragon],
      [TrainerClass.JohtoBurglar, Types.Dark],
      [TrainerClass.Firebreather, Types.Fire],
      [TrainerClass.Medium, Types.Ghost],
      [TrainerClass.Teacher, Types.Psychic],
      [TrainerClass.SchoolKid, Types.Electric],
      [TrainerClass.Youngster, Types.Ground],
      [TrainerClass.Camper, Types.Rock],
    ];

    for (const [trainer, type] of johto) {
      expect(TRAINER_TYPES[trainer], TRAINER_NAMES[trainer]).toContain(type);
      expect(TRAINER_REGIONS[trainer], TRAINER_NAMES[trainer]).toBe(Regions.Johto);
    }

    // Johto's road covers every type there is a line for, which is
    // more than Kanto's does: five of them Kanto has nobody for
    const covered = (region: Regions): Set<Types> =>
      new Set(
        TRAINER_CLASSES.filter((trainer) => TRAINER_REGIONS[trainer] === region).flatMap(
          (trainer) => TRAINER_TYPES[trainer],
        ),
      );

    for (const type of ACHIEVEMENT_TYPES) {
      expect(covered(Regions.Johto).has(type), TYPE_NAMES[type]).toBe(true);
    }
    expect(covered(Regions.Kanto).size).toBeLessThan(covered(Regions.Johto).size);

    // Every class is drawn and speaks for itself, twins included
    for (const trainer of TRAINER_CLASSES) {
      expect(TRAINER_QUOTES[trainer].length).toBeGreaterThan(0);
      expect(TRAINER_CHARSETS[trainer].length).toBeGreaterThan(0);
      for (const sheet of TRAINER_CHARSETS[trainer]) {
        expect(existsSync(`public/sprites/overworld/${sheet}/image.png`), sheet).toBe(true);
      }
    }
    // No sheet is worn by two classes: a coat is one trade's
    const worn = TRAINER_CLASSES.flatMap((trainer) => TRAINER_CHARSETS[trainer]);

    expect(new Set(worn).size).toBe(worn.length);
  });

  it('fields each class out of its own region rather than the country', () => {
    for (const trainer of TRAINER_CLASSES) {
      const pool = getTrainerPool(trainer);

      expect(pool.length, TRAINER_NAMES[trainer]).toBeGreaterThan(0);
      for (const species of pool) {
        expect(getSpeciesRegion(species), getSpeciesData(species).name).toBe(
          TRAINER_REGIONS[trainer],
        );
      }
    }

    // The twins are the same trade fielding different water
    const kanto = new Set(getTrainerPool(TrainerClass.Swimmer));

    for (const species of getTrainerPool(TrainerClass.JohtoSwimmer)) {
      expect(kanto.has(species)).toBe(false);
    }
  });

  it('puts each type expert in the countries their type belongs to', () => {
    const roads = new Set<TrainerClass>();

    for (const biome of Object.keys(BIOME_NAMES).map(Number) as Biome[]) {
      const standing = BIOME_TRAINERS[biome];

      // Every country puts somebody on the road, and the Ace is in
      // none of the lists: they belong to no country
      expect(standing.length).toBeGreaterThan(0);
      expect(standing).not.toContain(TrainerClass.AceTrainer);
      expect(new Set(standing).size).toBe(standing.length);
      for (const trainer of standing) {
        expect(TRAINER_TYPES[trainer].length, TRAINER_NAMES[trainer]).toBeGreaterThan(0);
        roads.add(trainer);
      }
      // What may actually be met there: the country's own, plus the
      // two Aces, who belong to no country. Out on the water it is
      // the seafarers among them and nobody else
      if (isOpenSea(biome)) {
        const afloat = getBiomeTrainers(biome);

        expect(afloat.length).toBeGreaterThan(0);
        for (const trainer of afloat) {
          expect(standing, TRAINER_NAMES[trainer]).toContain(trainer);
          expect(TRAINER_TYPES[trainer], TRAINER_NAMES[trainer]).toContain(Types.Water);
        }
        // And nobody who would need ground to stand on
        for (const trainer of standing) {
          if (!new Set(TRAINER_TYPES[trainer]).has(Types.Water)) {
            expect(afloat, TRAINER_NAMES[trainer]).not.toContain(trainer);
          }
        }
      } else {
        expect(getBiomeTrainers(biome)).toEqual([
          TrainerClass.AceTrainer,
          TrainerClass.JohtoAceTrainer,
          TrainerClass.HoennAceTrainer,
          TrainerClass.SinnohAceTrainer,
          TrainerClass.UnovaAceTrainer,
          ...standing,
        ]);
      }
    }

    // No class is written out of the world, the Aces aside
    for (const trainer of TRAINER_CLASSES) {
      if (!isAceTrainer(trainer)) {
        expect(roads.has(trainer), TRAINER_NAMES[trainer]).toBe(true);
      }
    }
  });

  it('puts somebody of Hoenn’s on the road for every type it grows', () => {
    const hoenn: [TrainerClass, Types][] = [
      [TrainerClass.AromaLady, Types.Grass],
      [TrainerClass.Tuber, Types.Ice],
      [TrainerClass.HoennScientist, Types.Steel],
      [TrainerClass.DragonTamer, Types.Dragon],
      [TrainerClass.StreetThug, Types.Dark],
      [TrainerClass.Kindler, Types.Fire],
      [TrainerClass.NinjaBoy, Types.Ghost],
      [TrainerClass.Expert, Types.Psychic],
      [TrainerClass.Guitarist, Types.Electric],
      [TrainerClass.RuinManiac, Types.Ground],
      [TrainerClass.BattleGirl, Types.Fighting],
    ];

    for (const [trainer, type] of hoenn) {
      expect(TRAINER_TYPES[trainer], TRAINER_NAMES[trainer]).toContain(type);
      expect(TRAINER_REGIONS[trainer], TRAINER_NAMES[trainer]).toBe(Regions.Hoenn);
    }

    const covered = new Set(
      TRAINER_CLASSES.filter((trainer) => TRAINER_REGIONS[trainer] === Regions.Hoenn).flatMap(
        (trainer) => TRAINER_TYPES[trainer],
      ),
    );

    for (const type of ACHIEVEMENT_TYPES) {
      expect(covered.has(type), TYPE_NAMES[type]).toBe(true);
    }
  });

  it('numbers every trade inside the band its title is read from', () => {
    // The first 50 trades are titled `300 + trade * 2`; the rest, which
    // Sinnoh's own are the first of, carry on at 500, above the
    // professors rather than through them
    for (const trade of TRAINER_TRADES) {
      expect(titleTrainer(trainerTitle(trade, false)), TRAINER_NAMES[trade]).toBe(trade);
      expect(titleTrainer(trainerTitle(trade, true)), TRAINER_NAMES[trade]).toBe(trade);
      expect(titleProfessor(trainerTitle(trade, false)), TRAINER_NAMES[trade]).toBeNull();
    }
    // And the professors keep the numbers they were stored under
    for (const region of REGIONS) {
      if (region !== Regions.Unknown) {
        expect(titleProfessor(professorTitle(region))).toBe(region);
        expect(titleTrainer(professorTitle(region))).toBeNull();
      }
    }
    expect(trainerTitle(TrainerClass.Ranger, false)).toBeGreaterThanOrEqual(500);
    expect(getTitleName(trainerTitle(TrainerClass.Ranger, true))).toBe('Master Pokémon Ranger');
  });

  it('puts somebody of Sinnoh’s on the road for every type it grows', () => {
    const sinnoh: [TrainerClass, Types][] = [
      [TrainerClass.SinnohAromaLady, Types.Grass],
      [TrainerClass.SinnohSkier, Types.Ice],
      [TrainerClass.SinnohScientist, Types.Steel],
      [TrainerClass.SinnohDragonTamer, Types.Dragon],
      [TrainerClass.Policeman, Types.Dark],
      [TrainerClass.Waiter, Types.Fire],
      [TrainerClass.SinnohNinjaBoy, Types.Ghost],
      [TrainerClass.SinnohPsychic, Types.Psychic],
      [TrainerClass.Cyclist, Types.Electric],
      [TrainerClass.SinnohHiker, Types.Ground],
      [TrainerClass.Jogger, Types.Fighting],
      [TrainerClass.Worker, Types.Rock],
      [TrainerClass.ParasolLady, Types.Water],
      [TrainerClass.Ranger, Types.Bug],
      [TrainerClass.RichBoy, Types.Flying],
      [TrainerClass.Rancher, Types.Normal],
      [TrainerClass.SinnohRoughneck, Types.Poison],
    ];

    for (const [trainer, type] of sinnoh) {
      expect(TRAINER_TYPES[trainer], TRAINER_NAMES[trainer]).toContain(type);
      expect(TRAINER_REGIONS[trainer], TRAINER_NAMES[trainer]).toBe(Regions.Sinnoh);
    }

    const covered = new Set(
      TRAINER_CLASSES.filter((trainer) => TRAINER_REGIONS[trainer] === Regions.Sinnoh).flatMap(
        (trainer) => TRAINER_TYPES[trainer],
      ),
    );

    for (const type of ACHIEVEMENT_TYPES) {
      expect(covered.has(type), TYPE_NAMES[type]).toBe(true);
    }
  });

  it('names every title, and only the titles there are', () => {
    expect(getTitleName(lineTitle(AchievementLine.Collector, false))).toBe('Collector');
    expect(getTitleName(lineTitle(AchievementLine.Collector, true))).toBe('Master Collector');
    expect(getTitleName(typeTitle(Types.Dragon, false))).toBe('Dragon Specialist');
    expect(getTitleName(typeTitle(Types.Dragon, true))).toBe('Dragon Master');
    expect(getTitleName(trainerTitle(TrainerClass.BugCatcher, false))).toBe('Bug Catcher');
    expect(getTitleName(trainerTitle(TrainerClass.BugCatcher, true))).toBe('Master Bug Catcher');
    expect(getTitleName(LadderTitle.LeagueChallenger)).toBe('League Challenger');
    expect(getTitleName(LadderTitle.EliteConqueror)).toBe('Elite Conqueror');
    expect(getTitleName(LadderTitle.KantoChampion)).toBe('Kanto Champion');
    expect(getTitleName(LadderTitle.LegendBreaker)).toBe('Legend Breaker');
    // A filled dex is worth that region's professor
    expect(getTitleName(professorTitle(Regions.Kanto))).toBe('Kanto Professor');
    expect(getTitleName(professorTitle(Regions.Johto))).toBe('Johto Professor');
    expect(getTitleName(professorTitle(Regions.Unknown))).toBeNull();
    // A region's own class carries no title of its own: the trade
    // does, and both regions' wins climb it
    expect(getTitleName(trainerTitle(TrainerClass.JohtoSwimmer, false))).toBeNull();
    expect(getTitleName(trainerTitle(TrainerClass.Swimmer, false))).toBe('Swimmer');
    // A number that names nothing reads as no title
    expect(getTitleName(99)).toBeNull();
    expect(getTitleName(typeTitle(Types.Fairy, false))).toBeNull();
  });
});

describe('rotating quests', () => {
  const NOON = Date.UTC(2026, 7, 26, 12);

  it('deals the same board for one day and turns it over at midnight', () => {
    const today = getDailyQuests(NOON);
    const again = getDailyQuests(NOON + 3_600_000);

    expect(today).toHaveLength(DAILY_SLOTS);
    expect(again.map((one) => one.name)).toEqual(today.map((one) => one.name));
    expect(dailyWindow(NOON)).not.toBe(dailyWindow(NOON + 24 * 3_600_000));
  });

  it('spotlights the featured family on its day', () => {
    // Family number 1 is featured on January 2nd, day 1 of the year
    const featured = Date.UTC(2026, 0, 2, 12);
    const [spotlight] = getDailyQuests(featured);

    expect(spotlight.name.startsWith('Featured:')).toBe(true);
    expect(spotlight.requirement.family).toBe(1);
  });

  it('hunts one registered, lair-free family a week', () => {
    const hunt = getWeeklyHunt(NOON);

    expect(hunt.requirement.metric).toBe(Metric.Catches);
    expect(hunt.requirement.count).toBe(5);
    expect(hunt.requirement.family).not.toBeUndefined();
    expect(getWeeklyHunt(NOON + 24 * 3_600_000).name).toBe(hunt.name);
    expect(weeklyWindow(NOON)).not.toBe(weeklyWindow(NOON + 7 * 24 * 3_600_000));
  });
});

describe('the quest board', () => {
  it('gives every quest one chain and one definition', () => {
    const seen = new Set<Quests>();

    for (const chain of CHAIN_ORDER) {
      for (const quest of CHAINS[chain].quests) {
        expect(seen.has(quest), `${quest} is in two chains`).toBe(false);
        seen.add(quest);
        expect(getQuestData(quest), `${quest} has no definition`).not.toBeNull();
        expect(QUESTS[quest].requirements.length).toBeGreaterThan(0);
      }
    }
    expect(QUEST_ORDER.length).toBe(seen.size);
    // Nothing is defined that the board never shows
    expect(Object.keys(QUESTS).length).toBe(seen.size);
  });

  it('walks a chain forwards and backwards the same way', () => {
    for (const chain of CHAIN_ORDER) {
      const chained = CHAINS[chain].quests;

      expect(prerequisiteOf(chained[0])).toBeNull();
      for (const [at, quest] of chained.entries()) {
        expect(prerequisiteOf(quest)).toBe(at === 0 ? null : chained[at - 1]);
        expect(successorOf(quest)).toBe(at === chained.length - 1 ? null : chained[at + 1]);
      }
    }
  });
});

describe('a region’s pokedex chain', () => {
  it('is generated from the region rather than written out', () => {
    const chain = getDexChain(Regions.Kanto);
    const quests = getDexQuests(Regions.Kanto);

    expect(chain?.name).toBe('Kanto Pokedex');
    expect(chain?.quests).toEqual([...quests.keys()]);
    expect([...quests.keys()]).toEqual([
      dexQuestId(Regions.Kanto, 0),
      dexQuestId(Regions.Kanto, 1),
      dexQuestId(Regions.Kanto, 2),
    ]);

    // The rungs are the region's own milestones, counted against the
    // region's own stretch of the dex and nobody else's
    const asks = [...quests.values()].map((data) => data.requirements[0]);

    for (const ask of asks) {
      expect(ask.kind).toBe(RequirementKind.Dex);
      if (ask.kind === RequirementKind.Dex) {
        expect(ask.region).toBe(Regions.Kanto);
      }
    }
    expect(asks.map((ask) => ask.count)).toEqual([25, 75, 150]);

    // The last rung is the one with the medal on it
    const last = quests.get(dexQuestId(Regions.Kanto, 2));

    expect(last?.name).toBe('Kanto Complete');
    expect(last?.rewards.some((reward) => reward.kind === QuestRewardKind.Award)).toBe(true);
  });

  it('is in the board with everything else', () => {
    const chain = dexChainId(Regions.Kanto);

    expect(CHAIN_ORDER).toContain(chain);
    expect(CHAINS[chain].name).toBe('Kanto Pokedex');
    // ...and its rungs chain to each other like any other chain
    expect(prerequisiteOf(dexQuestId(Regions.Kanto, 1))).toBe(dexQuestId(Regions.Kanto, 0));
  });

  it('gives Johto the same ladder with its own numbers', () => {
    // A second region is a row in the table rather than a second set
    // of quests, and the medal at the top of it is its own
    expect(getDexRegions()).toContain(Regions.Johto);
    expect(CHAINS[dexChainId(Regions.Johto)].name).toBe('Johto Pokedex');

    const last = getDexQuests(Regions.Johto).get(dexQuestId(Regions.Johto, 2));

    expect(last?.name).toBe('Johto Complete');
    expect(
      last?.rewards.some(
        (reward) => reward.kind === QuestRewardKind.Award && reward.award === Awards.JohtoDexMedal,
      ),
    ).toBe(true);
  });

  it('gives Hoenn its own ladder, all but the two mythicals', () => {
    expect(getDexRegions()).toContain(Regions.Hoenn);
    expect(CHAINS[dexChainId(Regions.Hoenn)].name).toBe('Hoenn Pokedex');

    const last = getDexQuests(Regions.Hoenn).get(dexQuestId(Regions.Hoenn, 2));

    expect(last?.name).toBe('Hoenn Complete');
    expect(
      last?.rewards.some(
        (reward) => reward.kind === QuestRewardKind.Award && reward.award === Awards.HoennDexMedal,
      ),
    ).toBe(true);

    // The top rung asks for every dex number of the region but the
    // two a relic calls, which is the ask the other two regions carry
    const [from, to] = getRegionSpan(Regions.Hoenn) ?? [0, 0];
    const walked = getRegisteredSpecies().filter((species) => {
      const dex = getSpeciesData(species).dexNumber;

      return isBaseForm(species) && !isMythicalSpecies(species) && dex >= from && dex <= to;
    });

    expect(REGION_DEXES[Regions.Hoenn]?.milestones.at(-1)).toBe(walked.length);
  });

  it('gives Sinnoh its own ladder, all but the four mythicals', () => {
    expect(getDexRegions()).toContain(Regions.Sinnoh);
    expect(CHAINS[dexChainId(Regions.Sinnoh)].name).toBe('Sinnoh Pokedex');

    const last = getDexQuests(Regions.Sinnoh).get(dexQuestId(Regions.Sinnoh, 2));

    expect(last?.name).toBe('Sinnoh Complete');
    expect(
      last?.rewards.some(
        (reward) => reward.kind === QuestRewardKind.Award && reward.award === Awards.SinnohDexMedal,
      ),
    ).toBe(true);

    // Darkrai, Manaphy, Shaymin and Arceus are the four left out, and
    // every one of them is called by a relic rather than walked into
    const [from, to] = getRegionSpan(Regions.Sinnoh) ?? [0, 0];
    const walked = getRegisteredSpecies().filter((species) => {
      const dex = getSpeciesData(species).dexNumber;

      return isBaseForm(species) && !isMythicalSpecies(species) && dex >= from && dex <= to;
    });

    expect(REGION_DEXES[Regions.Sinnoh]?.milestones.at(-1)).toBe(walked.length);
  });

  it('gives Unova its own ladder, all but the four mythicals', () => {
    expect(getDexRegions()).toContain(Regions.Unova);
    expect(CHAINS[dexChainId(Regions.Unova)].name).toBe('Unova Pokedex');

    const last = getDexQuests(Regions.Unova).get(dexQuestId(Regions.Unova, 2));

    expect(last?.name).toBe('Unova Complete');
    expect(
      last?.rewards.some(
        (reward) => reward.kind === QuestRewardKind.Award && reward.award === Awards.UnovaDexMedal,
      ),
    ).toBe(true);

    // Victini, Keldeo, Meloetta and Genesect are the four left out,
    // each called by a relic rather than walked into
    const [from, to] = getRegionSpan(Regions.Unova) ?? [0, 0];
    const walked = getRegisteredSpecies().filter((species) => {
      const dex = getSpeciesData(species).dexNumber;

      return isBaseForm(species) && !isMythicalSpecies(species) && dex >= from && dex <= to;
    });

    expect(REGION_DEXES[Regions.Unova]?.milestones.at(-1)).toBe(walked.length);
  });

  it('leaves a region with no dex alone rather than inventing one', () => {
    // Nothing is written for it, so it stands no chain at all. This is
    // what a generation that has not landed yet looks like
    expect(getDexChain(Regions.Unknown)).toBeNull();
    expect(getDexQuests(Regions.Unknown).size).toBe(0);
    expect(getDexRegions()).not.toContain(Regions.Unknown);
  });

  it('numbers its quests where no written quest can reach', () => {
    const written = Object.keys(QUESTS)
      .map(Number)
      .filter((quest) => quest < DEX_QUEST_BASE);

    // A written quest and a generated one can never collide, however
    // many of either are added
    expect(written.length).toBeGreaterThan(0);
    expect(Math.max(...written)).toBeLessThan(DEX_QUEST_BASE);

    // ...and one region's rungs can never collide with another's,
    // which is what lets a region be added without renumbering
    const ids = new Set<number>();

    for (let region = 0; region < 20; region++) {
      for (let rung = 0; rung < 100; rung++) {
        const id = dexQuestId(region, rung);

        expect(ids.has(id)).toBe(false);
        ids.add(id);
      }
    }
  });
});
