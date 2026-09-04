import Awards from '../ids/awards';
import Biome from '../ids/biome';
import { EXECUTIVE_HONORS, EXECUTIVE_NAMES, Executive } from './npc';

/**
 * Who keeps the crime landmark here.
 *
 * One landmark, three organisations: the cell, the ranks, the shadows
 * and the purse are the same wherever it stands, and which team is
 * standing there is the biome's answer rather than the roll's. Team
 * Magma wants the land raised and holds the volcanoes and the dry
 * country; Team Aqua wants it drowned and holds the water; Team
 * Rocket has no ambition beyond the money and holds everywhere else.
 *
 * It is a fixture, not a window roll: a player who learns that the
 * coast is Aqua's has learned something about the world
 */
const enum Syndicate {
  Rocket = 0,
  Magma = 1,
  Aqua = 2,
}

export { Syndicate };

export const SYNDICATES: Syndicate[] = [Syndicate.Rocket, Syndicate.Magma, Syndicate.Aqua];

export const SYNDICATE_NAMES: Record<Syndicate, string> = {
  [Syndicate.Rocket]: 'Team Rocket',
  [Syndicate.Magma]: 'Team Magma',
  [Syndicate.Aqua]: 'Team Aqua',
};

/** The uniform the rank and file are met in */
export const SYNDICATE_GRUNT_CHARSETS: Record<Syndicate, string[]> = {
  [Syndicate.Rocket]: ['characters/hgss/rocket-f', 'characters/hgss/rocket-m'],
  [Syndicate.Magma]: ['characters/rse/magma-grunt-f', 'characters/rse/magma-grunt-m'],
  [Syndicate.Aqua]: ['characters/rse/aqua-grunt-f', 'characters/rse/aqua-grunt-m'],
};

/**
 * One mark for clearing a cell of that team's rank and file, however
 * many are put down: a grunt is a uniform rather than a person
 */
export const SYNDICATE_GRUNT_HONORS: Record<Syndicate, Awards> = {
  [Syndicate.Rocket]: Awards.RocketGruntDefeated,
  [Syndicate.Magma]: Awards.MagmaGruntDefeated,
  [Syndicate.Aqua]: Awards.AquaGruntDefeated,
};

/**
 * Who answers to each boss. Rolled apart from the rank, so a team
 * with two of them is no likelier to field one than a team with four
 */
export const SYNDICATE_EXECUTIVES: Record<Syndicate, Executive[]> = {
  [Syndicate.Rocket]: [Executive.Archer, Executive.Ariana, Executive.Proton, Executive.Petrel],
  [Syndicate.Magma]: [Executive.Tabitha, Executive.Courtney],
  [Syndicate.Aqua]: [Executive.Matt, Executive.Shelly],
};

export const SYNDICATE_BOSS_NAMES: Record<Syndicate, string> = {
  [Syndicate.Rocket]: 'Giovanni',
  [Syndicate.Magma]: 'Maxie',
  [Syndicate.Aqua]: 'Archie',
};

export const SYNDICATE_BOSS_CHARSETS: Record<Syndicate, string[]> = {
  // His Heart Gold coat is the one he runs Team Rocket in; the Fire
  // Red one belongs to the gym he keeps in Kanto
  [Syndicate.Rocket]: ['characters/hgss/giovanni'],
  [Syndicate.Magma]: ['characters/oras/maxie'],
  [Syndicate.Aqua]: ['characters/oras/archie', 'characters/rse/archie'],
};

export const SYNDICATE_BOSS_HONORS: Record<Syndicate, Awards> = {
  [Syndicate.Rocket]: Awards.GiovanniDefeated,
  [Syndicate.Magma]: Awards.MaxieDefeated,
  [Syndicate.Aqua]: Awards.ArchieDefeated,
};

/** What each boss says as they bar the cell */
export const SYNDICATE_BOSS_QUOTES: Record<Syndicate, string> = {
  [Syndicate.Rocket]: 'So you are the one. Show me what you have.',
  [Syndicate.Magma]: 'The sea has had its turn. I am giving the land back its own.',
  [Syndicate.Aqua]: 'Everything began in the water. I am only sending it home.',
};

