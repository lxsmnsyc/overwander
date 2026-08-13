import type { JSX } from 'solid-js';

/**
 * Where a picture will go.
 *
 * Nothing in the game is drawn as an icon yet, and the room for it is
 * taken now rather than later: a menu that grows a column of icons the
 * day they are drawn moves every label on it, and a player who had
 * learned where a thing was has to learn it again. It is dashed so it
 * reads as a space kept rather than as something that failed to load.
 */
export interface IconSlotProps {
  /**
   * How big, as a Tailwind size. The menu's keys carry a large one and
   * a button in a line of text carries a small one
   */
  size?: string;
  class?: string;
}

export default function IconSlot(props: IconSlotProps): JSX.Element {
  return (
    <span
      aria-hidden="true"
      class={`shrink-0 rounded-md border border-dashed border-line bg-line-soft ${
        props.size ?? 'size-7'
      } ${props.class ?? ''}`}
    />
  );
}
