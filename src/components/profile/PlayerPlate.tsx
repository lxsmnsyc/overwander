import { type JSX, Show } from 'solid-js';
import { RowButton } from '../styled';

export interface PlayerPlateProps {
  name: string;
  avatar?: string | null;
  /**
   * What pressing the name does — opening the player's profile,
   * usually. Without it the plate is a label: a player's own row is
   * not a way into a read-only copy of their own profile
   */
  onOpen?: () => void;
}

/**
 * A player as a face and a name, for the rooms that list several of
 * them: a raid lobby, a battle's history, its summary. The avatar is
 * drawn either way — a missing picture becomes the name's first
 * letter, so every row keeps the same shape
 */
export default function PlayerPlate(props: PlayerPlateProps): JSX.Element {
  return (
    <span class="flex min-w-0 items-center gap-2">
      <Show
        when={props.avatar}
        fallback={
          <span
            class="flex size-8 shrink-0 items-center justify-center rounded-full border
              border-dashed border-line bg-line-soft text-sm font-semibold text-muted"
            aria-hidden="true"
          >
            {props.name.slice(0, 1).toUpperCase()}
          </span>
        }
      >
        {(avatar) => (
          <img
            src={avatar()}
            alt=""
            width={32}
            height={32}
            class="size-8 shrink-0 rounded-full border-2 border-tide object-cover"
          />
        )}
      </Show>
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
