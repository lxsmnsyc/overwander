import 'server-only';
import registerGameData from '../data';

/**
 * Every registry, filled the moment the server loads.
 *
 * The browser loads what a fight needs on demand, because it has a
 * first frame to protect and none of that data is read to walk
 * around. The server has no first frame: it answers one call at a
 * time, and a privileged call that had to await a dynamic import
 * before reading a move would be a race for every caller to
 * remember. So the server takes the whole dex at import, once, and
 * every read below is synchronous again.
 *
 * It is imported for its side effect by [`db.ts`](./db.ts), which
 * every privileged module already goes through.
 */
registerGameData();
