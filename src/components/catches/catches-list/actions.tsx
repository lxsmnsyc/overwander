import { For, type JSX, Show, createSignal } from 'solid-js';
import { getReleaseCandy } from '../../../auth/candy';
import { isFavorite, isGuarded } from '../../../model/caught-record';
import type Families from '../../../data/ids/families';
import { getFamilyName, getSpeciesData } from '../../../data/species';
import CandySprite from '../../sprites/CandySprite';
import type { CatchOption } from '../catch-picker';
import { BoxIcon } from '../../icons';
import { Badge, Button, Menu, type MenuAction, Meta } from '../../styled';
import type { RailBox } from './rail';
import { m } from '../../../i18n/paraglide/messages.js';

/**
 * What to do with a handful of pokemon at once.
 *
 * The green strip under the heading while picking: how many are
 * picked, then where to move them, the two marks, letting them go and
 * clearing the lot. Whether a press marks or unmarks is read off what
 * is picked, since a player who has selected six favorites means to
 * unfavorite them.
 */

export interface CatchActionsProps {
  chosen: CatchOption[];
  onFavorite: (on: boolean) => void;
  onGuard: (on: boolean) => void;
  onRelease: () => void;
  onClear: () => void;
  /** Every box, to file the picked ones into */
  boxes: RailBox[];
  onMove: (box: string | null) => void;
  /** Make a box and file the picked ones into it */
  onMoveToNew: () => void;
  /** While a round trip is in the air, so nothing is asked for twice */
  busy?: boolean;
}

/**
 * Why one of the picked ones will not be let go. A favorite and a
 * locked one are both marks the player put on the record to stop
 * exactly this; a pokemon in a battle is held while the fight runs
 */
type HeldBack = 'battle' | 'favorite' | 'locked';

/** How many are held back for each reason, said with the count */
const HELD_BACK: Record<HeldBack, (inputs: { count: number }) => string> = {
  battle: m.catch_held_battle,
  favorite: m.catch_held_favorite,
  locked: m.catch_held_locked,
};

function heldBack(option: CatchOption): HeldBack | null {
  if (option.fighting) {
    return 'battle';
  }
  if (isFavorite(option.caught)) {
    return 'favorite';
  }
  return isGuarded(option.caught) ? 'locked' : null;
}

/** The same, counted, so the line under the buttons can say how many of each */
function tally(chosen: CatchOption[]): string {
  const counts = new Map<HeldBack, number>();

  for (const option of chosen) {
    const why = heldBack(option);

    if (why != null) {
      counts.set(why, (counts.get(why) ?? 0) + 1);
    }
  }
  const parts: string[] = [];

  for (const [why, count] of counts) {
    parts.push(HELD_BACK[why]({ count }));
  }
  return parts.join(', ');
}

/**
 * What letting this lot go pays, by family. A single total would not
 * say which pile grows, and which pile grows is most of the reason to
 * do it
 */
function candyPiles(going: CatchOption[]): [Families, number][] {
  const piles = new Map<Families, number>();

  for (const option of going) {
    const { family } = getSpeciesData(option.caught.species);

    piles.set(family, (piles.get(family) ?? 0) + getReleaseCandy(option.caught));
  }
  return [...piles];
}

/** How many of them are carrying something that would come back */
function holding(going: CatchOption[]): number {
  let total = 0;

  for (const option of going) {
    total += option.caught.items.length;
  }
  return total;
}

