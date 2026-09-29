import { type JSX, Show, createSignal } from 'solid-js';
import { groomCatch } from '../../../../auth/npcs';
import { describeFriendship } from '../../../../data/constants/friendship';
import Npc, { GROOMING_FEE } from '../../../../data/overworld/npc';
import { Button, DialogActions } from '../../../styled';
import { CostBadge } from '../terms';
import { type CounterProps, NPC_SPENT, goldOf, optionsOf, refusal, useSaying } from '../shared';
import { GroomerCounter } from './care';

/** The groomer: a fee, a brush, and a pokemon that thinks more of you */
export default function Groomer(props: CounterProps): JSX.Element {
  const said = useSaying();
  const [picked, setPicked] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);

  const groom = (): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;
    const id = picked();

    if (snapshot == null || standing == null || id == null) {
      return;
    }
    setBusy(true);
    groomCatch(snapshot, standing[0], id)
      .then((friendship) => {
        setBusy(false);
        if (friendship != null) {
          setPicked(null);
        }
        said(
          friendship == null
            ? 'He would not take it. A shadow, a friend already, or he has seen you this while.'
            : `Brushed, fussed over and handed back ${describeFriendship(friendship)}. (−${GROOMING_FEE} gold)`,
          friendship == null ? 'ember' : 'leaf',
        );
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
      <GroomerCounter
        options={optionsOf(props)}
        picked={picked()}
        busy={busy()}
        fee={GROOMING_FEE}
        gold={goldOf(props)}
        done={props.spent.latest === true}
        spent={NPC_SPENT[Npc.Groomer] ?? ''}
        onPick={(next) => {
          setPicked(next);
        }}
      />
      <DialogActions>
        <Show when={props.spent.latest !== true}>
          <Button
            tone="primary"
            disabled={busy() || picked() == null || goldOf(props) < GROOMING_FEE}
            onClick={groom}
          >
            Groom <CostBadge cost={{ gold: GROOMING_FEE }} />
          </Button>
        </Show>
        {props.walkOn()}
      </DialogActions>
    </>
  );
}
