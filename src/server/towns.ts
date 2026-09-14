import 'server-only';
import type { TownRecord } from '../auth/town-record';
import getWorld from '../overworld/current';
import { townName, townOfRegion } from '../overworld/town';
import { getSql } from './db';
import { asNumber } from './read';

/**
 * The register of towns anybody has walked into, written with admin
 * credentials.
 *
 * Where a town is, what stands in it and what it is **called** all
 * derive from the world seed, so none of that is stored and none of it
 * is taken from a caller: this sites the region again before it
 * answers. What the table holds is the one fact no derivation can
 * reach, which is whether anybody has been there.
 *
 * It is one shared register rather than a thing each player keeps. A
 * town anybody walked into is a town everybody can cross to.
 */

/** One region filled out into the town standing in it, or null where none does */
function found(regionX: number, regionY: number, foundAt: number): TownRecord | null {
  const town = townOfRegion(getWorld(), regionX, regionY);

  return town == null
    ? null
    : {
        regionX,
        regionY,
        name: townName(town),
        x: town.x,
        y: town.y,
        biome: town.biome,
        foundAt,
      };
}

/**
 * Walk into a town and put it on everybody's map.
 *
 * Nothing is reserved and nothing can clash, since the name falls out
 * of the region the town stands in. The row is the discovery and
 * nothing else, so a second player walking in changes nothing but
 * still gets their answer.
 *
 * Resolves the town, whoever found it, or null when the region holds
 * no town at all
 */
export async function discoverTown(
  uid: string,
  regionX: number,
  regionY: number,
  now: number,
): Promise<TownRecord | null> {
  if (townOfRegion(getWorld(), regionX, regionY) == null) {
    return null;
  }

  // The no-op update is what makes a second walk-in return the row
  // rather than nothing: the finder stays whoever got there first
  const rows = await getSql()`
    insert into towns (region_x, region_y, found_by, found_at)
    values (${regionX}, ${regionY}, ${uid}, ${now})
    on conflict (region_x, region_y) do update set region_x = excluded.region_x
    returning found_at as "foundAt"
  `;

  return rows.at(0) == null ? null : found(regionX, regionY, asNumber(rows[0].foundAt));
}

/**
 * Every town anybody has found. The whole list rather than a page of
 * it, because it is what a portal's name box narrows: a player types a
 * few letters and the box knows the rest. It holds what has been
 * walked into rather than what the world grows, which is far less
 */
export async function listTowns(): Promise<TownRecord[]> {
  const rows = await getSql()`
    select region_x as "regionX", region_y as "regionY", found_at as "foundAt"
    from towns
  `;
  const towns: TownRecord[] = [];

  for (const row of rows) {
    const town = found(
      Math.trunc(asNumber(row.regionX)),
      Math.trunc(asNumber(row.regionY)),
      asNumber(row.foundAt),
    );

    // A region that no longer sites a town is a world reseeded under
    // the register. It is not somewhere to send anybody
    if (town != null) {
      towns.push(town);
    }
  }
  return towns.sort((left, right) => left.name.localeCompare(right.name));
}

/** Whether anybody has walked into the town of this region */
export async function isTownFound(regionX: number, regionY: number): Promise<boolean> {
  const rows = await getSql()`
    select 1 from towns where region_x = ${regionX} and region_y = ${regionY}
  `;

  return rows.at(0) != null;
}
