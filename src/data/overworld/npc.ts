import { countsAgainstSlots } from '../constants/slots';
import { MAX_FRIENDSHIP } from '../constants/friendship';
import { MAX_IV } from '../constants/stats';
import Awards from '../ids/awards';
import type Abilities from '../ids/abilities';
import { Items } from '../ids/items';
import type { Moves } from '../ids/moves';
import type { Species } from '../ids/species';
import {
  getLevelUpMoves,
  getSpeciesAbilities,
  getSpeciesData,
  getTeachableMoves,
} from '../species';
import { isTutorOnlyMove } from '../moves/tutor-only';

import Npc from '../ids/npcs';
import { getNpcData, npcEntries } from './npc-data';

export default Npc;
export { type NpcData, getNpcData, npcEntries } from './npc-data';

/**
 * Everyone who wanders, for uniform rolls over the variants, in id
 * order. The rest keep a landmark of their own: the grunt and the
 * trainer, the vendor's Market and Nurse Joy's Pokémon Center. Each
 * name added makes every other name rarer
 */
export const NPCS: Npc[] = [];

/** The people who keep a crate to buy from, and take what a player sells */
export const TRADERS = new Set<Npc>();

/**
 * The wanderers who serve a player once a window, and the visit marker
 * the server takes for it. Everyone else can be visited again
 */
export const NPC_VISIT_TAGS = new Map<Npc, string>();

for (const [npc, data] of npcEntries()) {
  if (data.wanders === true) {
    NPCS.push(npc);
  }
  if (data.shop === true) {
    TRADERS.add(npc);
  }
  if (data.visit != null) {
    NPC_VISIT_TAGS.set(npc, data.visit);
  }
}

/**
 * The people who answer to a syndicate's boss. Like Giovanni they are the grunt's
 * landmark wearing a rarer face rather than a role of their own, and
 * they stand between him and the rank and file in every way: what
 * they field, what level it fights at, and how often one is met
 */
const enum Executive {
  Archer = 0,
  Ariana = 1,
  Proton = 2,
  Petrel = 3,
  Tabitha = 4,
  Courtney = 5,
  Matt = 6,
  Shelly = 7,
  Mars = 8,
  Jupiter = 9,
  Saturn = 10,
  Colress = 11,
  Zinzolin = 12,
  Xerosic = 13,
  Aliana = 14,
  Bryony = 15,
  Celosia = 16,
  Mable = 17,
}

export { Executive };

export const EXECUTIVE_NAMES: Record<Executive, string> = {
  [Executive.Archer]: 'Archer',
  [Executive.Ariana]: 'Ariana',
  [Executive.Proton]: 'Proton',
  [Executive.Petrel]: 'Petrel',
  [Executive.Tabitha]: 'Tabitha',
  [Executive.Courtney]: 'Courtney',
  [Executive.Matt]: 'Matt',
  [Executive.Shelly]: 'Shelly',
  [Executive.Mars]: 'Mars',
  [Executive.Jupiter]: 'Jupiter',
  [Executive.Saturn]: 'Saturn',
  [Executive.Colress]: 'Colress',
  [Executive.Zinzolin]: 'Zinzolin',
  [Executive.Xerosic]: 'Xerosic',
  [Executive.Aliana]: 'Aliana',
  [Executive.Bryony]: 'Bryony',
  [Executive.Celosia]: 'Celosia',
  [Executive.Mable]: 'Mable',
};

export const EXECUTIVE_CHARSETS: Record<Executive, string[]> = {
  [Executive.Archer]: ['characters/hgss/archer', 'characters/lgpe/archer'],
  [Executive.Ariana]: ['characters/hgss/ariana'],
  [Executive.Proton]: ['characters/hgss/proton'],
  [Executive.Petrel]: ['characters/hgss/petrel'],
  [Executive.Tabitha]: ['characters/oras/tabitha'],
  [Executive.Courtney]: ['characters/oras/courtney'],
  [Executive.Matt]: ['characters/oras/matt'],
  [Executive.Shelly]: ['characters/oras/shelly'],
  [Executive.Mars]: ['characters/dppt/mars'],
  [Executive.Jupiter]: ['characters/dppt/jupiter'],
  [Executive.Saturn]: ['characters/dppt/saturn'],
  // Both of his coats: the one he wears under Ghetsis and the one he
  // wears once the machine is his own
  [Executive.Colress]: ['characters/b2w2/colress-1', 'characters/b2w2/colress-2'],
  [Executive.Zinzolin]: ['characters/b2w2/zinzolin'],
  [Executive.Xerosic]: ['characters/xy/xerosic'],
  [Executive.Aliana]: ['characters/xy/aliana'],
  [Executive.Bryony]: ['characters/xy/bryony'],
  [Executive.Celosia]: ['characters/xy/celosia'],
  [Executive.Mable]: ['characters/xy/mable'],
};

