import { type JSX, type ParentProps, Show } from 'solid-js';
import type { InventoryEntry } from '../../../../auth/inventory';
import type { Items } from '../../../../data/ids/items';
import { FOSSIL_REVIVE_LEVEL, getFossilPrice } from '../../../../data/overworld/fossil';
import ItemGrid, { type ItemCell } from '../../../items/ItemGrid';
import InventoryPicker from '../../../items/InventoryPicker';
import { describeItem } from '../../../details';
import { Detail, DialogSection, Meta, Note } from '../../../styled';
import { CounterSpent, CounterStep, CounterTerms } from '../terms';

/**
 * The counters that deal in things rather than in pokemon: the rocks
 * the maniac digs up, the bench they are opened on, and the vendor's
 * crate. What a purse holds is drawn on each of them, since it is what
 * decides whether a square can be pressed.
 */

export interface FossilCounterProps {
  /** The rocks he is carrying this window */
  offer: Items[];
  gold: number;
  busy: boolean;
  /** The rock picked, paid for at the foot */
  picked: Items | null;
  /** Whether he has already sold his one this window */
  sold: boolean;
  spent: string;
  onPick: (item: Items) => void;
}

export function FossilCounter(props: FossilCounterProps): JSX.Element {
  const shelf = (): ItemCell[] => {
    const cells: ItemCell[] = [];

    for (const item of props.offer) {
      cells.push({
        item,
        note: `${getFossilPrice(item)} gold`,
        said: `Pick ${describeItem(item)}, ${getFossilPrice(item)} gold`,
        selected: props.picked === item,
        blocked: getFossilPrice(item) > props.gold ? 'More than you hold' : null,
        card: () => <Detail label="Costs">{getFossilPrice(item)} gold</Detail>,
      });
    }
    return cells;
  };

  return (
    <DialogSection class="flex flex-col gap-3">
      {/* Each rock carries its own price, so the terms say the purse */}
      <CounterTerms have={{ amount: props.gold, short: false, unit: 'gold' }} />
      {/* Two rocks, and nothing about what is in them: he sells the dig,
          not the pokemon */}
      <Show when={!props.sold} fallback={<CounterSpent says={props.spent} />}>
        <Show when={props.offer.length > 0} fallback={<Note>He has nothing on him just now.</Note>}>
          <CounterStep>Choose a rock</CounterStep>
          <ItemGrid
            bare
            verb="Pick"
            disabled={props.busy}
            entries={shelf()}
            onPress={props.onPick}
          />
        </Show>
      </Show>
    </DialogSection>
  );
}

export interface ReviveCounterProps {
  /** How many kinds of fossil the player is carrying, which is all he works on */
  carrying: number;
}

/** What his bench promises, over the fossils laid out on it */
export function ReviveCounter(props: ReviveCounterProps & ParentProps): JSX.Element {
  return (
    <DialogSection class="flex flex-col gap-3">
      <Show when={props.carrying > 0} fallback={<Note>You are carrying nothing he can open.</Note>}>
        {/* What comes out is the rock's business, but the level is not:
            a party planned around it is worth knowing before the fossil
            is spent */}
        <Meta class="block">Whatever is in there comes out at level {FOSSIL_REVIVE_LEVEL}.</Meta>
        <CounterStep>Choose a fossil</CounterStep>
        {props.children}
      </Show>
    </DialogSection>
  );
}

export interface KurtCounterProps {
  /** The apricorns in the player's own bag, which is all he works on */
  apricorns: InventoryEntry[];
  busy: boolean;
  /** What the apricorn on a square becomes, said in the corner of it */
  ballName: (item: Items) => string;
  onCarve: (item: Items, amount: number) => void;
}

/**
 * Kurt's bench. What he takes is in the bag rather than in a crate, so
 * the bag itself is the counter: the apricorns are on it from the
 * moment he is spoken to, the way the nurse's party is. He charges
 * nothing and the colour has already settled which ball, so how many
 * is the only thing left to decide, and the tray asks that where the
 * square was pressed
 */
export function KurtCounter(props: KurtCounterProps): JSX.Element {
  const carrying = (): number => {
    let total = 0;

    for (const entry of props.apricorns) {
      total += entry.amount;
    }
    return total;
  };

  return (
    <DialogSection class="flex flex-col gap-3">
      <CounterTerms have={{ amount: carrying(), short: carrying() === 0, unit: 'apricorns' }} />
      <Show
        when={props.apricorns.length > 0}
        fallback={<Note>You are carrying nothing he can carve.</Note>}
      >
        <CounterStep>Choose an apricorn</CounterStep>
        <InventoryPicker
          keepOpen
          inline
          counts
          entries={props.apricorns}
          disabled={props.busy}
          value={null}
          verb="Carve"
          note={(entry) => props.ballName(entry.item)}
          card={(entry) => <Detail label="Becomes">{props.ballName(entry.item)}</Detail>}
          // He works through as many as are handed over, so the bag is
          // the only limit there is
          most={(entry) => entry.amount}
          sum={(item, amount) => (
            <Meta>
              {amount} × {describeItem(item)} ={' '}
              <strong>
                {amount} {props.ballName(item)}
              </strong>
            </Meta>
          )}
          onPick={(item, amount) => {
            if (item != null && amount > 0) {
              props.onCarve(item, amount);
            }
          }}
        />
      </Show>
    </DialogSection>
  );
}
