import { type JSX, type Resource, Suspense, createResource } from 'solid-js';
import { type CaughtPokemon, getCaught } from '../../auth/caught';
import { describeCatch } from '../catches/catch-summary';

/**
 * A catch named by its id, for a line that only holds the id: a trade
 * names rows the way an auction lot does, and every signed-in player
 * may read them. The record is read one component down so a name still
 * arriving suspends here rather than at the page's own boundary
 */

function Named(props: { caught: Resource<CaughtPokemon | null> }): JSX.Element {
  return <span>{props.caught() == null ? 'a pokemon' : describeCatch(props.caught()!)}</span>;
}

export default function NamedCatch(props: { id: string }): JSX.Element {
  const [caught] = createResource(() => props.id, getCaught);

  return (
    <Suspense fallback={<span>a pokemon</span>}>
      <Named caught={caught} />
    </Suspense>
  );
}
