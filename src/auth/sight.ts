import { REALTIME_SUBSCRIBE_STATES, type RealtimeChannel } from '@supabase/supabase-js';
import { DEFAULT_CHARSET, getCharset } from '../data/overworld/charsets';
import { CHUNK_CELLS } from '../overworld/chunk';
import { WORLD_GENERATION } from '../overworld/current';
import type { Depth } from '../overworld/depth';
import { type Sector, homeSector, sectorKey, sectorShift, sectorTopic } from '../overworld/sight';
import Strangers, {
  type Facing,
  type Leg,
  MAX_LEG_STEPS,
  MAX_ROUTE_STEPS,
  type Sighting,
  decodeSteps,
  encodeSteps,
} from '../overworld/strangers';
import { WORLD_MAX, WORLD_MIN } from '../overworld/world';
import { asNumber, asRecord, asString } from './__normalize';
import { serverNow } from './clock';
import getSupabase from './supabase';

/**
 * Seeing the other players on the overworld, over one realtime
 * channel per sector.
 *
 * Presence says who is in a sector and roughly where they stand. A
 * pressed walk is broadcast once, as its whole route, and only a walk
 * that leaves its route says so again. A walk on the keys has no route,
 * so its steps are broadcast in runs every couple of seconds. Standing
 * still sends nothing. Nothing here touches a table: where somebody is
 * walking is gone the moment they leave.
 *
 * Everything that arrives is another client's word, the uid included.
 * It is only ever drawn, and nothing that decides anything may read it.
 */

/** How long a run of steps on the keys is held before it is sent, in milliseconds */
export const FLUSH_PACE = 2000;

/**
 * How often a stop may update the presence, in milliseconds. The last
 * run already says where a walker stopped, so the presence is only for
 * screens that arrive later, and the free plan allows 20 presence
 * messages a second across the whole project
 */
export const PRESENCE_PACE = 15_000;

/** The lowest and highest world cell a sighting may claim */
const CELL_MIN = WORLD_MIN * CHUNK_CELLS;
const CELL_MAX = (WORLD_MAX + 1) * CHUNK_CELLS - 1;

const WALK_EVENT = 'walk';

/**
 * A presence as it is tracked: short keys, since every listener in the
 * sector is sent it again whenever it changes
 */
interface TrackedPresence {
  /** Charset */
  c: string;
  x: number;
  y: number;
  /** Facing, as one step letter */
  f: string;
}

/** A walk as it is broadcast */
interface WalkMessage {
  /** Uid */
  u: string;
  x: number;
  y: number;
  /** Steps, one letter each. None says only where they are now */
  s: string;
  /** When the first step began, on the server's clock */
  t: number;
  /** Set on a route still to be walked */
  p?: 1;
}

function asCell(value: unknown): number | null {
  const cell = asNumber(value, Number.NaN);

  return Number.isInteger(cell) && cell >= CELL_MIN && cell <= CELL_MAX ? cell : null;
}

/** A presence from another client, or null when it is not one this build could have sent */
export function asSighting(uid: string, value: unknown): Sighting | null {
  const data = asRecord(value);
  const x = asCell(data.x);
  const y = asCell(data.y);
  const facing = decodeSteps(asString(data.f), 1)?.[0] ?? null;

  if (uid === '' || x == null || y == null || facing == null) {
    return null;
  }

  // Only a charset the game has, since it names a file to fetch
  const charset = asString(data.c);

  return {
    uid,
    charset: getCharset(charset) == null ? DEFAULT_CHARSET : charset,
    x,
    y,
    facing,
  };
}

/** A walk from another client, or null */
export function asLeg(value: unknown): Leg | null {
  const data = asRecord(value);
  const uid = asString(data.u);
  const x = asCell(data.x);
  const y = asCell(data.y);
  const planned = data.p === 1;
  const steps = decodeSteps(asString(data.s), planned ? MAX_ROUTE_STEPS : MAX_LEG_STEPS, true);
  const at = asNumber(data.t, Number.NaN);

  if (uid === '' || x == null || y == null || steps == null || !Number.isFinite(at)) {
    return null;
  }
  return { uid, x, y, steps, at, planned };
}

interface Joined {
  sector: Sector;
  channel: RealtimeChannel;
  ready: boolean;
  /** Who is present in it, and the presence ref last taken from each */
  members: Map<string, string>;
}

interface Trail {
  x: number;
  y: number;
  steps: Facing[];
  at: number;
}

export interface Sight {
  /** Everybody else in sight, for the board to draw */
  readonly strangers: Strangers;
  /**
   * Where the player stands now. One cell from the last is a step and
   * is walked; anything else is a jump and is shown as one
   */
  stand(depth: Depth, x: number, y: number, facing: Facing): void;
  setCharset(charset: string): void;
  /**
   * The route a pressed walk is about to take from where the player
   * stands, or null once the walk is over. Steps along it are not sent
   * again; a step off it, or a walk ending short of it, is
   */
  plan(steps: Facing[] | null): void;
  /**
   * Whether other players see this screen. One that has stood down for
   * another screen still sees, but is not seen, or a player on two
   * screens would stand in two places
   */
  setSeen(seen: boolean): void;
  close(): void;
}

