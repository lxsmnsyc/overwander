import { Types } from '../../../../data/constants/types';
import type { Point } from '../../stage';
import {
  between,
  bolt,
  bubble,
  burst,
  decay,
  edge,
  fade,
  hoop,
  lash,
  lighten,
  mix,
  motes,
  noise,
  orb,
  petal,
  ring,
  ripple,
  sickle,
  spread,
  star,
  swell,
} from '../__paint';
import { BEE } from './care';
import type { EffectShape, ShapePainter } from './shapes';
import { REACH, landing, many } from './shapes';

/** Defog's fog, and the smoke Memento's user goes up in */
export const FOG = '#c8ccd4';
export const SMOKE = '#1a1220';

/** Defend Order: the rows and columns of its wall of bees */
export const HIVE_ROWS = 3;
export const HIVE_COLUMNS = 5;

/** Stockpile: the share at which each of its orbs lands on the stack */
export const STACK_LANDS = [0.15, 0.37, 0.59];

/** Up by `1 / rise` of the span, held, and gone between `until` and the end */
export function showing(share: number, rise: number, until: number): number {
  return (
    Math.min(1, share * rise) * (share < until ? 1 : Math.max(0, 1 - (share - until) / (1 - until)))
  );
}

/** Eased out: quick at first and settling, clamped to 0 and 1 */
export function settle(share: number): number {
  return 1 - (1 - Math.max(0, Math.min(1, share))) ** 2;
}

/** A filled round, for smoke, fog and cotton */
function blob(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  radius: number,
  color: string,
  alpha: number,
): void {
  context.beginPath();
  context.ellipse(x, y, Math.max(0.1, radius), Math.max(0.1, radius), 0, 0, Math.PI * 2);
  context.fillStyle = fade(color, alpha);
  context.fill();
}

