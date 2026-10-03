import type { InventoryEntry } from '../../auth/inventory';
import type { Items } from '../../data/ids/items';
import type Npc from '../../data/ids/npcs';
import type ChunkSnapshot from '../chunk-snapshot';
import type { Conversation } from '../../components/forms/conversation';
import type { ToastRequest } from '../../components/styled';

/**
 * What a script is handed: the conversation to talk through, who and
 * where it is, and the player's purse and bag, read fresh on every ask.
 * Everything a script changes still goes through a server function,
 * which derives the NPC again from the cell
 */
export interface NpcVisit extends Conversation {
  npc: Npc;
  /** The chunk's cell they stand on, which the server re-derives them from */
  cell: number;
  snapshot: ChunkSnapshot;
  player: string;
  /** Say what arrived or what it cost, over the world, outliving the conversation */
  notify: (toast: ToastRequest) => void;
  /** Tell the screen behind that something about the player changed */
  changed: () => void;
  gold: () => Promise<number>;
  bag: () => Promise<InventoryEntry[]>;
  /** How many of one item the player carries */
  carrying: (item: Items) => Promise<number>;
}

/** What happens when a player walks up to somebody */
export type NpcScript = (visit: NpcVisit) => Promise<void>;

export interface NpcDefinition {
  id: Npc;
  name: string;
  /** What they are for, said to a player in a line */
  description: string;
  /** What they open with when walked up to */
  quote: string;
  /** What they say instead, once their one visit this window is spent */
  spent?: string;
  /**
   * The charsets they may turn up wearing. Which one is standing there
   * is the window's roll, see `ChunkSnapshot.getWandererCoats`
   */
  sprites: string[];
  /** The visit the server claims when they serve, for those who serve once a window */
  visit?: string;
  /**
   * Whether they pass through wandering cells, 3 hours at a time. The
   * roll is world generation: a new wanderer moves who stands on every
   * existing cell
   */
  wanders?: boolean;
  /** Whether they keep a crate to buy from, and take what a player sells */
  shop?: boolean;
  /**
   * Their script, loaded the first time somebody talks to them. Left
   * out for those met through a challenge rather than a conversation.
   * A loader rather than the function, so the server and world
   * generation can read who they are without the forms they ask through
   */
  interact?: () => Promise<{ default: NpcScript }>;
}

/** One of the people, defined in one place: who they are and what they do */
export function createNpc(id: Npc, definition: Omit<NpcDefinition, 'id'>): NpcDefinition {
  return { id, ...definition };
}
