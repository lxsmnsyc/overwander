import { type JSX, Show, createEffect, createMemo, createResource, createSignal } from 'solid-js';
import {
  type BoxLayout,
  type BoxRecord,
  DEFAULT_BOX_NAME,
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
import BattleData from '../../app/battle-data';
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
const SORTS: { value: string; label: string }[] = [
  { value: 'caught', label: 'Caught' },
  { value: 'level', label: 'Level' },
  { value: 'iv', label: 'Values' },
  { value: 'friendship', label: 'Friendship' },
  { value: 'species', label: 'Dex number' },
  { value: 'name', label: 'Name' },
  { value: 'hp', label: 'HP' },
  { value: 'walked', label: 'Walked' },
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
      { id: null, name: DEFAULT_BOX_NAME, tone: DEFAULT_BOX_TONE, count: count('') },
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
    return DEFAULT_BOX_NAME;
  };

  const controls = (): QueryControls => parseControls(query(), true);

  /** The sort control's choices, the first of them the box's own order */
  const sortOptions = (): { value: string; label: string }[] => [
    { value: '', label: current() == null || everywhere() ? 'Box order' : 'Slot order' },
    ...SORTS,
  ];

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
  const reason = (option: CatchOption): string | null => (option.fighting ? 'in a battle' : null);

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
          message: caught instanceof Error ? caught.message : String(caught),
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
          message: `${said(outcome.done.length)}${skipped === 0 ? '' : `, ${skipped} skipped`}.`,
          tone: outcome.done.length === 0 ? 'ember' : 'leaf',
        });
        setPicked([]);
        game.touchRecords();
      })
      .catch((caught: unknown) => {
        toast.push({
          message: caught instanceof Error ? caught.message : String(caught),
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
    settle(releaseCatches(going), (count) => `${count} let go`);
  };

  /** File some catches, into the first free squares or from one square on */
  const file = (ids: string[], box: string | null, slot: number | null = null): void => {
    if (ids.length > 0) {
      settle(fileCatches(ids, box, slot), (count) => `${count} moved to ${nameOf(box)}`);
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
      return filing.length === 0 ? `Made ${name}` : `Made ${name} with ${filing.length} in it`;
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
          verb: 'Add',
          reason,
          onPick: (chose) => {
            setPicked(chose);
          },
        }
      : {
          value: null,
          verb: 'Open',
          onPick: (catchId) => {
            if (catchId != null) {
              game.setSheet({ catchId, readOnly: props.viewOnly === true });
            }
          },
        };

  /** What an empty box says, which for one the player made is how to fill it */
  const emptyNote = (): string => {
    if (!mine()) {
      return 'Nothing caught yet.';
    }
    return current() == null ? 'No catches yet.' : `Nothing in ${nameOf(current())} yet.`;
  };

  /** The card over a box the player made while nothing is in it */
  const emptyCard = (): JSX.Element => (
    <>
      <p class="m-0 text-lg font-black">Nothing in {nameOf(current())} yet</p>
      <Meta>
        Add pokemon from any box, drag some onto {nameOf(current())} in the list, or move them here
        from their sheet.
      </Meta>
    </>
  );

  /** How many pokemon, in how many boxes, beside the plate */
  const summary = (): string => {
    const total = offered().length;
    const count = rail().length;

    return `${total} pokemon in ${count} box${count === 1 ? '' : 'es'}`;
  };

  /** What the search says it looks through */
  const placeholder = (): string =>
    everywhere() ? 'Search every box' : `Search ${nameOf(current())}`;

  /** Where in the box the player has scrolled to: by slot in a box that keeps them */
  const viewSay = (view: BoxView): string =>
    `${slotted() ? 'Slots' : 'Showing'} ${view.from} to ${view.to} of ${view.total}`;

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
                  New box
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
                Select
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
            Done
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
        aria-label="Where to search"
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
          This box
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
          All boxes
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
                  run(editBox(id, name, colour), (done) =>
                    done ? null : 'That name will not do.',
                  );
                }
              }}
              onLayOut={(layout: BoxLayout) => {
                const id = current();

                if (id != null) {
                  run(layOutBox(id, layout), () =>
                    layout === 'dex' ? 'Laid out by dex number' : 'Gaps closed up',
                  );
                }
              }}
              onEmpty={(to) => {
                const id = current();

                if (id != null) {
                  run(emptyBox(id, to), (done) =>
                    done ? `Moved them all to ${nameOf(to)}` : null,
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
                    return `Deleted ${name}`;
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
                    {shown().length} found in {foundIn()} box{foundIn() === 1 ? '' : 'es'}
                  </span>
                  <Meta>Each square says which box it lives in</Meta>
                </div>
              </Show>
            }
            aside={() => (
              <>
                {scope()}
                <Select
                  label="Sort"
                  class="shrink-0 [&>label]:sr-only"
                  value={sortValue()}
                  options={sortOptions()}
                  onChange={(sort) => {
                    setQuery(withControl(query(), 'sort', sort === '' ? null : sort));
                  }}
                />
                <Button
                  class="shrink-0"
                  label={controls().descending ? 'Highest first' : 'Lowest first'}
                  disabled={sortValue() === ''}
                  onClick={() => {
                    setQuery(withControl(query(), 'order', controls().descending ? 'asc' : null));
                  }}
                >
                  <SwapIcon class="size-5" aria-hidden="true" />
                </Button>
                <Show when={selecting() && pickable() > 0}>
                  <Button class="shrink-0" onClick={pickAll}>
                    Pick all {pickable()}
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
            placeLabel={(slot) => `Put the ${picked().length} picked in slot ${slot + 1}`}
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
            <Meta>
              Slot order keeps the gaps. Any other order lists the box packed, gaps hidden. The box
              always ends in one empty row to place into, and grows as you fill it.
            </Meta>
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
        title="Boxes"
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
                  on ? `${count} favorited` : `${count} unfavorited`,
                );
              }}
              onGuard={(on) => {
                settle(guardCatches(picked(), on), (count) =>
                  on ? `${count} locked` : `${count} unlocked`,
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
              <Button onClick={props.onClose}>Close</Button>
            </DialogActions>
          }
        >
          {body()}
          {/* The way out, and what a press does while nothing is being picked */}
          <DialogActions
            note={
              <Show when={!selecting()}>
                <Meta class="hidden sm:block">Press a pokemon to open its sheet</Meta>
                <Meta class="sm:hidden">Long-press a pokemon to start picking</Meta>
              </Show>
            }
          >
            <Button onClick={props.onClose}>Close</Button>
          </DialogActions>
        </BattleData>
      </Dialog>

      {/* Filling an empty box from every other */}
      <CatchPicker
        open={adding()}
        multiple
        player={props.player}
        value={[]}
        title={`Add to ${nameOf(current())}`}
        description="Pick from any of your boxes. They are filed in the order picked."
        verb="Add"
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
