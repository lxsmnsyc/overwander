import { type InventoryEntry, getInventory } from '../../auth/inventory';
import { hasVisited } from '../../auth/npcs';
import { getProfile } from '../../auth/profile';
import type Npc from '../../data/ids/npcs';
import { type NpcVisit, getNpc } from '../../overworld/npcs';
import type ChunkSnapshot from '../../overworld/chunk-snapshot';
import { type ConversationHandle, converse } from '../forms/conversation';
import { HeadingPortrait } from '../forms/terms';
import type { ToastRequest } from '../styled';
import NpcSprite from './NpcSprite';

export interface VisitOptions {
  npc: Npc;
  cell: number;
  snapshot: ChunkSnapshot;
  player: string;
  /** The style they turned up in this window */
  sheet?: string;
  notify: (toast: ToastRequest) => void;
  changed: () => void;
}

/**
 * Walk up to somebody and talk: their definition says who they are,
 * and its script is what they do. Whoever serves once a window and has
 * already served this player says so instead of running their script
 */
export function visitNpc(options: VisitOptions): ConversationHandle {
  const data = getNpc(options.npc);
  const load = data.interact;

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
      if (load == null) {
        await talk.say(data.quote);
        return;
      }
      // Loaded here rather than with the world, the first time anybody talks to them
      const { default: script } = await load();

      await script(visit);
    },
  );
}
