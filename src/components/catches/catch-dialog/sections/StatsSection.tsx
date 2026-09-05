import {
  EFFORT_STEP,
  NATURE_BARS,
  NATURE_MARKS,
  NATURE_NUMBERS,
  NATURE_WORDS,
  STAT_LABELS,
  bestTotal,
  natureShift,
  totalOf,
} from '../describe';

import type { CaughtPokemon } from '../../../../auth/caught';

import { assignableEffort, unusedEffort } from '../../../../auth/effort';

import { STATUS_NAMES } from '../../../../auth/health';

import type { Stats } from '../../../../data/constants/stats';
import { MAX_EFFORT_PER_STAT, MAX_IV, STAT_ORDER, getIV } from '../../../../data/constants/stats';

import { unpackStatuses } from '../../../../data/ids/status';

import {
  Button,
  DialogSection,
  List,
  ListRow,
  Meta,
  Row,
  TabBar,
  TabButton,
  TabGroup,
  TabPane,
} from '../../../styled';

import { For, type JSX, Show, createEffect, createSignal, on } from 'solid-js';

/**
 * The three readings of one set of six numbers: what the pokemon has
 * now, what it was born with, and what has been trained into it
 */
const enum StatView {
  Total = 0,
  IV = 1,
  EV = 2,
}

/**
 * The same six numbers read three ways: what the pokemon has, what it
 * was born with, and what has been trained into it.
 */
export interface StatsSectionProps {
  caught: CaughtPokemon;
  /** Whether the reader owns it, which is what the +4 buttons need */
  owned: boolean;
  /** Whether the record is being held still, by a lock or by a fight */
  frozen: boolean;
  /**
   * Save a whole spread at once. The pane lays the points out and
   * hands them over on one press, so six stats are one round trip
   */
  onTrain: (spread: Partial<Record<Stats, number>>) => void;
}

