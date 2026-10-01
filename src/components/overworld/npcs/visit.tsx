import { type InventoryEntry, getInventory } from '../../../auth/inventory';
import { hasVisited } from '../../../auth/npcs';
import { getProfile } from '../../../auth/profile';
import type { Items } from '../../../data/ids/items';
import type Npc from '../../../data/overworld/npc';
import { getNpcData } from '../../../data/overworld/npc';
import type ChunkSnapshot from '../../../overworld/chunk-snapshot';
import { type Conversation, type ConversationHandle, converse } from '../../forms/conversation';
import { HeadingPortrait } from '../../forms/terms';
import type { ToastRequest } from '../../styled';
import NpcSprite from '../NpcSprite';

/**
 * What an NPC's script is handed: the conversation to talk through,
 * who and where it is, and the player's purse and bag, read fresh on
 * every ask. Everything a script does to the world still goes through
 * a server function, which derives the NPC again from the cell
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

export interface VisitOptions {
  npc: Npc;
  cell: number;
  snapshot: ChunkSnapshot;
  player: string;
  /** The style they turned up in this window */
  sheet?: string;
  script?: NpcScript;
  notify: (toast: ToastRequest) => void;
  changed: () => void;
}

/**
 * Walk up to somebody and talk. Whoever serves once a window and has
 * already served this player says so instead of running their script
 */
export function visitNpc(options: VisitOptions): ConversationHandle {
  const data = getNpcData(options.npc);

  return converse(
    {
      name: data.name,
      greeting: data.quote,
      portrait: () => (
        <HeadingPortrait>
          <NpcSprite npc={options.npc} sheet={options.sheet} size={28} label="" />
        </HeadingPortrait>
      ),
    },
    async (talk) => {
      const bag = async (): Promise<InventoryEntry[]> => getInventory(options.player);
      const visit: NpcVisit = {
        ...talk,
        npc: options.npc,
        cell: options.cell,
        snapshot: options.snapshot,
        player: options.player,
        notify: options.notify,
        changed: options.changed,
        gold: async () => (await getProfile(options.player))?.gold ?? 0,
        bag,
        carrying: async (item) => {
          for (const entry of await bag()) {
            if (entry.item === item) {
              return entry.amount;
            }
          }
          return 0;
        },
      };

      if (
        data.visit != null &&
        (await hasVisited(options.snapshot, data.visit, options.cell)) &&
        data.spent != null
      ) {
        await talk.say(data.spent);
        return;
      }
      if (options.script == null) {
        await talk.say(data.quote);
        return;
      }
      await options.script(visit);
    },
  );
}
