import { type JSX, createSignal } from 'solid-js';
import { breed } from '../../../../auth/npcs';
import { BREEDING_FEE } from '../../../../data/overworld/npc';
import { canBreed } from '../../../../overworld/breeding';
import type { CatchOption } from '../../../catches/catch-picker';
import { Badge, Button, DialogActions, Status, useToast } from '../../../styled';
import { type CounterProps, asParent, optionsOf, refusal } from '../shared';
import { BreederCounter } from './care';

/**
 * The breeder: two pokemon and a fee, and an egg if the pair will
 * have anything to do with each other
 */
export default function Breeder(props: CounterProps): JSX.Element {
  const toast = useToast();
  const [status, setStatus] = createSignal<string | null>(null);
  const [chosen, setChosen] = createSignal<string[]>([]);
  const [busy, setBusy] = createSignal(false);

  const pair = (): [CatchOption, CatchOption] | null => {
    const picked = chosen();

    if (picked.length !== 2) {
      return null;
    }

    const found = picked.map((id) => optionsOf(props).find((entry) => entry.id === id));

    return found[0] == null || found[1] == null ? null : [found[0], found[1]];
  };

  const compatible = (): boolean => {
    const chosenPair = pair();

    return (
      chosenPair != null && canBreed(asParent(chosenPair[0].caught), asParent(chosenPair[1].caught))
    );
  };

  const submitPair = (): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;
    const chosenPair = pair();

    if (snapshot == null || standing == null || chosenPair == null) {
      return;
    }
    setStatus(null);
    setBusy(true);
    breed(snapshot, standing[0], [chosenPair[0].id, chosenPair[1].id])
      .then((egg) => {
        setBusy(false);

        // Said in passing rather than in the panel: the egg is
        // already in the box by the time there is anything to report
        if (egg == null) {
          toast.push({
            message:
              'He handed them back. Wrong pair, short purse, or you have already bred this while.',
            tone: 'ember',
          });
          return;
        }
        setChosen([]);
        toast.push({
          title: 'An egg',
          message: `Carry it as your buddy and walk. −${BREEDING_FEE} gold`,
          tone: 'leaf',
        });
        props.onServed();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        setStatus(refusal(caught));
      });
  };

  return (
    <>
      <BreederCounter
        options={optionsOf(props)}
        chosen={chosen()}
        compatible={compatible()}
        onPick={(picked) => {
          setStatus(null);
          setChosen(picked);
        }}
      />
      <Status message={status()} />
      <DialogActions>
        <Button tone="primary" disabled={busy() || !compatible()} onClick={submitPair}>
          Breed <Badge tone="gold">{BREEDING_FEE} gold</Badge>
        </Button>
        {props.walkOn()}
      </DialogActions>
    </>
  );
}
