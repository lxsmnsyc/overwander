import Landmark from '../data/overworld/landmark';
import { NPC_VISIT_TAGS } from '../data/overworld/npc';
import type ChunkSnapshot from '../overworld/chunk-snapshot';
import { asNumber, asString } from './__normalize';
import { RaidKind, raidId } from './raid-record';
import { seatId } from './gym-seat-record';
import { stopIdOf } from './stop-record';
import getSupabase from './supabase';

/** Where the signed-in player stands with a chunk's landmarks, by cell */
export interface LandmarkStandings {
  /** Lairs whose raid this player won this raid window */
  cleared: Set<number>;
  /** Trainers and grunts this player has beaten this window */
  beaten: Set<number>;
  /** Seats somebody holds, with who holds them */
  seats: Map<number, string>;
  /** Wanderers who have already done their one thing for this player */
  visited: Set<number>;
  /** Nests whose egg this player has already taken this nest window */
  taken: Set<number>;
}

/** The cells whose row id is in `ids`, read back through the id they were asked by */
function cellsOf<K extends string>(
  ids: Map<string, number>,
  rows: Record<K, unknown>[],
  column: K,
): Set<number> {
  const cells = new Set<number>();

  for (const row of rows) {
    const cell = ids.get(asString(row[column]));

    if (cell != null) {
      cells.add(cell);
    }
  }
  return cells;
}

/**
 * Read under row-level security rather than through the server: every
 * row asked for is either public or the player's own
 */
export async function readLandmarkStandings(
  snapshot: ChunkSnapshot,
  uid: string,
): Promise<LandmarkStandings> {
  const { chunk, offset } = snapshot;
  const lairs = new Map<string, number>();
  const stops = new Map<string, number>();
  const seats = new Map<string, number>();
  const visits = new Map<string, number>();

  for (const [cell, landmark] of chunk.getLandmarkCells()) {
    if (landmark === Landmark.LegendaryLair || landmark === Landmark.ShadowLair) {
      const kind = landmark === Landmark.ShadowLair ? RaidKind.Shadow : RaidKind.Legendary;

      lairs.set(raidId(chunk, snapshot.raidTimestamp, cell, kind, offset), cell);
    } else if (landmark === Landmark.GymSeat) {
      seats.set(seatId(chunk, cell), cell);
    }
  }
  // Only the cells that stage somebody this window: a stop row is
  // keyed by the window, so an empty cell has nothing to look up
  for (const cell of [...snapshot.getTrainerStops().keys(), ...snapshot.getRocketStops().keys()]) {
    stops.set(stopIdOf(chunk, snapshot.npcTimestamp, cell, offset), cell);
  }
  for (const [cell, npc] of snapshot.getWanderingNpcs()) {
    const tag = NPC_VISIT_TAGS.get(npc);

    if (tag != null) {
      visits.set(snapshot.visitMarker(tag, cell), cell);
    }
  }
  const nests = new Map<string, number>();

  for (const cell of snapshot.getNests().keys()) {
    nests.set(snapshot.nestMarker(cell), cell);
  }

  const supabase = getSupabase();
  const [rewards, defeated, held, claims, eggs] = await Promise.all([
    lairs.size === 0
      ? null
      : supabase
          .from('raid_rewards')
          .select('raid_id')
          .eq('player', uid)
          .in('raid_id', [...lairs.keys()]),
    stops.size === 0
      ? null
      : supabase
          .from('rocket_stops')
          .select('stop_id')
          .eq('player', uid)
          .eq('defeated', true)
          .in('stop_id', [...stops.keys()]),
    seats.size === 0
      ? null
      : supabase
          .from('gym_seats')
          .select('cell, holder')
          .in('seat_id', [...seats.keys()])
          .not('holder', 'is', null),
    visits.size === 0
      ? null
      : supabase
          .from('npc_claims')
          .select('marker')
          .eq('player', uid)
          .in('marker', [...visits.keys()]),
    nests.size === 0
      ? null
      : supabase
          .from('nest_claims')
          .select('marker')
          .eq('player', uid)
          .in('marker', [...nests.keys()]),
  ]);

  const holders = new Map<number, string>();

  for (const row of (held?.data ?? []) as { cell: unknown; holder: unknown }[]) {
    holders.set(asNumber(row.cell), asString(row.holder));
  }
  return {
    cleared: cellsOf(lairs, (rewards?.data ?? []) as { raid_id: unknown }[], 'raid_id'),
    beaten: cellsOf(stops, (defeated?.data ?? []) as { stop_id: unknown }[], 'stop_id'),
    seats: holders,
    visited: cellsOf(visits, (claims?.data ?? []) as { marker: unknown }[], 'marker'),
    taken: cellsOf(nests, (eggs?.data ?? []) as { marker: unknown }[], 'marker'),
  };
}
