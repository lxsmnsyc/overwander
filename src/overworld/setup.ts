import type { Buddy } from './core';
import Overworld from './core';
import setupOverworldAbilities from './abilities/gen-1';
import setupOverworldCandyItems from './items/candy-items';
import setupOverworldIncenses from './items/incenses';
import setupOverworldItems from './items/key-items';
import setupOverworldTrinkets from './items/trinkets';

/**
 * Build the overworld one player walks in: the engine, then every
 * field ability and held-item effect registered against it. The ones
 * their buddy does not have register nothing, so a player walking
 * alone gets a bare engine that answers every question plainly.
 *
 * Both sides build one — the client to show the player what is
 * standing in front of them, the server to stage exactly that — and
 * because every roll is seeded from the subject and the player, the
 * two agree without talking to each other
 */
export default function createOverworld(player: string, buddy: Buddy | null): Overworld {
  const overworld = new Overworld(player, buddy);

  setupOverworldAbilities(overworld);
  setupOverworldItems(overworld);
  setupOverworldIncenses(overworld);
  setupOverworldTrinkets(overworld);
  setupOverworldCandyItems(overworld);

  return overworld;
}
