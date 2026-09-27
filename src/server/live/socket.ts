import 'server-only';
import { defineWebSocketHandler } from 'nitro';
import * as v from 'valibot';
import { requireReader } from '../auth';
import { type Filter, isLiveTable, parseFilter } from './rules';
import * as hub from './hub';

/**
 * The live feed's socket, at `/_live`. A tab signs in first, naming its
 * token and its build, then follows table changes or joins sight
 * topics. See `src/auth/live.ts` for the other end
 */

/** The most a message may be, which a walk or a presence is well under */
const MESSAGE_LIMIT = 16_384;

/**
 * How many relayed messages a connection may send in a burst, and how
 * many a second after it. Only what reaches other tabs is limited: a
 * reconnect resends every follow and join at once, and dropping one of
 * those would leave the tab deaf to it until it reloads
 */
const BURST = 60;
const PER_SECOND = 20;

const ID = v.pipe(v.string(), v.minLength(1), v.maxLength(64));
const TOPIC = v.pipe(v.string(), v.regex(/^sight:\d+:\d+:-?\d+:-?\d+$/));

const MESSAGE = v.variant('t', [
  v.object({ t: v.literal('auth'), token: v.string(), build: v.string() }),
  v.object({
    t: v.literal('sub'),
    id: ID,
    table: v.string(),
    filters: v.pipe(v.array(v.pipe(v.string(), v.maxLength(8192))), v.maxLength(16)),
  }),
  v.object({ t: v.literal('unsub'), id: ID }),
  v.object({ t: v.literal('join'), id: ID, topic: TOPIC }),
  v.object({ t: v.literal('leave'), id: ID }),
  v.object({ t: v.literal('send'), id: ID, event: ID, payload: v.unknown() }),
  v.object({ t: v.literal('track'), id: ID, state: v.unknown() }),
]);

type Message = v.InferOutput<typeof MESSAGE>;

/** Each connection's message allowance, refilled over time */
const allowances = new Map<string, { tokens: number; at: number }>();

function allowed(peerId: string): boolean {
  const now = Date.now();
  const held = allowances.get(peerId) ?? { tokens: BURST, at: now };
  const tokens = Math.min(BURST, held.tokens + ((now - held.at) / 1000) * PER_SECOND);

  allowances.set(peerId, { tokens: tokens - 1, at: now });
  return tokens >= 1;
}

async function handle(peer: hub.LivePeer, message: Message): Promise<void> {
  const reply = (answer: unknown): void => {
    peer.send(JSON.stringify(answer));
  };

  if (message.t === 'auth') {
    // A tab from another build speaks a protocol this server may not, so it reloads first
    if (message.build !== import.meta.env.VITE_BUILD_ID) {
      reply({ t: 'stale' });
      return;
    }
    try {
      hub.connect(peer, await requireReader(message.token));
      await hub.listen();
      reply({ t: 'ready' });
    } catch {
      reply({ t: 'denied' });
    }
    return;
  }
  if (!hub.isConnected(peer.id)) {
    reply({ t: 'denied' });
    return;
  }
  switch (message.t) {
    case 'sub': {
      const filters: Filter[] = [];

      for (const text of message.filters) {
        const filter = parseFilter(text);

        if (filter == null) {
          reply({ t: 'error', id: message.id });
          return;
        }
        filters.push(filter);
      }
      if (!isLiveTable(message.table)) {
        reply({ t: 'error', id: message.id });
        return;
      }
      if (!hub.subscribe(peer.id, message.id, message.table, filters)) {
        reply({ t: 'error', id: message.id });
        return;
      }
      reply({ t: 'subscribed', id: message.id });
      return;
    }
    case 'unsub':
      hub.unsubscribe(peer.id, message.id);
      return;
    case 'join':
      if (!hub.join(peer.id, message.id, message.topic)) {
        reply({ t: 'error', id: message.id });
        return;
      }
      reply({ t: 'subscribed', id: message.id });
      return;
    case 'leave':
      hub.leave(peer.id, message.id);
      return;
    case 'send':
      hub.broadcast(peer.id, message.id, message.event, message.payload);
      return;
    case 'track':
      hub.track(peer.id, message.id, message.state);
  }
}

export default defineWebSocketHandler({
  message(peer, raw) {
    const text = raw.text();

    if (text.length > MESSAGE_LIMIT) {
      return;
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(text);
    } catch {
      return;
    }

    const checked = v.safeParse(MESSAGE, parsed);

    if (!checked.success) {
      return;
    }
    if ((checked.output.t === 'send' || checked.output.t === 'track') && !allowed(peer.id)) {
      return;
    }
    handle(
      {
        id: peer.id,
        send: (answer) => {
          peer.send(answer);
        },
      },
      checked.output,
    ).catch(() => {
      // A message that failed is one the tab resends after it reconnects
    });
  },
  close(peer) {
    allowances.delete(peer.id);
    hub.disconnect(peer.id);
  },
});
