import type PaintedVisual from '../moves/__painted';
import { burst, decay, motes, orb, ring, star, swell } from '../moves/__paint';
import { TAU } from '../moves/lit/pieces';
import { aside } from '../moves/lit/shapes';
import { footOf, sizeOf } from './lit/shapes';
import { type Cue, REACH, played } from './shapes';

/**
 * A pokemon changing form: light closing in on the body, a flash as
 * the new shape takes over, and the light thrown back out. The body
 * swaps at the halfway point of the sprite's own morph, which is where
 * the flash peaks
 */

/** The share the new form takes over at */
const SWAP = 0.5;

const MORPH_CUE: Cue = {
  paint: (context, stage, share, paint) => {
    const size = REACH * stage.scale;

    if (share < SWAP) {
      const closing = share / SWAP;

      for (let band = 0; band < 2; band += 1) {
        ring(context, stage.source, size * (2.4 - closing * 1.8 - band * 0.4), {
          ...paint,
          alpha: closing * 0.9,
          width: 2.4 * stage.scale,
        });
      }
    } else {
      const opened = (share - SWAP) / (1 - SWAP);

      ring(context, stage.source, size * (0.6 + opened * 1.8), {
        ...paint,
        alpha: decay(opened),
        width: 3 * stage.scale,
      });
      burst(context, stage.source, size * (0.8 + opened * 1.2), 8, 83, {
        ...paint,
        alpha: decay(opened),
        width: 2.2 * stage.scale,
      });
      motes(context, stage.source, size * 1.6, 8, 89, opened, {
        ...paint,
        alpha: decay(opened),
        width: 2.4 * stage.scale,
      });
    }
    // The flash itself, brightest as the shape swaps
    const flash = swell(share);

    orb(context, stage.source, size * 1.1 * flash, { ...paint, alpha: flash });
    star(context, stage.source, size * 0.9 * flash, share * 2, { ...paint, alpha: flash });
  },
  color: '#f6efff',
  span: 600,
};

export default function morphCue(): PaintedVisual {
  return played(MORPH_CUE, 1, 1, (kit, stage, share, colour, strength) => {
    const size = sizeOf(stage);
    const at = stage.source;
    const flash = swell(share) * strength;

    kit.pool(footOf(stage), size * 1.6, colour, flash * 0.5);
    if (share < SWAP) {
      const closing = share / SWAP;

      for (let band = 0; band < 2; band += 1) {
        kit.ring(at, size * (2.4 - closing * 1.8 - band * 0.4), 0.12, colour, closing * strength);
      }
    } else {
      const opened = (share - SWAP) / (1 - SWAP);
      const fading = decay(opened) * strength;

      kit.ring(at, size * (0.6 + opened * 1.8), 0.1, colour, fading);
      for (let ray = 0; ray < 8; ray += 1) {
        const angle = (ray / 8) * TAU + 0.2;
        const reach = size * (0.8 + opened * 1.4);

        // Out across the picture, so the rays fan round the body
        kit.streak(
          aside(kit, at, Math.cos(angle) * reach, Math.sin(angle) * reach),
          size * 0.5,
          size * 0.08,
          angle,
          colour,
          fading,
        );
      }
    }
    kit.glow(at, size * 1.2, colour, flash, 1);
    kit.star(at, size * 0.9 * swell(share), share * 2, colour, flash);
  });
}
