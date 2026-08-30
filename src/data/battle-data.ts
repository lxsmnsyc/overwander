/**
 * The registries a fight needs, loaded when something needs them.
 *
 * Moves, abilities and items are two thirds of the data in the game
 * and none of it is read to draw the overworld: a player walking
 * around is not using a move card, a bag or an ability. So they are
 * imported dynamically and registered on first ask, which keeps them
 * out of the chunk the first frame waits for.
 *
 * The load is memoized rather than guarded by a flag, so twenty
 * callers asking at once share one import. Registration itself is an
 * idempotent map overwrite, so asking again is harmless.
 *
 * Both sides of the boundary have to wait for it. In the browser that
 * is a resource read under `Suspense`; on the server it is an `await`
 * at the top of whichever privileged call reads one of these
 * registries.
 */
let loading: Promise<void> | undefined;

let loaded = false;

/**
 * Whether the fight registries are filled. Anything that reads one of
 * them without awaiting first can ask this rather than throwing
 */
export function isBattleDataReady(): boolean {
  return loaded;
}

export default async function ensureBattleData(): Promise<void> {
  loading ??= (async (): Promise<void> => {
    const [moves, abilities, items] = await Promise.all([
      import('./moves'),
      import('./abilities'),
      import('./items'),
    ]);

    moves.registerMoves();
    abilities.default();
    items.default();

    loaded = true;
  })();

  return loading;
}
