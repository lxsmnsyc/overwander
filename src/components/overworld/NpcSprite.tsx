import { type JSX, Show, createEffect, createSignal, onCleanup } from 'solid-js';
import type OWCharSprite from '../../canvas/ow-char-sprite';
import loadOWChar from '../../canvas/ow-char-sprites';
import type Npc from '../../data/overworld/npc';
import { npcSheet } from '../../data/overworld/npc';

/**
 * One of the wandering people, standing still and facing the player:
 * the overworld's own charset, drawn as a CSS background the way every
 * interface sprite is. The dialog that names them draws no letter in a
 * circle once the sheet is in hand
 */

export interface NpcSpriteProps {
  npc: Npc;
  /** The height of the box, in pixels; the width follows the frame */
  size?: number;
  /**
   * What a screen reader is told. Empty where the dialog already names
   * the person beside the picture
   */
  label?: string;
  class?: string;
}

const DEFAULT_SIZE = 96;

export default function NpcSprite(props: NpcSpriteProps): JSX.Element {
  const [sprite, setSprite] = createSignal<OWCharSprite | null>(null);

  createEffect(() => {
    const sheet = npcSheet(props.npc);
    let live = true;

    onCleanup(() => {
      live = false;
    });
    loadOWChar(sheet)
      .then((loaded) => {
        if (live) {
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
