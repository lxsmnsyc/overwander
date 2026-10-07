import type { JSX, ParentProps } from 'solid-js';
import type { CaughtPokemon } from '../../auth/caught';
import TeamStrip from './TeamStrip';

/**
 * One saved team as a row: the team first, standing on its own with
 * no box round it, then a plate holding its name and what can be done
 * with it. Inside a row of its own the strip was squeezed to nothing;
 * outside it the team is the first thing read, the way a battle in the
 * history reads.
 *
 * The children are the plate's: the name and its notes, then the
 * buttons, which stand at the plate's far end.
 */
export interface TeamRowProps extends ParentProps {
  catches: [string, CaughtPokemon][];
  /** The team's name, which titles the row for a screen reader */
  name: string;
  /** What each one finished a fight on, passed to the strip */
  ended?: (number | undefined)[];
  /** The plate tinted for the reader's own row, or for the other side */
  tone?: 'mine' | 'foe';
}

const PLATES: Record<'mine' | 'foe' | 'plain', string> = {
  mine: 'border-leaf bg-leaf-soft',
  foe: 'border-ember bg-ember-soft',
  plain: 'border-line bg-paper',
};

export default function TeamRow(props: TeamRowProps): JSX.Element {
  return (
    <li aria-label={props.name} class="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
      <div class="w-full shrink-0 sm:w-80">
        <TeamStrip catches={props.catches} ended={props.ended} />
      </div>
      <div
        class={`flex min-w-0 grow flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border-2 px-3
          py-2 text-sm shadow-pop-sm ${PLATES[props.tone ?? 'plain']}`}
      >
        {props.children}
      </div>
    </li>
  );
}

/** The list the rows stand in, with no box of its own either */
export function TeamRows(props: ParentProps): JSX.Element {
  return <ul class="m-0 flex list-none flex-col gap-2 p-0">{props.children}</ul>;
}
