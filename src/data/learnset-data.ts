/**
 * The learn sets, loaded when something needs them.
 *
 * They are 1.4 MB of YAML and most of what the species registry
 * weighs, and nothing that draws the overworld reads one. So the
 * browser imports them dynamically, after the first frame, and every
 * reader that can run before they arrive waits on this or checks
 * `isLearnSetsReady`. The battle engine reads none, which is why they
 * are not part of [`battle-data.ts`](./battle-data.ts).
 *
 * The load is memoized so any number of callers share one import,
 * and registering is an overwrite, so asking again is harmless. The
 * server and the tests take them at once through `registerGameData`.
 */
import { isLearnSetsLoaded } from './species/learnset-store';

let loading: Promise<void> | undefined;

/** Whether the learn sets can be read, however they got here */
export function isLearnSetsReady(): boolean {
  return isLearnSetsLoaded();
}

export default async function ensureLearnSets(): Promise<void> {
  if (isLearnSetsLoaded()) {
    return;
  }

  loading ??= (async (): Promise<void> => {
    // The species are what the sets are checked against
    const learnsets = await import('./species/learnsets');

    learnsets.default();
  })();

  try {
    await loading;
  } catch (error) {
    // A failed fetch is retried by the next caller
    loading = undefined;
    throw error;
  }
}
