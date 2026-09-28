import { COMPACT_REGIONS, type LearnSetFile, registerLearnSetRows } from './compact';

/**
 * Every species' learn set. Nothing on the way to the first frame reads
 * one, so the browser loads this with the fight data rather than at boot
 */
const LEARN_SETS = import.meta.glob<LearnSetFile>('./compact/*.learnsets.json', {
  eager: true,
  import: 'default',
});

export default function registerSpeciesLearnSets(): void {
  for (const region of COMPACT_REGIONS) {
    registerLearnSetRows(LEARN_SETS[`./compact/${region}.learnsets.json`]);
  }
}
