import { Index, type JSX, Show } from 'solid-js';
import { m } from '../../../i18n/paraglide/messages.js';
import ItemSprite from '../../items/ItemSprite';
import { Meta, TooltipHost } from '../../styled';
import type { ItemReading, ItemState } from './unit-reading';

/** The square each state is drawn in */
const SQUARES: Record<ItemState, string> = {
  held: 'border-gold/60 bg-gold-soft',
  stopped: 'border-line bg-line-soft',
  used: 'border-dashed border-line bg-transparent',
  lost: 'border-dashed border-ember/60 bg-transparent',
};

/** The picture inside the square: whole while it works, faded once it does not */
const PICTURES: Record<ItemState, string> = {
  held: '',
  stopped: 'opacity-60',
  used: 'opacity-35 grayscale',
  lost: 'opacity-35 grayscale',
};

/** What the card under an item's name says about where it stands */
function describeState(reading: ItemReading): string | null {
  switch (reading.state) {
    case 'stopped':
      return m.battle_item_stopped();
    case 'used':
      return m.battle_item_used();
    case 'lost':
      return reading.by == null ? m.battle_item_lost() : m.battle_item_lost_to({ by: reading.by });
    default:
      return null;
  }
}

/** What a screen reader hears for a square: the item, then where it stands */
function describeSquare(reading: ItemReading): string {
  const state = describeState(reading);

  return state == null ? reading.name : m.battle_item_with_state({ item: reading.name, state });
}

/**
 * A pokemon's items as a tray of squares, one per item it has held
 * this fight. A spent or taken item keeps its square, faded, so the
 * tray says what the pokemon walked in with and what it has left; the
 * card over each square says what happened to it
 */
export default function ItemTray(props: { items: ItemReading[]; size: number }): JSX.Element {
  return (
    <Show when={props.items.length > 0} fallback={<Meta>{m.battle_no_item()}</Meta>}>
      <ul class="m-0 flex list-none flex-row flex-wrap gap-1 p-0">
        <Index each={props.items}>
          {(reading) => (
            <li>
              <TooltipHost
                class="block"
                kind="item"
                name={reading().name}
                description={reading().description}
                extra={() => (
                  <Show when={describeState(reading())}>
                    {(said) => <span class="text-xs font-extrabold">{said()}</span>}
                  </Show>
                )}
              >
                <span
                  class={`relative flex items-center justify-center rounded-button border-2
                    transition-[opacity,filter,border-color] duration-(--motion-move)
                    ${SQUARES[reading().state]}`}
                  style={{ width: `${props.size}px`, height: `${props.size}px` }}
                >
                  <ItemSprite
                    item={reading().item}
                    size={props.size - 4}
                    label={describeSquare(reading())}
                    class={`transition-[opacity,filter] duration-(--motion-move) ${PICTURES[reading().state]}`}
                  />
                  {/* A taken item is struck through, so a glance tells it
                      from one used up */}
                  <Show when={reading().state === 'lost'}>
                    <span
                      class="pointer-events-none absolute inset-x-1 top-1/2 h-0.5 -rotate-45 rounded-full
                        bg-ember"
                      aria-hidden="true"
                    />
                  </Show>
                </span>
              </TooltipHost>
            </li>
          )}
        </Index>
      </ul>
    </Show>
  );
}