export default function StatsSection(props: StatsSectionProps): JSX.Element {
  /**
   * Points laid out but not yet saved, by stat. They are the pane's
   * own until Save is pressed: nothing has been asked of the server,
   * so Undo costs nothing
   */
  const [pending, setPending] = createSignal<Partial<Record<Stats, number>>>({});

  // A different pokemon on the sheet is a different set of points
  createEffect(
    on(
      () => props.caught,
      () => {
        setPending({});
      },
    ),
  );

  /** How many points are laid out across all six */
  const spent = (): number => STAT_ORDER.reduce((total, stat) => total + (pending()[stat] ?? 0), 0);

  /** What is left of the budget once what is laid out is counted */
  const left = (): number => unusedEffort(props.caught) - spent();

  /** The six values as the pane is showing them, saved or not */
  const laidOut = (): Record<Stats, number> => {
    const values = { ...props.caught.effortValues };

    for (const stat of STAT_ORDER) {
      values[stat] += pending()[stat] ?? 0;
    }
    return values;
  };

  /**
   * How much more this stat can take right now: what the stat has room
   * for and what the budget has left, both counting what is already
   * laid out
   */
  const room = (stat: Stats): number =>
    Math.min(left(), assignableEffort(props.caught, stat) - (pending()[stat] ?? 0));

  const add = (stat: Stats): void => {
    setPending((laid) => ({ ...laid, [stat]: (laid[stat] ?? 0) + EFFORT_STEP }));
  };

  return (
    <DialogSection title="Stats">
      <TabGroup horizontal defaultValue={StatView.Total} class="flex flex-col gap-2">
        <TabBar>
          <TabButton value={StatView.Total}>Total</TabButton>
          <TabButton value={StatView.IV}>IV</TabButton>
          <TabButton value={StatView.EV}>EV</TabButton>
        </TabBar>

        <TabPane value={StatView.Total}>
          <List>
            {/* All six, health included: what it is worth
                in a fight is the whole set, and what it
                has left of its health is said under the
                sprite. No nature moves health, so its
                mark column simply comes out empty */}
            <For each={STAT_ORDER}>
              {(stat) => (
                <ListRow>
                  {/* The arrow the games have always used,
    in a column of its own at the head of
    the row — the mirror of the number at
    the far end of it. Written after the
    name it pushed the labels out of line
    with each other, since only two of
    the six carry one; given its own
    width it marks the row without moving
    anything. The bar and the number are
    already tinted, and a colour is not
    something everybody can read */}
                  <span
                    class={`w-3 shrink-0 text-left ${
                      NATURE_NUMBERS[natureShift(props.caught.nature, stat)]
                    }`}
                    title={
                      NATURE_MARKS[natureShift(props.caught.nature, stat)] === ''
                        ? undefined
                        : `${STAT_LABELS[stat]} is ${
                            NATURE_WORDS[natureShift(props.caught.nature, stat)]
                          }`
                    }
                    aria-label={
                      NATURE_MARKS[natureShift(props.caught.nature, stat)] === ''
                        ? undefined
                        : NATURE_WORDS[natureShift(props.caught.nature, stat)]
                    }
                    role={
                      NATURE_MARKS[natureShift(props.caught.nature, stat)] === ''
                        ? undefined
                        : 'img'
                    }
                  >
                    {NATURE_MARKS[natureShift(props.caught.nature, stat)]}
                  </span>
                  <span class="w-24 shrink-0 text-left">{STAT_LABELS[stat]}</span>
                  {/* Measured against its own best rather
    than against a ceiling: what a player
    wants off this list is which end of
    the pokemon is the sharp one, and the
    bar the nature moved is the colour of
    the way it moved it */}
                  <div class="h-2 grow overflow-hidden rounded-full bg-line-soft">
                    <div
                      class={`h-full rounded-full ${
                        NATURE_BARS[natureShift(props.caught.nature, stat)]
                      }`}
                      style={{
                        width: `${(totalOf(props.caught, stat) / bestTotal(props.caught)) * 100}%`,
                      }}
                    />
                  </div>
                  <Meta
                    class={`w-12 text-right tabular-nums ${
                      NATURE_NUMBERS[natureShift(props.caught.nature, stat)]
                    }`}
                  >
                    {totalOf(props.caught, stat)}
                  </Meta>
                </ListRow>
              )}
            </For>
          </List>
          <Show when={props.caught.statuses !== 0}>
            <Meta>
              {unpackStatuses(props.caught.statuses)
                .map((carried) => STATUS_NAMES[carried])
                .join(' · ')}
            </Meta>
          </Show>
        </TabPane>

        <TabPane value={StatView.IV}>
          <List>
            <For each={STAT_ORDER}>
              {(stat) => (
                <ListRow>
                  {/* The column the Total tab marks a
    nature in, empty here: a stat's name
    should not move when the tab under
    it changes */}
                  <span class="w-3 shrink-0" />
                  <span class="w-24 shrink-0 text-left">{STAT_LABELS[stat]}</span>
                  <div class="h-2 grow overflow-hidden rounded-full bg-line-soft">
                    <div
                      class="h-full rounded-full bg-gold"
                      style={{
                        width: `${(getIV(props.caught.ivs, stat) / MAX_IV) * 100}%`,
                      }}
                    />
                  </div>
                  <Meta class="w-12 text-right tabular-nums">{getIV(props.caught.ivs, stat)}</Meta>
                </ListRow>
              )}
            </For>
          </List>
        </TabPane>

        <TabPane value={StatView.EV}>
          <List>
            <For each={STAT_ORDER}>
              {(stat) => (
                <ListRow>
                  {/* The column the Total tab marks a
    nature in, empty here: a stat's name
    should not move when the tab under
    it changes */}
                  <span class="w-3 shrink-0" />
                  <span class="w-24 shrink-0 text-left">{STAT_LABELS[stat]}</span>
                  <div class="h-2 grow overflow-hidden rounded-full bg-line-soft">
                    <div
                      class="h-full rounded-full bg-leaf"
                      style={{
                        width: `${(laidOut()[stat] / MAX_EFFORT_PER_STAT) * 100}%`,
                      }}
                    />
                  </div>
                  <Meta class="w-12 text-right tabular-nums">
                    {props.caught.effortValues[stat]}
                    {/* What is laid out but not saved, kept apart from
    what the record says: the bar above
    already shows the two added up */}
                    <Show when={(pending()[stat] ?? 0) > 0}>
                      <span class="text-leaf-dark"> +{pending()[stat]}</span>
                    </Show>
                  </Meta>
                  {/* Only up. Effort is taken back off a
    stat by feeding the pokemon a bitter
    berry — a Pomeg for health, a Kelpsy
    for attack — which costs an item and
    earns the pokemon's regard. A button
    here undid all of that for free, and
    made six berries pointless */}
                  <Show when={props.owned}>
                    <Button
                      tone="primary"
                      disabled={props.frozen || room(stat) < EFFORT_STEP}
                      onClick={() => {
                        add(stat);
                      }}
                    >
                      +{EFFORT_STEP}
                    </Button>
                  </Show>
                </ListRow>
              )}
            </For>
          </List>
          {/* What is left to spend, under the rows it
              would be spent on. It sits at the end
              because it is the answer to "can I press
              these", which is a question asked after
              reading them rather than before */}
          <Meta class="block text-right">Remaining: {left()}</Meta>

          {/* Nothing has left the sheet until this is pressed. The
              points are laid out first and saved once, so a player
              filling out six stats waits on one answer rather than
              thirty — and can change their mind for free until then */}
          <Show when={props.owned && spent() > 0}>
            <Row class="justify-end">
              <Meta>{spent()} to spend</Meta>
              <Button
                onClick={() => {
                  setPending({});
                }}
              >
                Undo
              </Button>
              <Button
                tone="primary"
                disabled={props.frozen}
                onClick={() => {
                  const laid = pending();

                  setPending({});
                  props.onTrain(laid);
                }}
              >
                Save
              </Button>
            </Row>
          </Show>
        </TabPane>
      </TabGroup>
    </DialogSection>
  );
}
