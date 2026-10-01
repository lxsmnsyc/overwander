import Npc from '../ids/npcs';

/**
 * Everything about one of the people that is not what they do: who
 * they are, what they say and what they wear. What happens when a
 * player walks up to them is their script, under
 * `src/components/overworld/npcs`, and what the server agrees to is in
 * `src/server/npcs`
 */
export interface NpcData {
  name: string;
  /** What they are for, said to a player in a line */
  description: string;
  /** What they open with when walked up to */
  quote: string;
  /** What they say instead, once their one visit this window is spent */
  spent?: string;
  /**
   * The charsets they may turn up wearing: the community packs' takes
   * on the same figure. Which one is standing there is the window's
   * roll, see `ChunkSnapshot.getWandererCoats`
   */
  sprites: string[];
  /**
   * The visit the server claims when they serve, for those who serve
   * a player once a window. Everyone else can be visited again
   */
  visit?: string;
  /**
   * Whether they pass through wandering cells, 3 hours at a time.
   * The rest keep a landmark of their own: a stall, a counter, a fight
   */
  wanders?: boolean;
  /** Whether they keep a crate to buy from, and take what a player sells */
  shop?: boolean;
}

/**
 * Every role, dressed and given its lines. A `Record` so a role cannot
 * be added without them.
 *
 * Which wanderers are in the roll is read off this in id order, and
 * the roll is part of world generation: marking another role as
 * wandering moves who stands on every existing wandering cell
 */
