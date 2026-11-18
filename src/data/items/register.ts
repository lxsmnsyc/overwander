import { fillItems } from './load';

/**
 * Every item, in every locale, at once and synchronously, for the
 * server, the tests and the scripts. The browser loads through
 * `load.ts` instead, so the other locales stay out of its chunks
 */
export default function registerItems(): void {
  fillItems(import.meta.glob('../text/*/items/*.yaml', { eager: true, import: 'default' }));
}
