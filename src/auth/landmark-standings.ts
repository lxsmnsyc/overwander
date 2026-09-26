import { readOnly } from '../utils/server-calls';
import Landmark from '../data/overworld/landmark';
import { NPC_VISIT_TAGS } from '../data/overworld/npc';
import type ChunkSnapshot from '../overworld/chunk-snapshot';
import { RaidKind, raidId } from './raid-record';
import { seatId } from './gym-seat-record';
import { stopIdOf } from './stop-record';
import getIdToken from './session';
import { requireUid } from '../server/auth';
import check, { STANDING_IDS, TOKEN, UID } from '../server/validate';
import {
  type StandingIds,
  type StandingRows,
  readStandingRows,
} from '../server/landmark-standings';

const EMPTY_IDS: StandingIds = { lairs: [], stops: [], seats: [], visits: [], nests: [] };

/** Where the signed-in player stands with a chunk's landmarks, by cell */
export interface LandmarkStandings {
  /** Lairs whose raid this player won this raid window */
  cleared: Set<number>;
  /** Trainers, grunts and experts this player has beaten this window */
  beaten: Set<number>;
  /** Seats somebody holds, with who holds them */
  seats: Map<number, string>;
  /** Wanderers who have already done their one thing for this player */
  visited: Set<number>;
  /** Nests whose egg this player has already taken this nest window */
  taken: Set<number>;
}

/** The cells whose row id came back, read through the id they were asked by */
function cellsOf(ids: Map<string, number>, found: readonly string[]): Set<number> {
  const cells = new Set<number>();

  for (const id of found) {
    const cell = ids.get(id);

    if (cell != null) {
      cells.add(cell);
    }
  }
  return cells;
}

/** Every row asked for is either public (the seats) or the player's own */
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
  // keyed by the window, so an empty cell has nothing to look up. The
  // experts keep their houses for good, so theirs are the cells the
  // landmark itself is on
  const fighters = [
    ...snapshot.getTrainerStops().keys(),
    ...snapshot.getRocketStops().keys(),
    ...snapshot.getGymStops().keys(),
    ...snapshot.getEliteStops().keys(),
    ...snapshot.getChampionStops().keys(),
  ];

  for (const [cell, landmark] of chunk.getLandmarkCells()) {
    if (landmark === Landmark.FrontierBrain) {
      fighters.push(cell);
    }
  }
  for (const cell of fighters) {
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

  const rows = await readStandingsOnServer(await getIdToken(), uid, {
    lairs: [...lairs.keys()],
    stops: [...stops.keys()],
    seats: [...seats.keys()],
    visits: [...visits.keys()],
    nests: [...nests.keys()],
  });

  return {
    cleared: cellsOf(lairs, rows.cleared),
    beaten: cellsOf(stops, rows.beaten),
    seats: new Map(rows.held),
    visited: cellsOf(visits, rows.visited),
    taken: cellsOf(nests, rows.taken),
  };
}

/** Another player's standings are never read, so their own rows come back empty */
async function readStandingsOnServer(
  token: string,
  player: string,
  ids: StandingIds,
): Promise<StandingRows> {
  'use server';
  check(TOKEN, token);
  check(UID, player);
  check(STANDING_IDS, ids);
  const uid = await requireUid(token);

  return readStandingRows(uid, player === uid ? ids : { ...EMPTY_IDS, seats: ids.seats });
}
readOnly(readStandingsOnServer);
