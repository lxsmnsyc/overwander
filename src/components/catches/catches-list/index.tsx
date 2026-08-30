import { type JSX, Show, createEffect, createSignal } from 'solid-js';
import {
  type BulkOutcome,
  favoriteCatches,
  guardCatches,
  releaseCatches,
} from '../../../auth/caught';
import CatchPicker, { type CatchOption, type CatchPickerProps } from '../catch-picker';
import { useGame } from '../../app/game-context';
import { Button, useToast } from '../../styled';
import CatchActions from './actions';

export interface CatchesListProps {
  player: string;
  /**
   * Whether this is somebody else's box. Catch records are readable by
   * every signed-in player — that is what makes a lot on the block
   * worth bidding on — so the box draws the same either way, and what
   * changes is what opening a square leads to: the whole record, and
   * nothing on it to press
   */
  viewOnly?: boolean;
}

/**
 * The player's pokemon, in boxes.
 *
 * It is the picker, browsing. This was a second copy of the same
 * screen — the same box of squares, the same search over it, the same
 * paging under it, the same three empty states — kept beside the
 * picker's copy and drifting from it. Picking one of your pokemon and
 * looking at one of your pokemon are the same act with different
 * consequences, so it is the same list, and what a press opens is the
 * caller's business.
 *
 * Selecting is that same list again with the picker's `multiple`
 * shape: press to add, press to remove, and a bar under the box for
 * what to do with the lot.
 */
export default function CatchesList(props: CatchesListProps): JSX.Element {
  const game = useGame();
  const toast = useToast();
  const [picked, setPicked] = createSignal<string[]>([]);
  /**
   * Every pokemon the box is offering, so a picked id can be read back
   * as the record behind it: whether it is a favorite, whether it is
   * locked, whether it is fighting somewhere
   */
  const [offered, setOffered] = createSignal<CatchOption[]>([]);
  const [busy, setBusy] = createSignal(false);
  /**
   * Held here rather than inside the picker: browsing and selecting are
   * two different components, so a query left down there would be
   * thrown away every time the mode changed
   */
  const [query, setQuery] = createSignal('');
  /**
   * Whether presses pick pokemon rather than open them. It is the
   * box's own rather than the panel's: what it changes is what a
   * square does, so the button that turns it on stands beside the
   * search rather than in the row of buttons that closes the panel
   */
  const [marking, setMarking] = createSignal(false);

  // Leaving select mode lets go of what was picked. Coming back to a
  // box still lit from last time is a selection nobody made
  createEffect(() => {
    if (!marking()) {
      setPicked([]);
    }
  });

  const ids = (): string[] => picked();

  const chosen = (): CatchOption[] => {
    const wanted = new Set(picked());

    return offered().filter((option) => wanted.has(option.id));
  };

  /**
   * A pokemon in a battle is shown and refused rather than left out: a
   * player looking for one wants to be told where it went. Nothing else
   * is refused at pick time — a favorite and a locked one are both
   * legitimate things to unmark, and only Release steps over them
   */
  const reason = (option: CatchOption): string | null => (option.fighting ? 'in a battle' : null);

  /**
   * What a bulk action came to, said once. The records are re-read
   * either way: a refusal is still worth showing the box again, since
   * the reason for it may be what the box is now out of date about
   */
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
    const going = chosen()
      .filter((option) => !option.fighting)
      .map((option) => option.id);

    settle(releaseCatches(going), (count) => `${count} let go`);
  };

  const selecting = (): boolean => marking() && props.viewOnly !== true;

  /**
   * The half of the picker's props that looking and picking disagree
   * about.
   *
   * Spread into one picker rather than rendered as two of them. The
   * two shapes are the same component with different props, and
   * swapping the component itself tore down the records it had read,
   * the page it was on and the cards standing over it — so pressing
   * Select read as the whole box reloading
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

  return (
    <div class="flex w-full flex-col gap-3">
      <CatchPicker
        inline
        player={props.player}
        viewOnly={props.viewOnly}
        empty={props.viewOnly === true ? 'Nothing caught yet.' : 'No catches yet.'}
        search={query()}
        onSearch={(typed) => {
          setQuery(typed);
        }}
        // Marking a run of them and letting a run of them go, which is
        // the one thing the box is for that opening them one at a time
        // cannot do. Nobody marks somebody else's pokemon
        aside={
          props.viewOnly === true
            ? undefined
            : () => (
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
              )
        }
        // Nothing more asked for while a round trip is in the air
        disabled={busy()}
        // A record changed under it — an evolution, a release, a lot
        // put on the block — and the box reads itself again
        revision={game.records()}
        onOptions={(list) => {
          setOffered(list);
        }}
        {...mode()}
      />

      <Show when={selecting()}>
        <CatchActions
          chosen={chosen()}
          busy={busy()}
          onFavorite={(on) => {
            settle(favoriteCatches(ids(), on), (count) =>
              on ? `${count} favorited` : `${count} unfavorited`,
            );
          }}
          onGuard={(on) => {
            settle(guardCatches(ids(), on), (count) =>
              on ? `${count} locked` : `${count} unlocked`,
            );
          }}
          onRelease={release}
          onClear={() => {
            setPicked([]);
          }}
        />
      </Show>
    </div>
  );
}
