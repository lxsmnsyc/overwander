import { Items } from '../ids/items';
import type { Moves } from '../ids/moves';
import type { Species } from '../ids/species';
import { getLevelUpMoves, getTeachableMoves } from '../species';

/**
 * The people who stand at the world's people landmarks. Most pass
 * through a wandering-NPC cell: the cell is fixed by the chunk seed,
 * the way every landmark is, but who is standing on it is not — every
 * six hours brings somebody else, so the spot is a crossroads rather
 * than a shop. The two who fight, Team Rocket and the duelling
 * trainer, stand at landmarks of their own instead
 */
const enum Npc {
  /**
   * Takes two compatible pokemon and a fee, and hands back an egg
   */
  Breeder = 0,
  /**
   * Takes an egg and a fee, and warms it half a walk's worth further
   * along than it already was
   */
  DaycareLady = 1,
  /**
   * Looks a party over and hands it back whole: health, statuses and
   * — for a shadow — the shadow itself. She charges nothing, and she
   * does it once per window
   */
  NurseJoy = 2,
  /**
   * Takes one pokemon and a fee, and hands it back thinking half
   * again as well of its owner as it did. The daycare lady's trade,
   * done on the pokemon rather than on the egg
   */
  Groomer = 3,
  /**
   * Carries a crate of balls and medicine and a purse, and is the
   * only one of them a player may deal with more than once while he
   * is standing there. What he sells is fixed for the window; what he
   * buys is anything the market puts a price on
   */
  Vendor = 4,
  /**
   * Takes a Heart Scale and puts back a move the pokemon learned by
   * levelling and has since lost. He is the only way a forgotten
   * level-up move ever comes back, and gold is no use to him
   */
  MoveReminder = 5,
  /**
   * Bars the cell and fights whoever accepts, with shadows of the
   * biome's own. Beaten, they pay a purse and leave one of their
   * party behind. Not a wanderer any more: Team Rocket stands at a
   * landmark of its own, and once in a long while it is Giovanni
   */
  RocketGrunt = 6,
  /**
   * Carries two of the three fossils and will part with one for
   * gold. He is the only place a fossil can be bought, and he sells
   * a player one while he is standing there
   */
  FossilManiac = 7,
  /**
   * Takes a fossil and hands back what was in it. He charges nothing
   * but the rock, and — alone among the people who do something to a
   * pokemon — he will do it as often as a player has fossils
   */
  FossilScientist = 8,
  /**
   * Takes gold and puts a move on a pokemon that its species can be
   * taught but never grows into. The reminder's counter run the other
   * way: he deals in what a machine would teach, not in what was lost
   */
  MoveTutor = 9,
  /**
   * Offers a fair duel: three of the biome's own against whatever the
   * player brings, purse on a win. The grunt's fight without the
   * ambush — nothing fielded is a shadow. Like Team Rocket, a
   * landmark of their own rather than a wanderer
   */
  Trainer = 10,
}

export default Npc;

/**
 * Everyone who wanders, for uniform rolls over the variants. The two
 * who fight — the grunt and the trainer — stand at landmarks of their
 * own and are not in it
 */
export const NPCS: Npc[] = [
  Npc.Breeder,
  Npc.DaycareLady,
  Npc.NurseJoy,
  Npc.Groomer,
  Npc.Vendor,
  Npc.MoveReminder,
  Npc.FossilManiac,
  Npc.FossilScientist,
  Npc.MoveTutor,
];

/**
 * The charsets a role may turn up wearing: the community packs' takes
 * on the same figure, FRLG and LGPE where both drew one. Which of a
 * role's styles is standing there is the window's roll — see
 * `ChunkSnapshot.getWandererCoats`. A role listed nowhere would keep
 * its numbered Gen 4 folder; every role is covered today
 */
