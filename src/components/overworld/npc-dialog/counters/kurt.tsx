import { type JSX, createSignal } from 'solid-js';
import type { InventoryEntry } from '../../../../auth/inventory';
import { carveApricorns } from '../../../../auth/npcs';
import { type Items, getApricornBall } from '../../../../data/ids/items';
import { getItemData } from '../../../../data/items';
import { describeItem } from '../../../details';
import ItemSprite from '../../../items/ItemSprite';
import { DialogActions, Status, useToast } from '../../../styled';
import type { CounterProps } from '../shared';
import { KurtCounter } from './goods';

/**
 * Kurt at his lathe: a basket of one colour in, the ball that colour
 * makes out
 */
export default function Kurt(props: CounterProps): JSX.Element {
  const toast = useToast();
  const [status, setStatus] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);

  /** What the apricorn on this square becomes, for the tray to say */
  const ballName = (item: Items): string => {
    const ball = getApricornBall(item);

    return ball == null ? '' : getItemData(ball).name;
  };

  const apricorns = (): InventoryEntry[] =>
    (props.bag.latest ?? []).filter(
      (entry) => getApricornBall(entry.item) != null && entry.amount > 0,
    );

  /**
   * The bag is re-read afterwards the way a trade re-reads it: the
   * apricorns went from it and the balls arrived in it
   */
  const carve = (item: Items, amount: number): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    if (snapshot == null || standing == null) {
      return;
    }
    setStatus(null);
    setBusy(true);
    carveApricorns(snapshot, standing[0], item, amount)
      .then((done) => {
        setBusy(false);

        if (done == null) {
          toast.push({
            message: 'He turned the basket over and handed it straight back.',
            tone: 'ember',
          });
          return;
        }
        // What came back rather than what he did with it: the bench is
        // still open behind this, and the next basket is the next
        // press
        toast.push({
          title: `${getItemData(done.ball).name}${done.amount > 1 ? ` ×${done.amount}` : ''}`,
          message: `−${amount} ${describeItem(item)}`,
          art: () => <ItemSprite item={done.ball} size={24} label="" />,
          tone: 'leaf',
        });
        props.onTraded();
        props.onServed();
        props.onChange?.();
      })
      .catch(() => {
        setBusy(false);
        toast.push({ message: 'The bench went quiet. Nothing changed hands.', tone: 'ember' });
      });
  };

  return (
    <>
      <KurtCounter apricorns={apricorns()} busy={busy()} ballName={ballName} onCarve={carve} />
      <Status message={status()} />
      <DialogActions>{props.walkOn()}</DialogActions>
    </>
  );
}
