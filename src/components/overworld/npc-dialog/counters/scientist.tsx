import { type JSX, createSignal } from 'solid-js';
import type { InventoryEntry } from '../../../../auth/inventory';
import { reviveFossil } from '../../../../auth/npcs';
import type { Items } from '../../../../data/ids/items';
import { isFossil } from '../../../../data/items';
import { getSpeciesData } from '../../../../data/species';
import { describeItem } from '../../../details';
import AnimatedSprite from '../../../sprites/AnimatedSprite';
import { DialogActions, Status, useToast } from '../../../styled';
import { type CounterProps, refusal } from '../shared';
import { ReviveCounter } from './goods';

/**
 * The fossil scientist: put the rock on the bench and see what was in
 * it. What comes out is the fossil's rather than anybody's choice, so
 * one press opens one rock
 */
export default function Scientist(props: CounterProps): JSX.Element {
  const toast = useToast();
  const [status, setStatus] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);

  /** What is in the bag that he can open */
  const fossils = (): InventoryEntry[] =>
    (props.bag.latest ?? []).filter((entry) => isFossil(entry.item) && entry.amount > 0);

  const openRock = (item: Items): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    if (snapshot == null || standing == null) {
      return;
    }
    setStatus(null);
    setBusy(true);
    reviveFossil(snapshot, standing[0], item)
      .then((revived) => {
        setBusy(false);

        if (revived == null) {
          toast.push({
            message: 'Nothing came of it. That rock is not in your bag any more.',
            tone: 'ember',
          });
          return;
        }
        // Said over the counter rather than under it: the bench is
        // cleared for the next rock the moment this one is open, and a
        // line in the panel would go with it
        toast.push({
          title: getSpeciesData(revived.species).name,
          message: `Level ${revived.level}, out of ${describeItem(item)}.${
            revived.shiny ? ' It sparkles.' : ''
          }`,
          art: () => (
            <span class="flex size-8 items-center justify-center">
              <AnimatedSprite
                species={revived.species}
                shiny={revived.shiny}
                direction="DownLeft"
                fill
                still
                label=""
              />
            </span>
          ),
          tone: 'leaf',
        });
        props.onTraded();
        props.onServed();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        toast.push({ message: refusal(caught), tone: 'ember' });
      });
  };

  return (
    <>
      <ReviveCounter fossils={fossils()} busy={busy()} onRevive={openRock} />
      <Status message={status()} />
      <DialogActions>{props.walkOn()}</DialogActions>
    </>
  );
}
