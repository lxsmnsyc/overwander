import turns from '../../../battle/turn';
import Awards from '../../ids/awards';
import { Species } from '../../ids/species';
import { Statuses } from '../../ids/status';
import { getWorldExpertPool } from './pools';

/**
 * The Frontier Brains: the house champion of a facility, and the
 * rank above the league.
 *
 * What sets them apart from every seat below is not the party but the
 * **rule**. A gym is a type, an elite is a type with a widener, a
 * champion is a fixed six; a Brain is a fight held under the house's
 * own terms, and the party is only what those terms are demonstrated
 * with. All seven are open
 */
const enum FrontierBrain {
  Brandon = 0,
  Greta = 1,
  Lucy = 2,
  Noland = 3,
  Anabel = 4,
  Spenser = 5,
  Tucker = 6,
}

export { FrontierBrain };

export const FRONTIER_BRAINS: FrontierBrain[] = [
  FrontierBrain.Brandon,
  FrontierBrain.Greta,
  FrontierBrain.Lucy,
  FrontierBrain.Noland,
  FrontierBrain.Anabel,
  FrontierBrain.Spenser,
  FrontierBrain.Tucker,
];

export const FRONTIER_BRAIN_NAMES: Record<FrontierBrain, string> = {
  [FrontierBrain.Brandon]: 'Brandon',
  [FrontierBrain.Greta]: 'Greta',
  [FrontierBrain.Lucy]: 'Lucy',
  [FrontierBrain.Noland]: 'Noland',
  [FrontierBrain.Anabel]: 'Anabel',
  [FrontierBrain.Spenser]: 'Spenser',
  [FrontierBrain.Tucker]: 'Tucker',
};

/** The house each of them keeps, which is what the rule is named for */
export const FRONTIER_FACILITY_NAMES: Record<FrontierBrain, string> = {
  [FrontierBrain.Brandon]: 'Battle Pyramid',
  [FrontierBrain.Greta]: 'Battle Arena',
  [FrontierBrain.Lucy]: 'Battle Pike',
  [FrontierBrain.Noland]: 'Battle Factory',
  [FrontierBrain.Anabel]: 'Battle Tower',
  [FrontierBrain.Spenser]: 'Battle Palace',
  [FrontierBrain.Tucker]: 'Battle Dome',
};

export const FRONTIER_BRAIN_CHARSETS: Record<FrontierBrain, string[]> = {
  [FrontierBrain.Brandon]: ['characters/rse/brandon'],
  [FrontierBrain.Greta]: ['characters/rse/greta'],
  [FrontierBrain.Lucy]: ['characters/rse/lucy'],
  [FrontierBrain.Noland]: ['characters/rse/noland'],
  [FrontierBrain.Anabel]: ['characters/rse/anabel'],
  [FrontierBrain.Spenser]: ['characters/rse/spenser'],
  [FrontierBrain.Tucker]: ['characters/rse/tucker'],
};

/**
 * The pair each facility hangs on the shelf.
 *
 * Silver for taking the house. Holding it is what brings the Brain's
 * second three out the next time, and taking **that** is the gold
 * one: the two symbols are two different fights rather than one
 * fight scored two ways
 */
export const FRONTIER_BRAIN_SYMBOLS: Record<FrontierBrain, [silver: Awards, gold: Awards]> = {
  [FrontierBrain.Brandon]: [Awards.SilverBraveSymbol, Awards.GoldBraveSymbol],
  [FrontierBrain.Greta]: [Awards.SilverGutsSymbol, Awards.GoldGutsSymbol],
  [FrontierBrain.Lucy]: [Awards.SilverLuckSymbol, Awards.GoldLuckSymbol],
  [FrontierBrain.Noland]: [Awards.SilverKnowledgeSymbol, Awards.GoldKnowledgeSymbol],
  [FrontierBrain.Anabel]: [Awards.SilverAbilitySymbol, Awards.GoldAbilitySymbol],
  [FrontierBrain.Spenser]: [Awards.SilverSpiritsSymbol, Awards.GoldSpiritsSymbol],
  [FrontierBrain.Tucker]: [Awards.SilverTacticsSymbol, Awards.GoldTacticsSymbol],
};

/**
 * The three they field.
 *
 * Three rather than six is the Frontier's own shape, and it is the
 * whole reason a house rule bites: fighting bare across three
 * pokemon is a constraint, across six it is a nuisance. Both are the
 * teams they defend their houses with in Emerald
 */
