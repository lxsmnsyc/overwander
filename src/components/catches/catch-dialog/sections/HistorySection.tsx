import { HISTORY_BALL, describeHistory } from '../describe';
import type { OwnershipRecord } from '../../../../auth/caught-record';

import type { CaughtPokemon } from '../../../../auth/caught';
import { ACQUISITION_NAMES } from '../../../../auth/caught-record';

import describeDate from '../../../../core/dates';

import { BALL_ITEMS, Balls } from '../../../../data/ids/items';

import { describeItem } from '../../../items/ItemGrid';
import ItemSprite from '../../../items/ItemSprite';

import { DialogSection, List, ListRow, Meta, RowButton } from '../../../styled';

import { For, type JSX, Show } from 'solid-js';

/**
 * Whose hands it has passed through, oldest first. A previous owner is
 * a way into their profile; the reader themselves is not.
 */
export interface HistorySectionProps {
  caught: CaughtPokemon;
  /** The reader, who is named rather than linked to */
  player: string;
  /** What an entry's owner is called, which the sheet reads profiles for */
  nameOf: (entry: OwnershipRecord) => string;
  onTrainer?: (uid: string) => void;
}

export default function HistorySection(props: HistorySectionProps): JSX.Element {
  return (
<DialogSection title="History">
  <Show when={props.caught.history.length}>
    <List>
      <For each={props.caught.history}>
        {(entry) => (
          <ListRow>
            {/* The ball it arrived in, which is not
                always the one it sits in now: a later
                owner can re-ball it, and the entry is
                the record of how it came across */}
            <Show when={entry.ball != null}>
              <ItemSprite
                item={BALL_ITEMS[entry.ball ?? Balls.PokeBall]}
                size={HISTORY_BALL}
                label={describeItem(BALL_ITEMS[entry.ball ?? Balls.PokeBall])}
              />
            </Show>
            {/* A previous owner is a way to them. The
                reader's own name is not: pressing it
                would open a read-only copy of the
                profile the menu already gives them */}
            <Show
              when={
                // A trainer with no account behind them —
                // the original owner of a distribution —
                // is a name rather than a way to anybody
                entry.owner === '' || entry.owner === props.player
                  ? null
                  : (props.onTrainer ?? null)
              }
              fallback={
                <span class="grow text-left font-medium">
                  {props.nameOf(entry)}
                </span>
              }
            >
              {(visit) => (
                <RowButton
                  class="grow text-left font-medium"
                  onClick={() => {
                    visit()(entry.owner);
                  }}
                >
                  {props.nameOf(entry)}
                </RowButton>
              )}
            </Show>
            {/* How they came by it, when, and what it
                cost them where it cost anything: a lot
                off the block is the one handover with a
                price on it, and the price is most of
                what the entry is worth reading for */}
            <Meta>
              {ACQUISITION_NAMES[entry.kind]} · {describeDate(entry.acquiredAt)}
              {/* Grouped, since a winning bid runs to
                  five figures and a bare 12000 is read
                  digit by digit. Tested for absence
                  rather than truth: nought gold is a
                  price, and nothing is not */}
              <Show when={entry.paid != null}>
                {' '}
                · {(entry.paid ?? 0).toLocaleString('en-US')} gold
              </Show>
            </Meta>
          </ListRow>
        )}
      </For>
    </List>
  </Show>
  <Meta>{describeHistory(props.caught)}</Meta>
</DialogSection>
  );
}
