import { fillAbilities } from './load';

/**
 * Every ability, in every locale, at once and synchronously, for the
 * server, the tests and the scripts. The browser loads through
 * `load.ts` instead, so the other locales stay out of its chunks
 */
export default function registerAbilities(): void {
  fillAbilities(
    import.meta.glob('../text/*/abilities/**/*.yaml', { eager: true, import: 'default' }),
  );
}
