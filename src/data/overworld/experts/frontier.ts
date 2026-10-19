import * as v from 'valibot';
import turns from '../../../battle/turn';
import type Awards from '../../ids/awards';
import FrontierBrain, { FrontierRule } from '../../ids/frontier';
import { AWARD_IDS, FRONTIER_BRAIN_IDS, FRONTIER_RULE_IDS, SPECIES_IDS } from '../../ids/names';
import type { Species } from '../../ids/species';
import { Statuses } from '../../ids/status';
import namesFile from '../../text/en/frontier.yaml';
import Weather from '../weather/kinds';
import { idOf, idsOf } from '../../yaml';
import frontierFile from './frontier.yaml';
import { getWorldExpertPool } from './pools';

export { FrontierBrain, FrontierRule };

/**
 * The Frontier Brains, read out of `frontier.yaml` and
 * `text/en/frontier.yaml`; the numbers and the house rules are
 * `ids/frontier.ts`. What the rules do is the battle's, and the
 * Pike's curtains and the Arcade's panels are below
 */
const BRAIN = v.object({
  rule: v.string(),
  crown: v.string(),
  sheets: v.array(v.string()),
  symbols: v.tuple([v.string(), v.string()]),
  party: v.array(v.string()),
  'gold-party': v.array(v.string()),
});

const TEXT = v.object({ name: v.string(), house: v.string() });

/** Every Brain, in the order they are numbered */
export const FRONTIER_BRAINS: FrontierBrain[] = [];

export const FRONTIER_BRAIN_NAMES: Record<number, string> = {};

/** The house each of them keeps, which is what the rule is named for */
export const FRONTIER_FACILITY_NAMES: Record<number, string> = {};

/** The sheets each is seen in */
export const FRONTIER_BRAIN_CHARSETS: Record<number, string[]> = {};

/**
 * The pair each facility hangs on the shelf.
 *
 * Silver for taking the house. Holding it is what brings the Brain's
 * second three out the next time, and taking **that** is the gold
 * one: the two symbols are two different fights rather than one
 * fight scored two ways
 */
export const FRONTIER_BRAIN_SYMBOLS: Record<number, [silver: Awards, gold: Awards]> = {};

/**
 * The three they field the first time. Three rather than six is the
 * Frontier's own shape, and it is the whole reason a house rule bites:
 * fighting bare across three pokemon is a constraint, across six it is
 * a nuisance
 */
export const FRONTIER_BRAIN_PARTIES: Record<number, Species[]> = {};

/**
 * And the second hand, fielded once the challenger holds that house's
 * silver symbol. A Brain is fought twice in the mainline and the
 * second meeting is its own fight rather than a rematch
 */
export const FRONTIER_BRAIN_GOLD_PARTIES: Record<number, Species[]> = {};

/** The rule each house is fought under */
export const FRONTIER_BRAIN_RULES: Record<number, FrontierRule> = {};

/**
 * What a Brain asks to see: the crown of the region their house
 * stands in. The Frontier is what a league is walked to reach, so
 * nobody is admitted who has not taken one
 */
export const FRONTIER_BRAIN_TITLES: Record<number, Awards> = {};

for (const [name, written] of Object.entries(v.parse(v.record(v.string(), BRAIN), frontierFile))) {
  const where = `frontier.yaml: ${name}`;
  const brain = idOf<FrontierBrain>(FRONTIER_BRAIN_IDS, name, where);
  const [silver, gold] = idsOf<Awards>(AWARD_IDS, written.symbols, where);

  FRONTIER_BRAINS.push(brain);
  FRONTIER_BRAIN_RULES[brain] = idOf<FrontierRule>(FRONTIER_RULE_IDS, written.rule, where);
  FRONTIER_BRAIN_TITLES[brain] = idOf<Awards>(AWARD_IDS, written.crown, where);
  FRONTIER_BRAIN_CHARSETS[brain] = written.sheets;
  FRONTIER_BRAIN_SYMBOLS[brain] = [silver, gold];
  FRONTIER_BRAIN_PARTIES[brain] = idsOf<Species>(SPECIES_IDS, written.party, where);
  FRONTIER_BRAIN_GOLD_PARTIES[brain] = idsOf<Species>(SPECIES_IDS, written['gold-party'], where);
}
FRONTIER_BRAINS.sort((one, two) => one - two);