const NPC_CHARSETS: Partial<Record<Npc, string[]>> = {
  [Npc.Breeder]: ['characters/frlg/camper-f', 'characters/lgpe/picnicker'],
  [Npc.DaycareLady]: ['characters/frlg/woman'],
  [Npc.NurseJoy]: ['characters/extra/nurse'],
  [Npc.Groomer]: ['characters/frlg/daisy-oak', 'characters/lgpe/daisy-oak'],
  [Npc.Vendor]: ['characters/frlg/shop-keeper'],
  [Npc.MoveReminder]: ['characters/frlg/old-man'],
  [Npc.RocketGrunt]: ['characters/hgss/rocket-f', 'characters/hgss/rocket-m'],
  [Npc.FossilManiac]: ['characters/frlg/ruin-maniac', 'characters/lgpe/poke-maniac'],
  [Npc.FossilScientist]: ['characters/lgpe/scientist', 'characters/frlg/staff-member'],
  [Npc.MoveTutor]: ['characters/frlg/gentleman', 'characters/lgpe/gentleman'],
  [Npc.Trainer]: [
    'characters/frlg/ace-trainer-f',
    'characters/frlg/ace-trainer-m',
    'characters/lgpe/ace-trainer',
  ],
};

/**
 * The boss himself, when a Team Rocket stop rolls him: not a role of
 * his own, only the grunt's landmark wearing its rarest face
 */
export const GIOVANNI_CHARSETS: string[] = ['characters/frlg/giovanni', 'characters/hgss/giovanni'];

/**
 * Every charset a wanderer of this role may be drawn with
 */
export function npcSheets(npc: Npc): string[] {
  return NPC_CHARSETS[npc] ?? [`landmarks-npc-${npc}`];
}

/**
 * The role's first style, for anywhere that has no window to roll
 * one: a sheet that has not been drawn yet is a landmark drawn the
 * way it always was, which is the letter in a circle
 */
export function npcSheet(npc: Npc): string {
  return npcSheets(npc)[0];
}

export const NPC_NAMES: Record<Npc, string> = {
  [Npc.Breeder]: 'Breeder',
  [Npc.DaycareLady]: 'Daycare Lady',
  [Npc.NurseJoy]: 'Nurse Joy',
  [Npc.Groomer]: 'Groomer',
  [Npc.Vendor]: 'Vendor',
  [Npc.MoveReminder]: 'Move Reminder',
  [Npc.RocketGrunt]: 'Team Rocket Grunt',
  [Npc.FossilManiac]: 'Fossil Maniac',
  [Npc.FossilScientist]: 'Fossil Scientist',
  [Npc.MoveTutor]: 'Move Tutor',
  [Npc.Trainer]: 'Trainer',
};

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
 * How many pokemon Nurse Joy looks at in one visit. It is a party's
 * worth: she is what a player walks to between raids, not a way to put
 * a whole box right in one stop
 */
export const NURSE_CARE_LIMIT = 6;

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
 * What the reminder can put back on a pokemon: everything its species
 * has learned by levelling up to its level, minus the ones it still
 * knows, in the order it learned them.
 *
 * The list is read off the **species standing in front of him** rather
 * than off any history of the pokemon, because there is no history to
 * read — a record stores the four moves it knows and nothing about the
 * ones it dropped. That makes the rule a simple one to say: he can
 * give back anything this species could have known by now.
 *
 * A pre-evolution's list is not walked. An evolved species relists the
 * moves its line starts with at level 1, which is where it actually
 * learns them, so the chain adds nothing but a way for a Charizard to
 * be offered a move a Charizard never learns
 */
export function getRecallableMoves(
  species: Species,
  level: number,
  known: Iterable<Moves>,
): Moves[] {
  const knows = new Set(known);

  return getLevelUpMoves(species, level).filter((move) => !knows.has(move));
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
export function getTutorableMoves(species: Species, known: Iterable<Moves>): Moves[] {
  const knows = new Set(known);

  return getTeachableMoves(species).filter((move) => !knows.has(move));
}
