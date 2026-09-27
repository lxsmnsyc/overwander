import { For, type JSX, Show, createSignal } from 'solid-js';
import { hyperTrain } from '../../../../auth/npcs';
import { isEgg } from '../../../../auth/egg';
import { isGuarded } from '../../../../auth/caught-record';
import {
  MAX_IV,
  STAT_NAMES,
  STAT_ORDER,
  type Stats,
  getIV,
} from '../../../../data/constants/stats';
import { hyperTrainingCost } from '../../../../data/overworld/npc';
import CatchPicker, { type CatchOption } from '../../../catches/catch-picker';
import playEffect, { Effect } from '../../../app/sound';
import { Button, DialogActions, DialogSection, Meta, Note, useToast } from '../../../styled';
import { CENTRED, type CounterProps, optionsOf, refusal, useSaying } from '../shared';

/**
 * The Hyper Trainer: pick a pokemon, then the value to take to the
 * top. Each value says what it is now and what the climb costs, since
 * the price is the points it has left
 */
export default function Hyper(props: CounterProps): JSX.Element {
  const said = useSaying();
  const toast = useToast();
  const [busy, setBusy] = createSignal(false);
  const [picked, setPicked] = createSignal<string | null>(null);

  const gold = (): number => props.gold.latest ?? 0;

  const option = (): CatchOption | undefined => {
    const id = picked();

    for (const one of optionsOf(props)) {
      if (one.id === id) {
        return one;
      }
    }
    return undefined;
  };

  const train = (catchId: string, stat: Stats, cost: number): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    if (snapshot == null || standing == null) {
      return;
    }
    setBusy(true);
    hyperTrain(snapshot, standing[0], catchId, stat)
      .then((ivs) => {
        setBusy(false);

        if (ivs == null) {
          said('Not this one. The purse is short, or it is not yours to train.', 'ember');
          return;
        }
        playEffect(Effect.LevelUp);
        toast.push({
          title: STAT_NAMES[stat],
          message: `Trained to ${MAX_IV}. (−${cost.toLocaleString('en-US')} gold)`,
          tone: 'leaf',
        });
        setPicked(null);
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
      <DialogSection class={CENTRED}>
        <Show
          when={props.spent.latest !== true}
          fallback={<Note>One trained for you already this while.</Note>}
        >
          <Meta class="block">{gold().toLocaleString('en-US')} gold on you.</Meta>
          <CatchPicker
            inline
            disabled={busy()}
            options={optionsOf(props)}
            value={picked()}
            verb="Pick"
            empty="You have nothing to train."
            filter={(one) => !isEgg(one.caught) && !one.fighting && !isGuarded(one.caught)}
            onPick={(id) => {
              setPicked(id);
            }}
          />
          <Show when={option()}>
            {(chosen) => (
              <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <For each={STAT_ORDER}>
                  {(stat) => {
                    const iv = (): number => getIV(chosen().caught.ivs, stat);
                    const cost = (): number => hyperTrainingCost(iv());

                    return (
                      <Button
                        disabled={busy() || iv() >= MAX_IV || cost() > gold()}
                        label={`${STAT_NAMES[stat]} from ${iv()} to ${MAX_IV}, ${cost()} gold`}
                        onClick={() => {
                          train(chosen().id, stat, cost());
                        }}
                      >
                        {STAT_NAMES[stat]} {iv()} → {MAX_IV}
                        <span class="block text-xs opacity-70">
                          {iv() >= MAX_IV ? 'At the top' : `${cost().toLocaleString('en-US')} gold`}
                        </span>
                      </Button>
                    );
                  }}
                </For>
              </div>
            )}
          </Show>
        </Show>
      </DialogSection>
      <DialogActions>{props.walkOn()}</DialogActions>
    </>
  );
}
