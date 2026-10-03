import { type JSX, Show, createEffect, createMemo, createResource, createSignal } from 'solid-js';
import {
  type BoxLayout,
  type BoxRecord,
  DEFAULT_BOX_NAME,
  DEFAULT_BOX_TONE,
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
import { useGame } from '../../app/game-context';
import createClientSignal from '../../app/client-signal';
import { answered } from '../../app/resource-reads';
import { ArrowDownIcon, ArrowUpIcon } from '../../icons';
import { Button, DialogActions, Select, useToast } from '../../styled';
import { type QueryControls, parseControls, withControl } from '../../../core/query';
import CatchActions from './actions';
import BoxHeading from './heading';
import BoxRail, { type RailBox } from './rail';
import ReleasedList from './released';

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
  /** The dialog's way out, which shares the foot of the list with the selection's actions */
  onClose: () => void;
}

/** What the sort control offers past the box's own order */
const SORTS: { value: string; label: string }[] = [
  { value: 'caught', label: 'Sort: Caught' },
  { value: 'level', label: 'Sort: Level' },
  { value: 'iv', label: 'Sort: Values' },
  { value: 'friendship', label: 'Sort: Friendship' },
  { value: 'species', label: 'Sort: Dex number' },
  { value: 'name', label: 'Sort: Name' },
  { value: 'hp', label: 'Sort: HP' },
  { value: 'walked', label: 'Sort: Walked' },
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
  const [picked, setPicked] = createSignal<string[]>([]);
  /**
   * Every pokemon of theirs, so a picked id can be read back as the
   * record behind it, and each box counted
   */
  const [offered, setOffered] = createSignal<CatchOption[]>([]);
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
  /** Whether the new box form is open, and what it will be made with */
  const [making, setMaking] = createSignal(false);
  const [makingWith, setMakingWith] = createSignal<string[]>([]);
  /** What is being dragged, while something is */
  const [dragging, setDragging] = createSignal<string[]>([]);

  const mine = (): boolean => props.viewOnly !== true;

  const [boxes] = createResource(
    () => client() && mine() && ([props.player, game.records()] as const),
    async ([player]): Promise<[string, BoxRecord][]> => listBoxes(player),
  );

  /** The declaring body, so this never waits: no boxes until they are read */
  const made = (): [string, BoxRecord][] => answered(boxes) ?? [];

  /** How many each box holds, and how many squares it spans, by box id or '' for Default */
  const tally = createMemo(() => {
    const counts = new Map<string, number>();
    const spans = new Map<string, number>();

    for (const option of offered()) {
      const key = option.caught.box ?? '';

      counts.set(key, (counts.get(key) ?? 0) + 1);
      if (option.caught.slot != null) {
        spans.set(key, Math.max(spans.get(key) ?? 0, option.caught.slot + 1));
      }
    }
    return { counts, spans };
  });

  const rail = createMemo<RailBox[]>(() => {
    const { counts } = tally();
    const listed: RailBox[] = [
      { id: null, name: DEFAULT_BOX_NAME, tone: DEFAULT_BOX_TONE, count: counts.get('') ?? 0 },
    ];

    for (const [id, box] of made()) {
      listed.push({ id, name: box.name, tone: boxTone(box.colour), count: counts.get(id) ?? 0 });
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
    { value: '', label: current() == null ? 'Sort: Newest' : 'Sort: Squares' },
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

  // Leaving select mode lets go of what was picked. Coming back to a
  // box still lit from last time is a selection nobody made
  createEffect(() => {
    if (!marking()) {
      setPicked([]);
    }
  });

  // Held: the bar under the box asks what was picked a dozen times
  // over, and each of those was a scan of the whole collection
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
    // The bar's own count is what it offered, so it is what is sent:
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
      return filing.length === 0 ? `Made ${name}` : `Made ${name} with ${filing.length} in it`;
    });
  };

  const choose = (box: string | null): void => {
    setLastOpen(box);
    setEverywhere(false);
  };

  /** Picking up one pokemon, or every picked one when it is among them */
  const startDrag = (id: string): void => {
    setDragging(marking() && picked().includes(id) ? picked() : [id]);
    // Over once the pointer lets go, wherever that is: a drop lands
    // before this, so it still knows what was carried
    window.addEventListener(
      'dragend',
      () => {
        setDragging([]);
      },
      { once: true },
    );
  };

  const selecting = (): boolean => marking() && mine();

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
    if (current() == null) {
      return 'No catches yet.';
    }
    return `Nothing in ${nameOf(current())} yet. Drag some onto it, or pick some and move them here.`;
  };

  const heading = (): JSX.Element => (
    <Show
      when={!everywhere()}
      fallback={
        <div class="flex flex-col">
          <h3 class="m-0 text-xl font-black">Every box</h3>
        </div>
      }
    >
      <BoxHeading
        id={current()}
        name={nameOf(current())}
        tone={currentRecord() == null ? DEFAULT_BOX_TONE : boxTone(currentRecord()?.colour ?? 0)}
        colour={currentRecord()?.colour ?? 0}
        count={tally().counts.get(current() ?? '') ?? 0}
        span={tally().spans.get(current() ?? '') ?? 0}
        boxes={rail()}
        busy={busy()}
        onEdit={(name, colour) => {
          const id = current();

          if (id != null) {
            run(editBox(id, name, colour), (done) => (done ? null : 'That name will not do.'));
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
            run(emptyBox(id, to), (done) => (done ? `Moved them all to ${nameOf(to)}` : null));
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
  );

  return (
    <div class="flex w-full flex-col gap-3">
      <div class="flex w-full flex-col gap-4 sm:flex-row sm:items-start">
        <Show when={mine()}>
          <BoxRail
            boxes={rail()}
            current={everywhere() ? undefined : current()}
            onChoose={choose}
            dragging={dragging().length > 0}
            onDrop={(box) => {
              file(dragging(), box);
            }}
            making={making()}
            busy={busy()}
            onMake={make}
            onCancelMake={() => {
              setMaking(false);
              setMakingWith([]);
            }}
          />
        </Show>

        <div class="flex min-w-0 grow flex-col gap-3">
          <Show when={mine()}>{heading()}</Show>
          <CatchPicker
            inline
            player={props.player}
            viewOnly={props.viewOnly}
            box={mine() && !everywhere() ? { box: current() } : null}
            empty={emptyNote()}
            search={query()}
            onSearch={(typed) => {
              setQuery(typed);
            }}
            aside={() => (
              <>
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
                  <Show
                    when={controls().descending}
                    fallback={<ArrowUpIcon class="size-5" aria-hidden="true" />}
                  >
                    <ArrowDownIcon class="size-5" aria-hidden="true" />
                  </Show>
                </Button>
                <Show when={mine() && made().length > 0}>
                  <Button
                    class="shrink-0"
                    tone={everywhere() ? 'primary' : undefined}
                    title="Search every box rather than the one showing"
                    onClick={() => {
                      setEverywhere(!everywhere());
                    }}
                  >
                    All boxes
                  </Button>
                </Show>
                <Show when={mine()}>
                  <Button
                    class="shrink-0"
                    tone={selecting() ? 'primary' : undefined}
                    disabled={busy()}
                    onClick={() => {
                      setMarking(!marking());
                    }}
                  >
                    {selecting() ? 'Done' : 'Select'}
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
            onDragStart={mine() ? startDrag : undefined}
            onDropOn={
              mine() && !everywhere() && current() != null
                ? (slot) => {
                    file(dragging(), current(), slot);
                  }
                : undefined
            }
            {...mode()}
          />

          {/* What was let go today, on a server that gives a day to take it back */}
          <Show when={mine()}>
            <ReleasedList />
          </Show>
        </div>
      </div>

      {/* The dialog's foot: the selection's actions while picking, the way out last */}
      <DialogActions>
        <Show
          when={selecting()}
          fallback={
            <>
              <Show when={mine()}>
                <Button
                  disabled={busy() || making()}
                  onClick={() => {
                    setMakingWith([]);
                    setMaking(true);
                  }}
                >
                  New box
                </Button>
              </Show>
              <Button onClick={props.onClose}>Close</Button>
            </>
          }
        >
          <CatchActions
            chosen={chosen()}
            busy={busy()}
            boxes={rail()}
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
            trailing={<Button onClick={props.onClose}>Close</Button>}
          />
        </Show>
      </DialogActions>
    </div>
  );
}
