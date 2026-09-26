import { REALTIME_SUBSCRIBE_STATES, type RealtimeChannel } from '@supabase/supabase-js';
import { serverCallsSeen } from '../utils/server-calls';
import { asNumber, asRecord, asRecordArray, asString } from './__normalize';
import getSupabase from './supabase';

/**
 * The player's bag, read once and kept.
 *
 * Every screen that shows the bag asks for it whole, and most ask
 * again after every action. So the browser holds one copy per player,
 * and the database tells it what changed on the private channel
 * `bag:<uid>`: each stack written or spent to its last. Asking for the
 * bag answers from that copy without a read.
 *
 * The copy is only trusted while nothing could have moved it without
 * the channel saying so. It is read again when:
 *
 * - it has never been read, or the channel is not listening, since
 *   whatever changed meanwhile was said to nobody;
 * - the channel (re)connects, for the same reason;
 * - this tab has made a server call since it was read. The call's own
 *   change may still be on its way down the channel when the screen
 *   that made it asks for the bag again, and that screen must see it.
 *
 * What comes down the channel is the stack as it now stands rather
 * than a difference, so a message that arrives after a read that
 * already saw it changes nothing.
 */

/** The two stacks a bag holds, each key to how many */
export interface HeldBag {
  items: Map<number, number>;
  candies: Map<number, number>;
}

interface Watched {
  uid: string;
  channel: RealtimeChannel;
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
  const supabase = getSupabase();
  const [items, candies] = await Promise.all([
    supabase.from('bag_items').select('item, count').eq('player', uid),
    supabase.from('bag_candies').select('family, count').eq('player', uid),
  ]);

  if (items.error != null || candies.error != null) {
    throw new Error('Could not read your bag just now.');
  }

  const bag: HeldBag = { items: new Map(), candies: new Map() };

  for (const row of asRecordArray(items.data)) {
    bag.items.set(asNumber(row.item), asNumber(row.count));
  }
  for (const row of asRecordArray(candies.data)) {
    bag.candies.set(asNumber(row.family), asNumber(row.count));
  }
  return bag;
}

/** Fold one change the channel carried into the copy */
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

  const supabase = getSupabase();

  if (watched != null) {
    supabase.removeChannel(watched.channel).catch(() => {
      // A channel that cannot be removed is already gone
    });
  }

  const channel = supabase.channel(`bag:${uid}`, { config: { private: true } });
  const entry: Watched = {
    uid,
    channel,
    listening: false,
    bag: null,
    readAt: 0,
    reading: null,
    heard: [],
    epoch: 0,
  };

  channel
    .on('broadcast', { event: '*' }, ({ payload }) => {
      const change = asRecord(payload);

      if (entry.bag != null) {
        applyChange(entry.bag, change);
      }
      // A read that is out may have been answered before this change,
      // so it is laid over whatever that read brings back
      if (entry.reading != null) {
        entry.heard.push(change);
      }
    })
    .subscribe((status) => {
      entry.listening = status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED;
      // Whatever changed while the channel was away was said to nobody
      entry.bag = null;
      entry.epoch += 1;
    });

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