export const FRONTIER_BRAIN_PARTIES: Record<FrontierBrain, Species[]> = {
  // The Pyramid King fields the three that were sealed in chambers,
  // which is the one party in the game a legendary belongs to
  [FrontierBrain.Brandon]: [Species.Regirock, Species.Regice, Species.Registeel],
  [FrontierBrain.Greta]: [Species.Umbreon, Species.Hariyama, Species.Shedinja],
  [FrontierBrain.Lucy]: [Species.Seviper, Species.Shuckle, Species.Milotic],
  // Nobody's: the Factory rents to its own keeper too, so his three
  // are rolled out of the same crate the challenger's come from
  [FrontierBrain.Noland]: [],
  // The Tower's own three, and the hardest hand in the game: an
  // Entei among them, which is what a house with no rule has instead
  // of one
  [FrontierBrain.Anabel]: [Species.Alakazam, Species.Entei, Species.Snorlax],
  // Three that read as three different temperaments, which is what
  // the Palace is asking about
  [FrontierBrain.Spenser]: [Species.Crobat, Species.Slaking, Species.Lapras],
  // Nobody's either, and for the opposite reason to Noland's: the
  // Dome names nobody until the challenger has, and then answers them
  [FrontierBrain.Tucker]: [],
};

/**
 * And the second hand, fielded once the challenger holds that
 * house's silver symbol.
 *
 * A Brain is fought twice in the mainline and the second meeting is
 * its own fight rather than a rematch, so it is its own party here
 * too. Brandon's three are the same either time, which is the
 * mainline's own answer: what he changes between them is the level
 * and the loadout, not who is in the crate. Noland names nobody
 * twice over, since the Factory rents both meetings
 */
export const FRONTIER_BRAIN_GOLD_PARTIES: Record<FrontierBrain, Species[]> = {
  [FrontierBrain.Brandon]: [Species.Regirock, Species.Regice, Species.Registeel],
  [FrontierBrain.Greta]: [Species.Gengar, Species.Breloom, Species.Umbreon],
  [FrontierBrain.Lucy]: [Species.Seviper, Species.Steelix, Species.Gyarados],
  [FrontierBrain.Noland]: [],
  [FrontierBrain.Anabel]: [Species.Raikou, Species.Snorlax, Species.Latios],
  [FrontierBrain.Spenser]: [Species.Arcanine, Species.Slaking, Species.Suicune],
  [FrontierBrain.Tucker]: [],
};

/**
 * What a house fields against this challenger: its second three where
 * they already hold its silver symbol, its first where they do not
 */
export function getFrontierParty(brain: FrontierBrain, gold: boolean): Species[] {
  return gold ? FRONTIER_BRAIN_GOLD_PARTIES[brain] : FRONTIER_BRAIN_PARTIES[brain];
}

/**
 * How many a side a Frontier fight is fought with, the house's rather
 * than the league's
 */
export const FRONTIER_TEAM_SIZE = 3;

/**
 * The house rules, one per facility.
 *
 * A rule is stored on the battle it was fought under, the way the
 * limits and the sky are, so a fight replays as the fight it was
 */
export const enum FrontierRule {
  /** No rule at all: the fight is the ordinary one */
  None = 0,
  /**
   * The Pyramid, walked with nothing in hand. Neither side holds an
   * item, so a Focus Sash and a bag of berries are worth nothing and
   * the three pokemon are the whole of what was brought
   */
  Bare = 1,
  /**
   * The Arena, judged. The fight is stopped on the clock, and the
   * side with the greater share of its health still standing takes
   * it, which is the closest a real-time fight comes to being scored
   */
  Timed = 2,
  /**
   * The Pike, walked through a curtain. What is behind it is rolled
   * when the challenge is taken and it lands on the challenger's
   * party alone: the house is not walking through its own rooms
   */
  Curtained = 3,
  /**
   * The Factory, fought with three the house lends. Neither side
   * brings its own, so nothing of the challenger's is on the field
   * and nothing of theirs comes off it: no health lost, no item
   * spent, no candy earned. What is being tested is what they can do
   * with three pokemon they have never met
   */
  Rented = 4,
  /**
   * The Palace, fought on temperament. Every pokemon on the field
   * picks by its own nature rather than on the merits of the move,
   * so which three are brought is a question of who they are and not
   * of what they cover
   */
  Natured = 5,
  /**
   * The Dome, answered. The house names nobody until the challenger
   * has: its three are drawn once the party is frozen, one apiece
   * against what was brought, so a team that covers everything covers
   * nothing here
   */
  Countered = 6,
}