/**
 * Start seeing and being seen. `pace` is how long one step takes; the
 * board's and every other board's are the same
 */
export default function openSight(uid: string, pace: number): Sight {
  const supabase = getSupabase();
  const strangers = new Strangers(serverNow, pace);
  const joined = new Map<string, Joined>();

  let me: { depth: Depth; x: number; y: number; facing: Facing } | null = null;
  let charset = DEFAULT_CHARSET;
  let seen = true;
  let home: Sector | null = null;
  /** The home the presence is tracked on, which lags `home` until its channel is ready */
  let trackedOn: string | null = null;
  let trail: Trail | null = null;
  /** The route announced for the walk under way, and how many of its steps are taken */
  let route: { steps: Facing[]; taken: number } | null = null;
  let steppedAt = 0;
  let flushing: ReturnType<typeof setTimeout> | null = null;
  let idling: ReturnType<typeof setTimeout> | null = null;
  /** When the presence was last tracked, and the update waiting out the pace */
  let trackedAt = Number.NEGATIVE_INFINITY;
  let refreshing: ReturnType<typeof setTimeout> | null = null;

  const presence = (): TrackedPresence | null =>
    me == null ? null : { c: charset, x: me.x, y: me.y, f: encodeSteps([me.facing]) };

  /** Whether anybody else still lists them, so leaving one sector does not drop somebody standing in another */
  const listedElsewhere = (member: string, except: Joined): boolean => {
    for (const other of joined.values()) {
      if (other !== except && other.members.has(member)) {
        return true;
      }
    }
    return false;
  };

  const synced = (sector: Joined): void => {
    const state = sector.channel.presenceState<Partial<TrackedPresence>>();
    const present = new Set<string>();

    for (const [key, metas] of Object.entries(state)) {
      // Another screen of the same player is the player, not a stranger
      if (key === uid) {
        continue;
      }

      const meta = metas.at(-1);
      const sighting = meta == null ? null : asSighting(key, meta);

      if (meta == null || sighting == null) {
        continue;
      }
      present.add(key);
      // A sync repeats everybody. Only a changed presence is news: an
      // unchanged one would put a walker back where they last stopped
      if (sector.members.get(key) !== meta.presence_ref) {
        sector.members.set(key, meta.presence_ref);
        strangers.see(sighting);
      }
    }
    for (const member of sector.members.keys()) {
      if (!present.has(member)) {
        sector.members.delete(member);
        if (!listedElsewhere(member, sector)) {
          strangers.forget(member);
        }
      }
    }
  };

  /** Track the presence on the home channel, once it is ready, and nowhere else */
  const track = (): void => {
    const key = home == null ? null : sectorKey(home);
    const target = key == null ? null : joined.get(key);
    const wanted = seen && target?.ready === true ? key : null;

    if (trackedOn != null && trackedOn !== wanted) {
      joined
        .get(trackedOn)
        ?.channel.untrack()
        .catch(() => {
          // A presence that cannot be taken down goes when the channel does
        });
      trackedOn = null;
    }

    const payload = presence();

    if (wanted == null || target == null || payload == null) {
      return;
    }
    if (refreshing != null) {
      clearTimeout(refreshing);
      refreshing = null;
    }
    trackedOn = wanted;
    trackedAt = serverNow();
    target.channel.track({ ...payload }).catch(() => {
      // Not seen for a moment; the next stop tracks again
    });
  };

  const join = (sector: Sector): void => {
    const key = sectorKey(sector);
    const channel = supabase.channel(sectorTopic(WORLD_GENERATION, sector), {
      config: {
        private: true,
        broadcast: { self: false },
        presence: { key: uid, enabled: true },
      },
    });
    const entry: Joined = { sector, channel, ready: false, members: new Map() };

    channel
      .on('presence', { event: 'sync' }, () => {
        synced(entry);
      })
      .on('broadcast', { event: WALK_EVENT }, ({ payload }) => {
        const leg = asLeg(payload);

        if (leg != null && leg.uid !== uid) {
          strangers.hear(leg);
        }
      })
      .subscribe((status) => {
        entry.ready = status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED;
        if (entry.ready && home != null && sectorKey(home) === key) {
          track();
        }
      });
    joined.set(key, entry);
  };

  const leave = (entry: Joined): void => {
    const key = sectorKey(entry.sector);

    joined.delete(key);
    if (trackedOn === key) {
      trackedOn = null;
    }
    for (const member of entry.members.keys()) {
      if (!listedElsewhere(member, entry)) {
        strangers.forget(member);
      }
    }
    supabase.removeChannel(entry.channel).catch(() => {
      // A channel that cannot be removed is already gone
    });
  };

  /** Say something about the walk, on the sector the player speaks on. False when there is nowhere to say it yet */
  const send = (x: number, y: number, steps: Facing[], at: number, planned: boolean): boolean => {
    if (!seen || trackedOn == null) {
      return false;
    }

    const message: WalkMessage = { u: uid, x, y, s: encodeSteps(steps), t: at };

    if (planned) {
      message.p = 1;
    }
    joined
      .get(trackedOn)
      ?.channel.send({ type: 'broadcast', event: WALK_EVENT, payload: message })
      .catch(() => {
        // A lost run shows as a jump to the start of the next one
      });
    return true;
  };

  /** Send the steps taken on the keys since the last send */
  const flush = (): void => {
    if (flushing != null) {
      clearTimeout(flushing);
      flushing = null;
    }

    const sent = trail;

    trail = null;
    if (sent != null) {
      send(sent.x, sent.y, sent.steps, sent.at, false);
    }
  };

  /** Say what is left of the route from here, for a sector that has not heard it */
  const sendRoute = (): void => {
    if (me != null && route != null && route.taken < route.steps.length) {
      send(me.x, me.y, route.steps.slice(route.taken), serverNow(), true);
    }
  };

  /** Stopped walking: send what is left, and say where they stopped once the pace allows */
  const settle = (): void => {
    idling = null;
    flush();

    const owed = trackedAt + PRESENCE_PACE - serverNow();

    if (owed <= 0) {
      track();
    } else {
      refreshing ??= setTimeout(track, owed);
    }
  };

  const step = (from: { x: number; y: number }, facing: Facing): void => {
    const now = serverNow();

    // A pause mid-walk starts a new run, since a run plays back at one
    // step a pace with no gaps in it
    if (trail != null && now - steppedAt > pace * 1.5) {
      flush();
    }
    trail ??= { x: from.x, y: from.y, steps: [], at: now };
    trail.steps.push(facing);
    steppedAt = now;

    if (trail.steps.length >= MAX_LEG_STEPS) {
      flush();
    } else {
      flushing ??= setTimeout(flush, FLUSH_PACE);
    }
  };

  const regroup = (): void => {
    if (me == null) {
      return;
    }

    const sectors: Sector[] = [];

    for (const entry of joined.values()) {
      sectors.push(entry.sector);
    }

    const { join: joining, leave: leaving } = sectorShift(sectors, me.depth, me.x, me.y);

    for (const sector of leaving) {
      const entry = joined.get(sectorKey(sector));

      if (entry != null) {
        leave(entry);
      }
    }
    for (const sector of joining) {
      join(sector);
    }

    const moved = homeSector(home, me.depth, me.x, me.y);

    if (home == null || sectorKey(moved) !== sectorKey(home)) {
      // What was walked in the old sector is said there first, so the
      // screens that only hear the old one see the walk finish
      flush();
      home = moved;
      track();
      sendRoute();
    }
  };

  const restIn = (): void => {
    if (idling != null) {
      clearTimeout(idling);
    }
    idling = setTimeout(settle, pace * 2);
  };

  return {
    strangers,

    stand(depth, x, y, facing) {
      const was = me;

      me = { depth, x, y, facing };

      if (was == null) {
        regroup();
        return;
      }

      const walked = was.depth === depth && Math.abs(x - was.x) + Math.abs(y - was.y) === 1;

      if (walked) {
        const taken: Facing = [x - was.x, y - was.y];
        const next = route?.steps[route.taken];

        if (route != null && next?.[0] === taken[0] && next[1] === taken[1]) {
          // Already said: the route was sent before it was walked
          route.taken += 1;
          if (route.taken === route.steps.length) {
            route = null;
          }
        } else {
          // Off the route, which the run this step starts cuts short
          route = null;
          step(was, taken);
        }
        regroup();
        restIn();
        return;
      }
      if (was.depth !== depth || was.x !== x || was.y !== y) {
        // A jump is not played back as a walk: the run so far goes, and
        // they are put where they landed straight away
        flush();
        route = null;
        regroup();
        track();
        send(x, y, [], serverNow(), false);
        return;
      }
      if (was.facing[0] !== facing[0] || was.facing[1] !== facing[1]) {
        restIn();
      }
    },

    plan(steps) {
      if (me == null) {
        return;
      }
      // Whatever was walked on the keys comes first
      flush();

      if (steps == null || steps.length === 0) {
        if (route != null && route.taken < route.steps.length) {
          send(me.x, me.y, [], serverNow(), false);
        }
        route = null;
        return;
      }
      route = { steps: steps.slice(0, MAX_ROUTE_STEPS), taken: 0 };
      // Not said, so its steps are sent as they are taken instead
      if (!send(me.x, me.y, route.steps, serverNow(), true)) {
        route = null;
      }
    },

    setCharset(next) {
      if (next === charset) {
        return;
      }
      charset = next;
      track();
    },

    setSeen(next) {
      if (next === seen) {
        return;
      }
      seen = next;
      trail = null;
      route = null;
      track();
    },

    close() {
      if (flushing != null) {
        clearTimeout(flushing);
      }
      if (idling != null) {
        clearTimeout(idling);
      }
      if (refreshing != null) {
        clearTimeout(refreshing);
      }
      for (const entry of joined.values()) {
        leave(entry);
      }
      strangers.clear();
    },
  };
}
