import { type JSX, Show, createEffect, createSignal, onCleanup } from 'solid-js';
import type OWCharSprite from '../../canvas/ow-char-sprite';
import loadOWChar from '../../canvas/ow-char-sprites';

/**
 * A person from the overworld, standing still and facing the reader.
 *
 * The charset the board walks them about in, drawn as a CSS background
 * the way every interface sprite is. It is how a trainer is shown
 * anywhere a face used to be: a lobby row, a battle's history, the
 * profile itself.
 */

export interface TrainerSpriteProps {
  /** The sheet, under `sprites/overworld` */
  sheet: string;
  /** The height of the box in pixels; the width follows the frame */
  size?: number;
  /**
   * What a screen reader is told. Left out where the name is already
   * written beside the picture
   */
  label?: string;
  class?: string;
}

const DEFAULT_SIZE = 96;

export default function TrainerSprite(props: TrainerSpriteProps): JSX.Element {
  const [sprite, setSprite] = createSignal<OWCharSprite | null>(null);

  createEffect(() => {
    const sheet = props.sheet;
    let live = true;

    onCleanup(() => {
      live = false;
    });
    setSprite(null);
    loadOWChar(sheet)
      .then((loaded) => {
        if (live && loaded != null) {
          // Said rather than assumed: row 0 is only the down-facing
          // pose when the sheet happens to list Down first
          loaded.facing = 'Down';
          setSprite(loaded);
        }
      })
      .catch(() => {
        // The room stays held and empty, like a charset still arriving
      });
  });

  const size = (): number => props.size ?? DEFAULT_SIZE;

  /**
   * The standing Down frame as a background: the sheet scrolled to the
   * cell, everything scaled so the frame's height fills the box
   */
  const style = (): JSX.CSSProperties | null => {
    const person = sprite();
    const rect = person?.frameRect ?? null;

    if (person == null || rect == null || rect.width <= 0 || rect.height <= 0) {
      return null;
    }

    const scale = size() / rect.height;

    return {
      width: `${rect.width * scale}px`,
      height: `${rect.height * scale}px`,
      'background-image': `url(${person.source})`,
      'background-position': `${-rect.x * scale}px ${-rect.y * scale}px`,
      'background-size': `${person.data.width * scale}px ${person.data.height * scale}px`,
      'background-repeat': 'no-repeat',
      'image-rendering': 'pixelated',
    };
  };

  return (
    <span
      role="img"
      aria-label={props.label ?? ''}
      aria-hidden={props.label == null || props.label === '' ? true : undefined}
      class={`flex items-end justify-center ${props.class ?? ''}`}
      style={{ height: `${size()}px` }}
    >
      <Show when={style()}>{(drawn) => <span style={drawn()} />}</Show>
    </span>
  );
}
