import { reloadForNewBuild } from '../utils/stale-build';
import getIdToken from './session';
import { asNumber, asRecord, asString } from './__normalize';

/**
 * The browser's end of the live feed (`src/server/live`): one socket
 * per tab, opened by the first follower and closed after the last.
 *
 * A reconnect subscribes everything again and says so to each
 * follower, since changes made while it was away were said to nobody
 */

/** A row as a change carries it: whole, only its keys, or empty */
export type LiveRow = Record<string, unknown>;

export interface LiveChange {
  op: 'INSERT' | 'UPDATE' | 'DELETE';
  new: LiveRow;
  old: LiveRow;
}

/** Everybody present in a topic, by uid, each with the presences they hold */
export type LivePresence = Map<string, { ref: number; state: unknown }[]>;

interface Following {
  kind: 'changes';
  table: string;
  filters: string[];
  onChange: (change: LiveChange) => void;
  onReady: () => void;
  onLost?: () => void;
}

interface Joined {
  kind: 'topic';
  topic: string;
  state: unknown;
  onMessage: (event: string, payload: unknown) => void;
  onPresence: (presence: LivePresence) => void;
  onReady: (ready: boolean) => void;
}

const entries = new Map<string, Following | Joined>();

let socket: WebSocket | null = null;
let ready = false;
let retry = 0;
let reconnecting: ReturnType<typeof setTimeout> | undefined;
let closing: ReturnType<typeof setTimeout> | undefined;
let next = 0;

/** How long an unused socket stays open, so a screen that swaps its followers does not reconnect */
const LINGER = 5000;

/** The longest wait between reconnects */
const MOST_BACKOFF = 30_000;

function post(message: unknown): void {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function start(id: string, entry: Following | Joined): void {
  if (entry.kind === 'changes') {
    post({ t: 'sub', id, table: entry.table, filters: entry.filters });
    return;
  }
  post({ t: 'join', id, topic: entry.topic });
  if (entry.state != null) {
    post({ t: 'track', id, state: entry.state });
  }
}

function lost(): void {
  ready = false;
  for (const entry of entries.values()) {
    if (entry.kind === 'topic') {
      entry.onReady(false);
    } else {
      entry.onLost?.();
    }
  }
}

function reconnect(): void {
  clearTimeout(reconnecting);
  if (entries.size === 0) {
    return;
  }
  reconnecting = setTimeout(open, Math.min(MOST_BACKOFF, 1000 * 2 ** retry));
  retry += 1;
}

function receive(text: string): void {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    return;
  }

  const message = asRecord(parsed);

  const entry = typeof message.id === 'string' ? entries.get(message.id) : undefined;

  switch (message.t) {
    case 'ready':
      ready = true;
      retry = 0;
      for (const [id, held] of entries) {
        start(id, held);
      }
      return;
    case 'stale':
      reloadForNewBuild();
      return;
    case 'denied':
      // Most likely signed out, or a token that went stale mid-flight
      socket?.close();
      return;
    case 'resync':
      for (const held of entries.values()) {
        if (held.kind === 'changes') {
          held.onReady();
        }
      }
      return;
    case 'subscribed':
      if (entry?.kind === 'changes') {
        entry.onReady();
      } else {
        entry?.onReady(true);
      }
      return;
    case 'change':
      if (entry?.kind === 'changes') {
        entry.onChange({
          op: message.op === 'INSERT' || message.op === 'DELETE' ? message.op : 'UPDATE',
          new: asRecord(message.new),
          old: asRecord(message.old),
        });
      }
      return;
    case 'msg':
      if (entry?.kind === 'topic') {
        entry.onMessage(String(message.event), message.payload);
      }
      return;
    case 'presence':
      if (entry?.kind === 'topic') {
        const presence: LivePresence = new Map();

        for (const held of Array.isArray(message.state) ? message.state : []) {
          const { key, ref, state } = asRecord(held);
          const uid = asString(key);

          presence.set(uid, [...(presence.get(uid) ?? []), { ref: asNumber(ref), state }]);
        }
        entry.onPresence(presence);
      }
  }
}

function open(): void {
  if (typeof WebSocket === 'undefined' || socket != null) {
    return;
  }

  const opened = new WebSocket(
    `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/_live`,
  );

  socket = opened;
  opened.addEventListener('open', () => {
    getIdToken()
      .then((token) => {
        post({ t: 'auth', token, build: import.meta.env.VITE_BUILD_ID });
      })
      .catch(() => {
        opened.close();
      });
  });
  opened.addEventListener('message', (event) => {
    receive(String(event.data));
  });
  opened.addEventListener('close', () => {
    if (socket === opened) {
      socket = null;
      lost();
      reconnect();
    }
  });
}

function add(entry: Following | Joined): string {
  clearTimeout(closing);

  const id = String(++next);

  entries.set(id, entry);
  if (socket == null) {
    open();
  } else if (ready) {
    start(id, entry);
  }
  return id;
}

function remove(id: string, message: unknown): void {
  entries.delete(id);
  post(message);
  if (entries.size === 0) {
    clearTimeout(closing);
    closing = setTimeout(() => {
      if (entries.size === 0) {
        clearTimeout(reconnecting);
        socket?.close();
        socket = null;
        ready = false;
      }
    }, LINGER);
  }
}

/**
 * Follow a table's changes, narrowed by `column=eq.value` or
 * `column=in.(a,b)` filters (any of them). `onReady` runs each time the
 * subscription is (re)made, which is when a follower reads afresh, and
 * `onLost` when the socket drops
 */
export function followChanges(
  table: string,
  filters: string[],
  onChange: (change: LiveChange) => void,
  onReady: () => void,
  onLost?: () => void,
): () => void {
  const id = add({ kind: 'changes', table, filters, onChange, onReady, onLost });

  return () => {
    remove(id, { t: 'unsub', id });
  };
}

/** A topic joined for relayed messages and presence */
export interface Topic {
  /** Relay to everybody else in the topic. False while the socket is away */
  send: (event: string, payload: unknown) => boolean;
  /** Show this tab in the topic's presence, under the signed-in uid */
  track: (state: unknown) => void;
  untrack: () => void;
  leave: () => void;
}

export function joinTopic(
  topic: string,
  handlers: Pick<Joined, 'onMessage' | 'onPresence' | 'onReady'>,
): Topic {
  const entry: Joined = { kind: 'topic', topic, state: null, ...handlers };
  const id = add(entry);

  return {
    send: (event, payload) => {
      if (!ready) {
        return false;
      }
      post({ t: 'send', id, event, payload });
      return true;
    },
    track: (state) => {
      entry.state = state;
      post({ t: 'track', id, state });
    },
    untrack: () => {
      entry.state = null;
      post({ t: 'track', id, state: null });
    },
    leave: () => {
      remove(id, { t: 'leave', id });
    },
  };
}
