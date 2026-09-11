import type Biome from '../data/ids/biome';
import { asNumber, asRecord, asString } from './__normalize';

/**
 * A town as the store holds it.
 *
 * Where a town is and what it holds derive from the world seed, so
 * none of that has to be stored and none of it is trusted from here:
 * the server sites the region again before it sends anybody through.
 * The row is for the one thing a derivation cannot do, which is give
 * every town a name no other town has.
 *
 * The coordinates ride along so a list can be drawn without siting
 * every region in the world, which is thousands of biome reads for
 * something that is only going in a dropdown.
 */
export interface TownRecord {
  regionX: number;
  regionY: number;
  /** Unique across the world */
  name: string;
  /** The world cell its middle sits on */
  x: number;
  y: number;
  biome: Biome;
  /** When somebody first walked in, on the server's clock */
  foundAt: number;
}

/** Restore a town from an untyped row, as both sides read it */
export function asTownRecord(value: unknown): TownRecord {
  const data = asRecord(value);

  return {
    regionX: Math.trunc(asNumber(data.regionX)),
    regionY: Math.trunc(asNumber(data.regionY)),
    name: asString(data.name),
    x: Math.trunc(asNumber(data.x)),
    y: Math.trunc(asNumber(data.y)),
    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    biome: asNumber(data.biome) as Biome,
    foundAt: asNumber(data.foundAt),
  };
}