/** The stat moves drawn as what the pokemon does, rather than as the stat's arrows */
const stats = {
  // Speed lines streaking past it and afterimages left behind
  Haste(context, stage, share, { paint, seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const shown = showing(share, 4, 0.75);

    for (let copy = 1; copy <= 2; copy += 1) {
      orb(context, [at[0] - copy * size * 0.6 * swell(share), at[1]], size * 0.8, {
        ...paint,
        alpha: shown * (0.4 - copy * 0.12),
      });
    }
    for (let line = 0; line < 6; line += 1) {
      const held = (share * 2.5 + noise(seed, line)) % 1;
      const x = at[0] - size * 1.8 + held * size * 3.6;
      const y = at[1] + spread(seed, line + 10) * size * 1.1;

      edge(context, [x - size * 0.9, y], [x, y], size * 0.05, 0, {
        color: lighten(paint.color, 0.5),
        alpha: shown * swell(held),
      });
    }
  },

  // Rubbed to a shine: a ring working round over it and glints popping one after another
  Polish(context, stage, share, { paint, seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const shown = showing(share, 4, 0.8);
    const turn = share * Math.PI * 6;

    orb(context, at, size * 1.1, { ...paint, alpha: shown * 0.35 });
    ring(
      context,
      [at[0] + Math.cos(turn) * size * 0.5, at[1] + Math.sin(turn) * size * 0.3],
      size * 0.35,
      { color: lighten(paint.color, 0.5), alpha: shown * 0.8, width: 2.4 * stage.scale },
    );
    for (let glint = 0; glint < 5; glint += 1) {
      const held = share * 1.6 - glint * 0.2;

      if (held <= 0 || held >= 1) {
        continue;
      }
      star(
        context,
        [at[0] + spread(seed, glint) * size, at[1] + spread(seed, glint + 10) * size],
        size * 0.45 * swell(held),
        glint,
        { color: '#ffffff', alpha: swell(held) },
      );
    }
  },

  // Two hard throbs: the body swelling with power and spokes snapping out
  Flex(context, stage, share, { paint, seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;

    for (let beat = 0; beat < 2; beat += 1) {
      const held = share * 2 - beat;

      if (held <= 0 || held >= 1) {
        continue;
      }
      const pump = swell(Math.min(1, held * 2));

      orb(context, at, size * (0.9 + pump * 0.5), { ...paint, alpha: pump * 0.55 });
      burst(context, at, size * (1.2 + held * 0.8), 8, seed + beat, {
        color: lighten(paint.color, 0.4),
        alpha: decay(held),
        width: 3 * stage.scale,
      });
      ring(context, at, size * (1 + held * 0.9), {
        color: lighten(paint.color, 0.3),
        alpha: decay(held) * 0.8,
        width: 2.6 * stage.scale,
      });
    }
  },

  // Rings rising off its head as it calls out
  Howl(context, stage, share, { paint }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const head: Point = [at[0], at[1] - size * 0.8];

    orb(context, head, size * 0.5, { ...paint, alpha: swell(share) * 0.5 });
    for (let wave = 0; wave < 4; wave += 1) {
      const held = share * 1.6 - wave * 0.2;

      if (held <= 0 || held >= 1) {
        continue;
      }
      hoop(context, [head[0], head[1] - size * held * 2], size * (0.4 + held * 0.8), 0.35, 0, {
        color: lighten(paint.color, 0.3),
        alpha: decay(held),
        width: 2.4 * stage.scale,
      });
    }
  },

  // Empty thought bubbles floating up off its head: whatever was there is forgotten
  Blank(context, stage, share, { paint }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const kept = showing(share, 20, 0.8);

    for (let one = 0; one < 3; one += 1) {
      const held = Math.max(0, Math.min(1, share * 1.5 - one * 0.2));

      if (held <= 0) {
        continue;
      }
      bubble(
        context,
        [at[0] + size * (0.3 + one * 0.35), at[1] - size * (0.8 + one * 0.55 + held * 0.3)],
        size * (0.12 + one * 0.14) * Math.min(1, held * 3),
        { color: lighten(paint.color, 0.3), alpha: kept, width: 1.8 * stage.scale },
      );
    }
  },

  // Stars circling it on a tilted orbit, over a glow of night sky
  Cosmos(context, stage, share, { paint, seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const shown = showing(share, 4, 0.8);

    blob(context, at, size * 1.3, mix(paint.color, '#140c30', 0.7), shown * 0.4);
    for (let one = 0; one < 7; one += 1) {
      const angle = (one / 7) * Math.PI * 2 + share * Math.PI * 2;

      star(
        context,
        [at[0] + Math.cos(angle) * size * 1.4, at[1] + Math.sin(angle) * size * 0.45],
        size * 0.22,
        share * 4 + one,
        { ...paint, alpha: shown * (0.6 + 0.4 * Math.sin(share * 10 + one)) },
      );
    }
    for (let glint = 0; glint < 4; glint += 1) {
      star(
        context,
        [at[0] + spread(seed, glint) * size, at[1] + spread(seed, glint + 10) * size],
        size * 0.15,
        0,
        { color: '#ffffff', alpha: swell((share * 2 + noise(seed, glint)) % 1) * shown },
      );
    }
  },

  // Bees flying in and lining up into a wall in front of it
  Hive(context, stage, share, { seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const kept = showing(share, 20, 0.8);

    for (let row = 0; row < HIVE_ROWS; row += 1) {
      for (let column = 0; column < HIVE_COLUMNS; column += 1) {
        const bee = row * HIVE_COLUMNS + column;
        const flying = share * 1.8 - noise(seed, bee) * 0.5;

        if (flying <= 0) {
          continue;
        }
        const spot: Point = [
          at[0] + (column - (HIVE_COLUMNS - 1) / 2) * size * 0.4,
          at[1] + (row - (HIVE_ROWS - 1) / 2) * size * 0.45 + size * 0.2,
        ];
        const from: Point = [
          spot[0] + spread(seed, bee + 20) * size * 3,
          spot[1] + spread(seed, bee + 40) * size * 2,
        ];
        const [x, y] = between(from, spot, settle(flying));

        orb(context, [x + Math.sin(share * 40 + bee) * size * 0.04, y], size * 0.12, {
          color: BEE,
          alpha: kept,
        });
      }
    }
  },

  // Electricity crackling in over the body as it stores up charge
  Crackle(context, stage, share, { paint, seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const shown = showing(share, 4, 0.8);
    const flick = Math.floor(share * 16);

    orb(context, at, size * (0.4 + share * 0.5), { ...paint, alpha: shown * 0.7 });
    for (let arc = 0; arc < 3; arc += 1) {
      const angle = noise(seed + flick, arc) * Math.PI * 2;

      bolt(
        context,
        [at[0] + Math.cos(angle) * size * 1.4, at[1] + Math.sin(angle) * size * 1.4],
        at,
        seed + flick * 7 + arc,
        { ...paint, alpha: shown * (flick % 3 === 2 ? 0.5 : 1), width: 2 * stage.scale },
      );
    }
  },

  // A light glowing at its tail, pulsing, with fireflies drawn round it
  Lantern(context, stage, share, { paint, seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const shown = showing(share, 4, 0.8);
    const lamp: Point = [at[0] - size * 0.7, at[1] + size * 0.3];
    const pulse = 0.75 + Math.sin(share * Math.PI * 6) * 0.25;

    orb(context, lamp, size * (0.4 + swell(share) * 0.6) * pulse, { ...paint, alpha: shown });
    burst(context, lamp, size * 1.4 * pulse, 10, seed, {
      ...paint,
      alpha: shown * 0.6,
      width: 2 * stage.scale,
    });
    for (let fly = 0; fly < 6; fly += 1) {
      const angle = noise(seed, fly) * Math.PI * 2 + share * Math.PI * 3;

      orb(
        context,
        [lamp[0] + Math.cos(angle) * size * 1.2, lamp[1] + Math.sin(angle) * size * 0.6],
        size * 0.1,
        {
          color: lighten(paint.color, 0.5),
          alpha: shown * swell((share * 2 + noise(seed, fly + 10)) % 1),
        },
      );
    }
  },

  // Orbs dropping onto a stack over it one at a time, then taken in
  Stack(context, stage, share, { paint }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const sink = Math.max(0, (share - 0.8) / 0.2);

    for (const [one, lands] of STACK_LANDS.entries()) {
      const fall = Math.min(1, (share - lands + 0.12) / 0.12);

      if (fall <= 0) {
        continue;
      }
      const spot: Point = [
        at[0],
        at[1] - size * (1 + one * 0.55) * (1 - sink) - size * 1.2 * (1 - fall) ** 2,
      ];
      const since = (share - lands) / 0.2;

      orb(context, spot, size * 0.32, { ...paint, alpha: decay(sink) });
      if (since > 0 && since < 1) {
        ring(context, spot, size * (0.3 + since * 0.6), {
          color: lighten(paint.color, 0.4),
          alpha: decay(since),
          width: 2 * stage.scale,
        });
      }
    }
  },

  // A sprout pushing up out of the ground in front of it and opening two leaves
  Sprout(context, stage, share, { paint, seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const kept = showing(share, 20, 0.8);
    const foot: Point = [at[0], at[1] + size * 0.9];
    const grow = settle(share * 2.5);
    const top: Point = [foot[0], foot[1] - size * 1.8 * grow];
    const open = settle((share - 0.35) * 3);

    orb(context, at, size * (0.6 + share * 0.5), { ...paint, alpha: swell(share) * 0.4 });
    lash(context, foot, top, size * 0.25 * grow, {
      color: mix(paint.color, '#2c6a2c', 0.4),
      alpha: kept,
      width: 3 * stage.scale,
    });
    if (open > 0) {
      for (const side of [-1, 1]) {
        petal(
          context,
          [top[0] + side * size * 0.28 * open, top[1] + size * 0.05],
          size * 0.3 * open,
          side * 1.1,
          {
            ...paint,
            alpha: kept,
          },
        );
      }
    }
    motes(context, at, size * 1.2, 6, seed, share, {
      color: lighten(paint.color, 0.5),
      alpha: swell(share),
      width: 2 * stage.scale,
    });
  },

  // A shell closing round it from both sides, and a glint as it hardens
  Curl(context, stage, share, { paint }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const kept = showing(share, 20, 0.8);
    const close = settle(share / 0.4);

    for (const side of [-1, 1]) {
      sickle(
        context,
        at,
        size * 1.2,
        Math.PI / 2,
        Math.PI / 2 - side * Math.PI * close,
        size * 0.45,
        { ...paint, alpha: kept * 0.85 },
      );
    }
    ring(context, at, size * 1.2, {
      color: lighten(paint.color, 0.5),
      alpha: kept * close * 0.6,
      width: 2 * stage.scale,
    });
    if (share > 0.4) {
      const glint = swell((share - 0.4) / 0.5);

      star(context, [at[0], at[1] - size * 1.2], size * 0.6 * glint, 0, {
        color: '#ffffff',
        alpha: glint,
      });
    }
  },

  // Jagged arcs grating out toward it, with metal sparks for a steel sound
  Screech(context, stage, share, { paint, seed, weight, type }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const angle = Math.atan2(at[1] - stage.source[1], at[0] - stage.source[0]);
    const light = lighten(paint.color, 0.4);

    for (let pulse = 0; pulse < 3; pulse += 1) {
      const held = (share * 1.6 + pulse * 0.33) % 1;
      const front = between(stage.source, at, held * 0.9);
      const radius = size * (0.5 + held * 1.4);

      context.beginPath();
      for (let step = 0; step <= 12; step += 1) {
        const turn = angle + (step / 12 - 0.5) * 1.8;
        // Every other point out and in, which is what makes the arc grate rather than roll
        const out = radius + (step % 2 === 0 ? 1 : -1) * size * 0.15;

        context[step === 0 ? 'moveTo' : 'lineTo'](
          front[0] - Math.cos(angle) * radius + Math.cos(turn) * out,
          front[1] - Math.sin(angle) * radius + Math.sin(turn) * out,
        );
      }
      context.strokeStyle = fade(light, decay(held) * 0.9);
      context.lineWidth = 2.4 * stage.scale;
      context.stroke();
    }
    burst(context, at, size * (0.8 + swell(share) * 0.6), 10, seed + Math.floor(share * 12), {
      color: light,
      alpha: swell(share) * 0.8,
      width: 2 * stage.scale,
    });
    if (type === Types.Steel) {
      burst(context, at, size * 1.4, 6, seed + Math.floor(share * 16) * 3, {
        color: '#fff2c0',
        alpha: swell(share),
        width: 1.6 * stage.scale,
      });
    }
  },

  // Two feathers brushing quickly at its sides
  Tickle(context, stage, share, { paint }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const kept = showing(share, 5, 0.8);
    const wiggle = Math.sin(share * Math.PI * 8);

    for (const side of [-1, 1]) {
      const spot: Point = [
        at[0] + side * size * (0.9 + wiggle * 0.2),
        at[1] + size * 0.1 * Math.cos(share * Math.PI * 8),
      ];

      petal(context, spot, size * 0.4, side * (0.6 + wiggle * 0.4), { ...paint, alpha: kept });
      lash(
        context,
        [spot[0] + side * size * 0.35, spot[1] - size * 0.4],
        [spot[0] + side * size * 0.55, spot[1] - size * 0.1],
        size * 0.1,
        {
          color: lighten(paint.color, 0.3),
          alpha: kept * Math.abs(wiggle),
          width: 1.6 * stage.scale,
        },
      );
    }
  },

  // Cotton puffs drifting down onto it and sticking
  Cotton(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const kept = showing(share, 20, 0.8);

    for (let one = 0; one < many(8, weight); one += 1) {
      const drifting = share * 1.4 - noise(seed, one) * 0.4;

      if (drifting <= 0) {
        continue;
      }
      const held = settle(drifting);
      const x =
        at[0] +
        spread(seed, one + 10) * size * 0.8 +
        (spread(seed, one + 30) + Math.sin(held * 6 + one) * 0.15) * size * (1 - held);
      const y = at[1] + spread(seed, one + 20) * size * 0.6 - size * 2.5 * (1 - held);

      for (let tuft = 0; tuft < 3; tuft += 1) {
        const turn = (tuft / 3) * Math.PI * 2 + one;

        blob(
          context,
          [x + Math.cos(turn) * size * 0.12, y + Math.sin(turn) * size * 0.1],
          size * 0.16,
          paint.color,
          kept * 0.9,
        );
      }
    }
  },

  // Strands of silk shot at it, then wound round it
  Silk(context, stage, share, { paint, seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const kept = showing(share, 20, 0.8);
    const shoot = Math.min(1, share * 2.5);
    const wrap = Math.min(1, Math.max(0, (share - 0.35) / 0.35));

    for (let strand = 0; strand < 3; strand += 1) {
      const end: Point = [
        at[0] + spread(seed, strand) * size * 0.6,
        at[1] + spread(seed, strand + 10) * size * 0.6,
      ];

      lash(
        context,
        stage.source,
        between(stage.source, end, shoot),
        size * 0.3 * spread(seed, strand + 20),
        {
          ...paint,
          alpha: 0.9 * Math.max(0, 1 - Math.max(0, share - 0.5) * 3),
          width: 1.6 * stage.scale,
        },
      );
    }
    for (let loop = 0; loop < 3; loop += 1) {
      if (wrap <= loop / 3) {
        continue;
      }
      hoop(
        context,
        [at[0], at[1] + (loop - 1) * size * 0.45],
        size * (1.1 - wrap * 0.2),
        0.3,
        -0.25 + loop * 0.25,
        { ...paint, alpha: kept * Math.min(1, (wrap - loop / 3) * 3), width: 2 * stage.scale },
      );
    }
  },

  // Tears falling from its eyes and splashing at its feet
  Tears(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const kept = showing(share, 5, 0.8);
    const splash = (share * 2) % 1;

    for (let drop = 0; drop < many(6, weight); drop += 1) {
      const side = drop % 2 === 0 ? -1 : 1;
      const held = (share * 2 + noise(seed, drop)) % 1;

      petal(
        context,
        [at[0] + side * size * (0.3 + held * 0.15), at[1] - size * 0.5 + held * size * 1.4],
        size * 0.13,
        0,
        {
          ...paint,
          alpha: kept * Math.min(1, held * 5) * (held < 0.8 ? 1 : decay((held - 0.8) / 0.2)),
        },
      );
    }
    ripple(context, [at[0], at[1] + size * 0.9], size * (0.6 + splash * 0.8), {
      ...paint,
      alpha: kept * decay(splash) * 0.7,
      width: 2 * stage.scale,
    });
  },

  // The pokemon that used it going up in dark smoke, and the dark settling on the one it cursed
  Memento(context, stage, share, { paint, seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const kept = showing(share, 20, 0.8);
    const dark = mix(paint.color, SMOKE, 0.6);

    for (let puff = 0; puff < 8; puff += 1) {
      const held = (share * 1.2 + noise(seed, puff)) % 1;

      blob(
        context,
        [
          stage.source[0] + spread(seed, puff + 10) * size * 0.8,
          stage.source[1] + size * 0.6 - held * size * 2.4,
        ],
        size * (0.25 + held * 0.4),
        dark,
        swell(held) * kept * 0.7,
      );
    }
    blob(context, at, size * (1.4 - swell(share) * 0.4), dark, swell(share) * 0.45);
    ring(context, at, size * (1.9 - share * 1.1), {
      color: lighten(paint.color, 0.3),
      alpha: swell(share) * 0.7,
      width: 2.2 * stage.scale,
    });
  },

  // Fog over it blown apart to either side by a gust
  Clear(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale;

    for (let puff = 0; puff < many(8, weight); puff += 1) {
      const side = spread(seed, puff) < 0 ? -1 : 1;
      const out = settle(share * 1.3) * size * 2.2 * (0.5 + noise(seed, puff + 5));

      blob(
        context,
        [
          at[0] + spread(seed, puff) * size * 0.8 + side * out,
          at[1] + spread(seed, puff + 10) * size * 0.6,
        ],
        size * (0.45 + noise(seed, puff + 20) * 0.2),
        FOG,
        decay(share) * 0.6,
      );
    }
    for (let gust = 0; gust < 3; gust += 1) {
      const held = (share * 2 + gust / 3) % 1;
      const x = at[0] - size * 2 + held * size * 4;
      const y = at[1] + (gust - 1) * size * 0.6;

      edge(context, [x - size * 1.2, y], [x, y], size * 0.06, size * 0.1, {
        color: lighten(paint.color, 0.4),
        alpha: swell(held) * 0.8,
      });
    }
  },
} satisfies Partial<Record<EffectShape, ShapePainter>>;

export default stats;
