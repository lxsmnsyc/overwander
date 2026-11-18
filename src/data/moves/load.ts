import { type LazyText, readActiveText } from '../locale-text';
import { registerMove } from './__create';
import { readMoves } from './yaml';

/**
 * The moves, read out of their YAML and registered.
 *
 * Nothing but `battle-data.ts` (through a dynamic import) and
 * `register.ts` reaches this module, which is what keeps the move
 * files out of the first frame's download. The words of every locale
 * but English are fetched apart, one file each (see `locale-text.ts`).
 */

const BATTLE = import.meta.glob('./battle/**/*.yaml', { eager: true, import: 'default' });
const CAST = import.meta.glob('./cast/**/*.yaml', { eager: true, import: 'default' });
const ENGLISH = import.meta.glob('../text/en/moves/**/*.yaml', { eager: true, import: 'default' });
const OTHER: LazyText = import.meta.glob(['../text/*/moves/**/*.yaml', '!../text/en/moves/**'], {
  import: 'default',
});

/** Registers the moves from every text file given, English among them */
export function fillMoves(text: Record<string, unknown>): void {
  const read = readMoves({ battle: BATTLE, cast: CAST, text });

  for (const [move, data] of read) {
    registerMove(move, data);
  }
}

/** Registers the moves in English and the active locale, which is all a page shows */
export default async function loadMoves(): Promise<void> {
  fillMoves({ ...ENGLISH, ...(await readActiveText(OTHER)) });
}
