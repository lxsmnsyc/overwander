import { type JSX, createSignal } from 'solid-js';
import { boostEgg } from '../../../../auth/npcs';
import { Species } from '../../../../data/ids/species';
import { DAYCARE_FEE } from '../../../../data/overworld/npc';
import AnimatedSprite from '../../../sprites/AnimatedSprite';
import { DialogActions, Status, useToast } from '../../../styled';
import { type CounterProps, optionsOf, refusal } from '../shared';
import { DaycareCounter } from './care';

/** The daycare lady: one egg, one fee, and it hatches that much sooner */
export default function Daycare(props: CounterProps): JSX.Element {
  const toast = useToast();
  const [status, setStatus] = createSignal<string | null>(null);

  const pushEgg = (id: string): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    if (snapshot == null || standing == null) {
      return;
    }
    setStatus(null);
    boostEgg(snapshot, standing[0], id)
      .then((steps) => {
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
        props.onServed();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        toast.push({ message: refusal(caught), tone: 'ember' });
      });
  };

  return (
    <>
      {/* Centred, like everything else she is standing in the middle
          of: one egg, one price, and the box the egg is picked out of */}
      <DaycareCounter
        options={optionsOf(props)}
        warmed={props.warmed.latest === true}
        fee={DAYCARE_FEE}
        onWarm={pushEgg}
      />
      <Status message={status()} />
      <DialogActions>{props.walkOn()}</DialogActions>
    </>
  );
}