const NPC_DATA: Record<Npc, NpcData> = {
  [Npc.Breeder]: {
    name: 'Breeder',
    description: 'Breeds two compatible pokemon into an egg, for a fee.',
    quote: 'Two that get along, that is all I ask. I do the matching, you do the walking.',
    spent: 'That pair has done its part. Bring me another when I am next through.',
    sprites: [
      'characters/frlg/camper-f',
      'characters/lgpe/picnicker',
      'characters/dppt/breeder-f',
      'characters/dppt/breeder-m',
      'characters/oras/breeder-f',
      'characters/oras/breeder-m',
      'characters/b2w2/breeder-f',
      'characters/b2w2/breeder-m',
    ],
    visit: 'breed',
    wanders: true,
  },
  [Npc.DaycareLady]: {
    name: 'Daycare Lady',
    description: 'Warms an egg along, halving the steps it has left, for a fee.',
    quote: 'Leave the egg with me a while, dear. Half of what it has left, gone like that.',
    spent: 'I have warmed one for you already, dear. Come back when I am next here.',
    sprites: ['characters/frlg/woman'],
    visit: 'daycare',
    wanders: true,
  },
  [Npc.NurseJoy]: {
    name: 'Nurse Joy',
    description: 'Heals a party for free, as often as asked.',
    quote: 'Oh, hand them over, all of them. No charge. The counter is always open.',
    sprites: ['characters/extra/nurse'],
  },
  [Npc.Groomer]: {
    name: 'Groomer',
    description: 'Grooms a pokemon so it thinks more of its trainer, for a fee.',
    quote: 'One good brushing and it will think the world of you. Shadows? Out of my hands.',
    spent: 'One brushing a visit, that is my rule. Catch me next time.',
    sprites: ['characters/frlg/daisy-oak', 'characters/lgpe/daisy-oak'],
    visit: 'groom',
    wanders: true,
  },
  [Npc.Vendor]: {
    name: 'Vendor',
    description: 'Sells from a market crate and buys near anything.',
    quote:
      'Step up, step up. I sell what is in the crate and buy near anything, long as your purse holds.',
    sprites: ['characters/frlg/shop-keeper'],
    shop: true,
  },
  [Npc.MoveReminder]: {
    name: 'Move Reminder',
    description: 'Brings back a forgotten level-up move, for a Heart Scale.',
    quote: 'Forgotten? Hah. Nothing is ever forgotten. One Heart Scale and I will prove it.',
    sprites: ['characters/frlg/old-man'],
    wanders: true,
  },
  // The grunt and the trainer are met through a challenge rather than a
  // conversation, which says this line too
  [Npc.RocketGrunt]: {
    name: 'Team Rocket Grunt',
    description: 'Bars the way with shadows, and pays out when beaten.',
    quote: 'Wrong path, kid. Three of mine say so.',
    sprites: ['characters/hgss/rocket-f', 'characters/hgss/rocket-m'],
  },
  [Npc.FossilManiac]: {
    name: 'Fossil Maniac',
    description: 'Sells one of the two fossils he carries.',
    quote: 'Dug these up myself! Two beauties, and I will part with one. Just one, mind.',
    spent: 'That was my one to spare. I will have dug up more next time.',
    sprites: ['characters/frlg/ruin-maniac', 'characters/lgpe/poke-maniac'],
    visit: 'fossil',
    wanders: true,
  },
  [Npc.FossilScientist]: {
    name: 'Fossil Scientist',
    description: 'Revives fossils into pokemon, free of charge.',
    quote: 'A fossil? Marvelous! Hand it over. It has waited in there long enough.',
    sprites: ['characters/lgpe/scientist', 'characters/frlg/staff-member'],
    wanders: true,
  },
  [Npc.MoveTutor]: {
    name: 'Move Tutor',
    description: 'Teaches a move a pokemon never grows into, for a Heart Scale.',
    quote: 'Some moves are taught, never grown into. One Heart Scale buys the lesson.',
    sprites: ['characters/frlg/gentleman', 'characters/lgpe/gentleman'],
    wanders: true,
  },
  [Npc.Trainer]: {
    name: 'Trainer',
    description: 'Offers a fair duel, with a purse to the winner.',
    quote: 'You look strong. Prove it. Three of the local best, purse to the winner.',
    sprites: [
      'characters/frlg/ace-trainer-f',
      'characters/frlg/ace-trainer-m',
      'characters/lgpe/ace-trainer',
    ],
  },
  [Npc.Chef]: {
    name: 'Chef',
    description: 'Sells drinks and treats, and buys near anything.',
    quote: 'Fresh off the stove and out of the icebox. Your pokemon carries it, it eats well.',
    sprites: ['characters/frlg/chef'],
    wanders: true,
    shop: true,
  },
  [Npc.Channeler]: {
    name: 'Channeler',
    description: 'Calls up one more ability in a pokemon, for a Heart Scale.',
    quote:
      'There is more in it than it knows. One Heart Scale and I will call it up. What answers is not mine to choose.',
    spent: 'I called up what I could. The rest will keep until I pass this way again.',
    sprites: ['characters/lgpe/channeler'],
    visit: 'channel',
    wanders: true,
  },
  [Npc.Kurt]: {
    name: 'Kurt',
    description: 'Carves apricorns into balls, free of charge.',
    quote:
      'Apricorns, is it? Hand them over. One ball for each, and the colour decides which. No charge, you did the picking.',
    sprites: ['characters/hgss/kurt'],
    wanders: true,
  },
  [Npc.Geologist]: {
    name: 'Geologist',
    description: 'Sells stones and gems, and buys near anything.',
    quote:
      'Every one of these came out of a hillside with my own pick. Stones, gems, the lot. Take your pick of mine.',
    sprites: [
      'characters/frlg/hiker',
      'characters/lgpe/hiker',
      'characters/dppt/hiker',
      'characters/b2w2/hiker',
    ],
    wanders: true,
    shop: true,
  },
  [Npc.DojoMaster]: {
    name: 'Dojo Master',
    description: 'Trains a pokemon to hold one more move, for a Heart Scale.',
    quote:
      'A pokemon can carry more than it thinks. One Heart Scale and I will make room for another move.',
    sprites: [
      'characters/lgpe/black-belt',
      'characters/hgss/black-belt',
      'characters/dppt/black-belt',
      'characters/b2w2/black-belt',
    ],
    wanders: true,
  },
  [Npc.Trader]: {
    name: 'Trader',
    description: 'Swaps one of six far-off pokemon for one of the same sort.',
    quote:
      'Brought these a long way. Any one of them for one of yours, as long as it is the same sort.',
    spent: 'One trade a stop. I will have new faces with me next time.',
    sprites: [
      'characters/b2w2/backpacker-m',
      'characters/b2w2/backpacker-f',
      'characters/dppt/collector',
      'characters/oras/collector',
    ],
    visit: 'swap',
    wanders: true,
  },
  [Npc.HyperTrainer]: {
    name: 'Hyper Trainer',
    description: 'Trains one of a pokemon’s values to the top, for gold by the point.',
    quote:
      'Good is not the same as the best. Show me one and pick the stat, and I will take it all the way. It will cost you.',
    spent: 'One a visit. Bring me the next one when I am back.',
    sprites: ['characters/b2w2/veteran', 'characters/dppt/expert', 'characters/oras/expert'],
    visit: 'hyper',
    wanders: true,
  },
};

/** Who a role is, what they say and what they wear */
export function getNpcData(npc: Npc): NpcData {
  return NPC_DATA[npc];
}

/** Every role with its data, in id order */
export function npcEntries(): [Npc, NpcData][] {
  const entries: [Npc, NpcData][] = [];

  for (const [key, data] of Object.entries(NPC_DATA)) {
    entries.push([Number(key), data]);
  }
  return entries;
}
