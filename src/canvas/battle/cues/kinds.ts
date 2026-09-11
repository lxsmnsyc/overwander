import {
  burst,
  chevrons,
  decay,
  motes,
  noise,
  orb,
  ring,
  shards,
  star,
  swell,
} from '../moves/__paint';
import { type Cue, REACH, over, rising } from './shapes';

/** The shapes an ability or an item fires in */
/**
 * What an ability looks like when it fires.
 *
 * An ability is the quietest thing in a fight — no cast, no flight,
 * and the only sign of one is a number that came out different — so
 * **every** trigger draws something. The default is a ring and a
 * sparkle over the head, which says "that was the ability" without
 * claiming to say which; the kinds below are for the ones where the
 * shape can say more than that
 */
export type CueKind =
  | 'Pulse'
  | 'Rise'
  | 'Mend'
  | 'Menace'
  | 'Spark'
  | 'Ail'
  | 'Rush'
  | 'Notice'
  | 'Berry'
  | 'Guard'
  | 'Barb';

export const CUE_KINDS: Record<CueKind, Cue> = {
  Pulse: {
    paint: (context, stage, share, paint) => {
      const at = over(stage);

      ring(context, at, REACH * stage.scale * (0.4 + share * 1.1), {
        ...paint,
        alpha: decay(share),
        width: 2 * stage.scale,
      });
      star(context, at, REACH * stage.scale * 0.3 * swell(share), share * 3, { ...paint });
    },
    color: '#e6ecf5',
    span: 480,
  },
  Rise: {
    paint: (context, stage, share, paint) => {
      chevrons(context, stage.source, REACH * stage.scale, 3, share, {
        ...paint,
        alpha: swell(share),
        width: 2.4 * stage.scale,
      });
    },
    color: '#f0d264',
    span: 560,
  },
  Mend: {
    paint: (context, stage, share, paint) => {
      for (let mote = 0; mote < 6; mote += 1) {
        const held = (share + noise(41, mote)) % 1;
        const drift = (noise(41, mote + 9) - 0.5) * REACH * stage.scale * 2;

        orb(
          context,
          [stage.source[0] + drift, stage.source[1] - held * REACH * stage.scale * 2],
          2.4 * stage.scale,
          { ...paint, alpha: swell(held) },
        );
      }
    },
    color: '#4cc46a',
    span: 640,
  },
  Menace: {
    paint: (context, stage, share, paint) => {
      ring(context, stage.source, REACH * stage.scale * (1.6 - share * 1.1), {
        ...paint,
        alpha: swell(share),
        width: 3 * stage.scale,
      });
    },
    color: '#624d4e',
    span: 520,
  },
  Spark: {
    paint: (context, stage, share, paint) => {
      burst(context, stage.source, REACH * stage.scale * (0.5 + share), 6, 53, {
        ...paint,
        alpha: decay(share),
        width: 2 * stage.scale,
      });
    },
    color: '#fac000',
    span: 420,
  },
  Ail: { paint: rising(6, 59), color: '#9141cb', span: 560 },
  Rush: {
    paint: (context, stage, share, paint) => {
      const size = REACH * stage.scale;

      context.strokeStyle = '';
      for (let streak = 0; streak < 3; streak += 1) {
        const held = (share * 1.5 + streak * 0.3) % 1;

        ring(
          context,
          [stage.source[0] + (held - 0.5) * size * 3, stage.source[1] - streak * size * 0.5],
          size * 0.14,
          { ...paint, alpha: swell(held) * 0.9, width: 2 * stage.scale },
        );
      }
    },
    color: '#81b9ef',
    span: 420,
  },
  Notice: {
    paint: (context, stage, share, paint) => {
      const at = over(stage);

      star(context, at, REACH * stage.scale * 0.5 * (0.5 + swell(share)), 0, {
        ...paint,
        alpha: swell(share) + 0.2,
      });
    },
    color: '#fac000',
    span: 480,
  },
  // Something eaten: it is held over the head, and then it is not
  Berry: {
    paint: (context, stage, share, paint) => {
      const at = over(stage);
      const size = REACH * stage.scale;

      if (share < 0.45) {
        orb(context, at, size * 0.42 * (0.6 + share), { ...paint, alpha: 1 });
      } else {
        motes(context, at, size * 1.3, 6, 67, share, {
          ...paint,
          alpha: decay(share) * 1.6,
          width: 2.2 * stage.scale,
        });
      }
    },
    color: '#e0566a',
    span: 520,
  },
  // Something held that took the blow: a shell flashing where it was
  // hit and going again
  Guard: {
    paint: (context, stage, share, paint) => {
      for (let shell = 0; shell < 2; shell += 1) {
        ring(context, stage.source, REACH * stage.scale * (1.1 + shell * 0.3), {
          ...paint,
          alpha: swell(Math.max(0, share * 1.4 - shell * 0.25)),
          width: 2.6 * stage.scale,
        });
      }
    },
    color: '#c8d2e0',
    span: 460,
  },
  // Something held that hurt whoever touched it
  Barb: {
    paint: (context, stage, share, paint) => {
      shards(context, stage.source, REACH * stage.scale * 1.2, 5, 71, share, {
        ...paint,
        alpha: decay(share),
        width: 2.6 * stage.scale,
      });
    },
    color: '#8a5a4a',
    span: 440,
  },
};
