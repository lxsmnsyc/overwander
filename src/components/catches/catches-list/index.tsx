import { type JSX, Show, createEffect, createMemo, createResource, createSignal } from 'solid-js';
import {
  type BoxLayout,
  type BoxRecord,
  DEFAULT_BOX_TONE,
  arrangeBoxes,
  boxTone,
  deleteBox,
  editBox,
  emptyBox,
  fileCatches,
  layOutBox,
  listBoxes,
  makeBox,
} from '../../../auth/boxes';
import {
  type BulkOutcome,
  favoriteCatches,
  guardCatches,
  releaseCatches,
} from '../../../auth/caught';
import CatchPicker, { type CatchOption, type CatchPickerProps } from '../catch-picker';
import BattleData from '../../app/BattleData';
import { useGame } from '../../app/game-context';
import createClientSignal from '../../app/client-signal';
import { answered } from '../../app/resource-reads';
import { BoxIcon, PlusIcon, SelectIcon, SwapIcon } from '../../icons';
import { Button, Dialog, DialogActions, Meta, Select, useToast } from '../../styled';
import type { BoxView } from '../CatchBox';
import { type QueryControls, parseControls, withControl } from '../../../core/query';
import CatchActions from './actions';
import BoxHeading from './heading';
import BoxRail, { type RailBox } from './rail';
import ReleasedList, { createReleased } from './released';
import describeFailure from '../../../i18n/refusals';
import { m } from '../../../i18n/paraglide/messages.js';

