import { For, type JSX, Show, createSignal } from 'solid-js';
import { getReleaseCandy } from '../../../auth/candy';
import { isFavorite, isGuarded } from '../../../auth/caught-record';
import type Families from '../../../data/ids/families';
import { getFamilyName, getSpeciesData } from '../../../data/species';
import CandySprite from '../../sprites/CandySprite';
import type { CatchOption } from '../catch-picker';
import { BoxIcon } from '../../icons';
import { Badge, Button, Menu, type MenuAction, Meta } from '../../styled';
import type { RailBox } from './rail';

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
function heldBack(option: CatchOption): string | null {
  if (option.fighting) {
    return 'in a battle';
  }
  if (isFavorite(option.caught)) {
    return 'a favorite';
  }
  return isGuarded(option.caught) ? 'locked' : null;
}

/** The same, counted, so the line under the buttons can say how many of each */
function tally(chosen: CatchOption[]): string {
  const counts = new Map<string, number>();

  for (const option of chosen) {
    const why = heldBack(option);

    if (why != null) {
      counts.set(why, (counts.get(why) ?? 0) + 1);
    }
  }
  const parts: string[] = [];

  for (const [why, count] of counts) {
    parts.push(`${count} ${why}`);
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
        note: already ? 'here now' : String(box.count),
        disabled: already,
        onSelect: () => {
          props.onMove(box.id);
        },
      });
    }
    actions.push({
      label: `＋ New box with these ${count()}`,
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
        <span class="text-base font-black text-leaf-dark tabular-nums">{count()} selected</span>
        <div class="flex flex-wrap items-center justify-end gap-2">
          <Show when={count() > 0 && props.busy !== true}>
            <Menu
              label={`Move ${count()} to`}
              tone="accent"
              sheet
              heading={`Move ${count()} to`}
              face={
                <span class="inline-flex items-center gap-1.5">
                  <BoxIcon class="size-4" aria-hidden="true" />
                  Move {count()} to
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
            {favoriting() ? 'Favorite' : 'Unfavorite'} {count()}
          </Button>
          <Button
            disabled={props.busy === true || count() === 0}
            onClick={() => {
              props.onGuard(guarding());
            }}
          >
            {guarding() ? 'Lock' : 'Unlock'} {count()}
          </Button>
          {/* Two presses, the way the sheet asks: the second says what
              it is doing and what it pays */}
          <Button
            tone={releasing() ? 'danger' : 'caution'}
            disabled={props.busy === true || going().length === 0}
            onClick={release}
          >
            {releasing() ? `Let ${going().length} go?` : `Release ${going().length}`}
          </Button>
          <Show
            when={releasing()}
            fallback={
              <Button tone="quiet" disabled={count() === 0} onClick={props.onClear}>
                Clear
              </Button>
            }
          >
            <Button
              tone="quiet"
              onClick={() => {
                setReleasing(false);
              }}
            >
              Keep them
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
                {paid} {getFamilyName(family)}
              </Badge>
            )}
          </For>
          {/* The half a player forgets: a released pokemon hands back
              whatever it was carrying, and there is no undoing either */}
          <Show when={holding(going()) > 0}>
            <Meta>
              {holding(going())} held item{holding(going()) === 1 ? '' : 's'} come
              {holding(going()) === 1 ? 's' : ''} back to the bag.
            </Meta>
          </Show>
        </div>
      </Show>

      {/* Which of the picked ones Release will step over, and why. The
          other buttons take them all, so this is about Release alone */}
      <Show when={tally(props.chosen) !== ''}>
        <Meta class="text-right">
          {count() - going().length} of these cannot be released: {tally(props.chosen)}
        </Meta>
      </Show>
    </div>
  );
}
