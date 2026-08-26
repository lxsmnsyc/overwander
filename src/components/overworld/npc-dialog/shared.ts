import type { CaughtPokemon } from '../../../auth/caught';
import { isShadow } from '../../../auth/caught-record';
import { isEgg } from '../../../auth/egg';
import { Items } from '../../../data/ids/items';
import { getItemData } from '../../../data/items';
import { getHeldPowerStat } from '../../../data/items/power-items';
import Npc from '../../../data/overworld/npc';
import type { BreedingParent } from '../../../overworld/breeding';

/**
 * What the person standing there actually says.
 *
 * Each of them is one offer, and the sentence explaining it used to be
 * the dialog's own description — the same line of small grey text
 * every screen in the game has, which is the game explaining rather
 * than somebody talking. Said in their own words and set under them,
 * it reads as the person the player has walked up to, and it says the
 * one thing the row of controls beneath cannot: what this is for.
 *
 * They are quotes, so they are written as quotes
 */
export const NPC_QUOTES: Record<Npc, string> = {
  [Npc.Breeder]: 'Two that get along, that is all I ask. I do the matching, you do the walking.',
  [Npc.DaycareLady]:
    'Leave the egg with me a while, dear. Half of what it has left, gone like that.',
  [Npc.NurseJoy]: 'Oh, hand them over, all of them. No charge. I am here until the day turns.',
  [Npc.Groomer]: 'One good brushing and it will think the world of you. Shadows? Out of my hands.',
  [Npc.Vendor]:
    'Step up, step up. I sell what is in the crate and buy near anything, long as your purse holds.',
  [Npc.MoveReminder]:
    'Forgotten? Hah. Nothing is ever forgotten. One Heart Scale and I will prove it.',
  // The grunt never opens this dialog: walking up to one puts the
  // challenge in `RocketStopDialog`, which says this line instead.
  // They are still one of the people a cell can draw, so their words
  // live with the rest
  [Npc.RocketGrunt]: 'Wrong path, kid. Three of mine say so.',
  [Npc.FossilManiac]:
    'Dug these up myself! Two beauties, and I will part with one. Just one, mind.',
  [Npc.FossilScientist]: 'A fossil? Marvelous! Hand it over. It has waited in there long enough.',
  [Npc.MoveTutor]: 'Some moves are taught, never grown into. One Heart Scale buys the lesson.',
  // The trainer opens `RocketStopDialog` too: a duel is put the same
  // way an ambush is, only asked rather than sprung
  [Npc.Trainer]: 'You look strong. Prove it. Three of the local best, purse to the winner.',
};

/**
 * A catch as the breeding rules read one
 */
export function asParent(caught: CaughtPokemon): BreedingParent {
  const held = new Set(caught.items);

  return {
    species: caught.species,
    gender: caught.gender,
    ivs: caught.ivs,
    moves: caught.moves,
    shadow: isShadow(caught),
    nature: caught.nature,
    ability: caught.abilities[0],
    ball: caught.ball,
    everstone: held.has(Items.Everstone),
    destinyKnot: held.has(Items.DestinyKnot),
    powerStat: getHeldPowerStat(caught.items),
    egg: isEgg(caught),
  };
}

/**
 * What one of these costs, from whichever side of the counter it is
 * being looked at. He charges `buy` and pays `sell`, and `sell` is
 * half of `buy` everywhere
 */
export function priceOf(item: Items, buying: boolean): number {
  const data = getItemData(item);

  return buying ? data.buy : data.sell;
}

/** What a counter's own column is laid out as: one thing at a time, centred */
export const CENTRED = 'items-center text-center';
