/**
 * How many times this tab has started or finished a server call. A
 * copy of server state kept in the browser compares it against the
 * figure it was read at: any call since may have changed what it holds,
 * and the change is not always on the stream yet when the caller looks
 */
let seen = 0;

export function serverCallsSeen(): number {
  return seen;
}

export function countServerCall(): void {
  seen += 1;
}
