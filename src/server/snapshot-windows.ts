import 'server-only';
import type { SpawnRoll } from '../auth/snapshot-record';
import { WORLD_GENERATION } from '../overworld/current';
import { asOffset, toZoneKey } from '../auth/local-time';
import { getSql, tx } from './db';
import { asNumber } from './read';

/**
 * A chunk's stored spawn windows, one per zone, in the loose shape
 * `asSnapshotRecord` reads. Given an offset, only that zone's window
 */
export async function readSnapshotWindows(seed: string, offset?: number): Promise<unknown[]> {
  const sql = getSql();
  const zone = offset == null ? null : toZoneKey(asOffset(offset));
  const [windows, spawns] = await Promise.all([
    sql`select zone, utc_offset, window_at from snapshots
        where generation = ${WORLD_GENERATION} and chunk_seed = ${seed}
        ${zone == null ? sql`` : sql`and zone = ${zone}`}`,
    sql`select zone, species, individual_value, trait_value from snapshot_spawns
        where generation = ${WORLD_GENERATION} and chunk_seed = ${seed}
        ${zone == null ? sql`` : sql`and zone = ${zone}`}
        order by zone, idx`,
  ]);
  const rolls = new Map<string, unknown[]>();

  for (const row of spawns) {
    const key = String(row.zone);

    rolls.set(key, [
      ...(rolls.get(key) ?? []),
      {
        species: asNumber(row.species),
        individualValue: asNumber(row.individual_value),
        traitValue: asNumber(row.trait_value),
      },
    ]);
  }

  const found: unknown[] = [];

  for (const row of windows) {
    found.push({
      seed,
      offset: asNumber(row.utc_offset),
      timestamp: asNumber(row.window_at),
      spawns: rolls.get(String(row.zone)) ?? [],
    });
  }
  return found;
}

/**
 * Store a chunk's window for the offset's zone. Only a later window
 * replaces a stored one, so two racing publishers converge
 */
export async function writeSnapshotWindow(
  seed: string,
  offset: number,
  windowAt: number,
  spawns: SpawnRoll[],
): Promise<void> {
  const zoneOffset = asOffset(offset);
  const zone = toZoneKey(zoneOffset);

  await tx(async (sql) => {
    const stored = await sql`
      insert into snapshots (generation, chunk_seed, zone, utc_offset, window_at)
      values (${WORLD_GENERATION}, ${seed}, ${zone}, ${zoneOffset}, ${windowAt})
      on conflict (generation, chunk_seed, zone) do update
        set utc_offset = excluded.utc_offset, window_at = excluded.window_at
        where snapshots.window_at < excluded.window_at
      returning 1
    `;

    if (stored.length === 0) {
      return;
    }
    await sql`
      delete from snapshot_spawns
      where generation = ${WORLD_GENERATION} and chunk_seed = ${seed} and zone = ${zone}
    `;
    if (spawns.length === 0) {
      return;
    }

    const rows: Record<string, unknown>[] = [];

    for (const [idx, spawn] of spawns.entries()) {
      rows.push({
        generation: WORLD_GENERATION,
        chunk_seed: seed,
        zone,
        idx,
        species: spawn.species,
        individual_value: spawn.individualValue,
        trait_value: spawn.traitValue,
      });
    }
    await sql`insert into snapshot_spawns ${sql(rows)}`;
  });
}
