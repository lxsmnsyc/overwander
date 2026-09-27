import { type JSX, createSignal } from 'solid-js';
import { trainMoveSlot } from '../../../../auth/npcs';
import { DOJO_MASTER_FEE } from '../../../../data/overworld/npc';
import { Button, DialogActions, useToast } from '../../../styled';
import { CostBadge } from '../terms';
import { type CounterProps, optionsOf, refusal, scalesIn, useSaying } from '../shared';
import { DojoCounter } from './care';
import playEffect, { Effect } from '../../../app/sound';

/** The Dojo Master: a Heart Scale for room for one more move */
export default function Dojo(props: CounterProps): JSX.Element {
  const said = useSaying();
  const toast = useToast();
  const [busy, setBusy] = createSignal(false);
  const [picked, setPicked] = createSignal<string | null>(null);

  const train = (): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;
    const id = picked();

    if (snapshot == null || standing == null || id == null) {
      return;
    }
    setBusy(true);
    trainMoveSlot(snapshot, standing[0], id)
      .then((slots) => {
        setBusy(false);

        if (slots == null) {
          said('He would not. No scale, or a pokemon he cannot train further.', 'ember');
          return;
        }
        setPicked(null);
        playEffect(Effect.ItemSlot);
        toast.push({
          title: 'Trained',
          message: `Room for ${slots} moves now. (−1 Heart Scale)`,
          tone: 'leaf',
        });
        props.onTraded();
        props.onServed();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        said(refusal(caught), 'ember');
      });
  };

  return (
    <>
      <DojoCounter
        options={optionsOf(props)}
        picked={picked()}
        scales={scalesIn(props)}
        fee={DOJO_MASTER_FEE}
        busy={busy()}
        onPick={(next) => {
          setPicked(next);
        }}
      />
      <DialogActions>
        <Button
          tone="primary"
          disabled={busy() || picked() == null || scalesIn(props) < 1}
          onClick={train}
        >
          Train <CostBadge cost={{ item: DOJO_MASTER_FEE }} />
        </Button>
        {props.walkOn()}
      </DialogActions>
    </>
  );
}
