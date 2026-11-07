import type { JSX } from 'solid-js';
import type { Species } from '../../../../data/ids/species';
import { SpriteAnim } from '../../../../data/ids/sprite-anims';
import AnimatedSprite from '../../../sprites/AnimatedSprite';

/** A pokemon's picture fitted to a square, greyed once it has fainted */
export default function UnitArt(props: {
  species: Species;
  shiny: boolean;
  female: boolean;
  fainted: boolean;
  /** The square's side in pixels */
  size?: number;
}): JSX.Element {
  const size = (): number => props.size ?? 32;

  return (
    <span class="relative shrink-0" style={{ width: `${size()}px`, height: `${size()}px` }}>
      <span
        class={`absolute inset-0.5 flex items-center justify-center ${
          props.fainted ? 'opacity-50 grayscale' : ''
        }`}
      >
        <AnimatedSprite
          species={props.species}
          shiny={props.shiny}
          female={props.female}
          animation={SpriteAnim.Idle}
          direction="DownLeft"
          label=""
          fill
        />
      </span>
    </span>
  );
}
