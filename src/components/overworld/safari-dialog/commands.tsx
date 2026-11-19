import type { JSX } from '@solidjs/web';
import { Show } from 'solid-js';
import { Button } from '../../styled';
import type { InventoryEntry } from '../../../auth/inventory';
import { type Items, getBall } from '../../../data/ids/items';
import type { EncounterRecord } from '../../../model/encounter-record';
import type SafariSession from '../../../overworld/safari';
import { SafariState } from '../../../overworld/safari';
import { ArrowLeftIcon, BagIcon } from '../../icons';
import { describeItem } from '../../details';
import InventoryPicker from '../../items/InventoryPicker';
import ItemSprite from '../../items/ItemSprite';
import { THROW_SPRITE, isTreat } from './metrics';
import { m } from '../../../i18n/paraglide/messages.js';

/**
 * One command in the safari's menu: a button as tall as a thumb, its
 * word over a line of note. It squashes under the press like every
 * other button
 */
const TILE = 'h-21 flex-col justify-center gap-0.5 rounded-2xl! px-1.5 text-base shadow-pop!';

/** The small line under a tile's word */
const TILE_NOTE = 'text-[11px] font-bold text-muted';

export interface CommandsProps {
  session: SafariSession<EncounterRecord>;
  player: string;
  /** The bag as read, or undefined while it is not */
  entries: InventoryEntry[] | undefined;
  /** What the throw would send: a treat in hand, or the ball */
  inHand: Items;
  /** How many of it the player carries */
  stockOf: (item: Items) => number;
  throwing: boolean;
  rummaging: boolean;
  /** The id of what was just caught, until the player has seen it */
  caught: string | null;
  onLeave: () => void;
  onThrow: () => void;
  onOpenBag: () => void;
  onCloseBag: () => void;
  onTake: (item: Items) => void;
  onLook: () => void;
}

/**
 * What the player can do next: the three commands, the bag in their
 * place, or how it ended and the way on
 */
export default function Commands(props: CommandsProps): JSX.Element {
  return (
    <Show
      when={props.session.state === SafariState.Active}
      fallback={
        <div class="grid grid-cols-2 gap-2">
          <Show
            when={props.caught}
            fallback={
              <Button class={`${TILE} col-span-2`} onClick={props.onLeave}>
                {m.ow_walk_on()}
              </Button>
            }
          >
            <Button class={TILE} onClick={props.onLeave}>
              {m.ow_walk_on()}
            </Button>
            <Button tone="primary" class={TILE} onClick={props.onLook}>
              {m.safari_have_a_look()}
            </Button>
          </Show>
        </div>
      }
    >
      <Show
        when={props.rummaging}
        fallback={
          // The command menu: the way out on the left, as a dock has it, then the throw and the bag
          <div class="grid grid-cols-[1fr_1.5fr_1fr] gap-2.5">
            <Button
              class={`${TILE} text-ember-dark!`}
              disabled={props.throwing}
              onClick={props.onLeave}
            >
              <ArrowLeftIcon class="size-5" aria-hidden="true" />
              {m.safari_run()}
              <span class={TILE_NOTE}>{m.safari_walk_away()}</span>
            </Button>
            {/* The ball in hand is the label: it is the one thing
              checked between every throw */}
            <Button
              tone="primary"
              class={TILE}
              disabled={props.throwing || props.stockOf(props.inHand) === 0}
              label={m.safari_throw_label({
                item: describeItem(props.inHand),
                count: props.stockOf(props.inHand),
              })}
              onClick={props.onThrow}
            >
              <span class="flex items-center gap-2.5">
                <ItemSprite item={props.inHand} size={THROW_SPRITE} label="" class="-my-1" />
                {m.safari_throw()}
              </span>
              <span class="text-[11px] font-bold text-on-accent/85">
                {describeItem(props.inHand)} × {props.stockOf(props.inHand)}
              </span>
            </Button>
            <Button class={TILE} disabled={props.throwing} onClick={props.onOpenBag}>
              <BagIcon class="size-5" aria-hidden="true" />
              {m.safari_bag()}
              <span class={TILE_NOTE}>{m.safari_bag_note()}</span>
            </Button>
          </div>
        }
      >
        {/* Balls and treats only, and no treat while it is
          still chewing the last one */}
        <InventoryPicker
          fill
          inline
          player={props.player}
          value={props.inHand}
          empty={m.safari_bag_empty()}
          filter={(entry) =>
            getBall(entry.item) != null || (isTreat(entry.item) && props.session.canFeed())
          }
          entries={props.entries}
          onPick={(item) => {
            if (item != null) {
              props.onTake(item);
            }
          }}
        />
        <Button class={`${TILE} h-13!`} onClick={props.onCloseBag}>
          {m.safari_never_mind()}
        </Button>
      </Show>
    </Show>
  );
}
