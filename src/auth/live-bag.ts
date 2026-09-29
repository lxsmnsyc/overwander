import { readOnly, serverCallsSeen } from '../utils/server-calls';
import { asNumber, asRecord, asString } from './__normalize';
import getIdToken from './session';
import { requireReader } from '../server/auth';
import check, { TOKEN, UID } from '../server/validate';
import { readBag } from '../server/inventory';
import { followChanges } from './live';

/**
 * The player's bag, read once and kept.
 *
 * Every screen that shows the bag asks for it whole, and most ask
 * again after every action. So the browser holds one copy per player,
 * and the live feed tells it what changed in the player's own stacks:
 * each one written or spent to its last. Asking for the bag answers
 * from that copy without a read.
 *
 * The copy is only trusted while nothing could have moved it without
 * the feed saying so. It is read again when:
 *
 * - it has never been read, or the feed is not listening, since
 *   whatever changed meanwhile was said to nobody;
 * - the feed (re)connects, for the same reason;
 * - this tab has made a server call since it was read. The call's own
 *   change may still be on its way down the feed when the screen
 *   that made it asks for the bag again, and that screen must see it.
 *
 * What comes down the feed is the stack as it now stands rather
 * than a difference, so a message that arrives after a read that
 * already saw it changes nothing.
 */

/** The two stacks a bag holds, each key to how many */
export interface HeldBag {
  items: Map<number, number>;
  candies: Map<number, number>;
}

/** The two tables a bag is kept in, each followed for the player's own rows */
const BAG_TABLES = ['bag_items', 'bag_candies'];

interface Watched {
  uid: string;
  unfollow: () => void;
  /** The tables whose subscription is up */
  ready: Set<string>;
  listening: boolean;
  bag: HeldBag | null;
  /** The server calls seen when `bag` was read */
  readAt: number;
  reading: Promise<HeldBag> | null;
  /** Changes heard while a read was out, laid over it when it lands */
  heard: Record<string, unknown>[];
  /** Bumped on every (re)connect, so a read that straddles one is not kept */
  epoch: number;
}

let watched: Watched | null = null;

async function readWhole(uid: string): Promise<HeldBag> {
  const { items, candies } = await readWholeOnServer(await getIdToken(), uid);

  return { items: new Map(items), candies: new Map(candies) };
}

async function readWholeOnServer(
  token: string,
  player: string,
): Promise<{ items: [number, number][]; candies: [number, number][] }> {
  'use server';
  check(TOKEN, token);
  check(UID, player);
  const uid = await requireReader(token);

  return player === uid ? readBag(uid) : { items: [], candies: [] };
}
readOnly(readWholeOnServer);

/** Fold one change the feed carried into the copy */
function applyChange(bag: HeldBag, message: Record<string, unknown>): void {
  const table = asString(message.table);
  const stacks = table === 'bag_candies' ? bag.candies : bag.items;
  const column = table === 'bag_candies' ? 'family' : 'item';

  if (asString(message.operation) === 'DELETE') {
    stacks.delete(asNumber(asRecord(message.old_record)[column]));
    return;
  }

  const row = asRecord(message.record);

  stacks.set(asNumber(row[column]), asNumber(row.count));
}

function watch(uid: string): Watched {
  if (watched?.uid === uid) {
    return watched;
  }
  watched?.unfollow();

  const entry: Watched = {
    uid,
    unfollow: () => undefined,
    ready: new Set(),
    listening: false,
    bag: null,
    readAt: 0,
    reading: null,
    heard: [],
    epoch: 0,
  };
  const follow = (table: string): (() => void) =>
    followChanges(
      table,
      [`player=eq.${uid}`],
      (change) => {
        const message = { table, operation: change.op, record: change.new, old_record: change.old };

        if (entry.bag != null) {
          applyChange(entry.bag, message);
        }
        // A read that is out may have been answered before this change,
        // so it is laid over whatever that read brings back
        if (entry.reading != null) {
          entry.heard.push(message);
        }
      },
      () => {
        entry.ready.add(table);
        entry.listening = entry.ready.size === BAG_TABLES.length;
        // Whatever changed while the feed was away was said to nobody
        entry.bag = null;
        entry.epoch += 1;
      },
      () => {
        entry.ready.clear();
        entry.listening = false;
        entry.bag = null;
        entry.epoch += 1;
      },
    );
  const closers: (() => void)[] = [];

  for (const table of BAG_TABLES) {
    closers.push(follow(table));
  }
  entry.unfollow = () => {
    for (const close of closers) {
      close();
    }
  };
  watched = entry;
  return entry;
}

/**
 * The player's bag. Answered from the kept copy where it can be
 * trusted, and read whole where it cannot. Browser only: the server
 * reads the tables itself
 */
export default async function readHeldBag(uid: string): Promise<HeldBag> {
  const entry = watch(uid);

  if (entry.listening && entry.bag != null && entry.readAt === serverCallsSeen()) {
    return entry.bag;
  }

  if (entry.reading == null) {
    // Taken before the read goes out, so a call that starts while it
    // is in flight is not mistaken for one it has already seen
    const readAt = serverCallsSeen();
    const { epoch } = entry;

    entry.heard = [];
    entry.reading = readWhole(uid)
      .then((bag) => {
        for (const change of entry.heard) {
          applyChange(bag, change);
        }
        if (watched === entry && entry.epoch === epoch) {
          entry.bag = bag;
          entry.readAt = readAt;
        }
        return bag;
      })
      .finally(() => {
        entry.reading = null;
        entry.heard = [];
      });
  }
  return entry.reading;
}