export interface CatchesListProps {
  player: string;
  /**
   * Whether this is somebody else's box. Catch records are readable by
   * every signed-in player — that is what makes a lot on the block
   * worth bidding on — so the box draws the same either way, and what
   * changes is what opening a square leads to: the whole record, and
   * nothing on it to press. Their boxes are their own, so all of their
   * pokemon show as one
   */
  viewOnly?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

/** What the sort control offers past the box's own order */
const SORTS: { value: string; label: () => string }[] = [
  { value: 'caught', label: m.catch_sort_caught },
  { value: 'level', label: m.catch_sort_level },
  { value: 'iv', label: m.catch_sort_values },
  { value: 'friendship', label: m.catch_friendship },
  { value: 'species', label: m.catch_sort_dex },
  { value: 'name', label: m.catch_box_name },
  { value: 'hp', label: m.catch_sort_hp },
  { value: 'walked', label: m.catch_sort_walked },
];

/**
 * The box the player last had open, kept for the session so coming
 * back to the screen comes back to where they were
 */
const [lastOpen, setLastOpen] = createSignal<string | null>(null);

/**
 * The player's pokemon, in boxes.
 *
 * Default holds whatever is not filed anywhere, and is where new
 * catches land. The boxes the player makes sit under it down the side,
 * and the one chosen there is the box showing: its pokemon stand in
 * their squares with the gaps kept, so a box built as a dex shows what
 * is missing where it goes.
 *
 * It is the picker, browsing: picking one of your pokemon and looking
 * at one are the same act with different consequences, so it is the
 * same list, and what a press opens is the caller's business.
 * Selecting is that same list again with the picker's `multiple`
 * shape, and a bar under the box for what to do with the lot: move
 * them, mark them, let them go. A pokemon dragged onto a box in the
 * rail is filed there, and one dragged onto a square lands in it.
 */
export default function CatchesList(props: CatchesListProps): JSX.Element {
  const game = useGame();
  const toast = useToast();
  const client = createClientSignal();
  const released = createReleased();
  const [picked, setPicked] = createSignal<string[]>([]);
  /**
   * Every pokemon of theirs, so a picked id can be read back as the
   * record behind it, and each box counted
   */
  const [offered, setOffered] = createSignal<CatchOption[]>([]);
  /** What the search is showing, for the counts while it looks through every box */
  const [shown, setShown] = createSignal<CatchOption[]>([]);
  const [busy, setBusy] = createSignal(false);
  /**
   * Held here rather than inside the picker: browsing and selecting are
   * two different shapes of it, so a query left down there would be
   * thrown away every time the mode changed
   */
  const [query, setQuery] = createSignal('');
  /** Whether presses pick pokemon rather than open them */
  const [marking, setMarking] = createSignal(false);
  /** Whether the search looks through every box rather than the one showing */
  const [everywhere, setEverywhere] = createSignal(false);
  /** Whether the let-go list stands where the box would */
  const [lookingBack, setLookingBack] = createSignal(false);
  /** Whether the new box form is open, and what it will be made with */
  const [making, setMaking] = createSignal(false);
  const [makingWith, setMakingWith] = createSignal<string[]>([]);
  /** Whether the picker that fills an empty box is up */
  const [adding, setAdding] = createSignal(false);
  /** What is being dragged, while something is */
  const [dragging, setDragging] = createSignal<string[]>([]);

  const mine = (): boolean => props.viewOnly !== true;

  const [boxes] = createResource(
    () => client() && mine() && ([props.player, game.records()] as const),
    async ([player]): Promise<[string, BoxRecord][]> => listBoxes(player),
  );

  /** The declaring body, so this never waits: no boxes until they are read */
  const made = (): [string, BoxRecord][] => answered(boxes) ?? [];

  /** Whether a search is looking through every box, where counts are matches */
  const counting = (): boolean => everywhere() && query().trim() !== '';

  /** How many each box holds, and how many squares it spans, by box id or '' for Default */
  const tally = createMemo(() => {
    const counts = new Map<string, number>();
    const spans = new Map<string, number>();
    const hits = new Map<string, number>();

    for (const option of offered()) {
      const key = option.caught.box ?? '';

      counts.set(key, (counts.get(key) ?? 0) + 1);
      if (option.caught.slot != null) {
        spans.set(key, Math.max(spans.get(key) ?? 0, option.caught.slot + 1));
      }
    }
    for (const option of shown()) {
      const key = option.caught.box ?? '';

      hits.set(key, (hits.get(key) ?? 0) + 1);
    }
    return { counts, spans, hits };
  });

  const rail = createMemo<RailBox[]>(() => {
    const { counts, hits } = tally();
    const count = (key: string): number => (counting() ? hits : counts).get(key) ?? 0;
    const listed: RailBox[] = [
      { id: null, name: m.catch_box_default(), tone: DEFAULT_BOX_TONE, count: count('') },
    ];

    for (const [id, box] of made()) {
      listed.push({ id, name: box.name, tone: boxTone(box.colour), count: count(id) });
    }
    return listed;
  });

  /** Every box with how many it holds, whatever the search, for the Move menu */
  const held = createMemo<RailBox[]>(() => {
    const { counts } = tally();
    const listed: RailBox[] = [];

    for (const box of rail()) {
      listed.push({ ...box, count: counts.get(box.id ?? '') ?? 0 });
    }
    return listed;
  });

  /** The box showing. One that has gone, deleted elsewhere, falls back to Default */
  const current = (): string | null => {
    const id = lastOpen();

    for (const box of made()) {
      if (box[0] === id) {
        return id;
      }
    }
    return null;
  };

  const currentRecord = (): BoxRecord | undefined => {
    for (const [id, box] of made()) {
      if (id === current()) {
        return box;
      }
    }
    return undefined;
  };

  const nameOf = (box: string | null): string => {
    for (const listed of rail()) {
      if (listed.id === box) {
        return listed.name;
      }
    }
    return m.catch_box_default();
  };

  const controls = (): QueryControls => parseControls(query(), true);

  /** The sort control's choices, the first of them the box's own order */
  const sortOptions = (): { value: string; label: string }[] => {
    const options: { value: string; label: string }[] = [
      {
        value: '',
        label:
          current() == null || everywhere() ? m.catch_sort_box_order() : m.catch_sort_slot_order(),
      },
    ];

    for (const sort of SORTS) {
      options.push({ value: sort.value, label: sort.label() });
    }
    return options;
  };

  const sortValue = (): string => {
    for (const option of SORTS) {
      if (option.value === controls().sort) {
        return option.value;
      }
    }
    return '';
  };

  /** Whether the box showing keeps its squares, gaps and all */
  const slotted = (): boolean => !everywhere() && current() != null && sortValue() === '';

  // Leaving select mode lets go of what was picked. Coming back to a
  // box still lit from last time is a selection nobody made
  createEffect(() => {
    if (!marking()) {
      setPicked([]);
    }
  });

  // Held: the strip asks what was picked a dozen times over, and each
  // of those was a scan of the whole collection
  const chosen = createMemo<CatchOption[]>(() => {
    const wanted = new Set(picked());
    const found: CatchOption[] = [];

    for (const option of offered()) {
      if (wanted.has(option.id)) {
        found.push(option);
      }
    }
    return found;
  });

  /**
   * A pokemon in a battle is shown and refused rather than left out: a
   * player looking for one wants to be told where it went. Nothing else
   * is refused at pick time
   */
  const reason = (option: CatchOption): string | null =>
    option.fighting ? m.catch_in_battle() : null;

  /** A round trip, said once when it lands, with the records read again either way */
  const run = <T,>(done: Promise<T>, said: (answer: T) => string | null): void => {
    setBusy(true);
    done
      .then((answer) => {
        const message = said(answer);

        if (message != null) {
          toast.push({ message, tone: 'leaf' });
        }
        game.touchRecords();
      })
      .catch((caught: unknown) => {
        toast.push({
          message: describeFailure(caught),
          tone: 'ember',
        });
      })
      .finally(() => {
        setBusy(false);
      });
  };

  /** What a bulk action came to, with how many it stepped over */
  const settle = (done: Promise<BulkOutcome>, said: (count: number) => string): void => {
    setBusy(true);
    done
      .then((outcome) => {
        const skipped = outcome.refused.length;

        toast.push({
          message:
            skipped === 0
              ? m.catch_bulk_done({ said: said(outcome.done.length) })
              : m.catch_bulk_skipped({ said: said(outcome.done.length), skipped }),
          tone: outcome.done.length === 0 ? 'ember' : 'leaf',
        });
        setPicked([]);
        game.touchRecords();
      })
      .catch((caught: unknown) => {
        toast.push({
          message: describeFailure(caught),
          tone: 'ember',
        });
      })
      .finally(() => {
        setBusy(false);
      });
  };

  const release = (): void => {
    // The strip's own count is what it offered, so it is what is sent:
    // the ones it said it would step over are never named
    const going: string[] = [];

    for (const option of chosen()) {
      if (!option.fighting) {
        going.push(option.id);
      }
    }
    settle(releaseCatches(going), (count) => m.catch_bulk_let_go({ count }));
  };

  /** File some catches, into the first free squares or from one square on */
  const file = (ids: string[], box: string | null, slot: number | null = null): void => {
    if (ids.length > 0) {
      settle(fileCatches(ids, box, slot), (count) =>
        m.catch_bulk_moved({ count, name: nameOf(box) }),
      );
    }
  };

  const make = (name: string, colour: number): void => {
    const filing = makingWith();

    run(makeBox(name, colour, filing), (id) => {
      if (id == null) {
        return null;
      }
      setMaking(false);
      setMakingWith([]);
      setPicked([]);
      setLastOpen(id);
      setEverywhere(false);
      setLookingBack(false);
      return filing.length === 0
        ? m.catch_made({ name })
        : m.catch_made_with({ name, count: filing.length });
    });
  };

  const startMaking = (): void => {
    setMakingWith(marking() ? picked() : []);
    setMaking(true);
  };

  const choose = (box: string | null): void => {
    setLastOpen(box);
    setEverywhere(false);
    setLookingBack(false);
  };

  /** Picking up one pokemon, or every picked one when it is among them */
  const startDrag = (id: string): void => {
    setDragging(marking() && picked().includes(id) ? picked() : [id]);
    // Over once the pointer lets go, wherever that is: a drop lands
    // before this, so it still knows what was carried. The next press
    // ends it too, since a square scrolled out from under the drag is
    // no longer there to say it ended
    const over = (): void => {
      setDragging([]);
      window.removeEventListener('dragend', over);
      window.removeEventListener('pointerdown', over);
    };

    window.addEventListener('dragend', over);
    window.addEventListener('pointerdown', over);
  };

  const selecting = (): boolean => marking() && mine();

  /** Every pokemon the search is showing that can be picked, picked */
  const pickAll = (): void => {
    const all: string[] = [...picked()];

    for (const option of shown()) {
      if (reason(option) == null && !all.includes(option.id)) {
        all.push(option.id);
      }
    }
    setPicked(all);
  };

  /** How many more Pick all would take */
  const pickable = (): number => {
    let count = 0;
    const already = new Set(picked());

    for (const option of shown()) {
      if (reason(option) == null && !already.has(option.id)) {
        count += 1;
      }
    }
    return count;
  };

  /**
   * The half of the picker's props that looking and picking disagree
   * about, spread into one picker rather than swapping two: swapping
   * the component tore down the records it had read and the page it
   * was on
   */
  const mode = (): CatchPickerProps =>
    selecting()
      ? {
          multiple: true,
          live: true,
          value: picked(),
          verb: m.catch_picker_add(),
          reason,
          onPick: (chose) => {
            setPicked(chose);
          },
        }
      : {
          value: null,
          verb: m.catch_picker_open(),
          onPick: (catchId) => {
            if (catchId != null) {
              game.setSheet({ catchId, readOnly: props.viewOnly === true });
            }
          },
        };

  /** What an empty box says, which for one the player made is how to fill it */
  const emptyNote = (): string => {
    if (!mine()) {
      return m.catch_empty_theirs();
    }
    return current() == null
      ? m.catch_empty_default()
      : m.catch_empty_box({ name: nameOf(current()) });
  };

  /** The card over a box the player made while nothing is in it */
  const emptyCard = (): JSX.Element => (
    <>
      <p class="m-0 text-lg font-black">{m.catch_empty_card_title({ name: nameOf(current()) })}</p>
      <Meta>{m.catch_empty_card_note({ name: nameOf(current()) })}</Meta>
    </>
  );

  /** How many pokemon, in how many boxes, beside the plate */
  const summary = (): string => {
    const total = offered().length;
    const count = rail().length;

    return m.catch_boxes_summary({ total, count });
  };

  /** What the search says it looks through */
  const placeholder = (): string =>
    everywhere()
      ? m.catch_picker_search_all()
      : m.catch_picker_search_box({ name: nameOf(current()) });

  /** Where in the box the player has scrolled to: by slot in a box that keeps them */
  const viewSay = (view: BoxView): string =>
    slotted()
      ? m.catch_view_slots({ from: view.from, to: view.to, total: view.total })
      : m.catch_view_showing({ from: view.from, to: view.to, total: view.total });

  /** How many boxes the search found something in */
  const foundIn = (): number => {
    let count = 0;

    for (const box of rail()) {
      if (box.count > 0) {
        count += 1;
      }
    }
    return count;
  };

  /** The two buttons at the top right: making a box, and picking */
  const aside = (): JSX.Element => (
    <Show when={mine()}>
      <div class="flex items-center gap-2">
        <Show
          when={selecting()}
          fallback={
            <>
              {/* A phone has the chip at the end of the rail instead */}
              <span class="hidden sm:contents">
                <Button
                  tone={making() ? 'pressed' : undefined}
                  disabled={busy()}
                  onClick={() => {
                    if (making()) {
                      setMaking(false);
                      return;
                    }
                    startMaking();
                  }}
                >
                  <PlusIcon class="size-4" aria-hidden="true" />
                  {m.catch_box_new()}
                </Button>
              </span>
              <Button
                disabled={busy()}
                onClick={() => {
                  setMarking(true);
                  setLookingBack(false);
                }}
              >
                <SelectIcon class="size-4" aria-hidden="true" />
                {m.catch_select()}
              </Button>
            </>
          }
        >
          <Button
            tone="primary"
            onClick={() => {
              setMarking(false);
            }}
          >
            {m.catch_done()}
          </Button>
        </Show>
      </div>
    </Show>
  );

  /** This box or every box, beside the search */
  const scope = (): JSX.Element => (
    <Show when={mine() && made().length > 0}>
      <div
        role="radiogroup"
        aria-label={m.catch_where_to_search()}
        class="flex shrink-0 gap-0.5 rounded-xl bg-line-soft p-0.5"
      >
        <button
          type="button"
          role="radio"
          aria-checked={!everywhere()}
          class={`cursor-pointer rounded-lg px-3 py-1 text-sm font-extrabold ${
            everywhere() ? 'text-muted' : 'bg-paper text-ink shadow-pop-sm'
          }`}
          onClick={() => {
            setEverywhere(false);
          }}
        >
          {m.catch_this_box()}
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={everywhere()}
          class={`cursor-pointer rounded-lg px-3 py-1 text-sm font-extrabold ${
            everywhere() ? 'bg-paper text-ink shadow-pop-sm' : 'text-muted'
          }`}
          onClick={() => {
            setEverywhere(true);
            setLookingBack(false);
          }}
        >
          {m.catch_picker_all_boxes()}
        </button>
      </div>
    </Show>
  );

  const body = (): JSX.Element => (
    <div class="flex w-full flex-col gap-4 sm:flex-row sm:items-stretch">
      <Show when={mine()}>
        <BoxRail
          boxes={rail()}
          current={everywhere() || lookingBack() ? undefined : current()}
          onChoose={choose}
          dragging={dragging().length > 0}
          onDrop={(box) => {
            file(dragging(), box);
          }}
          onArrange={(order) => {
            run(arrangeBoxes(order), () => null);
          }}
          making={making()}
          makingWith={makingWith().length}
          busy={busy()}
          onMake={make}
          onCancelMake={() => {
            setMaking(false);
            setMakingWith([]);
          }}
          onStartMake={startMaking}
          counting={counting()}
          picked={selecting() ? picked().length : 0}
          letGo={released.letGo().length}
          showingLetGo={lookingBack()}
          onLetGo={() => {
            setLookingBack(true);
            setEverywhere(false);
          }}
        />
      </Show>

      <div class="flex min-w-0 grow flex-col gap-3">
        <Show when={lookingBack()}>
          <ReleasedList released={released} />
        </Show>
        <Show when={!lookingBack()}>
          <Show when={mine() && !everywhere()}>
            <BoxHeading
              id={current()}
              name={nameOf(current())}
              tone={
                currentRecord() == null ? DEFAULT_BOX_TONE : boxTone(currentRecord()?.colour ?? 0)
              }
              colour={currentRecord()?.colour ?? 0}
              count={tally().counts.get(current() ?? '') ?? 0}
              span={tally().spans.get(current() ?? '') ?? 0}
              boxes={held()}
              busy={busy()}
              selecting={selecting()}
              onAdd={() => {
                setAdding(true);
              }}
              onEdit={(name, colour) => {
                const id = current();

                if (id != null) {
                  run(editBox(id, name, colour), (done) => (done ? null : m.catch_bad_name()));
                }
              }}
              onLayOut={(layout: BoxLayout) => {
                const id = current();

                if (id != null) {
                  run(layOutBox(id, layout), () =>
                    layout === 'dex' ? m.catch_laid_out() : m.catch_gaps_closed(),
                  );
                }
              }}
              onEmpty={(to) => {
                const id = current();

                if (id != null) {
                  run(emptyBox(id, to), (done) =>
                    done ? m.catch_moved_all({ name: nameOf(to) }) : null,
                  );
                }
              }}
              onDelete={() => {
                const id = current();
                const name = nameOf(id);

                if (id != null) {
                  run(deleteBox(id), (done) => {
                    if (!done) {
                      return null;
                    }
                    setLastOpen(null);
                    return m.catch_deleted({ name });
                  });
                }
              }}
            />
          </Show>
          <CatchPicker
            inline
            player={props.player}
            viewOnly={props.viewOnly}
            box={mine() && !everywhere() ? { box: current() } : null}
            empty={emptyNote()}
            emptyCard={emptyCard()}
            search={query()}
            onSearch={(typed) => {
              setQuery(typed);
            }}
            placeholder={placeholder()}
            fill
            say={viewSay}
            results={
              <Show when={counting()}>
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="text-sm font-extrabold">
                    {m.catch_found_in({ count: shown().length, boxes: foundIn() })}
                  </span>
                  <Meta>{m.catch_found_note()}</Meta>
                </div>
              </Show>
            }
            aside={() => (
              <>
                {scope()}
                <Select
                  label={m.catch_sort()}
                  class="shrink-0 [&>label]:sr-only"
                  value={sortValue()}
                  options={sortOptions()}
                  onChange={(sort) => {
                    setQuery(withControl(query(), 'sort', sort === '' ? null : sort));
                  }}
                />
                <Button
                  class="shrink-0"
                  label={controls().descending ? m.catch_highest_first() : m.catch_lowest_first()}
                  disabled={sortValue() === ''}
                  onClick={() => {
                    setQuery(withControl(query(), 'order', controls().descending ? 'asc' : null));
                  }}
                >
                  <SwapIcon class="size-5" aria-hidden="true" />
                </Button>
                <Show when={selecting() && pickable() > 0}>
                  <Button class="shrink-0" onClick={pickAll}>
                    {m.catch_pick_all({ count: pickable() })}
                  </Button>
                </Show>
              </>
            )}
            // Nothing more asked for while a round trip is in the air
            disabled={busy()}
            // A record changed under it, a move between boxes among
            // them, and the box reads itself again
            revision={game.records()}
            onOptions={(list) => {
              setOffered(list);
            }}
            onShown={(list) => {
              setShown(list);
            }}
            onDragStart={mine() ? startDrag : undefined}
            onDropOn={
              mine() && !everywhere() && current() != null
                ? (slot) => {
                    file(dragging(), current(), slot);
                  }
                : undefined
            }
            // The picked ones put in an empty square, which is what a
            // finger does in place of dragging them there
            onPlace={
              selecting() && picked().length > 0 && !everywhere() && current() != null
                ? (slot) => {
                    file(picked(), current(), slot);
                  }
                : undefined
            }
            placeLabel={(slot) => m.catch_put_picked({ count: picked().length, slot: slot + 1 })}
            // A finger held on a pokemon starts picking, with it picked
            onHold={
              mine()
                ? (id) => {
                    setMarking(true);
                    setPicked((now) => (now.includes(id) ? now : [...now, id]));
                  }
                : undefined
            }
            {...mode()}
          />
          <Show when={slotted() && (tally().counts.get(current() ?? '') ?? 0) > 0}>
            <Meta>{m.catch_slot_order_note()}</Meta>
          </Show>
        </Show>
      </div>
    </div>
  );

  return (
    <>
      <Dialog
        isOpen={props.isOpen}
        onClose={props.onClose}
        width="broad"
        title={m.panel_boxes()}
        lead={<BoxIcon class="size-5 text-on-accent" aria-hidden="true" />}
        description={summary()}
        aside={aside()}
        bar={
          selecting() ? (
            <CatchActions
              chosen={chosen()}
              busy={busy()}
              boxes={held()}
              onMove={(box) => {
                file(picked(), box);
              }}
              onMoveToNew={() => {
                setMakingWith(picked());
                setMaking(true);
              }}
              onFavorite={(on) => {
                settle(favoriteCatches(picked(), on), (count) =>
                  on ? m.catch_bulk_favorited({ count }) : m.catch_bulk_unfavorited({ count }),
                );
              }}
              onGuard={(on) => {
                settle(guardCatches(picked(), on), (count) =>
                  on ? m.catch_held_locked({ count }) : m.catch_bulk_unlocked({ count }),
                );
              }}
              onRelease={release}
              onClear={() => {
                setPicked([]);
              }}
            />
          ) : undefined
        }
      >
        <BattleData
          fallback={
            <DialogActions>
              <Button onClick={props.onClose}>{m.ui_close()}</Button>
            </DialogActions>
          }
        >
          {body()}
          {/* The way out, and what a press does while nothing is being picked */}
          <DialogActions
            note={
              <Show when={!selecting()}>
                <Meta class="hidden sm:block">{m.catch_press_note()}</Meta>
                <Meta class="sm:hidden">{m.catch_long_press_note()}</Meta>
              </Show>
            }
          >
            <Button onClick={props.onClose}>{m.ui_close()}</Button>
          </DialogActions>
        </BattleData>
      </Dialog>

      {/* Filling an empty box from every other */}
      <CatchPicker
        open={adding()}
        multiple
        player={props.player}
        value={[]}
        title={m.catch_add_to({ name: nameOf(current()) })}
        description={m.catch_add_to_note()}
        verb={m.catch_picker_add()}
        filter={(option) => option.caught.box !== current()}
        reason={reason}
        onClose={() => {
          setAdding(false);
        }}
        onPick={(ids) => {
          setAdding(false);
          file(ids, current());
        }}
      />
    </>
  );
}
