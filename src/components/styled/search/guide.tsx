import { type JSX, Show } from 'solid-js';
import type { QueryVocabulary } from '../../../core/query';
import { InformationIcon } from '../../icons';
import HoverCard from '../hover-card';

/**
 * How to ask the box for something precise.
 *
 * The grammar is worth a sentence each and no more. What the fields
 * *are* is not written here at all: there are four dozen of them on a
 * box of pokemon, and a card listing every one is a card nobody
 * finishes. The box offers them as they are typed, and this says so.
 */

/** One rule, with the shape of it beside the words */
function Rule(props: { shows: string; children: JSX.Element }): JSX.Element {
  return (
    <li class="flex flex-col gap-0.5">
      <code class="w-fit rounded bg-line-soft px-1 py-0.5 text-xs text-ink">{props.shows}</code>
      <span class="text-xs text-muted">{props.children}</span>
    </li>
  );
}

/** The values a field offers, with anything needing quotes left out */
function plainValues(vocabulary: QueryVocabulary, named: string): string[] {
  return (
    vocabulary.fields
      .find((field) => field.name === named)
      ?.values?.()
      .filter((value) => !/\s/.test(value)) ?? []
  );
}

export interface SearchGuideProps {
  vocabulary: QueryVocabulary;
  /**
   * A whole term from the box being searched, so the first example is
   * about what the player is actually looking at rather than about
   * pokemon on a page about the bag
   */
  example?: string;
}

/**
 * The question mark beside the box, and what it says. A hover card
 * rather than a tooltip because there is more here than a line, and
 * because it has to stay up long enough to be read
 */
export default function SearchGuide(props: SearchGuideProps): JSX.Element {
  /**
   * The shapes, in the box's own words where it has any. A guide about
   * pokemon on a card attached to the bag would be worse than no card
   */
  const refused = (): string => {
    const marks = plainValues(props.vocabulary, 'is');

    return marks.length === 0 ? '!field:value' : `!is:${marks[0]}`;
  };

  const either = (): string => {
    for (const field of props.vocabulary.fields) {
      const values = plainValues(props.vocabulary, field.name);

      if (field.name !== 'order' && values.length >= 2) {
        return `${field.name}:${values[0]}|${values[1]}`;
      }
    }
    return 'field:one|other';
  };

  const arranged = (): string => {
    const ways = plainValues(props.vocabulary, 'sort');

    return ways.length === 0 ? 'sort:name order:desc' : `sort:${ways[0]} order:desc`;
  };

  return (
    <HoverCard
      title="Searching"
      description="A word finds a name. Everything else narrows."
      placement="bottom"
      width="wide"
      // The trigger is focusable but is not a button, so the ring the
      // rest of the kit draws is asked for here
      class="inline-flex rounded text-muted transition-colors hover:text-ink
      focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tide"
      trigger={
        // Named on the icon rather than beside it: the card's own
        // trigger takes its name from what is inside it, and a name
        // hidden from the pointer is a target nobody can reach
        <InformationIcon class="size-4" role="img" aria-label="How to search" />
      }
    >
      <ul class="flex flex-col gap-2">
        <Show when={props.example}>
          {(shown) => <Rule shows={shown()}>One field, one value. Terms narrow each other.</Rule>}
        </Show>
        <Rule shows={refused()}>A term with a bang in front of it is refused.</Rule>
        <Rule shows={either()}>A bar inside a value takes any of them.</Rule>
        <Rule shows="field:&gt;50">
          A number takes a comparison, or a range: <code>field:30-60</code>.
        </Rule>
        <Rule shows='field:"two words"'>Quotes hold a value that carries a space.</Rule>
        <Rule shows={arranged()}>Arranges the answers rather than narrowing them.</Rule>
      </ul>
      <p class="mt-2 text-xs text-muted">
        Start typing a field and the box offers the {props.vocabulary.fields.length} it knows, then
        the values that one takes.
      </p>
    </HoverCard>
  );
}
