import 'server-only';

/**
 * The parts of the game a self-hosted server may leave out. Each is an
 * environment variable, off unless it is exactly `1` or `true`, the way
 * `VITE_EMAIL_SIGN_IN` is: what they add is record keeping that costs
 * rows and writes, and a small private server may not want either.
 *
 * Read at call time rather than at load, so a deployment's variables
 * are what count however the bundle was built.
 */
export const enum ServerFlag {
  /** Every change to gold, items and candy, one row each */
  EconomyLedger = 'ECONOMY_LEDGER',
  /** Releases held for a day, and taken back if wanted */
  ReleaseGrace = 'RELEASE_GRACE',
  /** Every change staff make, one row each */
  StaffLog = 'STAFF_LOG',
}

export function isFlagOn(flag: ServerFlag): boolean {
  const value = process.env[flag];

  return value === '1' || value === 'true';
}
