import { type JSX, createSignal } from 'solid-js';
import { groomCatch } from '../../../../auth/npcs';
import { describeFriendship } from '../../../../data/constants/friendship';
import { GROOMING_FEE } from '../../../../data/overworld/npc';
import { DialogActions, Status } from '../../../styled';
import { type CounterProps, optionsOf, refusal } from '../shared';
import { GroomerCounter } from './care';

/** The groomer: a fee, a brush, and a pokemon that thinks more of you */
export default function Groomer(props: CounterProps): JSX.Element {
  const [status, setStatus] = createSignal<string | null>(null);

  const groom = (id: string): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    if (snapshot == null || standing == null) {
      return;
    }
    setStatus(null);
    groomCatch(snapshot, standing[0], id)
      .then((friendship) => {
        setStatus(
          friendship == null
            ? 'He would not take it. A shadow, a friend already, or he has seen you this while.'
            : `Brushed, fussed over and handed back ${describeFriendship(friendship)}. (−${GROOMING_FEE} gold)`,
        );
        props.onServed();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setStatus(refusal(caught));
      });
  };

  return (
    <>
      <GroomerCounter options={optionsOf(props)} fee={GROOMING_FEE} onGroom={groom} />
      <Status message={status()} />
      <DialogActions>{props.walkOn()}</DialogActions>
    </>
  );
}
