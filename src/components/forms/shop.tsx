import { type JSX, Show, createSignal } from 'solid-js';
import type { ItemAmount } from '../items/InventoryPicker';
import { Button, DialogActions, DialogSection, Segmented } from '../styled';
import { m } from '../../i18n/paraglide/messages.js';
import { type FormProps, defineForm } from './form';
import { ItemTray, type PickItemInput } from './pick-item';
import { DockNote, TERM_CHIP } from './terms';
import { formatNumber } from '../../i18n/format';

/**
 * A counter's two trays on one screen: his crate to buy from and the
 * bag to sell out of, as tabs over the same spot. The crate is what a
 * counter opens on, so buying is one press; asking Buy or Sell first
 * put a question between the player and every purchase.
 */
export interface ShopInput {
  buy: PickItemInput;
  sell: PickItemInput;
  /** Which tray is showing, so a second sale opens where the first was made */
  selling?: boolean;
}

/** What was picked, and from which tray */
export type ShopPick = [selling: boolean, picked: ItemAmount];

/** Which side of the counter is open */
const enum Side {
  Buy = 0,
  Sell = 1,
}

function ShopView(props: FormProps<ShopInput, ShopPick>): JSX.Element {
  const [side, setSide] = createSignal<Side>(props.input.selling === true ? Side.Sell : Side.Buy);

  return (
    <>
      <DialogSection class="flex flex-col gap-3">
        {/* Buy or Sell is what the tray shows, not an act on it */}
        <div class="flex flex-wrap items-center gap-2.5">
          <Segmented
            label={m.shop_title()}
            value={side()}
            options={[
              { value: Side.Buy, label: m.shop_buy() },
              { value: Side.Sell, label: m.shop_sell() },
            ]}
            onChange={(next) => {
              setSide(next);
            }}
          />
          {/* What the purse holds, as the gold chip beside the choice */}
          <Show when={props.input.buy.have}>
            {(have) => (
              <span class={`${TERM_CHIP} bg-gold-soft text-gold-dark`}>
                {formatNumber(have().amount)} {have().unit}
              </span>
            )}
          </Show>
        </div>
        <Show
          when={side() === Side.Sell}
          fallback={
            <ItemTray
              hideHave
              input={props.input.buy}
              onPick={(picked) => {
                props.submit([false, picked]);
              }}
            />
          }
        >
          <ItemTray
            hideHave
            input={props.input.sell}
            onPick={(picked) => {
              props.submit([true, picked]);
            }}
          />
        </Show>
      </DialogSection>
      <DialogActions
        stack
        note={
          <Show when={side() === Side.Buy}>
            <DockNote>{m.shop_press_buy()}</DockNote>
          </Show>
        }
      >
        <Button onClick={props.cancel}>{props.leave}</Button>
      </DialogActions>
    </>
  );
}

/** Buying from a counter or selling to it, whichever tray the player uses */
export const ShopForm = defineForm<ShopInput, ShopPick>({
  title: (input) => input.buy.title ?? m.shop_title(),
  prompt: (input) => input.buy.prompt ?? m.shop_prompt(),
  width: 'medium',
  view: (props) => <ShopView {...props} />,
});
