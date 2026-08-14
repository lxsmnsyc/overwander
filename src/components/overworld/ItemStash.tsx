import { For, type JSX, Show } from 'solid-js';
import type { ItemStack } from '../../data/overworld/item-pool';
import ItemSprite from '../items/ItemSprite';
import { describeItem } from '../items/InventoryPicker';

/**
 * What was found, shown rather than listed.
 *
 * A cache dug out of the ground, a patch picked, a phenomenon's
 * leavings — all three hand back the same thing, a few stacks, and
 * all three used to report it as a sentence. A sentence is the right
 * way to say it and the wrong way to show it: "Found 3 × Poke Ball
 * and a Fire Stone" is something to read, and what a player wants
 * after pressing a cell is to *see* what came out of it.
 *
 * The names stay under the pictures. Half the sheets draw items that
 * look alike at this size — the berries especially — and a picture
 * that cannot be named is a picture that has to be guessed at.
 */

/**
 * How big one is drawn. Larger than a bag row: this is the thing the
 * dialog is about rather than a column beside a name
 */
const ICON_SIZE = 48;

export interface ItemStashProps {
  items: ItemStack[];
}

export default function ItemStash(props: ItemStashProps): JSX.Element {
  return (
    <ul class="m-0 flex list-none flex-row flex-wrap items-start justify-center gap-3 p-0">
      <For each={props.items}>
        {(stack) => (
          <li class="flex w-20 flex-col items-center gap-1 text-center">
            <ItemSprite item={stack.item} size={ICON_SIZE} label="" />
            {/* The count sits with the name rather than under it. How
                many came out of the ground is part of what was found,
                and on its own line it read as a caption to the caption
                — three lines deep for two words.

                One of something still says so by not saying anything:
                a "× 1" beside every picture is noise */}
            <span class="text-xs leading-tight">
              {describeItem(stack.item)}
              <Show when={stack.amount > 1}>
                <span class="tabular-nums text-muted"> × {stack.amount}</span>
              </Show>
            </span>
          </li>
        )}
      </For>
    </ul>
  );
}
