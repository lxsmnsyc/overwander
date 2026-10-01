import { type JSX, Show, createSignal } from 'solid-js';
import { buyFossil } from '../../../../auth/npcs';
import type { Items } from '../../../../data/ids/items';
import { getFossilPrice } from '../../../../data/overworld/fossil';
import { describeItem } from '../../../details';
import ItemSprite from '../../../items/ItemSprite';
import Npc from '../../../../data/overworld/npc';
import { Button, DialogActions, useToast } from '../../../styled';
import { CostBadge } from '../terms';
import playEffect, { Effect } from '../../../app/sound';
import { type CounterProps, NPC_SPENT, goldOf, refusal, useSaying } from '../shared';
import { FossilCounter } from './goods';

/**
 * The fossil maniac: two rocks, and he will part with one.
 *
 * What he is carrying is derived from the window he was, so it needs
 * no read of its own, and the server derives the pair again before it
 * takes a coin
 */
export default function Maniac(props: CounterProps): JSX.Element {
  const said = useSaying();
  const toast = useToast();
  const [busy, setBusy] = createSignal(false);
  const [picked, setPicked] = createSignal<Items | null>(null);

  const offer = (): Items[] => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    return snapshot == null || standing == null ? [] : snapshot.getFossilOffer(standing[0]);
  };

  const price = (): number | null => {
    const item = picked();

    return item == null ? null : getFossilPrice(item);
  };

  /** The rock picked, paid for at the foot */
  const buyRock = (): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;
    const item = picked();

    if (snapshot == null || standing == null || item == null) {
      return;
    }
    setBusy(true);
    buyFossil(snapshot, standing[0], item)
      .then((done) => {
        setBusy(false);

        if (done == null) {
          said('He kept it. A short purse, or he has sold you his one this while.', 'ember');
          return;
        }
        setPicked(null);
        playEffect(Effect.ShopBuy);
        toast.push({
          title: describeItem(item),
          message: `−${getFossilPrice(item)} gold`,
          art: () => <ItemSprite item={item} size={24} label="" />,
          tone: 'leaf',
        });
        props.onTraded();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        said(refusal(caught), 'ember');
      });
  };

  return (
    <>
      <FossilCounter
        offer={offer()}
        gold={goldOf(props)}
        busy={busy()}
        picked={picked()}
        sold={props.visited.latest === true}
        spent={NPC_SPENT[Npc.FossilManiac] ?? ''}
        onPick={(next) => {
          setPicked(next);
        }}
      />
      <DialogActions>
        <Show when={props.visited.latest !== true}>
          <Button
            tone="primary"
            disabled={busy() || price() == null || (price() ?? 0) > goldOf(props)}
            onClick={buyRock}
          >
            Buy
            <Show when={picked()}>
              {(item) => <CostBadge cost={{ gold: getFossilPrice(item()) }} />}
            </Show>
          </Button>
        </Show>
        {props.walkOn()}
      </DialogActions>
    </>
  );
}
