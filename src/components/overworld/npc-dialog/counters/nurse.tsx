import { type JSX, createSignal } from 'solid-js';
import { needsCare } from '../../../../auth/health';
import { visitNurse } from '../../../../auth/npcs';
import { DialogActions } from '../../../styled';
import playEffect, { Effect } from '../../../app/sound';
import { type CounterProps, optionsOf, refusal, useSaying } from '../shared';
import { NurseCounter } from './care';

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
        // Only where she actually did something: a party handed
        // straight back is not worth a fanfare
        if (tended != null) {
          playEffect(Effect.NurseHeal);
        }
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
