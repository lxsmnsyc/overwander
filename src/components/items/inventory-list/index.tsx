import type { JSX } from '@solidjs/web';
import { Loading, Show, createEffect, createMemo, createSignal, refresh } from 'solid-js';
import { getCandies } from '../../../auth/candy';
import { getInventory } from '../../../auth/inventory';
import type { Items } from '../../../data/ids/items';
import BattleData from '../../app/BattleData';
import { catchFailure } from '../../app/create-load';
import { Button, Dialog, DialogActions, Meta, Note } from '../../styled';
import BagBody from './body';
import BagHint from './BagHint';
import { m } from '../../../i18n/paraglide/messages.js';

export interface BagDialogProps {
  player: string;
  isOpen: boolean;
  onClose: () => void;
  /** What the dialog is called and what it is for, which the route keeps */
  title: string;
  description: string;
}

/**
 * What the player carries: the pockets, the tray of the open one, and
 * the item pressed docked on the right. The sheet widens while an item
 * is docked, so the tray keeps its six columns beside it.
 *
 * The stacks are read one component down, under this boundary, so a
 * bag still arriving replaces the list rather than the panel it is
 * drawn in
 */
export default function BagDialog(props: BagDialogProps): JSX.Element {
  // A failed read is an answer the bag says in place of the tray
  const items = createMemo(async () => catchFailure(getInventory(props.player)));
  const candies = createMemo(async () => catchFailure(getCandies(props.player)));
  /** The item whose details are docked, which also decides the sheet's width */
  const [chosen, setChosen] = createSignal<Items | null>(null);

  // A bag opened again starts with nothing docked
  createEffect(
    () => props.isOpen,
    (open) => {
      if (!open) {
        setChosen(null);
      }
    },
  );

  return (
    <Dialog
      isOpen={props.isOpen}
      onClose={props.onClose}
      width={chosen() == null ? 'rail' : 'sheet'}
      terse
      aside={<BagHint />}
      title={props.title}
      description={props.description}
    >
      <BattleData>
        <Loading fallback={<Note>{m.item_bag_loading()}</Note>}>
          <BagBody
            player={props.player}
            items={items}
            candies={candies}
            chosen={chosen()}
            onChoose={(item) => {
              setChosen(item);
            }}
            onSpent={() => {
              refresh(items).catch(() => undefined);
            }}
          />
        </Loading>
      </BattleData>
      <DialogActions
        note={
          <Show when={chosen() == null}>
            <Meta class="hidden md:block">{m.item_press_note()}</Meta>
          </Show>
        }
      >
        <Button onClick={props.onClose}>{m.ui_close()}</Button>
      </DialogActions>
    </Dialog>
  );
}
