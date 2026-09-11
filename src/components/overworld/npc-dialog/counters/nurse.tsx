import { type JSX, createSignal } from 'solid-js';
import type { CaughtPokemon } from '../../../../auth/caught';
import { getMaxHealth } from '../../../../auth/health';
import { visitNurse } from '../../../../auth/npcs';
import { DialogActions } from '../../../styled';
import { type CounterProps, optionsOf, refusal, useSaying } from '../shared';
import { NurseCounter } from './care';

/**
 * Whether she would do anything to it: patch it up or take a status
 * off. A shadow is not hers to put right, so it is not one of the
 * answers here; one that is already whole she looks over and hands
 * straight back, so it is left out of her list rather than offered
 */
function needsCare(caught: CaughtPokemon): boolean {
  return caught.statuses !== 0 || caught.health < getMaxHealth(caught);
}

/** Nurse Joy: nothing asked for, and a party handed back whole */
export default function Nurse(props: CounterProps): JSX.Element {
  const said = useSaying();
  const [busy, setBusy] = createSignal(false);

  const tendParty = (picked: string[]): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    if (snapshot == null || standing == null || picked.length === 0) {
      return;
    }
    setBusy(true);
    visitNurse(snapshot, standing[0], picked)
      .then((tended) => {
        setBusy(false);
        said(
          tended == null
            ? 'She handed them straight back. Nothing to heal.'
            : 'She looked after them. Right as rain.',
          tended == null ? 'ember' : 'leaf',
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
      <NurseCounter
        options={optionsOf(props)}
        busy={busy()}
        needsCare={(option) => needsCare(option.caught)}
        onHeal={tendParty}
      />
      <DialogActions>{props.walkOn()}</DialogActions>
    </>
  );
}