/** What the rank and file say as they bar the cell */
export const SYNDICATE_GRUNT_QUOTES: Record<Syndicate, string> = {
  [Syndicate.Rocket]: 'Wrong path, kid. Three of mine say so.',
  [Syndicate.Magma]: 'This ground is going to be worth something. Off it.',
  [Syndicate.Aqua]: 'The tide is coming in whether you move or not.',
};

/**
 * The biomes each team keeps. Rocket is absent on purpose: it holds
 * whatever the other two have not claimed, so a biome added later
 * belongs to Rocket until somebody says otherwise
 */
const SYNDICATE_BIOMES: Record<Syndicate.Magma | Syndicate.Aqua, Biome[]> = {
  // Fire and raised ground: what Magma is for
  [Syndicate.Magma]: [
    Biome.Volcano,
    Biome.Mountain,
    Biome.AlpineTundra,
    Biome.Badlands,
    Biome.Desert,
    Biome.ColdDesert,
  ],
  // And everything the water already has
  [Syndicate.Aqua]: [
    Biome.DeepOcean,
    Biome.Ocean,
    Biome.PolarOcean,
    Biome.CoralReef,
    Biome.KelpForest,
    Biome.Beach,
    Biome.RockyCoast,
    Biome.Mangrove,
    Biome.Swamp,
    Biome.Bog,
  ],
};

const CLAIMED = new Map<Biome, Syndicate>([
  ...SYNDICATE_BIOMES[Syndicate.Magma].map((biome): [Biome, Syndicate] => [biome, Syndicate.Magma]),
  ...SYNDICATE_BIOMES[Syndicate.Aqua].map((biome): [Biome, Syndicate] => [biome, Syndicate.Aqua]),
]);

/** Whose cell this is, in this biome */
export function getSyndicate(biome: Biome): Syndicate {
  return CLAIMED.get(biome) ?? Syndicate.Rocket;
}

/**
 * What each team calls its own ranks. A person at one of these
 * landmarks is introduced the way the games introduce them, team
 * first and title before the name, so who is standing there says
 * which organisation and how far up it in one line
 */
export const SYNDICATE_BOSS_TITLES: Record<Syndicate, string> = {
  [Syndicate.Rocket]: 'Boss',
  [Syndicate.Magma]: 'Leader',
  [Syndicate.Aqua]: 'Leader',
};

export const SYNDICATE_EXECUTIVE_TITLES: Record<Syndicate, string> = {
  [Syndicate.Rocket]: 'Executive',
  [Syndicate.Magma]: 'Admin',
  [Syndicate.Aqua]: 'Admin',
};

/** "Team Aqua Leader Archie" */
export function bossName(syndicate: Syndicate): string {
  return `${SYNDICATE_NAMES[syndicate]} ${SYNDICATE_BOSS_TITLES[syndicate]} ${SYNDICATE_BOSS_NAMES[syndicate]}`;
}

/** "Team Magma Admin Tabitha" */
export function executiveName(syndicate: Syndicate, executive: Executive): string {
  return `${SYNDICATE_NAMES[syndicate]} ${SYNDICATE_EXECUTIVE_TITLES[syndicate]} ${EXECUTIVE_NAMES[executive]}`;
}

/** "Team Aqua Grunt", who is a uniform rather than a person */
export function gruntName(syndicate: Syndicate): string {
  return `${SYNDICATE_NAMES[syndicate]} Grunt`;
}

/** Every mark the three of them pay, for the shelf that lists them */
export const SYNDICATE_HONORS: Awards[] = SYNDICATES.flatMap((syndicate) => [
  SYNDICATE_GRUNT_HONORS[syndicate],
  ...SYNDICATE_EXECUTIVES[syndicate].map((executive) => EXECUTIVE_HONORS[executive]),
  SYNDICATE_BOSS_HONORS[syndicate],
]);