/** The mark putting one of them down is worth, one to each */
export const EXECUTIVE_HONORS: Record<Executive, Awards> = {
  [Executive.Archer]: Awards.ArcherDefeated,
  [Executive.Ariana]: Awards.ArianaDefeated,
  [Executive.Proton]: Awards.ProtonDefeated,
  [Executive.Petrel]: Awards.PetrelDefeated,
  [Executive.Tabitha]: Awards.TabithaDefeated,
  [Executive.Courtney]: Awards.CourtneyDefeated,
  [Executive.Matt]: Awards.MattDefeated,
  [Executive.Shelly]: Awards.ShellyDefeated,
  [Executive.Mars]: Awards.MarsDefeated,
  [Executive.Jupiter]: Awards.JupiterDefeated,
  [Executive.Saturn]: Awards.SaturnDefeated,
  [Executive.Colress]: Awards.ColressDefeated,
  [Executive.Zinzolin]: Awards.ZinzolinDefeated,
  [Executive.Xerosic]: Awards.XerosicDefeated,
  [Executive.Aliana]: Awards.AlianaDefeated,
  [Executive.Bryony]: Awards.BryonyDefeated,
  [Executive.Celosia]: Awards.CelosiaDefeated,
  [Executive.Mable]: Awards.MableDefeated,
};

/** What each says as they bar the cell */
export const EXECUTIVE_QUOTES: Record<Executive, string> = {
  [Executive.Archer]: 'I run this operation. You are an inconvenience in it.',
  [Executive.Ariana]: 'A child playing hero. I will enjoy putting you down.',
  [Executive.Proton]: 'I am the cruellest of the executives. Ask anyone who is left.',
  [Executive.Petrel]: 'Hehe, you thought I was the boss? Close enough for you.',
  [Executive.Tabitha]: 'The boss has plans for this land. You are standing on it.',
  [Executive.Courtney]: 'Analysing your chances. Result: none. Proceeding.',
  [Executive.Matt]: 'Ooooh, a challenger! Do not go down too fast, I get bored.',
  [Executive.Shelly]: 'The sea takes what it wants. Today it wants you out of the way.',
  [Executive.Mars]: 'You are in the way of a better world. Move, or be moved.',
  [Executive.Jupiter]: 'Do not take this personally. I barely take it personally.',
  [Executive.Saturn]: 'I have my doubts about all this. None of them are about beating you.',
  [Executive.Colress]: 'I want to see the strength a pokemon reaches with you. Purely as data.',
  [Executive.Zinzolin]: 'You will be cold long before you are finished. Begin.',
  [Executive.Xerosic]: 'Fascinating. Let me see how your pokemon hold up under stress.',
  [Executive.Aliana]: 'The world is ugly, so we are fixing it. You are part of the ugly.',
  [Executive.Bryony]: 'Calculating your odds. They round down to nothing.',
  [Executive.Celosia]: 'Only the beautiful get to stay. I will judge whether you do.',
  [Executive.Mable]: 'We scientists are busy. Let us make this quick and quiet.',
};

/**
 * Every charset a wanderer of this role may be drawn with
 */
export function npcSheets(npc: Npc): string[] {
  return getNpcData(npc).sprites;
}

/**
 * The role's first style, for anywhere that has no window to roll one
 */
export function npcSheet(npc: Npc): string {
  return npcSheets(npc)[0];
}

/** What a role is called */
export function npcName(npc: Npc): string {
  return getNpcData(npc).name;
}

/**
 * What the breeder charges for an egg. It is dear on purpose: an egg
 * bred from two pokemon a player already owns inherits their stats,
 * which is worth more than anything a nest leaves lying around
 */
export const BREEDING_FEE = 5000;

