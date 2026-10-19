import { type JSX, createSignal } from 'solid-js';
import type { ItemAmount } from '../items/InventoryPicker';
import {
  Button,
  DialogActions,
  DialogSection,
  TabBar,
  TabButton,
  TabGroup,
  TabPane,
} from '../styled';
import { type FormProps, defineForm } from './form';
import { ItemTray, type PickItemInput } from './pick-item';

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
        <TabGroup
          horizontal
          value={side()}
          onChange={(value: Side) => {
            setSide(value);
          }}
          class="flex flex-col gap-3"
        >
          <TabBar class="self-start">
            <TabButton value={Side.Buy}>Buy</TabButton>
            <TabButton value={Side.Sell}>Sell</TabButton>
          </TabBar>
          <TabPane value={Side.Buy}>
            <div class="flex flex-col gap-3">
              <ItemTray
                input={props.input.buy}
                onPick={(picked) => {
                  props.submit([false, picked]);
                }}
              />
            </div>
          </TabPane>
          <TabPane value={Side.Sell}>
            <div class="flex flex-col gap-3">
              <ItemTray
                input={props.input.sell}
                onPick={(picked) => {
                  props.submit([true, picked]);
                }}
              />
            </div>
          </TabPane>
        </TabGroup>
      </DialogSection>
      <DialogActions>
        <Button onClick={props.cancel}>{props.leave}</Button>
      </DialogActions>
    </>
  );
}

/** Buying from a counter or selling to it, whichever tray the player uses */
export const ShopForm = defineForm<ShopInput, ShopPick>({
  title: (input) => input.buy.title ?? 'The counter',
  prompt: (input) => input.buy.prompt ?? 'Buy from the crate, or sell from your bag.',
  view: (props) => <ShopView {...props} />,
});
