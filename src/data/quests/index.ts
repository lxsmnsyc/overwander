import { dexChainId, getDexChain, getDexQuests, getDexRegions } from './dex';
import type { ChainData, Chains, QuestData, Quests } from './types';
import { WRITTEN_CHAINS, WRITTEN_CHAIN_ORDER, WRITTEN_QUESTS } from './written';

/**
 * The quests themselves: requirements against the lifetime counters,
 * rewards paid through the gift machinery, and an optional chain link
 * so a line of them reads as a progression. The written ones are
 * `quests.yaml`, read by `written.ts`; the database only remembers
 * counters and claims.
 *
 * The vocabulary they are written in is in `types.ts`, which the
 * generated pokedex chains in `dex.ts` share
 */

export * from './types';

/**
 * Every chain there is: the written ones, then one pokedex chain per
 * region that has a dex. The generated half is why these are built
 * rather than declared — a region arrives with its chain already in
 * the board's order
 */
export const CHAINS: Record<number, ChainData> = (() => {
  const chains: Record<number, ChainData> = { ...WRITTEN_CHAINS };

  for (const region of getDexRegions()) {
    const chain = getDexChain(region);

    if (chain != null) {
      chains[dexChainId(region)] = chain;
    }
  }
  return chains;
})();

export const CHAIN_ORDER: Chains[] = (() => {
  const order: Chains[] = [...WRITTEN_CHAIN_ORDER];

  for (const region of getDexRegions()) {
    order.push(dexChainId(region));
  }
  return order;
})();

export const QUESTS: Record<number, QuestData> = (() => {
  const quests: Record<number, QuestData> = { ...WRITTEN_QUESTS };

  for (const region of getDexRegions()) {
    for (const [quest, data] of getDexQuests(region)) {
      quests[quest] = data;
    }
  }
  return quests;
})();

/**
 * One quest's definition, or null for an id nothing declares. A claim
 * row outlives the quest it was written for — a region's dex chain can
 * be taken out again — so a reader must be able to ask
 */
export function getQuestData(quest: Quests): QuestData | null {
  return Object.hasOwn(QUESTS, quest) ? QUESTS[quest] : null;
}

/**
 * The quest that has to be claimed before this one unlocks: its
 * predecessor in its chain, or nothing for a chain opener and for
 * every standalone
 */
export function prerequisiteOf(quest: Quests): Quests | null {
  for (const chain of CHAIN_ORDER) {
    const at = CHAINS[chain].quests.indexOf(quest);

    if (at > 0) {
      return CHAINS[chain].quests[at - 1];
    }
  }
  return null;
}

/**
 * The quest this one unlocks by being claimed: its successor in its
 * chain, or nothing for a chain's last quest and for every standalone
 */
export function successorOf(quest: Quests): Quests | null {
  for (const chain of CHAIN_ORDER) {
    const chained = CHAINS[chain].quests;
    const at = chained.indexOf(quest);

    if (at >= 0 && at < chained.length - 1) {
      return chained[at + 1];
    }
  }
  return null;
}

/** Every quest, in the order the list shows them: chain by chain */
export const QUEST_ORDER: Quests[] = (() => {
  const order: Quests[] = [];

  for (const chain of CHAIN_ORDER) {
    order.push(...CHAINS[chain].quests);
  }
  return order;
})();
