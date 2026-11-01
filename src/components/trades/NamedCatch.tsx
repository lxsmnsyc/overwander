import { type JSX, type Resource, Suspense, createResource } from 'solid-js';
import { type CaughtPokemon, getCaughtBatched } from '../../auth/caught';
import { describeCatch } from '../catches/catch-summary';
import { m } from '../../i18n/paraglide/messages.js';

/**
 * A catch named by its id, for a line that only holds the id: a trade
 * names rows the way an auction lot does, and every signed-in player
 * may read them. The record is read one component down so a name still
 * arriving suspends here rather than at the page's own boundary
 */

function Named(props: {
  caught: Resource<CaughtPokemon | null>;
  say?: (name: string) => string;
}): JSX.Element {
  // A caller that puts the name inside a sentence passes how it reads
  const say = (name: string): string => props.say?.(name) ?? name;

  return (
    <span>
      {say(props.caught() == null ? m.trade_a_pokemon() : describeCatch(props.caught()!))}
    </span>
  );
}

/**
 * A sentence with names in it that are markup, such as a catch still
 * being read. The message is written with a numbered mark in place of
 * each name and cut at the marks, so a language is free to put the names
 * where it wants them
 */
export function fillSentence(
  say: (marks: string[]) => string,
  nodes: readonly JSX.Element[],
): JSX.Element[] {
  const marks: string[] = [];

  for (let index = 0; index < nodes.length; index++) {
    marks.push(`\u0001${index}\u0001`);
  }

  const parts = say(marks).split('\u0001');
  const filled: JSX.Element[] = [];

  // Every second part is the number of a mark
  for (let index = 0; index < parts.length; index++) {
    filled.push(index % 2 === 1 ? nodes[Number(parts[index])] : parts[index]);
  }
  return filled;
}

export default function NamedCatch(props: {
  id: string;
  /** The name set inside a sentence, where another language orders it differently */
  say?: (name: string) => string;
}): JSX.Element {
  // One per trade row, so the rows on screen share a read
  const [caught] = createResource(
    () => props.id,
    async (id) => getCaughtBatched(id),
  );

  return (
    <Suspense fallback={<span>{props.say?.(m.trade_a_pokemon()) ?? m.trade_a_pokemon()}</span>}>
      <Named caught={caught} say={props.say} />
    </Suspense>
  );
}
