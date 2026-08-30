import { type JSX, Show, createSignal } from 'solid-js';
import { getCatchCandy } from '../../../auth/candy';
import { isFavorite, isGuarded } from '../../../auth/caught-record';
import { getFamilyName, getSpeciesData } from '../../../data/species';
import type { CatchOption } from '../catch-picker';
import { Button, Meta, Row } from '../../styled';

/**
 * What to do with a handful of pokemon at once.
 *
 * The bar under the box, drawn only while something is picked. It is
 * three buttons rather than six: whether a press marks or unmarks is
 * read off what is picked, since a player who has selected six
 * favorites means to unfavorite them.
 */

export interface CatchActionsProps {
  chosen: CatchOption[];
  onFavorite: (on: boolean) => void;
  onGuard: (on: boolean) => void;
  onRelease: () => void;
  onClear: () => void;
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
  return [...counts].map(([why, count]) => `${count} ${why}`).join(', ');
}

/**
 * What letting this lot go pays, by family. A single total would not
 * say which pile grows, and which pile grows is most of the reason to
 * do it
 */
function candyLine(going: CatchOption[]): string {
  const piles = new Map<string, number>();

  for (const option of going) {
    const { family } = getSpeciesData(option.caught.species);
    const name = getFamilyName(family);

    piles.set(name, (piles.get(name) ?? 0) + getCatchCandy(option.caught.species));
  }
  return [...piles].map(([name, count]) => `${count} ${name} candy`).join(', ');
}

export default function CatchActions(props: CatchActionsProps): JSX.Element {
  /** Whether Release has been pressed once. There is no undoing it */
  const [releasing, setReleasing] = createSignal(false);

  const count = (): number => props.chosen.length;
  /** Marking is off only when every one of them already carries the mark */
  const favoriting = (): boolean => !props.chosen.every((option) => isFavorite(option.caught));
  const guarding = (): boolean => !props.chosen.every((option) => isGuarded(option.caught));
  const going = (): CatchOption[] => props.chosen.filter((option) => heldBack(option) == null);

  const release = (): void => {
    if (!releasing()) {
      setReleasing(true);
      return;
    }
    setReleasing(false);
    props.onRelease();
  };

  return (
    <div class="flex flex-col items-center gap-1">
      <Row class="justify-center">
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
          tone="danger"
          disabled={props.busy === true || going().length === 0}
          onClick={release}
        >
          {releasing() ? `Let ${going().length} go?` : `Release ${going().length}`}
        </Button>
        <Show when={releasing()}>
          <Button
            onClick={() => {
              setReleasing(false);
            }}
          >
            Keep them
          </Button>
        </Show>
        <Show when={!releasing()}>
          <Button disabled={count() === 0} onClick={props.onClear}>
            Clear
          </Button>
        </Show>
      </Row>

      {/* What the price is, before the decision rather than after it */}
      <Show when={releasing() && going().length > 0}>
        <Meta>{candyLine(going())}</Meta>
      </Show>

      {/* Which of the picked ones Release will step over, and why. The
          other two buttons take them all, so this is about Release
          alone */}
      <Show when={tally(props.chosen) !== ''}>
        <Meta>
          {count() - going().length} of these cannot be released: {tally(props.chosen)}
        </Meta>
      </Show>
    </div>
  );
}
