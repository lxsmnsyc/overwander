import type { Point } from '../../stage';
import {
  type Painted,
  beam,
  between,
  bubble,
  chevrons,
  decay,
  fade,
  hoop,
  lash,
  lighten,
  mix,
  motes,
  noise,
  orb,
  pane,
  petal,
  ring,
  ripple,
  spread,
  star,
  swell,
} from '../__paint';
import { RAINBOW } from './legends';
import type { EffectShape, ShapePainter } from './shapes';
import { REACH, landing, many } from './shapes';

/** Protect: a shell hexagon's size, as a share of the shell's radius */
export const SHELL_CELL = 0.3;

/** Substitute: the share before the field's doll sprite lands, when the dust goes up */
export const DOLL_DROP = 0.3;

/** Splash: how many times it flops */
export const FLOP_HOPS = 3;

/** Swords Dance: how many swords circle it */
export const BLADES = 4;

/** Calm Mind: the share spent gathering before the pulse */
export const SCHEME_GATHER = 0.6;

/** Wish: the share by which its star is back down on it */
export const WISH_LANDS = 0.85;

/** A worker bee's yellow, for Heal Order */
export const BEE = '#f0c040';

/** How high Wish's star is, as a share of its climb: up, held a moment, and back down */
export function wishHeight(share: number): number {
  if (share < 0.4) {
    return 1 - (1 - share / 0.4) ** 2;
  }
  if (share < 0.55) {
    return 1;
  }
  return Math.max(0, 1 - ((share - 0.55) / (WISH_LANDS - 0.55)) ** 2);
}

/** The middles of a shell's hexagons inside `radius`, laid out in axial rows */
export function shellCells(radius: number): [x: number, y: number][] {
  const cell = radius * SHELL_CELL;
  const cells: [x: number, y: number][] = [];

  for (let q = -3; q <= 3; q += 1) {
    for (let r = -4; r <= 4; r += 1) {
      const x = cell * 1.5 * q;
      const y = cell * Math.sqrt(3) * (r + q / 2);

      if (Math.hypot(x, y) <= radius - cell * 0.6) {
        cells.push([x, y]);
      }
    }
  }
  return cells;
}

/** How bright a shell hexagon `out` of the way from the middle is: a flash running outward as it goes up */
export function shellFlash(share: number, out: number): number {
  return Math.max(0, 1 - Math.abs(share * 3 - out) * 3);
}

/** Which way the metronome's arm leans, in radians from upright */
export function wagOf(share: number): number {
  return Math.sin(share * Math.PI * 5) * 0.7;
}

/** A shaft of light coming down onto a point from above, with motes rising in it */
function shaft(
  context: CanvasRenderingContext2D,
  foot: Point,
  size: number,
  share: number,
  seed: number,
  color: string,
  alpha: number,
  scale: number,
): void {
  beam(context, [foot[0], foot[1] - size * 7], foot, Math.min(1, share * 3), size * 1.6, {
    color,
    alpha: alpha * 0.5,
  });
  motes(context, [foot[0], foot[1] - size * 1.4], size * 1.2, 10, seed, share, {
    color: lighten(color, 0.6),
    alpha,
    width: 2 * scale,
  });
}

/** A Z, for a pokemon asleep */
function zed(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  color: string,
  alpha: number,
  scale: number,
): void {
  context.beginPath();
  context.moveTo(x - size, y - size);
  context.lineTo(x + size, y - size);
  context.lineTo(x - size, y + size);
  context.lineTo(x + size, y + size);
  context.strokeStyle = fade(color, alpha);
  context.lineWidth = 2 * scale;
  context.stroke();
}

/** A hexagon's outline round a point, flat along its top */
function hexagon(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  painted: Painted,
): void {
  context.beginPath();
  for (let corner = 0; corner <= 6; corner += 1) {
    const angle = (corner / 6) * Math.PI * 2;

    context[corner === 0 ? 'moveTo' : 'lineTo'](
      x + Math.cos(angle) * size,
      y + Math.sin(angle) * size,
    );
  }
  context.strokeStyle = fade(painted.color, painted.alpha ?? 1);
  context.lineWidth = painted.width ?? 1.5;
  context.stroke();
}

/** A filled ellipse, for a shadow on the ground */
function blob(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  across: number,
  up: number,
  color: string,
  alpha: number,
): void {
  context.beginPath();
  context.ellipse(x, y, Math.max(0.1, across), Math.max(0.1, up), 0, 0, Math.PI * 2);
  context.fillStyle = fade(color, alpha);
  context.fill();
}

