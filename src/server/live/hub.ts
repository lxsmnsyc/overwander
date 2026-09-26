import 'server-only';
import { getSql } from '../db';
import { asRecord, asString } from '../read';
import { type Filter, type Row, matchesFilter, visibleRow } from './rules';

/**
 * The live feed's state: who is connected, what each follows, and who
 * is present where. One process holds all of it, which is what the
 * self-hosted server is
 */

/** The channel the change triggers notify on */
export const CHANGE_CHANNEL = 'live_changes';

/** A connection, as the hub needs it */
export interface LivePeer {
  id: string;
  send: (message: string) => void;
}

interface Subscription {
  table: string;
  /** A change matching any of these is sent; none means every change */
  filters: Filter[];
}

interface Presence {
  key: string;
  ref: number;
  state: unknown;
}

interface Connection {
  peer: LivePeer;
  uid: string;
  subscriptions: Map<string, Subscription>;
  /** Topic joins, by the id the client gave each */
  topics: Map<string, string>;
}

const connections = new Map<string, Connection>();

/** Who is present in each topic, by connection and join id */
const presences = new Map<string, Map<string, Presence>>();

let presenceRef = 0;

function send(connection: Connection, message: unknown): void {
  connection.peer.send(JSON.stringify(message));
}

export function connect(peer: LivePeer, uid: string): void {
  disconnect(peer.id);
  connections.set(peer.id, { peer, uid, subscriptions: new Map(), topics: new Map() });
}

export function disconnect(peerId: string): void {
  const connection = connections.get(peerId);

  if (connection == null) {
    return;
  }
  for (const id of [...connection.topics.keys()]) {
    leave(peerId, id);
  }
  connections.delete(peerId);
}

export function isConnected(peerId: string): boolean {
  return connections.has(peerId);
}

export function subscribe(peerId: string, id: string, table: string, filters: Filter[]): void {
  connections.get(peerId)?.subscriptions.set(id, { table, filters });
}

export function unsubscribe(peerId: string, id: string): void {
  connections.get(peerId)?.subscriptions.delete(id);
}

/** Send one change to every subscription it answers, each as its reader may see it */
export function dispatch(table: string, op: string, fresh: Row | null, old: Row | null): void {
  // Too large to notify whole: every follower of the table reads again
  const unknown = fresh == null && old == null;

  for (const connection of connections.values()) {
    for (const [id, subscription] of connection.subscriptions) {
      if (subscription.table !== table) {
        continue;
      }

      let matched = unknown || subscription.filters.length === 0;

      for (const filter of subscription.filters) {
        matched ||= matchesFilter(filter, fresh) || matchesFilter(filter, old);
      }
      if (matched) {
        send(connection, {
          t: 'change',
          id,
          op,
          new: visibleRow(table, fresh, connection.uid),
          old: visibleRow(table, old, connection.uid),
        });
      }
    }
  }
}

/** Tell every connection it may have missed changes, so each follower reads again */
export function resync(): void {
  for (const connection of connections.values()) {
    send(connection, { t: 'resync' });
  }
}

function presenceOf(topic: string): { key: string; ref: number; state: unknown }[] {
  const listed: { key: string; ref: number; state: unknown }[] = [];

  for (const presence of presences.get(topic)?.values() ?? []) {
    listed.push(presence);
  }
  return listed;
}

/** Every connection joined to the topic, with the join id each gave it */
function joinedTo(topic: string): [Connection, string][] {
  const found: [Connection, string][] = [];

  for (const connection of connections.values()) {
    for (const [id, joined] of connection.topics) {
      if (joined === topic) {
        found.push([connection, id]);
      }
    }
  }
  return found;
}

function announcePresence(topic: string): void {
  const state = presenceOf(topic);

  for (const [connection, id] of joinedTo(topic)) {
    send(connection, { t: 'presence', id, state });
  }
}

export function join(peerId: string, id: string, topic: string): void {
  const connection = connections.get(peerId);

  if (connection == null) {
    return;
  }
  connection.topics.set(id, topic);
  send(connection, { t: 'presence', id, state: presenceOf(topic) });
}

export function leave(peerId: string, id: string): void {
  const connection = connections.get(peerId);
  const topic = connection?.topics.get(id);

  if (connection == null || topic == null) {
    return;
  }
  connection.topics.delete(id);
  if (presences.get(topic)?.delete(`${peerId}:${id}`) === true) {
    announcePresence(topic);
  }
}

/** Relay a message to everybody else in the topic */
export function broadcast(peerId: string, id: string, event: string, payload: unknown): void {
  const topic = connections.get(peerId)?.topics.get(id);

  if (topic == null) {
    return;
  }
  for (const [connection, joinId] of joinedTo(topic)) {
    if (connection.peer.id !== peerId) {
      send(connection, { t: 'msg', id: joinId, event, payload });
    }
  }
}

/** Show this connection in the topic under its own uid, or take it down with null */
export function track(peerId: string, id: string, state: unknown): void {
  const connection = connections.get(peerId);
  const topic = connection?.topics.get(id);

  if (connection == null || topic == null) {
    return;
  }

  const present = presences.get(topic) ?? new Map<string, Presence>();

  if (state == null) {
    present.delete(`${peerId}:${id}`);
  } else {
    present.set(`${peerId}:${id}`, { key: connection.uid, ref: ++presenceRef, state });
  }
  if (present.size === 0) {
    presences.delete(topic);
  } else {
    presences.set(topic, present);
  }
  announcePresence(topic);
}

let listening: Promise<void> | null = null;

/** Start listening for changes, once per process. A reconnect may have missed some, so it resyncs */
export async function listen(): Promise<void> {
  listening ??= (async (): Promise<void> => {
    let first = true;

    await getSql().listen(
      CHANGE_CHANNEL,
      (text) => {
        try {
          const change = asRecord(JSON.parse(text) as unknown);

          dispatch(
            asString(change.table),
            asString(change.op),
            change.new == null ? null : asRecord(change.new),
            change.old == null ? null : asRecord(change.old),
          );
        } catch {
          // A notification this build cannot read is dropped
        }
      },
      () => {
        if (!first) {
          resync();
        }
        first = false;
      },
    );
  })().catch((error: unknown) => {
    // Tried again by the next connection rather than never
    listening = null;
    throw error;
  });
  return listening;
}
