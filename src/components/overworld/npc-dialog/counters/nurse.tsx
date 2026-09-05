import { type JSX, createSignal } from 'solid-js';
import type { CaughtPokemon } from '../../../../auth/caught';
import { isShadow } from '../../../../auth/caught-record';
import { getMaxHealth } from '../../../../auth/health';
import { visitNurse } from '../../../../auth/npcs';
import { DialogActions, Status } from '../../../styled';
import { type CounterProps, optionsOf, refusal } from '../shared';
import { NurseCounter } from './care';

/**
 * Whether she would do anything to it: patch it up, take a status
 * off, or put a shadow right. One that is already whole she looks
 * over and hands straight back, spending the window on nothing, so it
 * is left out of her list rather than offered
 */
function needsCare(caught: CaughtPokemon): boolean {
  return isShadow(caught) || caught.statuses !== 0 || caught.health < getMaxHealth(caught);
}

/** Nurse Joy: nothing asked for, and a party handed back whole */
export default function Nurse(props: CounterProps): JSX.Element {
  const [status, setStatus] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);

  const tendParty = (picked: string[]): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    if (snapshot == null || standing == null || picked.length === 0) {
      return;
    }
    setStatus(null);
    setBusy(true);
    visitNurse(snapshot, standing[0], picked)
      .then((tended) => {
        setBusy(false);
        setStatus(
          tended == null
            ? 'She handed it straight back. Nothing to heal.'
            : 'She looked after it. Right as rain.',
        );
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
      <NurseCounter
        options={optionsOf(props)}
        busy={busy()}
        needsCare={(option) => needsCare(option.caught)}
        onHeal={(id) => {
          tendParty([id]);
        }}
      />
      <Status message={status()} />
      <DialogActions>{props.walkOn()}</DialogActions>
    </>
  );
}
