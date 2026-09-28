import { type JSX, Show, createSignal } from 'solid-js';
import { channelAbility } from '../../../../auth/npcs';
import { getAbilityData } from '../../../../data/abilities';
import Npc, { CHANNELER_FEE } from '../../../../data/overworld/npc';
import { Button, DialogActions, useToast } from '../../../styled';
import { CostBadge } from '../terms';
import { type CounterProps, NPC_SPENT, optionsOf, refusal, scalesIn, useSaying } from '../shared';
import { ChannelerCounter } from './care';
import playEffect, { Effect } from '../../../app/sound';

/**
 * The channeler: hand the scale over and let her call something up.
 *
 * The slot she opens and the ability that fills it are one write on
 * the server, so the one press is the button at the foot, and what
 * came out is said in a toast
 */
export default function Channeler(props: CounterProps): JSX.Element {
  const said = useSaying();
  const toast = useToast();
  const [busy, setBusy] = createSignal(false);
  const [picked, setPicked] = createSignal<string | null>(null);

  const channel = (): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;
    const id = picked();

    if (snapshot == null || standing == null || id == null) {
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
        setPicked(null);
        playEffect(Effect.AbilityLearned);
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
        picked={picked()}
        scales={scalesIn(props)}
        fee={CHANNELER_FEE}
        busy={busy()}
        spent={NPC_SPENT[Npc.Channeler] ?? ''}
        onPick={(next) => {
          setPicked(next);
        }}
      />
      <DialogActions>
        <Show when={props.spent.latest !== true}>
          <Button
            tone="primary"
            disabled={busy() || picked() == null || scalesIn(props) < 1}
            onClick={channel}
          >
            Call up <CostBadge cost={{ item: CHANNELER_FEE }} />
          </Button>
        </Show>
        {props.walkOn()}
      </DialogActions>
    </>
  );
}
