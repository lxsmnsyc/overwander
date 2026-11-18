import { readLearnSets } from './yaml';
import { registerLearnSets as storeLearnSets } from './learnset-store';

/**
 * Read the learn sets out of their YAML and put them in the store.
 *
 * Only ever imported dynamically by the browser (see
 * [`learnset-data.ts`](../learnset-data.ts)), which is what keeps
 * these files out of the chunk the first frame waits for, and
 * statically by `registerGameData`, which has no first frame to
 * protect. The species have to be registered first
 */
export default function registerLearnSets(): void {
  storeLearnSets(
    readLearnSets(import.meta.glob('./learnsets/**/*.yaml', { eager: true, import: 'default' })),
  );
}
