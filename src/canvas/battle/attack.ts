import type { Moves } from '../../data/ids/moves';
import { TYPE_COLORS, type Types } from '../../data/constants/types';
import PaintedVisual, { type Painter } from './moves/__painted';
import type { Point, Stage } from './stage';
import { burst, decay, lighten, mix, ring, star, swell } from './moves/__paint';

/**
 * What one blow looks like where it lands.
 *
 * A move's own picture says what the move **is**; this says what it
 * did to this pokemon, and it is a different question with a different
 * answer every time. A move that strikes five times lands five of
 * these; one that is resisted lands a dull one; one that crits lands a
 * loud one. None of that is visible in the move's picture, because the
 * move is the same move whoever it hits.
 *
 * It is drawn small and quick on purpose. The blow is the second thing
 * on the field after the move, and a hit mark that outshouts the move
 * it belongs to reads as two moves.
 */

/**
 * How big a mark is, in canvas pixels before the field's scale.
 *
 * Small, and smaller than it first was: a raid is forty-eight pokemon
 * trading blows, and a mark the size of a pokemon turned the field
 * into a wall of white rings
 */
const REACH = 11;

/** How long it takes, in milliseconds. */
const SPAN = 260;

/** Whatever a blow arrived with. */
export interface Landed {
  move: Moves;
  type: Types;
  /** How much of the target's health it took, from 0 to 1. */
  share: number;
  /**
   * The type multiplier it resolved at: 0 for an immunity, a half or a
   * quarter for a resistance, two or four for a weakness
   */
  effectiveness: number;
  critical: boolean;
  /** Whether it landed at all. A refused blow is still worth a mark. */
  struck: boolean;
}

function landing(stage: Stage): Point {
  return stage.targets[0] ?? stage.source;
}

/** The grey a blow is drained toward when the type shrugged it off. */
const DULL = '#8a91a0';

/**
 * What colour the blow reads as.
 *
 * It is the move's own type, so a fight of mixed types reads as one:
 * a weakness is that colour lit, a resistance the same colour drained
 * toward grey, and only a blow that never landed has no type left to
 * show
 */
function tone(landed: Landed): string {
  if (!landed.struck || landed.effectiveness === 0) {
    return '#7c8496';
  }
  const color = TYPE_COLORS[landed.type];

  if (landed.effectiveness > 1) {
    return lighten(color, 0.35);
  }
  return landed.effectiveness < 1 ? mix(color, DULL, 0.6) : color;
}

export default function attackMarkVisual(landed: Landed): PaintedVisual {
  const color = tone(landed);
  // A blow that took a third of somebody is drawn about twice the size
  // of one that grazed them, and a refused one is barely there
  const size =
    landed.struck && landed.effectiveness > 0 ? 0.7 + Math.min(1, landed.share * 3) * 0.9 : 0.5;
  const painter: Painter = (context, stage, share) => {
    const at = landing(stage);
    const reach = REACH * stage.scale * size;

    ring(context, at, reach * (0.4 + share * 1.3), {
      color,
      alpha: decay(share),
      width: (landed.critical ? 3 : 2) * stage.scale,
    });
    burst(context, at, reach * (0.5 + share * 0.7), landed.critical ? 8 : 5, landed.move + 1, {
      color,
      alpha: decay(share),
      width: 2 * stage.scale,
    });
    // A critical says so: the one thing about a blow that is not a
    // matter of degree
    if (landed.critical) {
      star(context, [at[0], at[1] - reach], reach * 0.32 * swell(share), share * 2, {
        color: '#f0d264',
        alpha: swell(share) + 0.2,
      });
    }
  };

  return new PaintedVisual(SPAN, painter);
}