export const FRONTIER_BRAIN_RULES: Record<FrontierBrain, FrontierRule> = {
  [FrontierBrain.Brandon]: FrontierRule.Bare,
  [FrontierBrain.Greta]: FrontierRule.Timed,
  [FrontierBrain.Lucy]: FrontierRule.Curtained,
  [FrontierBrain.Noland]: FrontierRule.Rented,
  // The Tower asks nothing, which is the point of it: it is the
  // fight the other four are read against
  [FrontierBrain.Anabel]: FrontierRule.None,
  [FrontierBrain.Spenser]: FrontierRule.Natured,
  [FrontierBrain.Tucker]: FrontierRule.Countered,
};

/**
 * How long the Arena gives a fight before it is judged. Ten mainline
 * turns, which is the shape the facility judges in: long enough for
 * three a side to commit to something, short enough that stalling is
 * a decision rather than a plan
 */
export const FRONTIER_TIME_TURNS = 10;
export const FRONTIER_TIME_LIMIT = turns(FRONTIER_TIME_TURNS);

/**
 * What a Brain asks to see: the crown of the region their house
 * stands in. The Frontier is what a league is walked to reach, so
 * nobody is admitted who has not taken one
 */
export const FRONTIER_BRAIN_TITLES: Record<FrontierBrain, Awards> = {
  [FrontierBrain.Brandon]: Awards.HoennChampion,
  [FrontierBrain.Greta]: Awards.HoennChampion,
  [FrontierBrain.Lucy]: Awards.HoennChampion,
  [FrontierBrain.Noland]: Awards.HoennChampion,
  [FrontierBrain.Anabel]: Awards.HoennChampion,
  [FrontierBrain.Spenser]: Awards.HoennChampion,
  [FrontierBrain.Tucker]: Awards.HoennChampion,
};

/**
 * What is behind the Pike's curtain.
 *
 * The mainline's rooms come to the same handful of things: something
 * is wrong with your party on the far side, or somebody was kind. The
 * roll is taken when the challenge is accepted and baked into the
 * party as it is frozen, so what the curtain did is part of the fight
 * rather than something rolled again on every watch
 */
export const enum PikeCurtain {
  Poisoned = 0,
  Burned = 1,
  Paralysed = 2,
  Asleep = 3,
  /** The kind room: the party walks out mended, whatever it walked in as */
  Healed = 4,
}

/**
 * The curtains, in the order they are drawn from. Four of the five
 * cost something and one of them gives, which is the Pike's whole
 * character: it is the one house where walking in is a gamble rather
 * than a test
 */
export const PIKE_CURTAINS: PikeCurtain[] = [
  PikeCurtain.Poisoned,
  PikeCurtain.Burned,
  PikeCurtain.Paralysed,
  PikeCurtain.Asleep,
  PikeCurtain.Healed,
];

/** The status each curtain leaves on the party, or null for the kind one */
export const PIKE_CURTAIN_STATUSES: Record<PikeCurtain, Statuses | null> = {
  [PikeCurtain.Poisoned]: Statuses.Poisoned,
  [PikeCurtain.Burned]: Statuses.Burned,
  [PikeCurtain.Paralysed]: Statuses.Paralyzed,
  [PikeCurtain.Asleep]: Statuses.Sleeping,
  [PikeCurtain.Healed]: null,
};

/** What each curtain is called, for the line the fight is announced with */
export const PIKE_CURTAIN_NAMES: Record<PikeCurtain, string> = {
  [PikeCurtain.Poisoned]: 'poisoned',
  [PikeCurtain.Burned]: 'burned',
  [PikeCurtain.Paralysed]: 'paralysed',
  [PikeCurtain.Asleep]: 'put to sleep',
  [PikeCurtain.Healed]: 'mended',
};

/**
 * Which curtain a roll in [0, 1) draws. Taken from the stop rather
 * than from the clock, so the same challenge is the same room however
 * many times it is looked at
 */
export function pickPikeCurtain(roll: number): PikeCurtain {
  const at = Math.floor(Math.abs(roll) * PIKE_CURTAINS.length);

  return PIKE_CURTAINS[Math.min(at, PIKE_CURTAINS.length - 1)];
}

/**
 * What the Factory has in its crate.
 *
 * Everything an expert could field, from every region: the fully
 * evolved and the single-line species, legendaries and lair residents
 * left out the way every expert pool leaves them out. It is the one
 * pool that widens on its own — every generation registered puts more
 * in the crate, and the house is the harder for it, which is the
 * right way round for a rented fight
 */
export function getRentalPool(): Species[] {
  return getWorldExpertPool({ types: [] });
}

/**
 * How many the Factory lays out for the challenger to choose from.
 * Six for three: the choice is the fight, since nothing in the crate
 * is anybody's and none of it can be looked up beforehand
 */
export const FRONTIER_RENTAL_OFFER = 6;
