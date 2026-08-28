import type { JSX } from 'solid-js';
import type Npc from '../../data/overworld/npc';
import { npcSheet } from '../../data/overworld/npc';
import TrainerSprite from '../sprites/TrainerSprite';

/**
 * One of the wandering people, standing still and facing the player.
 *
 * All this adds to [`TrainerSprite`](../sprites/TrainerSprite.tsx) is
 * which sheet a role turned up in this window, which is the one thing
 * about a wanderer the drawing cannot work out for itself
 */

export interface NpcSpriteProps {
  npc: Npc;
  /**
   * The style the wanderer turned up in this window. Left out, the
   * role's first style
   */
  sheet?: string;
  /** The height of the box, in pixels; the width follows the frame */
  size?: number;
  /**
   * What a screen reader is told. Empty where the dialog already names
   * the person beside the picture
   */
  label?: string;
  class?: string;
}

export default function NpcSprite(props: NpcSpriteProps): JSX.Element {
  return (
    <TrainerSprite
      sheet={props.sheet ?? npcSheet(props.npc)}
      size={props.size}
      label={props.label}
      class={props.class}
    />
  );
}
