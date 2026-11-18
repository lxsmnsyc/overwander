/**
 * The registries a fight needs, loaded when something needs them.
 *
 * Moves, abilities and items are two thirds of the data in the game
 * and none of it is read to draw the overworld: a player walking
 * around is not using a move card, a bag or an ability. So they are
 * imported dynamically and registered on first ask, which keeps them
 * out of the chunk the first frame waits for.
 *
 * The load is memoized, so twenty callers asking at once share one
 * import, and a failed load is cleared so the next caller retries. It
 * is skipped when the registries are already filled, which is always
 * the case on the server: registering again with only one locale's
 * text would overwrite the server's every-locale records.
 *
 * Both sides of the boundary have to wait for it. In the browser that
 * is a resource read under `Suspense`; on the server it is an `await`
 * at the top of whichever privileged call reads one of these
 * registries.
 */
import { getRegisteredAbilities } from './abilities';
import { ItemTypes } from './ids/items';
import { listItemsByType } from './items';
import ensureLearnSets from './learnset-data';
import { getRegisteredMoves } from './moves';

let loading: Promise<void> | undefined;

let loaded = false;

/**
 * Whether something has already registered all three, which is the
 * server's case: it takes every locale at once, and a load here would
 * overwrite that with one locale's text
 */
function isRegistered(): boolean {
  return (
    getRegisteredMoves().length > 0 &&
    getRegisteredAbilities().length > 0 &&
    listItemsByType(ItemTypes.Medicine).length > 0
  );
}

/**
 * Whether the fight registries are filled. Anything that reads one of
 * them without awaiting first can ask this rather than throwing
 */
export function isBattleDataReady(): boolean {
  return loaded || isRegistered();
}

export default async function ensureBattleData(): Promise<void> {
  if (loaded || isRegistered()) {
    return;
  }

  loading ??= (async (): Promise<void> => {
    // The learn sets ride along: the machines are registered off what
    // every species can be taught, so the items cannot be filled
    // before them
    const [moves, abilities, items] = await Promise.all([
      import('./moves/load'),
      import('./abilities/load'),
      import('./items/load'),
      ensureLearnSets(),
    ] as const);

    // Each loader fetches its text files, English and the page's locale only
    await Promise.all([moves.default(), abilities.default()]);
    // The machines need the moves in place, so the items come after them
    await items.default();

    loaded = true;
  })();

  try {
    await loading;
  } catch (error) {
    // A failed fetch is retried by the next caller
    loading = undefined;
    throw error;
  }
}
