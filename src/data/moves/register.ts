import { fillMoves } from './load';

/**
 * Every move, in every locale, at once and synchronously, for the
 * server, the tests and the scripts. The browser loads through
 * `load.ts` instead, so the other locales stay out of its chunks
 */
export default function registerMoves(): void {
  fillMoves(import.meta.glob('../text/*/moves/**/*.yaml', { eager: true, import: 'default' }));
}
