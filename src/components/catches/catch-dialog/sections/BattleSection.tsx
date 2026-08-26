import { ITEM_SPRITE, isHoldable, itemSlots } from '../describe';

import type { CaughtPokemon } from '../../../../auth/caught';

import type { InventoryEntry } from '../../../../auth/inventory';

import type { Items } from '../../../../data/ids/items';

import { getMoveData } from '../../../../data/moves';

import { describeAbility, detailAbility } from '../../../details';

import InventoryPicker from '../../../items/InventoryPicker';
import ItemCard from '../../../items/ItemCard';

import ItemSprite from '../../../items/ItemSprite';
import MoveHoverCard from '../../../moves/MoveHoverCard';

import { Badge, Button, DialogSection, HoverCard, Note, TooltipHost } from '../../../styled';

import { For, Index, type JSX, Show } from 'solid-js';

/**
 * What it brings to a fight, in one row: what it knows, what it is,
 * and what it is carrying. The item squares are the only part anybody
 * can press, and only its owner can.
 */
export interface BattleSectionProps {
  caught: CaughtPokemon;
  owned: boolean;
  frozen: boolean;
  /** What in the bag it could be given, which decides whether a slot invites a press */
  holdables: InventoryEntry[];
  bag: InventoryEntry[] | undefined;
  /** Whether the bag is open over the sheet */
  giving: boolean;
  onGiving: (open: boolean) => void;
  onGive: (item: Items) => void;
  /** Take back whatever is in this slot */
  onTake: (at: number) => void;
}

export default function BattleSection(props: BattleSectionProps): JSX.Element {
  return (
<DialogSection>
  <div class="grid gap-3 sm:grid-cols-3">
    <div class="flex flex-col gap-1">
      <h4>Moves</h4>
      {/* The name, with the entry over it. The
          description was written out under each row
          once, which is four paragraphs in a column
          a third this wide */}
      <Show
        when={props.caught.moves.length}
        fallback={<Note>It knows nothing.</Note>}
      >
        <ul class="m-0 flex list-none flex-col gap-1 p-0">
          <For each={props.caught.moves}>
            {(move) => (
              <li>
                <MoveHoverCard class="block" move={move}>
                  {/* The name and nothing else: what
                      kind it is and what it does are
                      on the card over it, and three
                      marks in a column this narrow
                      left no room for the word */}
                  <span
                    class="block truncate rounded-lg border-2 border-line
                      bg-paper px-2 py-1 text-sm font-medium"
                  >
                    {getMoveData(move).name}
                  </span>
                </MoveHoverCard>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>

    <div class="flex flex-col gap-1">
      <h4>Abilities</h4>
      <Show when={props.caught.abilities.length} fallback={<Note>None.</Note>}>
        <ul class="m-0 flex list-none flex-col gap-1 p-0">
          <For each={props.caught.abilities}>
            {(ability) => (
              <li>
                <TooltipHost class="block" {...detailAbility(ability)}>
                  <Badge class="w-full justify-center" wrap>
                    {describeAbility(ability)}
                  </Badge>
                </TooltipHost>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>

    <div class="flex flex-col gap-1">
      <h4>Held items</h4>
      {/* Squares four across, the way the bag draws
          them: a pokemon carries one by default and
          a Utility Belt widens the record's own
          room, so the tray is as wide as the pokemon
          is rather than as wide as the game allows.
          Room is only drawn for somebody who can
          fill it — an empty square on a stranger's
          pokemon is a button nobody may press */}
      <ul class="m-0 grid list-none grid-cols-4 gap-1 p-0">
        <Index each={itemSlots(props.caught, props.owned)}>
          {(_, at) => (
            <li class="contents">
              <Show
                when={at < props.caught.items.length}
                fallback={
                  <button
                    type="button"
                    disabled={props.frozen || props.holdables.length === 0}
                    aria-label="Give it an item"
                    class="flex aspect-square cursor-pointer items-center
                      justify-center rounded-lg border-2 border-dashed
                      border-line bg-paper/40 p-0 text-muted shadow-none
                      hover:border-tide hover:text-tide-dark
                      active:translate-y-0 disabled:cursor-not-allowed"
                    onClick={() => {
                      props.onGiving(true);
                    }}
                  >
                    +
                  </button>
                }
              >
                <HoverCard
                  class="block"
                  title="Info"
                  footer={(close) => (
                    <Show
                      when={props.owned}
                      fallback={<Button onClick={close}>Close</Button>}
                    >
                      <Button
                        tone="primary"
                        disabled={props.frozen}
                        onClick={() => {
                          close();
                          props.onTake(at);
                        }}
                      >
                        Take back
                      </Button>
                    </Show>
                  )}
                  trigger={
                    <span
                      class="flex aspect-square w-full items-center
                        justify-center rounded-lg border-2 border-line bg-paper"
                    >
                      <ItemSprite
                        item={props.caught.items[at]}
                        size={ITEM_SPRITE}
                        label=""
                      />
                    </span>
                  }
                >
                  <ItemCard item={props.caught.items[at]} />
                </HoverCard>
              </Show>
            </li>
          )}
        </Index>
      </ul>
    </div>
  </div>

  {/* The bag opens as its own window rather than
      unfolding inside the sheet: a tray of thirty
      squares pushed everything under it off the
      screen */}
  <Show when={props.owned}>
    <InventoryPicker
      open={props.giving}
      onClose={() => {
        props.onGiving(false);
      }}
      title="Give an item"
      description="Choose what it should carry."
      entries={props.bag}
      disabled={props.frozen}
      value={null}
      verb="Give"
      filter={(entry) => isHoldable(entry.item)}
      onPick={(item) => {
        props.onGiving(false);

        if (item != null) {
          props.onGive(item);
        }
      }}
    />
  </Show>
</DialogSection>
  );
}
