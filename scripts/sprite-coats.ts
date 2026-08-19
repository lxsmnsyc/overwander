import writeCoats from '../src/server/sprites/coats.ts';

/**
 * Rebuilds the list of which pokemon were drawn in which coat.
 *
 * The sprite processor writes it after every pack, so this is for the
 * sheets that arrive another way — dropped in by hand, pulled from a
 * branch — and for the first build on a checkout that has none. It
 * reads the directories rather than any record of them, so running it
 * after deleting a sheet takes that sheet out of the list.
 */
console.log(`public/${await writeCoats()}`);
