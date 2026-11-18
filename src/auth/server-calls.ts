/**
 * How many times this tab has started or finished a server call. A
 * copy of server state kept in the browser compares it against the
 * figure it was read at: any call since may have changed what it holds,
 * and the change is not always on the stream yet when the caller looks
 */
let seen = 0;

/** The server ids of calls that only read, which cannot have changed anything */
const reads = new Set<string>();

export function serverCallsSeen(): number {
  return seen;
}

/** Count a call, unless it is one `readOnly` registered */
export function countServerCall(serverId: string | null): void {
  if (serverId == null || !reads.has(serverId)) {
    seen += 1;
  }
}

/**
 * Mark a server function as a read, so calling it does not count as a
 * change. Its reference carries its id in `id`, the same id the call's
 * path ends in
 */
export function readOnly<T extends object>(fn: T): T {
  const id: unknown = Reflect.get(fn, 'id');

  if (typeof id === 'string') {
    reads.add(id);
  }
  return fn;
}
