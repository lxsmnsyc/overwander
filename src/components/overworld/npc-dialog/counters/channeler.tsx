import { type JSX, createSignal } from 'solid-js';
import { channelAbility } from '../../../../auth/npcs';
import { getAbilityData } from '../../../../data/abilities';
import { CHANNELER_FEE } from '../../../../data/overworld/npc';
import { DialogActions, useToast } from '../../../styled';
import { type CounterProps, optionsOf, refusal, scalesIn, useSaying } from '../shared';
import { ChannelerCounter } from './care';

/**
 * The channeler: hand the scale over and let her call something up.
 *
 * One press. The slot she opens and the ability that fills it are one
 * write on the server, so there is nothing here to agree to
 * afterwards, and what came out is said in a word in passing since it
 * is the one thing the picker behind it cannot show
 */
export default function Channeler(props: CounterProps): JSX.Element {
  const said = useSaying();
  const toast = useToast();
  const [busy, setBusy] = createSignal(false);

  const channel = (id: string): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    if (snapshot == null || standing == null) {
      return;
    }
    setBusy(true);
    channelAbility(snapshot, standing[0], id)
      .then((drawn) => {
        setBusy(false);

        if (drawn == null) {
          said(
            'Nothing answered. No scale, a pokemon she cannot reach, or she has seen you this while.',
            'ember',
          );
          return;
        }
        toast.push({
          title: getAbilityData(drawn.ability).name,
          message: `Called up, and room for it. (−1 Heart Scale)`,
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
      <ChannelerCounter
        done={props.spent.latest === true}
        options={optionsOf(props)}
        scales={scalesIn(props)}
        fee={CHANNELER_FEE}
        busy={busy()}
        onChannel={channel}
      />
      <DialogActions>{props.walkOn()}</DialogActions>
    </>
  );
}
