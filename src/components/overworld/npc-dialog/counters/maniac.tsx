import { type JSX, createSignal } from 'solid-js';
import { buyFossil } from '../../../../auth/npcs';
import type { Items } from '../../../../data/ids/items';
import { getFossilPrice } from '../../../../data/overworld/fossil';
import { describeItem } from '../../../details';
import ItemSprite from '../../../items/ItemSprite';
import { DialogActions, Status, useToast } from '../../../styled';
import { type CounterProps, refusal } from '../shared';
import { FossilCounter } from './goods';

/**
 * The fossil maniac: two rocks, and he will part with one.
 *
 * What he is carrying is derived from the window he was, so it needs
 * no read of its own, and the server derives the pair again before it
 * takes a coin
 */
export default function Maniac(props: CounterProps): JSX.Element {
  const toast = useToast();
  const [status, setStatus] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);

  const offer = (): Items[] => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    return snapshot == null || standing == null ? [] : snapshot.getFossilOffer(standing[0]);
  };

  /**
   * One press, one purchase, the way the vendor's crate trades: the
   * price is on the square, and the shelf turning to "sold" says the
   * rest
   */
  const buyRock = (item: Items): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    if (snapshot == null || standing == null) {
      return;
    }
    setStatus(null);
    setBusy(true);
    buyFossil(snapshot, standing[0], item)
      .then((done) => {
        setBusy(false);

        if (done != null) {
          toast.push({
            title: describeItem(item),
            message: `−${getFossilPrice(item)} gold`,
            art: () => <ItemSprite item={item} size={24} label="" />,
            tone: 'leaf',
          });
          props.onTraded();
          props.onChange?.();
        }
      })
      .catch((caught: unknown) => {
        setBusy(false);
        setStatus(refusal(caught));
      });
  };

  return (
    <>
      <FossilCounter
        offer={offer()}
        gold={props.gold.latest ?? 0}
        busy={busy()}
        sold={props.visited.latest === true}
        onBuy={buyRock}
      />
      <Status message={status()} />
      <DialogActions>{props.walkOn()}</DialogActions>
    </>
  );
}
