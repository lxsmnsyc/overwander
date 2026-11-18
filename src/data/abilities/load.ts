import { type LazyText, readActiveText } from '../locale-text';
import { registerAbility, registerFormSignature, registerSignature } from './__create';
import { readAbilities, readSignatures } from './yaml';

/**
 * The abilities, read out of their YAML and registered.
 *
 * Nothing but `battle-data.ts` (through a dynamic import) and
 * `register.ts` reaches this module, which keeps the files out of the
 * first frame's download. The words of every locale but English are
 * fetched apart, one file each (see `locale-text.ts`).
 */

const ENGLISH = import.meta.glob('../text/en/abilities/**/*.yaml', {
  eager: true,
  import: 'default',
});
const OTHER: LazyText = import.meta.glob(
  ['../text/*/abilities/**/*.yaml', '!../text/en/abilities/**'],
  { import: 'default' },
);
const SIGNATURES = import.meta.glob('./signatures/*.yaml', { eager: true, import: 'default' });

/** Registers the abilities from every text file given, English among them */
export function fillAbilities(text: Record<string, unknown>): void {
  // Written as YAML: the abilities are all text, the grants a file per region (see ./yaml.ts)
  for (const [ability, data] of readAbilities(text)) {
    registerAbility(ability, data);
  }

  const grants = readSignatures(SIGNATURES);

  for (const [family, ability] of grants.families) {
    registerSignature(family, ability);
  }
  for (const [forms, ability] of grants.forms) {
    registerFormSignature(forms, ability);
  }
}

/** Registers the abilities in English and the active locale, which is all a page shows */
export default async function loadAbilities(): Promise<void> {
  fillAbilities({ ...ENGLISH, ...(await readActiveText(OTHER)) });
}
