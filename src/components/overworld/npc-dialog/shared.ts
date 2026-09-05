import type { CaughtPokemon } from '../../../auth/caught';
import { isShadow } from '../../../auth/caught-record';
import { isEgg } from '../../../auth/egg';
import { Items } from '../../../data/ids/items';
import { getItemData } from '../../../data/items';
import { getHeldPowerStat } from '../../../data/items/power-items';
import Npc, { REMINDER_FEE } from '../../../data/overworld/npc';
import type { BreedingParent } from '../../../overworld/breeding';
import type { JSX, Resource } from 'solid-js';
import type ChunkSnapshot from '../../../overworld/chunk-snapshot';
import type { InventoryEntry } from '../../../auth/inventory';
import type { CatchOption } from '../../catches/catch-picker';
import type { Moves } from '../../../data/ids/moves';
import type { LearnResult } from '../../../auth/learn-refusal';

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
  // challenge in `StopDialog`, which says this line instead.
  // They are still one of the people a cell can draw, so their words
  // live with the rest
  [Npc.RocketGrunt]: 'Wrong path, kid. Three of mine say so.',
  [Npc.FossilManiac]:
    'Dug these up myself! Two beauties, and I will part with one. Just one, mind.',
  [Npc.FossilScientist]: 'A fossil? Marvelous! Hand it over. It has waited in there long enough.',
  [Npc.MoveTutor]: 'Some moves are taught, never grown into. One Heart Scale buys the lesson.',
  // The trainer opens `StopDialog` too: a duel is put the same
  // way an ambush is, only asked rather than sprung
  [Npc.Trainer]: 'You look strong. Prove it. Three of the local best, purse to the winner.',
  [Npc.Chef]: 'Fresh off the stove and out of the icebox. Your pokemon carries it, it eats well.',
  [Npc.Channeler]:
    'There is more in it than it knows. One Heart Scale and I will call it up. What answers is not mine to choose.',
  [Npc.Kurt]:
    'Apricorns, is it? Hand them over. One ball for each, and the colour decides which. No charge, you did the picking.',
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

/**
 * What every counter is handed.
 *
 * One person, one offer: the resources they read, the way to say
 * something landed, and the button that walks away from them. Each
 * counter keeps its own picks and its own status line, so leaving one
 * and walking up to the next starts a fresh conversation
 */
export interface CounterProps {
  player: string;
  snapshot: ChunkSnapshot | null;
  /** Where they stand, which is what the server re-derives them from */
  standing: [cell: number, npc: Npc] | null;
  catches: Resource<CatchOption[]>;
  gold: Resource<number>;
  bag: Resource<InventoryEntry[]>;
  /** Whether the maniac has already sold to this player this window */
  visited: Resource<boolean>;
  /** Whether the daycare lady has already warmed an egg this window */
  warmed: Resource<boolean>;
  onServed: () => void;
  onTraded: () => void;
  onChange?: () => void;
  /**
   * The way out, drawn at the end of every counter's own row. A thunk
   * rather than the element, since it is built here and rendered a
   * component down
   */
  walkOn: () => JSX.Element;
  /**
   * A teaching the counter has agreed to, asked outside this window.
   *
   * The window steps aside while it is up: two modals at once fight
   * for the click that closes them, and a dialog nested in one that
   * closes goes with it
   */
  ask: (question: CounterQuestion | null) => void;
}

/**
 * The player's pokemon as every picker in these dialogs reads them.
 *
 * `latest`, not the resource. Every one of these people writes and
 * then re-reads the list, and a read that suspends takes the panel out
 * for the length of the round trip: handing a party to Nurse Joy would
 * blank the counter mid-sentence
 */
export function optionsOf(props: CounterProps): CatchOption[] {
  return props.catches.latest ?? [];
}

/**
 * How many Heart Scales are in the bag. It is the whole price of a
 * reminder, a lesson and a channelling
 */
export function scalesIn(props: CounterProps): number {
  return (props.bag.latest ?? []).find((entry) => entry.item === REMINDER_FEE)?.amount ?? 0;
}

/** What went wrong, said the way every counter says it */
export function refusal(caught: unknown): string {
  return caught instanceof Error ? caught.message : String(caught);
}

/**
 * What a counter has agreed and cannot ask by itself: whether there is
 * room for the move, and which one goes if there is not
 */
export interface CounterQuestion {
  catchId: string;
  move: Moves;
  /** What it costs, said in the dialog that asks */
  cost: string;
  teach: (catchId: string, move: Moves, replaces: number) => Promise<LearnResult>;
  onTaught: () => void;
}
