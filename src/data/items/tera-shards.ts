import { TYPE_NAMES, Types } from '../constants/types';
import { Items } from '../ids/items';
import type { Species } from '../ids/species';
import { teraTypeOf } from '../species/tera-type';
import { itemText } from './__create';

/**
 * The Tera Shards: one per type, spent fifty at a time to change a
 * catch's Tera type to the shard's. The Stellar Shard is carried but
 * nothing spends it yet.
 */
export const TERA_SHARDS = new Map<Items, Types>([
  [Items.NormalTeraShard, Types.Normal],
  [Items.FireTeraShard, Types.Fire],
  [Items.WaterTeraShard, Types.Water],
  [Items.ElectricTeraShard, Types.Electric],
  [Items.GrassTeraShard, Types.Grass],
  [Items.IceTeraShard, Types.Ice],
  [Items.FightingTeraShard, Types.Fighting],
  [Items.PoisonTeraShard, Types.Poison],
  [Items.GroundTeraShard, Types.Ground],
  [Items.FlyingTeraShard, Types.Flying],
  [Items.PsychicTeraShard, Types.Psychic],
  [Items.BugTeraShard, Types.Bug],
  [Items.RockTeraShard, Types.Rock],
  [Items.GhostTeraShard, Types.Ghost],
  [Items.DragonTeraShard, Types.Dragon],
  [Items.DarkTeraShard, Types.Dark],
  [Items.SteelTeraShard, Types.Steel],
  [Items.FairyTeraShard, Types.Fairy],
  [Items.StellarTeraShard, Types.Stellar],
]);

const SHARD_OF_TYPE = new Map<Types, Items>();

for (const [item, type] of TERA_SHARDS) {
  SHARD_OF_TYPE.set(type, item);
}

/** The shards something spends, which is every one but Stellar */
export function listTypeShards(): Items[] {
  const shards: Items[] = [];

  for (const [item, type] of TERA_SHARDS) {
    if (type !== Types.Stellar) {
      shards.push(item);
    }
  }
  return shards;
}

/** How many shards of a type one change of Tera type costs */
export const TERA_SHARD_COST = 50;

export function isTeraShard(item: Items): boolean {
  return TERA_SHARDS.has(item);
}

/** The type a shard is of, or null for an item that is not one */
export function getTeraShardType(item: Items): Types | null {
  return TERA_SHARDS.get(item) ?? null;
}

/** The shard of a type, for paying out Tera Shards of a boss's Tera type */
export function getTeraShard(type: Types): Items | null {
  return SHARD_OF_TYPE.get(type) ?? null;
}

/**
 * Whether spending these shards would change anything: never Stellar,
 * which nothing takes yet, and never the type it already has
 */
export function takesTeraShard(
  caught: { species: Species; teraType?: Types | null },
  item: Items,
): boolean {
  const type = getTeraShardType(item);

  return type != null && type !== Types.Stellar && type !== teraTypeOf(caught);
}

export function describeTeraShard(item: Items): string {
  const type = getTeraShardType(item);

  if (type == null) {
    throw new Error(`No Tera Shard line for item #${item}`);
  }
  return itemText('tera-shards', 'shard', { type: TYPE_NAMES[type] });
}
