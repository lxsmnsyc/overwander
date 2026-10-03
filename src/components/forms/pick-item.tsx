import { type JSX, Show } from 'solid-js';
import type { InventoryEntry } from '../../auth/inventory';
import type { Items } from '../../data/ids/items';
import InventoryPicker, { type ItemAmount } from '../items/InventoryPicker';
import { Button, DialogActions, DialogSection, Meta, Note } from '../styled';
import { CounterStep, CounterTerms } from './terms';
import { type FormProps, defineForm } from './form';

export interface PickItemInput {
  player: string;
  title?: string;
  prompt?: string;
  /** What is offered; left out, the player's bag */
  entries?: InventoryEntry[];
  /** What a square's button says, before the item's name */
  verb: string;
  empty?: string;
  /** Said in place of the tray when nothing is offered */
  none?: string;
  /** A line over the tray, read before choosing */
  intro?: string;
  /** The label over the tray */
  step?: string;
  /** What the player carries, as a chip over the tray */
  have?: { amount: number; short: boolean; unit: string };
  /** Whether a square shows how many of it there are */
  counts?: boolean;
  filter?: (entry: InventoryEntry) => boolean;
  /** Why a square cannot be picked, which greys it */
  blocked?: (entry: InventoryEntry) => string | null;
  note?: (entry: InventoryEntry) => string | null;
  card?: (entry: InventoryEntry) => JSX.Element;
  carried?: (entry: InventoryEntry) => number;
  /** How many of it may be taken; left out, one and no count asked */
  most?: (entry: InventoryEntry) => number;
  sum?: (item: Items, amount: number) => JSX.Element;
  refuse?: (item: Items, amount: number) => string | null;
}

function PickItemView(props: FormProps<PickItemInput, ItemAmount>): JSX.Element {
  return (
    <>
      <DialogSection class="flex flex-col gap-3">
        <Show when={props.input.have}>{(have) => <CounterTerms have={have()} />}</Show>
        <Show
          when={
            props.input.entries == null ||
            props.input.entries.length > 0 ||
            props.input.none == null
          }
          fallback={<Note>{props.input.none}</Note>}
        >
          <Show when={props.input.intro}>{(intro) => <Meta class="block">{intro()}</Meta>}</Show>
          <Show when={props.input.step}>{(step) => <CounterStep>{step()}</CounterStep>}</Show>
          <InventoryPicker
            inline
            player={props.input.player}
            verb={props.input.verb}
            entries={props.input.entries}
            value={null}
            counts={props.input.counts}
            empty={props.input.empty}
            filter={props.input.filter}
            blocked={props.input.blocked}
            note={props.input.note}
            card={props.input.card}
            carried={props.input.carried}
            most={props.input.most}
            sum={props.input.sum}
            refuse={props.input.refuse}
            onPick={(item, amount) => {
              if (item != null && amount > 0) {
                props.submit([item, amount]);
              }
            }}
          />
        </Show>
      </DialogSection>
      <DialogActions>
        <Button onClick={props.cancel}>{props.leave}</Button>
      </DialogActions>
    </>
  );
}

/** Something out of a bag or off a shelf, and how many of it */
export const PickItemForm = defineForm<PickItemInput, ItemAmount>({
  title: (input) => input.title ?? 'Your bag',
  prompt: (input) => input.prompt ?? 'Choose an item.',
  view: (props) => <PickItemView {...props} />,
});
