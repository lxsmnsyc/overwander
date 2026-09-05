import 'server-only';
import ChunkSnapshot, { SNAPSHOT_INTERVAL } from '../../overworld/chunk-snapshot';
import getWorld from '../../overworld/current';
import { getSql, jsonOf, tx } from '../db';
import { asOffset, toLocalTime, toZoneKey } from '../../auth/local-time';
import { asNumber, asRecordArray } from '../read';

/**
 * The one claim a cell gets: whoever writes the marker first has it,
 * and everybody after reads the refusal
 */
/**
 * The chunk's live window in one zone, as stored. A window nobody has
 * opened yet, or one that has expired, pays nothing: refreshing it is
 * the client's shared-world business, and a claim against a stale
 * window is a claim against a landmark that is no longer there.
 *
 * The instant is the server's; the zone is the caller's, and
 * everything derived from it (the window, the rolls, the claim
 * markers) is scoped by it, so a client that invents a zone gets that
 * zone's world rather than a second helping of its own
 */
export async function resolveSnapshot(
  x: number,
  y: number,
  now: number,
  offset: number,
): Promise<ChunkSnapshot | null> {
  const chunk = getWorld().getChunk(x, y);
  const zone = asOffset(offset);
  const rows = await getSql()`
    select window_at from snapshots
    where chunk_seed = ${chunk.seed} and zone = ${toZoneKey(zone)}
  `;
  const timestamp = asNumber(rows[0]?.window_at);

  if (timestamp === 0 || toLocalTime(now, zone) >= timestamp + SNAPSHOT_INTERVAL) {
    return null;
  }
  return new ChunkSnapshot(chunk, timestamp, zone);
}

/**
 * Take a claim marker, or find it already taken. One marker per
 * landmark, window and player, so a landmark pays each player once
 * per window and regenerates with the next one
 */
export async function claim(table: string, id: string, record: ClaimRecord): Promise<boolean> {
  return writeClaim(table, id, record);
}

/**
 * What a claim writer takes: who is claiming, and whatever the table
 * keeps beside the marker
 */
export interface ClaimRecord {
  player: string;
  [extra: string]: unknown;
}

/** The phenomenon kinds as the table stores them */
const PHENOMENON_KINDS: Record<string, number> = { item: 0, encounter: 1, egg: 2 };

/**
 * The marker as one insert: the primary key is the whole race, and
 * the row count is the answer. A marker that is already there grants
 * nothing.
 *
 * Every row is stamped with when it was written, which is what the
 * hourly sweep reads: a marker whose window has rolled can never
 * refuse a second claim again, so it is only taking up room
 */
async function writeClaim(table: string, marker: string, record: ClaimRecord): Promise<boolean> {
  const { player, ...extra } = record;

  return tx(async (transaction) => {
    let inserted: { count: number };

    if (table === 'cache_claims') {
      inserted = await transaction`
        insert into cache_claims (marker, player, claimed_at)
        values (${marker}, ${player}, ${Date.now()})
        on conflict do nothing
      `;
      if (inserted.count > 0) {
        const rows = asRecordArray(extra.items).map((stack) => ({
          marker,
          player,
          item: asNumber(stack.item),
          amount: asNumber(stack.amount),
        }));

        if (rows.length > 0) {
          await transaction`
            insert into cache_claim_items ${transaction(rows, 'marker', 'player', 'item', 'amount')}
          `;
        }
      }
    } else if (table === 'berry_claims') {
      inserted = await transaction`
        insert into berry_claims (marker, player, item, amount, claimed_at)
        values (${marker}, ${player}, ${asNumber(extra.item)}, ${asNumber(extra.amount)},
                ${Date.now()})
        on conflict do nothing
      `;
    } else if (table === 'nest_claims') {
      inserted = await transaction`
        insert into nest_claims (marker, player, species, claimed_at)
        values (${marker}, ${player}, ${asNumber(extra.species)}, ${Date.now()})
        on conflict do nothing
      `;
    } else if (table === 'phenomenon_claims') {
      inserted = await transaction`
        insert into phenomenon_claims (marker, player, kind, claimed_at)
        values (${marker}, ${player}, ${PHENOMENON_KINDS[String(extra.kind)] ?? 0}, ${Date.now()})
        on conflict do nothing
      `;
    } else {
      inserted = await transaction`
        insert into npc_claims (marker, player, payload, claimed_at)
        values (${marker}, ${player}, ${jsonOf(transaction, extra)}, ${Date.now()})
        on conflict do nothing
      `;
    }
    return inserted.count > 0;
  });
}
