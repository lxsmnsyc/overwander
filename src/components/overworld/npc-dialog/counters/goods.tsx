import { type JSX, Show } from 'solid-js';
import type { InventoryEntry } from '../../../../auth/inventory';
import type { Items } from '../../../../data/ids/items';
import { FOSSIL_REVIVE_LEVEL, getFossilPrice } from '../../../../data/overworld/fossil';
import ItemGrid from '../../../items/ItemGrid';
import { describeItem } from '../../../details';
import { Badge, Detail, DialogSection, Meta, Note, Row } from '../../../styled';
import { CENTRED } from '../shared';

/**
 * The counters that deal in things rather than in pokemon: the rocks
 * the maniac digs up, the bench they are opened on, and the vendor's
 * crate. What a purse holds is drawn on each of them, since it is what
 * decides whether a square can be pressed.
 */

/** What is in the purse, over whatever it is about to be spent on */
function Purse(props: { gold: number }): JSX.Element {
  return (
    <Row class="justify-center">
      <Badge tone="gold">{props.gold} gold</Badge>
    </Row>
  );
}

export interface FossilCounterProps {
  /** The rocks he is carrying this window */
  offer: Items[];
  gold: number;
  busy: boolean;
  /** Whether he has already sold his one this window */
  sold: boolean;
  onBuy: (item: Items) => void;
}

export function FossilCounter(props: FossilCounterProps): JSX.Element {
  return (
    <DialogSection class={CENTRED}>
      <Purse gold={props.gold} />

      {/* Two rocks, and nothing about what is in them. He is selling
          the dig rather than the pokemon, and a player who knew which
          species each held would be buying a name off a shelf.

          Sold is a state of the shelf, not a message: one a window is
          his rule, and after it the squares would only offer a press
          the server refuses */}
      <Show when={!props.sold} fallback={<Note>He has sold you his one for today.</Note>}>
        <Show when={props.offer.length > 0} fallback={<Note>He has nothing on him just now.</Note>}>
          {/* The bag's own tray, trading the way the vendor's crate
              does: the press is the purchase, with the price on the
              square and the purse greying what it will not stretch
              to */}
          <ItemGrid
            bare
            verb="Buy"
            disabled={props.busy}
            entries={props.offer.map((item) => ({
              item,
              note: `${getFossilPrice(item)} gold`,
              said: `Buy ${describeItem(item)}, ${getFossilPrice(item)} gold`,
              blocked: getFossilPrice(item) > props.gold ? 'More than you hold' : null,
              card: () => <Detail label="Costs">{getFossilPrice(item)} gold</Detail>,
            }))}
            onPress={props.onBuy}
          />
        </Show>
      </Show>
    </DialogSection>
  );
}

export interface ReviveCounterProps {
  /** The fossils in the player's own bag, which is all he works on */
  fossils: InventoryEntry[];
  busy: boolean;
  onRevive: (item: Items) => void;
}

export function ReviveCounter(props: ReviveCounterProps): JSX.Element {
  return (
    <DialogSection class={CENTRED}>
      {/* What he takes is in the bag rather than in a crate, so the
          list is the player's own fossils. He charges nothing else,
          and he will do it as often as there are rocks to open */}
      <Show
        when={props.fossils.length > 0}
        fallback={<Note>You are carrying nothing he can open.</Note>}
      >
        {/* The bag's own tray, opening rocks the way the crate sells:
            one press, one rock on the bench */}
        <ItemGrid
          bare
          verb="Revive"
          disabled={props.busy}
          entries={props.fossils.map((entry) => ({
            item: entry.item,
            amount: entry.amount,
            said: `Revive ${describeItem(entry.item)}`,
          }))}
          onPress={props.onRevive}
        />
        {/* What comes out is the rock's business, but the level is not
            — a party picked around it is worth planning before the
            fossil is spent */}
        <Meta class="block">Whatever is in there comes out at level {FOSSIL_REVIVE_LEVEL}.</Meta>
      </Show>
    </DialogSection>
  );
}

export function VendorCounter(props: { gold: number }): JSX.Element {
  return (
    <DialogSection title="Trading" class={CENTRED}>
      <Purse gold={props.gold} />

      {/* His crate and the player's bag are windows of their own,
          opened from the bar below */}
      <Note>Buy from him, or sell to him.</Note>
    </DialogSection>
  );
}
