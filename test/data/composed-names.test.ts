import { expect, it } from 'vitest';
import registerGameData from '../../src/data/index';
import { EXECUTIVE_IDS, LAIR_IDS, SYNDICATE_IDS, TYPE_IDS } from '../../src/data/ids/names';
import Biome from '../../src/data/ids/biome';
import Regions from '../../src/data/ids/regions';
import {
  getTitleName,
  lineTitle,
  professorTitle,
  trainerTitle,
  typeTitle,
} from '../../src/data/ids/titles';
import { AchievementLine } from '../../src/data/achievements';
import { TRAINER_NAMES, TRAINER_TRADES } from '../../src/data/overworld/trainers';
import { getDexChain, getDexQuests } from '../../src/data/quests/dex';
import { getDailyQuests, getWeeklyHunt } from '../../src/data/quests/rotations';
import { CHAINS } from '../../src/data/quests';
import { getLairTitle } from '../../src/data/overworld/lair';
import { bossName, executiveName, gruntName } from '../../src/data/overworld/syndicate';

registerGameData();

/**
 * Strings the game builds out of other names, as they read in English.
 * They are worked out from templates in the text files, and no template
 * may change what an English player reads
 */
const EXPECTED = [
  'title|prof|Kanto Professor',
  'title|prof|Paldea Professor',
  'title|prof|Unova Professor',
  'title|type0|Fire Specialist',
  'title|type1|Fire Master',
  'title|type0|Water Specialist',
  'title|type1|Water Master',
  'title|line0|Collector',
  'title|line1|Master Collector',
  'title|tr0|Ace Trainer',
  'title|tr1|Master Ace Trainer',
  'title|tr0|Lass',
  'title|tr1|Master Lass',
  'title|tr0|Black Belt',
  'title|tr1|Master Black Belt',
  'title|ladder|League Challenger',
  'title|ladder|Kanto Champion',
  'title|none|null',
  'trainer|0|Ace Trainer (Kanto)',
  'trainer|1|Lass (Kanto)',
  'trainer|2|Black Belt (Kanto)',
  'trainer|3|Bird Keeper (Kanto)',
  'trainer|4|Biker (Kanto)',
  'trainer|5|Hiker (Kanto)',
  'trainer|count|159',
  'dex|chain|Kanto Pokedex',
  'dex|1100|Field Researcher',
  'dex|1101|Dex Scholar',
  'dex|1102|Kanto Complete',
  'dex|chain|Hoenn Pokedex',
  'dex|1300|Field Researcher',
  'dex|1301|Dex Scholar',
  'dex|1302|Hoenn Complete',
  'dex|chain|undefined',
  'chains|Kanto Pokedex',
  'daily|1767225600000|0|Featured: Bulbasaur',
  'daily|1767225600000|1|Daily Stroll',
  'daily|1767225600000|2|Answer the Siren',
  'weekly|1767225600000|The Unown Hunt',
  'daily|1775692800000|0|Featured: Unown',
  'daily|1775692800000|1|Daily Stroll',
  "daily|1775692800000|2|Forager's Rounds",
  'weekly|1775692800000|The Murkrow Hunt',
  'daily|1784592000000|0|Featured: Deoxys',
  'daily|1784592000000|1|Daily Stroll',
  'daily|1784592000000|2|Roadside Challenge',
  'weekly|1784592000000|The Gimmighoul Hunt',
  'daily|1793664000000|0|Featured: Druddigon',
  'daily|1793664000000|1|Daily Stroll',
  'daily|1793664000000|2|Answer the Siren',
  'weekly|1793664000000|The Pancham Hunt',
  'lair|SeafoamIslands|Seafoam Islands',
  'lair|SeafoamIslands|Shadow Seafoam Islands',
  'lair|PowerPlant|Power Plant',
  'lair|PowerPlant|Shadow Power Plant',
  'lair|none|Taiga Lair',
  'lair|none|Shadow Woodland Lair',
  'syn|Team Rocket Grunt|Team Rocket Boss Giovanni',
  'exec|Team Rocket Executive Archer',
  'exec|Team Rocket Executive Ariana',
  'syn|Team Magma Grunt|Team Magma Leader Maxie',
  'exec|Team Magma Admin Archer',
  'exec|Team Magma Admin Ariana',
  'syn|Team Aqua Grunt|Team Aqua Leader Archie',
  'exec|Team Aqua Admin Archer',
  'exec|Team Aqua Admin Ariana',
  'syn|Team Galactic Grunt|Team Galactic Boss Cyrus',
  'exec|Team Galactic Commander Archer',
  'exec|Team Galactic Commander Ariana',
  'syn|Team Plasma Grunt|Team Plasma Sage Ghetsis',
  'exec|Team Plasma Admin Archer',
  'exec|Team Plasma Admin Ariana',
  'syn|Team Flare Grunt|Team Flare Boss Lysandre',
  'exec|Team Flare Scientist Archer',
  'exec|Team Flare Scientist Ariana',
];

