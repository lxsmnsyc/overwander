import { type JSX, Show } from 'solid-js';
import type { CaughtPokemon } from '../../auth/caught';
import { TEAM_SIZE } from '../../auth/teams';
import { HoverCard } from '../styled';
import CatchBox from './CatchBox';
import CatchCard from './CatchCard';
import { asBoxEntry } from './catch-summary';

export interface TeamStripProps {
  /** The party, as records — live ones, or snapshots read back */
  catches: [string, CaughtPokemon][];
}

/**
 * One party as one row of squares: the box, cut down to a team. Every
 * square carries the same card a square of the box carries — what it
 * is and what it knows — and nothing on the card can be pressed,
 * since a team being looked at is somebody else's to field
 */
export default function TeamStrip(props: TeamStripProps): JSX.Element {
  return (
    <div class="w-full max-w-60">
      <CatchBox
        capacity={TEAM_SIZE}
        cardOnly
        entries={props.catches.map(asBoxEntry)}
        cell={(entry) => (
          <HoverCard
            class="block size-full"
            trigger={<span class="block size-full" />}
            title="Info"
          >
            <Show when={props.catches.find(([id]) => id === entry().id)}>
              {(found) => <CatchCard caught={found()[1]} />}
            </Show>
          </HoverCard>
        )}
      />
    </div>
  );
}
