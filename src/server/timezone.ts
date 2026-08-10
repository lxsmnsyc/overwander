import 'server-only';

/**
 * The server keeps UTC, whatever the machine it runs on is set to.
 *
 * Every timestamp the game stores is epoch milliseconds, which carry
 * no timezone — but anything that reads a *calendar* out of one does:
 * the species day counts days of the year, a catch date is shown as a
 * date, and a snapshot window is a wall-clock slice. If one deploy
 * ran in Asia/Manila and another in UTC, the two would disagree about
 * which day it is for the same instant, and the featured family would
 * change at different moments for different players.
 *
 * Pinning the process timezone makes the server's local time and UTC
 * the same thing, so those derivations agree everywhere. It is set as
 * a side effect at import: the privileged modules all pull this in,
 * so it lands before any server code reads a clock.
 */
process.env.TZ = 'UTC';

/**
 * The timezone the server derives calendars in. Exported so a caller
 * can state it rather than assume it
 */
const SERVER_TIMEZONE = 'UTC';

export default SERVER_TIMEZONE;