/**
 * The shapes that mend, ward or pass something along rather than take
 * anything away
 */
const care = {
  // Health coming back: motes rising into the body
  Mend(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale;

    for (let mote = 0; mote < many(9, weight); mote += 1) {
      const held = (share + noise(seed, mote)) % 1;
      const angle = noise(seed, mote + 20) * Math.PI * 2;
      const x = at[0] + Math.cos(angle) * size * (1 - held) * 1.2;
      const y = at[1] + size * 0.8 - held * size * 1.8;

      orb(context, [x, y], 2.5 * stage.scale, { ...paint, alpha: swell(held) });
    }
    ring(context, at, size * (1.2 - swell(share) * 0.3), {
      ...paint,
      alpha: swell(share) * 0.5,
      width: 2 * stage.scale,
    });
  },

  // Something put up: a wall the caster stands behind
  Ward(context, stage, share, { paint }) {
    const at = landing(stage);
    const size = REACH * stage.scale;

    for (let shell = 0; shell < 3; shell += 1) {
      ring(context, at, size * (1.3 + shell * 0.22) * (0.6 + swell(share) * 0.5), {
        ...paint,
        alpha: swell(share) * (0.8 - shell * 0.2),
        width: 2 * stage.scale,
      });
    }
  },

  // A screen: a pane of coloured glass put up over the pokemon it is
  // for, rather than a shell closing on it. It goes up fast and then
  // stands, because standing there is the whole of what it does
  Screen(context, stage, share, { paint }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const up = Math.min(1, share * 3);
    // Held bright and taken away at the end, so what is read is a
    // wall rather than a flash
    const alpha = share < 0.8 ? 0.55 + up * 0.35 : decay(share) * 4.5;
    const foot: Point = [at[0], at[1] + size * 0.7];
    const height = size * 3.2 * up;

    pane(context, foot, size * 1.8, height, {
      ...paint,
      alpha,
      width: 2.6 * stage.scale,
    });
    // The light running across the face of it, which is what says
    // glass rather than paper
    if (up >= 1) {
      const along = ((share - 0.33) / 0.67) * 2 - 0.5;
      const x = at[0] + (along - 0.5) * size * 3.6;

      beam(context, [x, foot[1]], [x + size * 0.9, foot[1] - height], 1, size * 0.16, {
        ...paint,
        alpha: alpha * 0.5,
      });
    }
  },

  // Water turning about the pokemon rather than a wall in front of
  // it: three hoops on three axes, each passing through the flat at a
  // different moment, which is what makes them read as one turning
  // thing rather than three ringing ones
  Gyro(context, stage, share, { paint }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    // Up quickly and held: what it puts round the pokemon stays there
    const up = Math.min(1, share * 4);
    const alpha = share < 0.85 ? 0.55 + up * 0.4 : decay(share) * 6;

    for (let hoopAt = 0; hoopAt < 3; hoopAt += 1) {
      const spin = share * Math.PI * 2.4 + (hoopAt / 3) * Math.PI;

      hoop(context, at, size * 1.3 * up, Math.abs(Math.cos(spin)), (hoopAt / 3) * Math.PI, {
        ...paint,
        alpha,
        width: 2.6 * stage.scale,
      });
    }
  },

  // What it takes, going home: the point of a drain is where the
  // health ends up, so the motes cross back to the caster
  Drain(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    ring(context, at, size * (1.2 - swell(share) * 0.6), {
      ...paint,
      alpha: decay(share),
      width: 2.5 * stage.scale,
    });
    for (let mote = 0; mote < many(6, weight); mote += 1) {
      const held = (share * 1.3 + noise(seed, mote) * 0.5) % 1;
      const drift = between(at, stage.source, held);

      orb(context, [drift[0], drift[1] - Math.sin(Math.PI * held) * size * 0.4], 3 * stage.scale, {
        ...paint,
        alpha: swell(held) * 0.9,
      });
    }
  },

  // Something about the pokemon itself went up
  // A stat going up, on whoever it went up on
  Boost(context, stage, share, { paint }) {
    const at = landing(stage);
    const size = REACH * stage.scale;

    chevrons(context, at, size, 3, share, {
      ...paint,
      alpha: swell(share) + 0.2,
      width: 2.8 * stage.scale,
    });
  },

  // And going down: the same picture turned over, so a rise and a
  // drop are one thing read two ways rather than two pictures
  Drop(context, stage, share, { paint }) {
    const at = landing(stage);
    const size = REACH * stage.scale;

    chevrons(
      context,
      at,
      size,
      3,
      share,
      { ...paint, alpha: swell(share) + 0.2, width: 2.8 * stage.scale },
      -1,
    );
  },

  // Handed on: what the pokemon was carrying lifts off it rather than
  // going off on it
  Relay(context, stage, share, { paint, seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const lift: Point = [at[0], at[1] - size * 2.4 * swell(share)];

    orb(context, lift, size * 0.32, { ...paint, alpha: 1 - share * 0.4 });
    ring(context, lift, size * (0.5 + share * 0.7), {
      ...paint,
      alpha: decay(share) * 0.8,
      width: 2.4 * stage.scale,
    });
    motes(context, at, size * 1.2, 5, seed, share, {
      ...paint,
      alpha: decay(share) * 0.7,
      width: 2 * stage.scale,
    });
  },

  // A shell of hexagons thrown up round it, a flash running out from the middle as it goes up
  Shell(context, stage, share, { paint }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const up = Math.min(1, share * 4);
    const shown = share < 0.75 ? 1 : decay((share - 0.75) / 0.25);
    const radius = size * 1.5 * (0.7 + up * 0.3);
    const light = lighten(paint.color, 0.4);

    ring(context, at, radius, { color: light, alpha: shown * 0.8, width: 2.4 * stage.scale });
    for (const [x, y] of shellCells(radius)) {
      const flash = shellFlash(share, Math.hypot(x, y) / radius);

      hexagon(context, [at[0] + x, at[1] + y], radius * SHELL_CELL * 0.92, {
        color: mix(light, '#ffffff', flash),
        alpha: shown * (0.35 + flash * 0.65),
        width: 1.4 * stage.scale,
      });
    }
  },

  // The ground under the substitute's own sprite as the field drops it in: its shadow gathering, then dust as it lands
  Doll(context, stage, share, { paint, seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const foot: Point = [at[0], at[1] + size * 0.9];
    const drop = Math.min(1, share / DOLL_DROP);

    blob(
      context,
      foot,
      size * 0.8 * drop,
      size * 0.25 * drop,
      '#140e0a',
      drop * 0.4 * decay(share),
    );
    if (share <= DOLL_DROP) {
      return;
    }
    const settled = (share - DOLL_DROP) / (1 - DOLL_DROP);

    ripple(context, foot, size * (0.6 + settled * 1.2), {
      ...paint,
      alpha: decay(settled),
      width: 2 * stage.scale,
    });
    motes(context, foot, size * 1.2, 6, seed, settled, {
      ...paint,
      alpha: decay(settled) * 0.8,
      width: 2 * stage.scale,
    });
  },

  // Flopping about and nothing happening: a few hops of spray at its feet
  Flop(context, stage, share, { paint, seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const foot: Point = [at[0], at[1] + size * 0.9];

    for (let hop = 0; hop < FLOP_HOPS; hop += 1) {
      const held = share * FLOP_HOPS - hop;

      if (held <= 0 || held >= 1) {
        continue;
      }
      ripple(context, foot, size * (0.4 + held * 1.2), {
        ...paint,
        alpha: decay(held) * 0.8,
        width: 2 * stage.scale,
      });
      motes(context, [foot[0], foot[1] - size * 0.3], size * 0.9, 5, seed + hop, held, {
        ...paint,
        alpha: decay(held),
        width: 2 * stage.scale,
      });
    }
  },

  // A metronome ticking over its head, and whatever it picked going off at the end
  Wag(context, stage, share, { paint, seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const pivot: Point = [at[0], at[1] - size * 1.2];
    const shown = Math.min(1, share * 5) * (share < 0.7 ? 1 : decay((share - 0.7) / 0.3));
    const swing = wagOf(share);
    const tip: Point = [
      pivot[0] + Math.sin(swing) * size * 1.2,
      pivot[1] - Math.cos(swing) * size * 1.2,
    ];

    lash(context, pivot, tip, 0, { ...paint, alpha: shown, width: 3 * stage.scale });
    orb(context, tip, size * 0.25, { ...paint, alpha: shown });
    if (share <= 0.7) {
      return;
    }
    const pick = (share - 0.7) / 0.3;

    for (let spark = 0; spark < 6; spark += 1) {
      const angle = noise(seed, spark) * Math.PI * 2;
      const out = size * (0.4 + pick * 1.4);

      star(
        context,
        [pivot[0] + Math.cos(angle) * out, pivot[1] + Math.sin(angle) * out],
        size * 0.22,
        pick * 4 + spark,
        { color: RAINBOW[spark % RAINBOW.length], alpha: decay(pick) },
      );
    }
  },

  // Bands of light sweeping up the pokemon that is changing, the way a shape is redrawn
  Shimmer(context, stage, share, { paint, seed }) {
    const at = stage.source;
    const size = REACH * stage.scale;
    const shown = swell(share);
    const light = lighten(paint.color, 0.5);

    orb(context, at, size * 1.1, { ...paint, alpha: shown * 0.35 });
    for (let band = 0; band < 4; band += 1) {
      const held = (share * 1.6 + band * 0.25) % 1;
      const y = at[1] + size * 0.9 - held * size * 2;
      const half = size * 0.9 * Math.sin(Math.PI * held);

      lash(context, [at[0] - half, y], [at[0] + half, y], 0, {
        color: light,
        alpha: shown * swell(held),
        width: 2.4 * stage.scale,
      });
    }
    motes(context, at, size * 1.3, 8, seed, share, {
      color: '#ffffff',
      alpha: shown,
      width: 1.8 * stage.scale,
    });
  },

  // Swords circling it, then drawn in and crossed over its head
  Blades(context, stage, share, { paint }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const shown = Math.min(1, share * 4) * (share < 0.75 ? 1 : decay((share - 0.75) / 0.25));
    const closing = Math.max(0, (share - 0.55) / 0.45);

    for (let blade = 0; blade < BLADES; blade += 1) {
      const angle = (blade / BLADES) * Math.PI * 2 + share * Math.PI * 3;
      const round = size * 1.3 * (1 - closing * 0.6);
      const x = at[0] + Math.cos(angle) * round;
      const y = at[1] + Math.sin(angle) * round * 0.35;

      lash(context, [x, y + size * 0.5], [x, y - size * 0.8], 0, {
        color: '#e8eef5',
        alpha: shown,
        width: 3 * stage.scale,
      });
      lash(context, [x - size * 0.2, y + size * 0.3], [x + size * 0.2, y + size * 0.3], 0, {
        ...paint,
        alpha: shown,
        width: 2.4 * stage.scale,
      });
    }
    if (closing <= 0) {
      return;
    }
    star(context, [at[0], at[1] - size * (1.6 + closing * 0.6)], size * (0.6 + closing * 0.6), 0, {
      color: '#ffffff',
      alpha: swell(closing),
    });
    ring(context, at, size * (0.6 + closing * 1.4), {
      ...paint,
      alpha: decay(closing),
      width: 2.4 * stage.scale,
    });
  },

  // Aura winding up round it in two strands
  Dance(context, stage, share, { paint, seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const shown = Math.min(1, share * 4) * (share < 0.7 ? 1 : decay((share - 0.7) / 0.3));
    const risen = Math.min(1, share * 2.5);
    const light = lighten(paint.color, 0.4);

    for (let strand = 0; strand < 2; strand += 1) {
      for (let step = 0; step < 14; step += 1) {
        const along = step / 13;
        const turn = along * Math.PI * 4 + share * Math.PI * 3 + strand * Math.PI;
        const round = size * (1.1 - along * 0.5);

        orb(
          context,
          [
            at[0] + Math.cos(turn) * round,
            at[1] + size * 0.9 - along * size * 3.2 * risen + Math.sin(turn) * round * 0.25,
          ],
          size * 0.16,
          { color: Math.sin(turn) > 0 ? light : paint.color, alpha: shown * 0.9 },
        );
      }
    }
    motes(context, at, size * 1.4, 6, seed, share, {
      color: light,
      alpha: shown,
      width: 2 * stage.scale,
    });
  },

  // A metal sheen running across the body, and a glint where it ends
  Sheen(context, stage, share, { paint }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const shown = Math.min(1, share * 4) * (share < 0.75 ? 1 : decay((share - 0.75) / 0.25));
    const sweep = Math.min(1, share / 0.6);
    const across = (sweep * 2 - 1) * size * 1.2;

    orb(context, at, size * 1.1, { ...paint, alpha: shown * 0.45 });
    lash(
      context,
      [at[0] + across - size * 0.5, at[1] + size * 0.8],
      [at[0] + across + size * 0.5, at[1] - size * 0.8],
      0,
      { color: '#ffffff', alpha: shown * swell(sweep), width: size * 0.25 },
    );
    ring(context, at, size * 1.05, {
      color: lighten(paint.color, 0.6),
      alpha: shown * 0.6,
      width: 2 * stage.scale,
    });
    if (share > 0.6) {
      const glint = swell((share - 0.6) / 0.4);

      star(context, [at[0] + size * 0.7, at[1] - size * 0.6], size * 0.5 * glint, 0, {
        color: '#ffffff',
        alpha: glint,
      });
    }
  },

  // Copies of it sliding out to either side and back
  Mirage(context, stage, share, { paint }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const out = swell(share);

    for (const side of [-1, 1]) {
      for (let copy = 1; copy <= 2; copy += 1) {
        const spot: Point = [at[0] + side * copy * size * 0.9 * out, at[1]];

        orb(context, spot, size * 0.8, { ...paint, alpha: out * (0.35 - copy * 0.1) });
        hoop(context, spot, size, 0.7, Math.PI / 2, {
          color: lighten(paint.color, 0.3),
          alpha: out * (0.7 - copy * 0.2),
          width: 2 * stage.scale,
        });
      }
    }
  },

  // Thought gathering into its head under halos, then a pulse off it
  Scheme(context, stage, share, { paint, seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const head: Point = [at[0], at[1] - size * 0.9];
    const light = lighten(paint.color, 0.5);
    const gather = Math.min(1, share / SCHEME_GATHER);
    const kept = share < 0.8 ? 1 : decay((share - 0.8) / 0.2);

    if (share < SCHEME_GATHER) {
      for (let mote = 0; mote < 10; mote += 1) {
        const held = (share * 1.5 + noise(seed, mote)) % 1;
        const angle = noise(seed, mote + 10) * Math.PI * 2;
        const out = size * 1.6 * (1 - held);

        orb(
          context,
          [head[0] + Math.cos(angle) * out, head[1] + Math.sin(angle) * out],
          2 * stage.scale,
          { color: light, alpha: swell(held) },
        );
      }
    }
    orb(context, head, size * (0.2 + gather * 0.35), {
      color: light,
      alpha: Math.min(1, gather + 0.2) * kept,
    });
    for (let halo = 0; halo < 3; halo += 1) {
      hoop(context, [head[0], head[1] - size * 0.35], size * (0.5 + halo * 0.2), 0.3, 0, {
        ...paint,
        alpha: gather * kept * (0.8 - halo * 0.2),
        width: 2 * stage.scale,
      });
    }
    if (share > SCHEME_GATHER) {
      ring(context, head, size * (0.3 + ((share - SCHEME_GATHER) / (1 - SCHEME_GATHER)) * 1.6), {
        color: light,
        alpha: decay((share - SCHEME_GATHER) / (1 - SCHEME_GATHER)),
        width: 2 * stage.scale,
      });
    }
  },
  // Asleep where it stands: a bubble breathing at its nose and Zs drifting up off it
  Slumber(context, stage, share, { paint }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const shown = Math.min(1, share * 4) * (share < 0.8 ? 1 : decay((share - 0.8) / 0.2));
    const head: Point = [at[0] + size * 0.3, at[1] - size * 0.5];

    bubble(
      context,
      [head[0] + size * 0.3, head[1]],
      size * (0.18 + 0.1 * Math.sin(share * Math.PI * 4)),
      {
        color: lighten(paint.color, 0.3),
        alpha: shown,
        width: 1.6 * stage.scale,
      },
    );
    for (let z = 0; z < 3; z += 1) {
      const held = (share * 1.2 + z / 3) % 1;

      zed(
        context,
        [head[0] + size * (0.4 + held * 0.8), head[1] - size * held * 1.8],
        size * (0.12 + held * 0.1),
        paint.color,
        swell(held) * shown,
        stage.scale,
      );
    }
  },

  // Warm sunlight coming down on it
  Sunbeam(context, stage, share, { paint, seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const shown = Math.min(1, share * 3) * (share < 0.7 ? 1 : decay((share - 0.7) / 0.3));

    shaft(context, [at[0], at[1] + size * 0.9], size, share, seed, paint.color, shown, stage.scale);
    star(context, at, size * (1 + swell(share) * 0.8), share, {
      color: lighten(paint.color, 0.6),
      alpha: swell(share) * 0.8,
    });
  },

  // Cool moonlight coming down on it, glinting
  Moonbeam(context, stage, share, { paint, seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const shown = Math.min(1, share * 3) * (share < 0.7 ? 1 : decay((share - 0.7) / 0.3));

    shaft(context, [at[0], at[1] + size * 0.9], size, share, seed, paint.color, shown, stage.scale);
    for (let glint = 0; glint < 5; glint += 1) {
      star(
        context,
        [
          at[0] + spread(seed, glint + 30) * size * 1.3,
          at[1] + spread(seed, glint + 40) * size * 1.3,
        ],
        size * 0.22,
        0,
        { color: '#ffffff', alpha: swell((share * 2 + noise(seed, glint)) % 1) * shown },
      );
    }
  },

  // Leaves drawn in round it, and the green gathering in them
  Greening(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const shown = Math.min(1, share * 3) * (share < 0.75 ? 1 : decay((share - 0.75) / 0.25));

    orb(context, at, size * (0.6 + share * 0.6), { ...paint, alpha: shown * 0.5 });
    for (let leaf = 0; leaf < many(10, weight); leaf += 1) {
      const held = (share * 1.3 + noise(seed, leaf)) % 1;
      const angle = noise(seed, leaf + 5) * Math.PI * 2 + held * Math.PI * 3;
      const round = size * 1.8 * (1 - held);

      petal(
        context,
        [at[0] + Math.cos(angle) * round, at[1] + Math.sin(angle) * round * 0.4],
        size * 0.2,
        angle * 2,
        { ...paint, alpha: swell(held) * shown },
      );
    }
  },

  // A star rising off it into the sky and coming back down onto it
  Wishing(context, stage, share, { paint }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const shown = share < WISH_LANDS ? 1 : decay((share - WISH_LANDS) / (1 - WISH_LANDS));
    const spot: Point = [at[0], at[1] - size * (0.4 + wishHeight(share) * 5)];
    const was: Point = [at[0], at[1] - size * (0.4 + wishHeight(Math.max(0, share - 0.05)) * 5)];

    lash(context, was, spot, 0, { ...paint, alpha: shown * 0.6, width: 3 * stage.scale });
    orb(context, spot, size * 0.45, { ...paint, alpha: shown });
    star(context, spot, size * 0.55, share * 8, { color: '#ffffff', alpha: shown });
    if (share > WISH_LANDS) {
      ring(context, at, size * (0.4 + ((share - WISH_LANDS) / (1 - WISH_LANDS)) * 1.4), {
        color: lighten(paint.color, 0.3),
        alpha: shown,
        width: 2.4 * stage.scale,
      });
    }
  },

  // Feathers drifting down round it and settling
  Feathers(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale;

    orb(context, at, size * 0.9, { ...paint, alpha: swell(share) * 0.35 });
    for (let one = 0; one < many(8, weight); one += 1) {
      const held = Math.max(0, Math.min(1, share * 1.3 - noise(seed, one) * 0.3));

      if (held <= 0) {
        continue;
      }
      petal(
        context,
        [
          at[0] +
            spread(seed, one + 10) * size * 1.2 +
            Math.sin(held * Math.PI * 3 + one) * size * 0.4,
          at[1] + size * 0.9 - size * 2.6 * (1 - held),
        ],
        size * 0.24,
        Math.sin(held * Math.PI * 2 + one) * 0.8,
        {
          color: lighten(paint.color, 0.2),
          alpha: Math.min(1, held * 5) * (held < 0.8 ? 1 : decay((held - 0.8) / 0.2)),
        },
      );
    }
  },

  // A swarm of bees buzzing round it and settling in
  Swarm(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const shown = Math.min(1, share * 4) * (share < 0.75 ? 1 : decay((share - 0.75) / 0.25));

    orb(context, at, size * 0.9, { ...paint, alpha: swell(share) * 0.3 });
    for (let bee = 0; bee < many(10, weight); bee += 1) {
      const angle =
        noise(seed, bee) * Math.PI * 2 + share * Math.PI * 2 * (1.5 + noise(seed, bee + 5));
      const round = size * 1.4 * (1 - share * 0.5);

      orb(
        context,
        [
          at[0] + Math.cos(angle) * round,
          at[1] + Math.sin(angle) * round * 0.35 + Math.sin(share * Math.PI * 6 + bee) * size * 0.4,
        ],
        size * 0.1,
        { color: BEE, alpha: shown },
      );
    }
  },
} satisfies Partial<Record<EffectShape, ShapePainter>>;

export default care;