/**
 * What the daycare lady charges to push an egg along
 */
export const DAYCARE_FEE = 2500;

/**
 * What the groomer charges. It is the daycare lady's price for the
 * daycare lady's trade: half of what is left, bought rather than
 * walked for
 */
export const GROOMING_FEE = 2500;

/**
 * What the Move Reminder charges, and the only thing he takes. He is
 * the one wanderer whose price is not gold: a scale is dug out of the
 * ground and nothing sells one, so what paces him is walking rather
 * than a purse.
 *
 * One move costs **one** of them. There is no constant for the count
 * because there is no choice in it: `learnMove` spends a single item
 * whatever the item is, so a second figure here would only be
 * something to fall out of step with it
 */
export const REMINDER_FEE = Items.HeartScale;

/**
 * What the reminder can put back on a pokemon: everything its line has
 * learned by levelling up to its level, pre-evolutions included, minus
 * the ones it still knows. Earlier stages come first.
 *
 * The list is read off the species rather than the pokemon's history,
 * since a record keeps only the moves it knows now. The chain is walked
 * because an evolved species does not relist its pre-evolutions' moves.
 */
export function getRecallableMoves(
  species: Species,
  level: number,
  known: Iterable<Moves>,
): Moves[] {
  const knows = new Set(known);
  const moves: Moves[] = [];
  const line: Species[] = [];

  for (let stage: Species | undefined = species; stage != null;) {
    line.unshift(stage);
    const previous: Species | undefined = getSpeciesData(stage).evolvesFrom;
    stage = previous === stage ? undefined : previous;
  }
  for (const stage of line) {
    for (const move of getLevelUpMoves(stage, level)) {
      if (!knows.has(move)) {
        knows.add(move);
        moves.push(move);
      }
    }
  }
  return moves;
}

/**
 * What the tutor charges per lesson: the reminder's own price. One
 * scale, one lesson, and gold is no use to either of them
 */
export const TUTOR_FEE = Items.HeartScale;

/**
 * What the tutor can put on a pokemon: everything on its species'
 * teachable list, minus the moves it already knows. The list is the
 * machines' own — he teaches nothing a machine could not — so what he
 * sells is the lesson without the hunt for the disc
 */
/**
 * Whether the tutor turns this lesson down: a signature move of his
 * own is taught only to a pokemon at the most friendship it can have
 */
export function tutorRefuses(move: Moves, friendship: number): boolean {
  return isTutorOnlyMove(move) && friendship < MAX_FRIENDSHIP;
}

export function getTutorableMoves(species: Species, known: Iterable<Moves>): Moves[] {
  const knows = new Set(known);
  const moves: Moves[] = [];

  for (const move of getTeachableMoves(species)) {
    if (!knows.has(move)) {
      moves.push(move);
    }
  }
  return moves;
}

/**
 * What the Channeler charges: the reminder's own price. A scale is
 * dug out of the ground and nothing sells one, so what paces her is
 * walking rather than a purse
 */
export const CHANNELER_FEE = Items.HeartScale;

/** What the Hyper Trainer charges for each point a value is trained up */
export const HYPER_TRAINING_PER_POINT = 10_000;

/** What training this value to the top costs: every point it has left to climb */
export function hyperTrainingCost(iv: number): number {
  return Math.max(0, MAX_IV - iv) * HYPER_TRAINING_PER_POINT;
}

/** How many pokemon the trader has on offer at once */
export const TRADER_OFFERS = 6;

/** What the Dojo Master charges for one more move slot: the same scale */
export const DOJO_MASTER_FEE = Items.HeartScale;

/**
 * What she can still draw out of the pokemon: everything it could ever
 * come to have, minus what it already carries.
 *
 * The pool walks up the chain and stops there, so a Magikarp is never
 * offered what only a Gyarados knows. The special tier is left out of
 * both sides: a shadow's mark is not an ability the pokemon could have
 * been born with, and it takes up no room either way
 */
export function getAwakenableAbilities(species: Species, known: Iterable<Abilities>): Abilities[] {
  const knows = new Set(known);
  const abilities: Abilities[] = [];

  for (const ability of getSpeciesAbilities(species)) {
    if (countsAgainstSlots(ability) && !knows.has(ability)) {
      abilities.push(ability);
    }
  }
  return abilities;
}
