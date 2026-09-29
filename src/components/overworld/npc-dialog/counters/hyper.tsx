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
import Npc, { hyperTrainingCost } from '../../../../data/overworld/npc';
import type { CatchOption } from '../../../catches/catch-picker';
import playEffect, { Effect } from '../../../app/sound';
import {
  Button,
  DialogActions,
  DialogSection,
  List,
  ListRow,
  RowButton,
  useToast,
} from '../../../styled';
import { CostBadge, CounterSpent, CounterStep, CounterTerms, PickOne } from '../terms';
import { type CounterProps, NPC_SPENT, goldOf, optionsOf, refusal, useSaying } from '../shared';

/**
 * The Hyper Trainer: pick a pokemon, then the value to take to the
 * top, then pay at the foot. The price is the points it has left, so
 * each value says its own
 */
export default function Hyper(props: CounterProps): JSX.Element {
  const said = useSaying();
  const toast = useToast();
  const [busy, setBusy] = createSignal(false);
  const [picked, setPicked] = createSignal<string | null>(null);
  const [stat, setStat] = createSignal<Stats | null>(null);

  const gold = (): number => goldOf(props);

  const option = (): CatchOption | undefined => {
    const id = picked();

    for (const one of optionsOf(props)) {
      if (one.id === id) {
        return one;
      }
    }
    return undefined;
  };

  /** The value picked and what taking it to the top costs */
  const climb = (): { stat: Stats; cost: number } | null => {
    const chosen = option();
    const wanted = stat();

    if (chosen == null || wanted == null) {
      return null;
    }
    const iv = getIV(chosen.caught.ivs, wanted);

    return iv >= MAX_IV ? null : { stat: wanted, cost: hyperTrainingCost(iv) };
  };

  const train = (): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;
    const chosen = option();
    const wanted = climb();

    if (snapshot == null || standing == null || chosen == null || wanted == null) {
      return;
    }
    setBusy(true);
    hyperTrain(snapshot, standing[0], chosen.id, wanted.stat)
      .then((ivs) => {
        setBusy(false);

        if (ivs == null) {
          said('Not this one. The purse is short, or it is not yours to train.', 'ember');
          return;
        }
        playEffect(Effect.LevelUp);
        toast.push({
          title: STAT_NAMES[wanted.stat],
          message: `Trained to ${MAX_IV}. −${wanted.cost.toLocaleString('en-US')} gold`,
          tone: 'leaf',
        });
        setPicked(null);
        setStat(null);
        props.onTraded();
        props.onServed();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        said(refusal(caught), 'ember');
      });
  };

  const done = (): boolean => props.spent.latest === true;

  return (
    <>
      <DialogSection class="flex flex-col gap-3">
        {/* The cost is the value's own, so it is said on each value */}
        <CounterTerms have={{ amount: gold(), short: false, unit: 'gold' }} />
        <Show when={!done()} fallback={<CounterSpent says={NPC_SPENT[Npc.HyperTrainer] ?? ''} />}>
          <PickOne
            options={optionsOf(props)}
            picked={picked()}
            onPick={(id) => {
              setPicked(id);
              setStat(null);
            }}
            busy={busy()}
            verb="Pick"
            empty="You have nothing to train."
            filter={(one) => !isEgg(one.caught) && !one.fighting && !isGuarded(one.caught)}
          />
          <Show when={option()}>
            {(chosen) => (
              <>
                <CounterStep>Choose a value</CounterStep>
                {/* A list rather than a grid, so the cost has room beside each value */}
                <List>
                  <For each={STAT_ORDER}>
                    {(one) => {
                      const iv = (): number => getIV(chosen().caught.ivs, one);
                      const cost = (): number => hyperTrainingCost(iv());

                      return (
                        <ListRow class="flex-nowrap p-0" selected={stat() === one}>
                          <RowButton
                            class="flex items-center gap-2 px-3 py-2"
                            pressed={stat() === one}
                            disabled={busy() || iv() >= MAX_IV || cost() > gold()}
                            onClick={() => {
                              setStat(one);
                            }}
                          >
                            <span class="grow font-semibold">{STAT_NAMES[one]}</span>
                            <span class="tabular-nums">
                              {iv()} → {MAX_IV}
                            </span>
                            <span class="w-24 shrink-0 text-right text-xs text-muted tabular-nums">
                              {iv() >= MAX_IV
                                ? 'At the top'
                                : `${cost().toLocaleString('en-US')} gold`}
                            </span>
                          </RowButton>
                        </ListRow>
                      );
                    }}
                  </For>
                </List>
              </>
            )}
          </Show>
        </Show>
      </DialogSection>
      <DialogActions>
        <Show when={!done()}>
          <Button
            tone="primary"
            disabled={busy() || climb() == null || (climb()?.cost ?? 0) > gold()}
            onClick={train}
          >
            Train
            <Show when={climb()}>{(wanted) => <CostBadge cost={{ gold: wanted().cost }} />}</Show>
          </Button>
        </Show>
        {props.walkOn()}
      </DialogActions>
    </>
  );
}
