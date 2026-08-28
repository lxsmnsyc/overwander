import { type JSX, Show } from 'solid-js';
import { DEFAULT_CHARSET } from '../../data/overworld/charsets';
import TrainerSprite from '../sprites/TrainerSprite';
import { RowButton } from '../styled';

/**
 * A trainer's character in a round frame, at the size a row draws it.
 * Exported because the rows that keep the name somewhere else draw the
 * same picture: a friend's row, the plate below
 */
export function PlayerFace(props: { sprite?: string | null; size?: number }): JSX.Element {
  const room = (): number => props.size ?? 32;

  return (
    <span
      class="flex shrink-0 items-center justify-center rounded-full border-2 border-tide
        bg-line-soft"
      style={{ width: `${room()}px`, height: `${room()}px` }}
    >
      <TrainerSprite sheet={props.sprite ?? DEFAULT_CHARSET} size={Math.round(room() * 0.82)} />
    </span>
  );
}

export interface PlayerPlateProps {
  name: string;
  /**
   * The overworld character they go about as. Left out, the one the
   * game starts everybody as, so a row is never a gap
   */
  sprite?: string | null;
  /**
   * What pressing the name does — opening the player's profile,
   * usually. Without it the plate is a label: a player's own row is
   * not a way into a read-only copy of their own profile
   */
  onOpen?: () => void;
}

/**
 * A player as a character and a name, for the rooms that list several
 * of them: a raid lobby, a battle's history, its summary.
 *
 * The picture is the one they walk the world in rather than a
 * portrait, so somebody met in a lobby is somebody who could have been
 * met on the road
 */
export default function PlayerPlate(props: PlayerPlateProps): JSX.Element {
  return (
    <span class="flex min-w-0 items-center gap-2">
      <PlayerFace sprite={props.sprite} />
      <Show when={props.onOpen} fallback={<span class="truncate font-semibold">{props.name}</span>}>
        {(open) => (
          <RowButton class="truncate font-semibold" onClick={open()}>
            {props.name}
          </RowButton>
        )}
      </Show>
    </span>
  );
}