export default function CatchActions(props: CatchActionsProps): JSX.Element {
  /** Whether Release has been pressed once. There is no undoing it */
  const [releasing, setReleasing] = createSignal(false);

  const count = (): number => props.chosen.length;
  /** Marking is off only when every one of them already carries the mark */
  const favoriting = (): boolean => {
    for (const option of props.chosen) {
      if (!isFavorite(option.caught)) {
        return true;
      }
    }
    return false;
  };
  const guarding = (): boolean => {
    for (const option of props.chosen) {
      if (!isGuarded(option.caught)) {
        return true;
      }
    }
    return false;
  };
  const going = (): CatchOption[] => {
    const kept: CatchOption[] = [];

    for (const option of props.chosen) {
      if (heldBack(option) == null) {
        kept.push(option);
      }
    }
    return kept;
  };

  /**
   * Where they can go. A box every one of them is already in is still
   * listed, so the list reads the same whatever is picked, but it does
   * nothing
   */
  const destinations = (): MenuAction[] => {
    const actions: MenuAction[] = [];

    for (const box of props.boxes) {
      let already = props.chosen.length > 0;

      for (const option of props.chosen) {
        if (option.caught.box !== box.id) {
          already = false;
        }
      }
      actions.push({
        label: box.name,
        swatch: box.tone,
        note: already ? m.catch_move_here_now() : String(box.count),
        disabled: already,
        onSelect: () => {
          props.onMove(box.id);
        },
      });
    }
    actions.push({
      label: m.catch_move_new_box({ count: count() }),
      separated: true,
      onSelect: props.onMoveToNew,
    });
    return actions;
  };

  const release = (): void => {
    if (!releasing()) {
      setReleasing(true);
      return;
    }
    setReleasing(false);
    props.onRelease();
  };

  return (
    <div
      class="flex w-full min-w-0 flex-col gap-1.5 rounded-xl border-2 border-leaf/40 bg-leaf-soft
        px-3 py-2"
    >
      {/* Wraps on a phone rather than scrolling an action off the end */}
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-base font-black text-leaf-dark tabular-nums">
          {m.catch_selected({ count: count() })}
        </span>
        <div class="flex flex-wrap items-center justify-end gap-2">
          <Show when={count() > 0 && props.busy !== true}>
            <Menu
              label={m.catch_move_to({ count: count() })}
              tone="accent"
              sheet
              heading={m.catch_move_to({ count: count() })}
              face={
                <span class="inline-flex items-center gap-1.5">
                  <BoxIcon class="size-4" aria-hidden="true" />
                  {m.catch_move_to({ count: count() })}
                </span>
              }
              actions={destinations()}
            />
          </Show>
          <Button
            disabled={props.busy === true || count() === 0}
            onClick={() => {
              props.onFavorite(favoriting());
            }}
          >
            {favoriting()
              ? m.catch_favorite_count({ count: count() })
              : m.catch_unfavorite_count({ count: count() })}
          </Button>
          <Button
            disabled={props.busy === true || count() === 0}
            onClick={() => {
              props.onGuard(guarding());
            }}
          >
            {guarding()
              ? m.catch_lock_count({ count: count() })
              : m.catch_unlock_count({ count: count() })}
          </Button>
          {/* Two presses, the way the sheet asks: the second says what
              it is doing and what it pays */}
          <Button
            tone={releasing() ? 'danger' : 'caution'}
            disabled={props.busy === true || going().length === 0}
            onClick={release}
          >
            {releasing()
              ? m.catch_release_ask({ count: going().length })
              : m.catch_release_count({ count: going().length })}
          </Button>
          <Show
            when={releasing()}
            fallback={
              <Button tone="quiet" disabled={count() === 0} onClick={props.onClear}>
                {m.catch_clear()}
              </Button>
            }
          >
            <Button
              tone="quiet"
              onClick={() => {
                setReleasing(false);
              }}
            >
              {m.catch_keep_them()}
            </Button>
          </Show>
        </div>
      </div>

      {/* The price, read before the second press */}
      <Show when={releasing() && going().length > 0}>
        <div class="flex flex-wrap items-center justify-end gap-2">
          <For each={candyPiles(going())}>
            {([family, paid]) => (
              <Badge tone="gold">
                <CandySprite family={family} label="" />
                {m.catch_candy_pile({ count: paid, family: getFamilyName(family) })}
              </Badge>
            )}
          </For>
          {/* The half a player forgets: a released pokemon hands back
              whatever it was carrying, and there is no undoing either */}
          <Show when={holding(going()) > 0}>
            <Meta>{m.catch_release_items({ count: holding(going()) })}</Meta>
          </Show>
        </div>
      </Show>

      {/* Which of the picked ones Release will step over, and why. The
          other buttons take them all, so this is about Release alone */}
      <Show when={tally(props.chosen) !== ''}>
        <Meta class="text-right">
          {m.catch_release_held({ count: count() - going().length, reasons: tally(props.chosen) })}
        </Meta>
      </Show>
    </div>
  );
}