it('builds the same English strings from its templates', () => {
  const out: string[] = [];

  for (const region of [Regions.Kanto, Regions.Paldea, Regions.Unova]) {
    out.push(`title|prof|${getTitleName(professorTitle(region))}`);
  }
  for (const type of [TYPE_IDS.Fire, TYPE_IDS.Water]) {
    out.push(`title|type0|${getTitleName(typeTitle(type, false))}`);
    out.push(`title|type1|${getTitleName(typeTitle(type, true))}`);
  }
  out.push(`title|line0|${getTitleName(lineTitle(AchievementLine.Collector, false))}`);
  out.push(`title|line1|${getTitleName(lineTitle(AchievementLine.Collector, true))}`);
  for (const trade of TRAINER_TRADES.slice(0, 3)) {
    out.push(`title|tr0|${getTitleName(trainerTitle(trade, false))}`);
    out.push(`title|tr1|${getTitleName(trainerTitle(trade, true))}`);
  }
  out.push(`title|ladder|${getTitleName(0)}`, `title|ladder|${getTitleName(2)}`);
  out.push(`title|none|${getTitleName(150)}`);

  const marked: string[] = [];

  for (const [id, name] of Object.entries(TRAINER_NAMES)) {
    if (name.includes('(')) {
      marked.push(`${id}|${name}`);
    }
  }
  for (const line of marked.slice(0, 6)) {
    out.push(`trainer|${line}`);
  }
  out.push(`trainer|count|${marked.length}`);

  for (const region of [Regions.Kanto, Regions.Hoenn, Regions.Paldea]) {
    out.push(`dex|chain|${getDexChain(region)?.name}`);
    for (const [id, quest] of getDexQuests(region)) {
      out.push(`dex|${id}|${quest.name}`);
    }
  }
  out.push(`chains|${CHAINS[100 + Regions.Kanto]?.name}`);

  const days = [
    Date.UTC(2026, 0, 1),
    Date.UTC(2026, 3, 9),
    Date.UTC(2026, 6, 21),
    Date.UTC(2026, 10, 3),
  ];

  for (const day of days) {
    for (const quest of getDailyQuests(day)) {
      out.push(`daily|${day}|${quest.slot}|${quest.name}`);
    }
    out.push(`weekly|${day}|${getWeeklyHunt(day).name}`);
  }
  for (const [name, id] of Object.entries(LAIR_IDS).slice(0, 2)) {
    out.push(`lair|${name}|${getLairTitle(id, Biome.Taiga, false)}`);
    out.push(`lair|${name}|${getLairTitle(id, Biome.Taiga, true)}`);
  }
  out.push(`lair|none|${getLairTitle(null, Biome.Taiga, false)}`);
  out.push(`lair|none|${getLairTitle(null, Biome.Woodland, true)}`);
  for (const team of Object.values(SYNDICATE_IDS)) {
    out.push(`syn|${gruntName(team)}|${bossName(team)}`);
    for (const executive of Object.values(EXECUTIVE_IDS).slice(0, 2)) {
      out.push(`exec|${executiveName(team, executive)}`);
    }
  }
  expect(out).toEqual(EXPECTED);
});
