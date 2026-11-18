import type { JSX } from '@solidjs/web';
import { Loading, Show, createResource } from 'solid-js';
import { AuctionLot, type AuctionRecord } from '../../auth/auctions';
import { getCaughtBatched } from '../../auth/caught';
import { Genders, Species } from '../../data/ids/species';
import { isEgg } from '../../model/egg';
import { isShiny } from '../../model/caught-record';
import ItemSprite from '../items/ItemSprite';
import AnimatedSprite from '../sprites/AnimatedSprite';

/**
 * A lot's picture in a 44px rounded square: the pokemon as it stands
 * in its record, or the item's icon. The row it sits in names the lot
 * in words; this is what the eye finds first.
 *
 * The record is read through the batched read the rest of the board
 * uses, so a page of rows is one read
 */
export function CatchFace(props: { catchId: string }): JSX.Element {
  const [caught] = createResource(
    () => props.catchId || false,
    async (id) => getCaughtBatched(id),
  );

  return (
    <Show when={caught()}>
      {(loaded) => (
        <AnimatedSprite
          species={isEgg(loaded()) ? Species.Egg : loaded().species}
          female={!isEgg(loaded()) && loaded().gender === Genders.Female}
          shiny={!isEgg(loaded()) && isShiny(loaded())}
          direction="DownLeft"
          fill
          shadow
        />
      )}
    </Show>
  );
}

export default function LotFace(props: { auction: AuctionRecord }): JSX.Element {
  return (
    <span
      class="flex size-11 shrink-0 items-center justify-center rounded-[12px] border-2
        border-line-soft bg-line-soft/60 p-0.5"
      aria-hidden="true"
    >
      <Show
        when={
          props.auction.lot === AuctionLot.Item && props.auction.item != null
            ? props.auction.item
            : null
        }
        fallback={
          <Loading>
            <CatchFace catchId={props.auction.caught} />
          </Loading>
        }
      >
        {(item) => <ItemSprite item={item()} size={32} label="" />}
      </Show>
    </span>
  );
}
