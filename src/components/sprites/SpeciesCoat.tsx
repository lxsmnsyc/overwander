import type { JSX } from 'solid-js';
import type { SpriteDirection } from '../../canvas/sprite-sheet';
import { Species } from '../../data/ids/species';
import { getSpeciesData } from '../../data/species';
import AnimatedSprite from './AnimatedSprite';
import { SpriteAnim } from '../../data/ids/sprite-anims';

/**
 * A pokemon drawn to what the reader has earned of it.
 *
 * Three states, and the dex is where they were settled: a species
 * nobody has met is **not drawn at all** — not even as its own shadow,
 * which would give away the shape somebody is meant to go and find —
 * and Missingno stands in its place; one that has been met but never
 * owned is its own silhouette, which is the half of an entry that
 * sends a player out looking; one that has been owned is drawn in
 * full.
 *
 * It lives here rather than in the dex because the catch sheet asks
 * the same question of an evolution: what a pokemon turns into is
 * something the player may never have seen, and drawing it in full
 * would be the sheet giving away what the dex is keeping.
 */

/**
 * What a reader who cannot see the picture is told: nothing at all
 * about a species nobody has met, the name of one that has been
 * caught, and the name with the reason it is a shadow otherwise
 */
export function describeCoat(met: boolean, revealed: boolean, called: string): string {
  if (!met) {
    return 'A pokemon nobody has met yet';
  }
  return revealed ? called : `${called} — not yet caught`;
}

export interface SpeciesCoatProps {
  species: Species;
  /**
   * Whether the reader has ever met this species
   */
  met: boolean;
  /**
   * Whether they have owned the coat being drawn, which is what
   * decides between the picture and the shadow of it
   */
  revealed: boolean;
  /**
   * Which coat: the ordinary one, or the shiny. A shiny is its own
   * half of an entry — met is not the same as caught is not the same
   * as caught sparkling
   */
  shiny?: boolean;
  /**
   * Whether to draw the female form. Only worth setting where the
   * species has one — see `hasFemaleSheet`
   */
  female?: boolean;
  scale?: number;
  /**
   * Whether to fit the picture to the square it is put in rather than
   * draw it at a multiple of the sheet. What a list of them wants: a
   * sheet is whatever size it was drawn at, so a row of coats sized by
   * their own sheets comes out ragged. **The box has to be square**
   */
  fill?: boolean;
  /** What it should be doing */
  animation?: SpriteAnim;
  /**
   * What it does before it has been met, which is not the same
   * question. A dex entry nobody has found is asleep, since there is
   * nothing to show off; a silhouette standing in a row of pokemon is
   * still standing, since the row is read as one picture
   */
  unmet?: SpriteAnim;
  /**
   * How long one pass of that animation should take, in milliseconds.
   * A dex turning a pokemon on the spot sets it; everything else
   * plays at the speed the sheet was drawn at
   */
  duration?: number;
  direction?: SpriteDirection;
  /**
   * What to call it, if not the species' own name — a caller saying
   * "shiny Pidgey" rather than "Pidgey"
   */
  called?: string;
}

export default function SpeciesCoat(props: SpeciesCoatProps): JSX.Element {
  const named = (): string => props.called ?? getSpeciesData(props.species).name;

  return (
    <AnimatedSprite
      species={props.met ? props.species : Species.Missingno}
      shiny={props.met && props.shiny === true}
      female={props.female === true}
      animation={
        props.met ? (props.animation ?? SpriteAnim.Idle) : (props.unmet ?? SpriteAnim.Sleep)
      }
      // The pace belongs to the animation that was asked for. An
      // unmet coat is doing something else, at somebody else's tempo
      duration={props.met ? props.duration : undefined}
      direction={props.direction ?? 'Down'}
      scale={props.scale}
      fill={props.fill}
      shadow
      // Black by day and white by night: a silhouette is the shape
      // with the colour taken out of it, and "no colour" is a
      // different colour on a page that is paper in one theme and
      // night sky in the other.
      //
      // Missingno is shadowed too. It is a picture of a pokemon that
      // is not there, and drawn in full it reads as a pokemon whose
      // sprite failed to load rather than as an absence
      class={props.revealed ? '' : 'opacity-70 brightness-0 dark:invert'}
      label={describeCoat(props.met, props.revealed, named())}
    />
  );
}
