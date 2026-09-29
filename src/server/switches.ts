import 'server-only';
import { getSql } from './db';
import { asString } from './read';

/**
 * The parts of the game a switch can close, each a row in `switches`.
 *
 * A closed part refuses new things only: the server functions that
 * start something name their part through `requireUidFor`, and the ones
 * that leave, cancel, read or settle something do not, so closing a
 * part never strands a player halfway through it.
 *
 * `Everything` is maintenance. Every call checks it, and it refuses
 * anybody without a role.
 */
export const enum Feature {
  Everything = 'everything',
  Auctions = 'auctions',
  Trades = 'trades',
  Stops = 'stops',
  Raids = 'raids',
  Duels = 'duels',
  GymSeats = 'gym-seats',
  Gifts = 'gifts',
  Townsfolk = 'townsfolk',
  Catching = 'catching',
  Claims = 'claims',
}

/** What a player is told when maintenance is on and its switch names no message */
export const MAINTENANCE_MESSAGE = 'The game is closed for maintenance. Try again soon.';

/** What a player is told when one part is closed and its switch names no message */
export const CLOSED_MESSAGE = 'This is closed for now. Try again soon.';

/** Every part in the order the dashboard lists them, maintenance first */
export const FEATURES: readonly Feature[] = [
  Feature.Everything,
  Feature.Auctions,
  Feature.Trades,
  Feature.Stops,
  Feature.Raids,
  Feature.Duels,
  Feature.GymSeats,
  Feature.Gifts,
  Feature.Townsfolk,
  Feature.Catching,
  Feature.Claims,
];

export interface SwitchRow {
  feature: string;
  closed: boolean;
  /** What a refused player is told; empty for the default */
  message: string;
}

export async function readSwitches(): Promise<SwitchRow[]> {
  const rows = await getSql()`select feature, closed, message from switches`;
  const read: SwitchRow[] = [];

  for (const row of rows) {
    read.push({
      feature: asString(row.feature),
      closed: row.closed === true,
      message: asString(row.message),
    });
  }
  return read;
}

/**
 * Open or close one part, and set what a refused player is told. The
 * caller holds `feature` to a real part (`FEATURE` in `./validate`).
 * Written as an upsert so a part added after the table was seeded
 * still takes a switch
 */
export async function writeSwitch(
  feature: string,
  closed: boolean,
  message: string,
): Promise<void> {
  await getSql()`
    insert into switches (feature, closed, message)
    values (${feature}, ${closed}, ${message})
    on conflict (feature) do update set closed = excluded.closed, message = excluded.message
  `;
}
