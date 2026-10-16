/**
 * How long a battle holds what it is fighting with. A fight is over
 * in minutes; one still unfinished after this was walked out on, so
 * its party — and the raid landmark it stood on — must not stay held
 * forever.
 *
 * It sits in its own module because three sides read it: the
 * privileged server, which refuses edits to a locked catch; the raid
 * server, which decides an abandoned raid may be restaged; and the
 * client, which greys out what it can see is fighting.
 */
const BATTLE_TIMEOUT = 10 * 60 * 1000;

/**
 * Whether a catch's lock is still holding: it was fielded in a battle
 * and that battle has neither released it nor timed out. The client
 * asks this to grey out what it can see is fighting; the server asks
 * the same of its own clock before allowing the write, which is where
 * the refusal actually happens
 */
export function isLockLive(caught: { lockedAt: number }, now: number): boolean {
  return caught.lockedAt > 0 && now - caught.lockedAt < BATTLE_TIMEOUT;
}

export default BATTLE_TIMEOUT;
