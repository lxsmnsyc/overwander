import { type JSX, Show } from 'solid-js';
import type { CaughtPokemon } from '../../auth/caught';
import { TEAM_SIZE } from '../../auth/teams';
import { HoverCard } from '../styled';
import CatchBox, { type BoxEntry } from './CatchBox';
import CatchCard from './CatchCard';
import { asBoxEntry } from './catch-summary';
import { titleCatch } from '../details';

export interface TeamStripProps {
  /** The party, as records — live ones, or snapshots read back */
  catches: [string, CaughtPokemon][];
  /**
   * How much room the strip takes. It is capped by default, since most
   * of the rows that carry one put it beside something else; a row
   * that gives it the width says so
   */
  class?: string;
  /**
   * What each one finished a fight on, by its place in the party, as a
   * share of its HP: a summary draws the party as the fight left it
   * rather than as it went in
   */
  ended?: (number | undefined)[];
}

/**
 * One party as one row of squares: the box, cut down to a team. Every
 * square carries the same card a square of the box carries — what it
 * is and what it knows — and nothing on the card can be pressed,
 * since a team being looked at is somebody else's to field
 */
export default function TeamStrip(props: TeamStripProps): JSX.Element {
  const entries = (): BoxEntry[] => {
    const squares: BoxEntry[] = [];

    for (const [seat, record] of props.catches.entries()) {
      const entry = asBoxEntry(record);
      const health = props.ended?.[seat];

      squares.push(health == null ? entry : { ...entry, health, fainted: health <= 0 });
    }
    return squares;
  };

  const recordOf = (id: string): [string, CaughtPokemon] | undefined => {
    for (const record of props.catches) {
      if (record[0] === id) {
        return record;
      }
    }
    return undefined;
  };

  return (
    <div class={props.class ?? 'w-full max-w-80'}>
      <CatchBox
        capacity={TEAM_SIZE}
        compact
        cardOnly
        entries={entries()}
        cell={(entry) => (
          <HoverCard
            class="block size-full"
            trigger={<span class="block size-full" />}
            title={titleCatch(recordOf(entry().id)?.[1])}
            kind="Pokémon"
          >
            <Show when={recordOf(entry().id)}>{(found) => <CatchCard caught={found()[1]} />}</Show>
          </HoverCard>
        )}
      />
    </div>
  );
}
