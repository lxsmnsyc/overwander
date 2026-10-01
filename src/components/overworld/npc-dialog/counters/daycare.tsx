import { type JSX, Show, createSignal } from 'solid-js';
import { boostEgg } from '../../../../auth/npcs';
import { Species } from '../../../../data/ids/species';
import Npc, { DAYCARE_FEE } from '../../../../data/overworld/npc';
import AnimatedSprite from '../../../sprites/AnimatedSprite';
import { Button, DialogActions, useToast } from '../../../styled';
import { CostBadge } from '../terms';
import { type CounterProps, NPC_SPENT, goldOf, optionsOf, refusal } from '../shared';
import { DaycareCounter } from './care';

/** The daycare lady: one egg, one fee, and it hatches that much sooner */
export default function Daycare(props: CounterProps): JSX.Element {
  const toast = useToast();
  const [picked, setPicked] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);

  const pushEgg = (): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;
    const id = picked();

    if (snapshot == null || standing == null || id == null) {
      return;
    }
    setBusy(true);
    boostEgg(snapshot, standing[0], id)
      .then((steps) => {
        setBusy(false);
        if (steps == null) {
          toast.push({
            message: 'She would not take it. It may be ready, or she has warmed her one for you.',
            tone: 'ember',
          });
          return;
        }
        toast.push({
          title: 'Egg',
          message: `Warmed along to ${steps} steps. −${DAYCARE_FEE} gold`,
          art: () => (
            <span class="flex size-8 items-center justify-center">
              <AnimatedSprite species={Species.Egg} direction="DownLeft" fill still label="" />
            </span>
          ),
          tone: 'leaf',
        });
        setPicked(null);
        props.onServed();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        toast.push({ message: refusal(caught), tone: 'ember' });
      });
  };

  return (
    <>
      <DaycareCounter
        options={optionsOf(props)}
        picked={picked()}
        busy={busy()}
        warmed={props.warmed.latest === true}
        fee={DAYCARE_FEE}
        gold={goldOf(props)}
        spent={NPC_SPENT[Npc.DaycareLady] ?? ''}
        onPick={(next) => {
          setPicked(next);
        }}
      />
      <DialogActions>
        <Show when={props.warmed.latest !== true}>
          <Button
            tone="primary"
            disabled={busy() || picked() == null || goldOf(props) < DAYCARE_FEE}
            onClick={pushEgg}
          >
            Warm <CostBadge cost={{ gold: DAYCARE_FEE }} />
          </Button>
        </Show>
        {props.walkOn()}
      </DialogActions>
    </>
  );
}