for (const [name, said] of Object.entries(v.parse(v.record(v.string(), TEXT), namesFile))) {
  const brain = idOf<FrontierBrain>(FRONTIER_BRAIN_IDS, name, `text/en/frontier.yaml: ${name}`);

  FRONTIER_BRAIN_NAMES[brain] = said.name;
  FRONTIER_FACILITY_NAMES[brain] = said.house;
}

// Every Brain the enum has is written down, so no house stands empty or nameless
for (const [name, brain] of Object.entries(FRONTIER_BRAIN_IDS)) {
  if (!Object.hasOwn(FRONTIER_BRAIN_RULES, brain) || !Object.hasOwn(FRONTIER_BRAIN_NAMES, brain)) {
    throw new Error(`${name} needs a record in frontier.yaml and a name in text/en`);
  }
}

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
 * How long the Arena gives a fight before it is judged. Ten mainline
 * turns, which is the shape the facility judges in: long enough for
 * three a side to commit to something, short enough that stalling is
 * a decision rather than a plan
 */
export const FRONTIER_TIME_TURNS = 10;
export const FRONTIER_TIME_LIMIT = turns(FRONTIER_TIME_TURNS);

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
 * What the Arcade's roulette lands on.
 *
 * The panel is rolled when the challenge is taken and it lands on
 * both sides, which is what tells it from the Pike's curtain: the
 * Arcade changes the fight, the Pike changes the challenger
 */
export const enum ArcadePanel {
  Sun = 0,
  Rain = 1,
  Sandstorm = 2,
  Hail = 3,
  /** Every held item on the field is left at the door */
  Stripped = 4,
  /** Everybody on the field walks in poisoned */
  Poisoned = 5,
  /** And the kind panel: everybody walks in whole */
  Mended = 6,
}

export const ARCADE_PANELS: ArcadePanel[] = [
  ArcadePanel.Sun,
  ArcadePanel.Rain,
  ArcadePanel.Sandstorm,
  ArcadePanel.Hail,
  ArcadePanel.Stripped,
  ArcadePanel.Poisoned,
  ArcadePanel.Mended,
];

/** The sky a panel puts over the fight, or null for one that is not weather */
export const ARCADE_PANEL_WEATHER: Record<ArcadePanel, Weather | null> = {
  [ArcadePanel.Sun]: Weather.Heatwave,
  [ArcadePanel.Rain]: Weather.Rain,
  [ArcadePanel.Sandstorm]: Weather.Sandstorm,
  [ArcadePanel.Hail]: Weather.Hail,
  [ArcadePanel.Stripped]: null,
  [ArcadePanel.Poisoned]: null,
  [ArcadePanel.Mended]: null,
};

/** What each panel is called, for the line the fight is announced with */
export const ARCADE_PANEL_NAMES: Record<ArcadePanel, string> = {
  [ArcadePanel.Sun]: 'the sun comes out',
  [ArcadePanel.Rain]: 'the rain comes down',
  [ArcadePanel.Sandstorm]: 'the sand comes up',
  [ArcadePanel.Hail]: 'the hail comes down',
  [ArcadePanel.Stripped]: 'every held item is left at the door',
  [ArcadePanel.Poisoned]: 'everybody is poisoned',
  [ArcadePanel.Mended]: 'everybody is mended',
};

/**
 * Which panel a roll in [0, 1) lands on. Taken from the stop rather
 * than from the clock, the way the Pike's room is, so the same
 * challenge is the same fight however many times it is watched
 */
export function pickArcadePanel(roll: number): ArcadePanel {
  const at = Math.floor(Math.abs(roll) * ARCADE_PANELS.length);

  return ARCADE_PANELS[Math.min(at, ARCADE_PANELS.length - 1)];
}

/**
 * What a panel does to a party on the way in, said in the Pike's own
 * terms so both houses bake their room into the frozen snapshot the
 * same way. Null for a panel that leaves the parties alone
 */
export function arcadeCurtain(panel: ArcadePanel | undefined): PikeCurtain | undefined {
  if (panel === ArcadePanel.Poisoned) {
    return PikeCurtain.Poisoned;
  }
  return panel === ArcadePanel.Mended ? PikeCurtain.Healed : undefined;
}

/**
 * How many a side this house fights with: one at the Hall, three
 * everywhere else
 */
export function frontierTeamSize(rules: FrontierRule): number {
  return rules === FrontierRule.Singled ? 1 : FRONTIER_TEAM_SIZE;
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
