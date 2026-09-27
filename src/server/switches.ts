import 'server-only';

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
