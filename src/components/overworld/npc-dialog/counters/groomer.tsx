import type { JSX } from 'solid-js';
import { groomCatch } from '../../../../auth/npcs';
import { describeFriendship } from '../../../../data/constants/friendship';
import { GROOMING_FEE } from '../../../../data/overworld/npc';
import { DialogActions } from '../../../styled';
import { type CounterProps, optionsOf, refusal, useSaying } from '../shared';
import { GroomerCounter } from './care';

/** The groomer: a fee, a brush, and a pokemon that thinks more of you */
export default function Groomer(props: CounterProps): JSX.Element {
  const said = useSaying();

  const groom = (id: string): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    if (snapshot == null || standing == null) {
      return;
    }
    groomCatch(snapshot, standing[0], id)
      .then((friendship) => {
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
        said(refusal(caught), 'ember');
      });
  };

  return (
    <>
      <GroomerCounter
        options={optionsOf(props)}
        fee={GROOMING_FEE}
        done={props.spent.latest === true}
        onGroom={groom}
      />
      <DialogActions>{props.walkOn()}</DialogActions>
    </>
  );
}
