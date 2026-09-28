import { type JSX, type ParentProps, Suspense, createResource, createSignal } from 'solid-js';
import ensureBattleData, { isBattleDataReady } from '../../data/battle-data';

/**
 * The moves, abilities and items, waited for.
 *
 * They are not in the chunk the first frame waits for: nothing about
 * walking around reads them. Anything that does — a move card, a bag,
 * a fight, a dex entry — goes inside one of these, and the wait is
 * whatever the browser takes to fetch a script it does not have yet,
 * which after the first time is nothing at all.
 */

/**
 * The read that suspends. It is a child rather than the provider
 * itself, because a component that reads its own resource suspends
 * the boundary it is meant to be inside
 */
function Loaded(props: ParentProps<{ ready: () => unknown }>): JSX.Element {
  props.ready();

  return <>{props.children}</>;
}

export default function BattleData(props: ParentProps<{ fallback?: JSX.Element }>): JSX.Element {
  const [ready] = createResource(ensureBattleData);

  return (
    <Suspense fallback={props.fallback}>
      <Loaded ready={ready}>{props.children}</Loaded>
    </Suspense>
  );
}

const [ready, setReady] = createSignal(isBattleDataReady());

/**
 * Whether the fight data has landed, read as a signal, for something
 * drawn without waiting on it that can simply stay hidden until then
 */
export function battleDataReady(): boolean {
  if (!ready()) {
    ensureBattleData().then(
      () => setReady(true),
      () => {
        // Retried by whatever asks next
      },
    );
  }
  return ready();
}
