import type { Point } from '../../stage';
import {
  beam,
  between,
  bolt,
  burst,
  decay,
  edge,
  fade,
  late,
  lighten,
  mix,
  motes,
  noise,
  orb,
  pane,
  petal,
  ring,
  ripple,
  shards,
  spiral,
  spread,
  star,
  swell,
} from '../__paint';
import type { EffectShape, ShapePainter } from './shapes';
import { REACH, landing, many } from './shapes';

/** Flower Trick: the share the bouquet has landed on it by */
export const BOUQUET_LANDS = 0.35;

/** Meowscarada's pink and green, and the confetti the trick goes off in */
export const MEOWSCARADA_PINK = '#ff5c9a';
export const MEOWSCARADA_GREEN = '#2f9e4f';
export const CONFETTI = ['#ffd84a', '#5ad2ff', '#ff8ad0', '#b07aff', '#7aff8a'];

/** Torch Song: the share the song has reached it by */
export const TORCH_REACHES = 0.4;

/** Skeledirge's fire: its orange, its gold and the red at the root of the flames */
export const SKELEDIRGE_ORANGE = '#ff7a2a';
export const SKELEDIRGE_GOLD = '#ffd24a';
export const SKELEDIRGE_RED = '#d8302a';

/** Aqua Step: how many steps the dance takes, and the share the last lands by */
export const AQUA_STEPS = 5;
export const AQUA_DANCED = 0.6;

/** Quaquaval's water and the foam off each step */
export const AQUA_BLUE = '#3aa8ff';
export const AQUA_FOAM = '#d8f4ff';

/** Raging Bull: the share the horns have driven in by */
export const BULL_LANDS = 0.35;

/** Tauros's horns, its hide, and the glass of the screen it breaks */
export const BULL_HORN = '#efe2c4';
export const BULL_HIDE = '#5a3622';
export const BULL_GLASS = '#bfe8ff';

/** Make It Rain: how many coins fall, and the share the last has landed by */
export const COINS = 12;
export const COINS_LANDED = 0.6;

/** Gholdengo's gold, the shadow on its edge and the glint off it */
export const COIN_GOLD = '#f2c33a';
export const COIN_DARK = '#9a6a14';
export const COIN_GLINT = '#fff6c8';

/** Hyper Drill: the share the drill's point has reached it by */
export const DRILL_LANDS = 0.3;

/** The drill's steel and Dunsparce's yellow and blue banded round it */
export const DRILL_STEEL = '#aab6c4';
export const DRILL_YELLOW = '#f0d050';
export const DRILL_BLUE = '#3a64c8';
export const DRILL_SHIELD = '#7ae8ff';

/** Twin Beam: the shares the two beams leave at, and how long each takes to cross */
export const TWIN_FIRST = 0.12;
export const TWIN_SECOND = 0.4;
export const TWIN_CROSS = 0.18;

/** The head's beam and the tail's */
export const TWIN_PINK = '#ff5aa8';
export const TWIN_GOLD = '#ffc84a';

/** Rage Fist: the share the fist lands at */
export const RAGE_LANDS = 0.35;

/** The fist's grey and the ghost flame of rage round it */
export const RAGE_FIST = '#d8d0e0';
export const RAGE_PURPLE = '#8a3ad8';
export const RAGE_RED = '#e8344a';

/** Armor Cannon: how many shells are shot, the share the first leaves at, and how far apart */
export const ARMOR_SHELLS = 3;
export const ARMOR_FIRES = 0.12;
export const ARMOR_APART = 0.15;
export const ARMOR_FLIGHT = 0.18;

/** Armarouge's red and gold armour, and the fire it is shot in */
export const ARMOR_RED = '#d8302a';
export const ARMOR_GOLD = '#f2c040';
export const ARMOR_FIRE = '#ff9a2a';

/** Bitter Blade: the share the second blade has crossed by, and the drain begins */
export const BITTER_CROSSED = 0.35;

/** Ceruledge's ghost flame: the violet, the blue and the dark of the blades */
export const BITTER_VIOLET = '#8a5aff';
export const BITTER_BLUE = '#4ac0ff';
export const BITTER_DARK = '#2a1a48';

/** Double Shock: the shares the two arcs strike at, and when the sparks go out */
export const SHOCK_FIRST = 0.2;
export const SHOCK_SECOND = 0.42;
export const SHOCK_SPENT = 0.6;

/** Pawmot's yellow, its orange, and the white of the arcs */
export const SHOCK_YELLOW = '#ffe04a';
export const SHOCK_ORANGE = '#ff9a2a';
export const SHOCK_WHITE = '#fffbe0';

/** Gigaton Hammer: the share the hammer has come down by */
export const GIGATON_LANDS = 0.4;

/** Tinkaton's pink and the hammer's steel */
export const GIGATON_PINK = '#ff7ab8';
export const GIGATON_STEEL = '#8a94a8';
export const GIGATON_DARK = '#4a5262';

/** Blood Moon: the share the moon has risen by */
export const MOON_RISEN = 0.4;

/** The moon's crimson, its light, and the dark of its seas */
export const MOON_RED = '#c8202a';
export const MOON_LIGHT = '#ff6a5a';
export const MOON_DARK = '#5a0a18';

/** Matcha Gotcha: the share the whisking ends at, and the share the spray has landed by */
export const MATCHA_WHISKED = 0.25;
export const MATCHA_LANDS = 0.5;

/** The tea's green, its froth, and the steam off it */
export const MATCHA_GREEN = '#6aa82a';
export const MATCHA_FROTH = '#d8f0a8';
export const MATCHA_STEAM = '#d8ecd0';

/** A point on a curve from one point to another, lifted by `height` at its middle */
function lofted(from: Point, to: Point, share: number, height: number): Point {
  const [x, y] = between(from, to, share);

  return [x, y - Math.sin(Math.PI * share) * height];
}

/** A flower: five petals round a gold eye */
function flower(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  turn: number,
  color: string,
  alpha: number,
): void {
  for (let leaf = 0; leaf < 5; leaf += 1) {
    const angle = turn + (leaf / 5) * Math.PI * 2;

    petal(
      context,
      [x + Math.cos(angle) * size * 0.55, y + Math.sin(angle) * size * 0.55],
      size * 0.55,
      angle + Math.PI / 2,
      { color, alpha },
    );
  }
  orb(context, [x, y], size * 0.4, { color: '#ffd84a', alpha });
}

/** A music note: a filled head, a stem and a flag */
function note(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  color: string,
  alpha: number,
): void {
  context.fillStyle = fade(color, alpha);
  context.beginPath();
  context.ellipse(x, y, size * 0.5, size * 0.36, -0.4, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = fade(color, alpha);
  context.lineWidth = Math.max(1, size * 0.18);
  context.beginPath();
  context.moveTo(x + size * 0.42, y);
  context.lineTo(x + size * 0.42, y - size * 1.5);
  context.quadraticCurveTo(x + size * 1.1, y - size * 1.1, x + size * 0.9, y - size * 0.6);
  context.stroke();
}

/** A tongue of flame standing up off a point */
function flame(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  height: number,
  lean: number,
  color: string,
  alpha: number,
): void {
  edge(context, [x, y], [x + lean, y - height], height * 0.28, lean * 0.3, { color, alpha });
}

/** A coin seen turning: a gold oval with a dark rim, narrowed as it spins */
function coin(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  spin: number,
  alpha: number,
): void {
  const wide = Math.max(size * 0.15, Math.abs(Math.cos(spin)) * size);

  context.beginPath();
  context.ellipse(x, y, wide, size, 0, 0, Math.PI * 2);
  context.fillStyle = fade(COIN_GOLD, alpha);
  context.fill();
  context.strokeStyle = fade(COIN_DARK, alpha);
  context.lineWidth = Math.max(1, size * 0.22);
  context.stroke();
}

/** A hexagon outline round a point */
function hexagon(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  radius: number,
  color: string,
  alpha: number,
  width: number,
): void {
  context.beginPath();
  for (let corner = 0; corner <= 6; corner += 1) {
    const angle = Math.PI / 6 + (corner / 6) * Math.PI * 2;

    context[corner === 0 ? 'moveTo' : 'lineTo'](
      x + Math.cos(angle) * radius,
      y + Math.sin(angle) * radius,
    );
  }
  context.fillStyle = fade(color, alpha * 0.2);
  context.fill();
  context.strokeStyle = fade(color, alpha);
  context.lineWidth = width;
  context.stroke();
}

/** A fist seen from the front: a block with four knuckles across its top */
function fist(context: CanvasRenderingContext2D, [x, y]: Point, size: number, alpha: number): void {
  context.fillStyle = fade(RAGE_FIST, alpha);
  context.strokeStyle = fade('#3a2a4a', alpha);
  context.lineWidth = Math.max(1, size * 0.1);
  context.beginPath();
  context.rect(x - size * 0.8, y - size * 0.3, size * 1.6, size * 1.1);
  context.fill();
  context.stroke();
  for (let knuckle = 0; knuckle < 4; knuckle += 1) {
    context.beginPath();
    context.ellipse(
      x - size * 0.6 + knuckle * size * 0.4,
      y - size * 0.35,
      size * 0.22,
      size * 0.26,
      0,
      0,
      Math.PI * 2,
    );
    context.fill();
    context.stroke();
  }
}

/** The vein mark of anger: four short curves round a point, bowed inward */
function anger(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  alpha: number,
): void {
  context.strokeStyle = fade(RAGE_RED, alpha);
  context.lineWidth = Math.max(1.5, size * 0.28);
  context.lineCap = 'round';
  for (let corner = 0; corner < 4; corner += 1) {
    const angle = Math.PI / 4 + (corner / 4) * Math.PI * 2;
    const cx = x + Math.cos(angle) * size;
    const cy = y + Math.sin(angle) * size;

    context.beginPath();
    context.arc(cx, cy, size * 0.6, angle + Math.PI * 0.6, angle + Math.PI * 1.4);
    context.stroke();
  }
  context.lineCap = 'butt';
}

/** A plate of armour: a diamond with a gold rim */
function plate(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  turn: number,
  alpha: number,
): void {
  context.save();
  context.translate(x, y);
  context.rotate(turn);
  context.beginPath();
  context.moveTo(0, -size);
  context.lineTo(size * 0.7, 0);
  context.lineTo(0, size * 0.8);
  context.lineTo(-size * 0.7, 0);
  context.closePath();
  context.fillStyle = fade(ARMOR_RED, alpha);
  context.fill();
  context.strokeStyle = fade(ARMOR_GOLD, alpha);
  context.lineWidth = Math.max(1, size * 0.2);
  context.stroke();
  context.restore();
}

const paldeaLines = {
  // A bouquet tossed up and over onto it, then going off as a trick bomb
  // in a burst of petals and confetti
  Bouquet(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    if (share < BOUQUET_LANDS) {
      const run = share / BOUQUET_LANDS;
      const head = lofted(stage.source, at, run, size * 4);
      const turn = run * 5;

      // The stems, bound below the flowers
      for (let stem = -1; stem <= 1; stem += 1) {
        const tip: Point = [
          head[0] + Math.cos(turn + stem * 0.6 - Math.PI / 2) * size * 1.1,
          head[1] + Math.sin(turn + stem * 0.6 - Math.PI / 2) * size * 1.1,
        ];

        edge(context, between(head, tip, -0.6), tip, size * 0.14, 0, {
          color: MEOWSCARADA_GREEN,
          alpha: 1,
        });
        flower(context, tip, size * 0.6, turn + stem, MEOWSCARADA_PINK, 1);
      }
      motes(context, head, size * 1.4, 6, seed, run, { color: CONFETTI[0], alpha: 0.8 });
      return;
    }
    const pop = (share - BOUQUET_LANDS) / (1 - BOUQUET_LANDS);

    orb(context, at, size * (0.8 + pop * 2), { color: '#fff0f6', alpha: decay(pop * 2.5) });
    orb(context, at, size * (1.2 + pop * 1.6), {
      color: MEOWSCARADA_PINK,
      alpha: decay(pop) * 0.7,
    });
    ring(context, at, size * (1 + pop * 2.6), {
      color: lighten(MEOWSCARADA_PINK, 0.4),
      alpha: decay(pop),
      width: 3 * stage.scale,
    });
    for (let leaf = 0; leaf < many(14, weight); leaf += 1) {
      const angle = noise(seed, leaf) * Math.PI * 2;
      const out = size * (0.6 + pop * (2.2 + noise(seed, leaf + 20)));

      petal(
        context,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out + pop * pop * size],
        size * 0.4,
        angle + pop * 6,
        { color: leaf % 3 === 0 ? MEOWSCARADA_GREEN : MEOWSCARADA_PINK, alpha: decay(pop) },
      );
    }
    for (let bit = 0; bit < many(12, weight); bit += 1) {
      const angle = noise(seed + 5, bit) * Math.PI * 2;
      const out = size * (0.8 + pop * (2.8 + noise(seed + 5, bit + 20)));

      context.fillStyle = fade(CONFETTI[bit % CONFETTI.length], decay(pop));
      context.fillRect(
        at[0] + Math.cos(angle) * out,
        at[1] + Math.sin(angle) * out + pop * pop * size * 1.4,
        size * 0.22,
        size * 0.14,
      );
    }
    for (let glint = 0; glint < 4; glint += 1) {
      const angle = (glint / 4) * Math.PI * 2 + 0.4;

      star(
        context,
        [at[0] + Math.cos(angle) * size * 1.8, at[1] + Math.sin(angle) * size * 1.4],
        size * 0.35 * swell(Math.min(1, pop * 1.5)),
        pop * 3,
        { color: CONFETTI[0], alpha: decay(pop) },
      );
    }
  },

  // A wave of fire poured out along a song, flaming notes riding it, and
  // the flames flaring up round it when the song arrives
  Torch(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const run = Math.min(1, share / TORCH_REACHES);
    const fading = late(share, 0.6);
    const dx = at[0] - stage.source[0];
    const dy = at[1] - stage.source[1];
    const length = Math.max(1, Math.hypot(dx, dy));
    const across: Point = [-dy / length, dx / length];
    const along = (t: number, lift = 0): Point => {
      const [x, y] = between(stage.source, at, t);
      const sway = Math.sin(t * Math.PI * 3 - share * 10) * size * 0.6 + lift;

      return [x + across[0] * sway, y + across[1] * sway];
    };

    // The wave, red under gold, thickening as it pours out
    for (let step = 0; step < 12; step += 1) {
      const from = along(run * (step / 12));
      const to = along(run * ((step + 1) / 12));
      const thick = 0.5 + (step / 12) * 0.7;

      edge(context, from, to, size * 0.9 * thick, 0, {
        color: SKELEDIRGE_RED,
        alpha: fading * 0.7,
      });
      edge(context, from, to, size * 0.45 * thick, 0, {
        color: SKELEDIRGE_ORANGE,
        alpha: fading,
      });
    }
    orb(context, along(run), size * 1.1, { color: SKELEDIRGE_GOLD, alpha: fading });
    // The notes riding along it, each lit in flame
    for (let one = 0; one < 4; one += 1) {
      const t = run * (0.25 + one * 0.22);
      const lift = (one % 2 === 0 ? 1 : -1) * size * 1.1;
      const spot = along(t, lift);

      orb(context, spot, size * 0.9, { color: SKELEDIRGE_ORANGE, alpha: fading * 0.6 });
      note(context, spot, size * 0.7, one % 2 === 0 ? SKELEDIRGE_GOLD : '#fff2c8', fading);
    }
    if (share < TORCH_REACHES) {
      return;
    }
    const flare = (share - TORCH_REACHES) / (1 - TORCH_REACHES);
    const foot: Point = [at[0], at[1] + size * 0.9];

    orb(context, at, size * (1.2 + flare * 1.4), {
      color: SKELEDIRGE_ORANGE,
      alpha: decay(flare) * 0.8,
    });
    for (let tongue = 0; tongue < many(7, weight); tongue += 1) {
      const x = foot[0] + spread(seed, tongue) * size * 1.8;
      const high = size * (1.6 + noise(seed, tongue + 10) * 1.4) * swell(Math.min(1, flare * 1.6));

      flame(
        context,
        [x, foot[1]],
        high,
        spread(seed, tongue + 30) * size * 0.4,
        SKELEDIRGE_RED,
        decay(flare),
      );
      flame(context, [x, foot[1]], high * 0.65, 0, SKELEDIRGE_GOLD, decay(flare));
    }
    motes(context, at, size * 2.2, many(10, weight), seed + 1, flare, {
      color: SKELEDIRGE_GOLD,
      alpha: decay(flare),
      width: 2.4 * stage.scale,
    });
  },

  // Footprints of water stepping across it in a dance, each one going up
  // in a splash, inside a ribbon of water swirling round it
  Stepdance(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const shown = Math.min(1, share * 6) * late(share, 0.75);

    // The ribbon, swirling round it and climbing as the dance goes on
    for (let step = 0; step < 18; step += 1) {
      const t = step / 18;
      const next = (step + 1) / 18;
      const angle = (u: number): number => u * Math.PI * 2.4 + share * Math.PI * 4;
      const spot = (u: number): Point => [
        at[0] + Math.cos(angle(u)) * size * 2,
        at[1] + Math.sin(angle(u)) * size * 0.6 + size * (0.8 - u * 1.8),
      ];

      edge(context, spot(t), spot(next), size * 0.32 * (0.4 + t), 0, {
        color: AQUA_BLUE,
        alpha: shown * 0.8,
      });
    }
    for (let one = 0; one < AQUA_STEPS; one += 1) {
      const lands = 0.02 + (one / (AQUA_STEPS - 1)) * (AQUA_DANCED - 0.02);

      if (share < lands) {
        break;
      }
      const after = Math.min(1, (share - lands) / 0.35);
      const side = one % 2 === 0 ? -1 : 1;
      const spot: Point = [
        at[0] + (one / (AQUA_STEPS - 1) - 0.5) * size * 3,
        at[1] + side * size * 0.5,
      ];

      // The print: a sole and a heel, left on it in water
      context.fillStyle = fade(AQUA_BLUE, decay(after) * 0.9);
      context.beginPath();
      context.ellipse(
        spot[0],
        spot[1] - size * 0.2,
        size * 0.32,
        size * 0.42,
        side * 0.3,
        0,
        Math.PI * 2,
      );
      context.fill();
      context.beginPath();
      context.ellipse(spot[0], spot[1] + size * 0.4, size * 0.22, size * 0.22, 0, 0, Math.PI * 2);
      context.fill();
      ring(context, spot, size * (0.5 + after * 1.4), {
        color: AQUA_FOAM,
        alpha: decay(after),
        width: 2 * stage.scale,
      });
      motes(context, spot, size * 1.4, 6, seed + one, after, {
        color: AQUA_FOAM,
        alpha: decay(after),
        width: 2 * stage.scale,
      });
    }
    if (share > AQUA_DANCED) {
      const end = (share - AQUA_DANCED) / (1 - AQUA_DANCED);

      orb(context, at, size * (1 + end * 1.6), { color: AQUA_BLUE, alpha: decay(end) * 0.6 });
      ripple(context, [at[0], at[1] + size * 0.9], size * (1.2 + end * 2.4), {
        color: AQUA_FOAM,
        alpha: decay(end),
        width: 2.4 * stage.scale,
      });
    }
  },

  // Two great horns driven in, a hard blow, and the glass of a screen in
  // front of it shattering outward
  Bull(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const glass = late(share, 0.25) * Math.min(1, share * 6);

    if (share < BULL_LANDS) {
      const run = (share / BULL_LANDS) ** 1.6;
      const back = (1 - run) * size * 3;

      pane(context, [at[0], at[1] + size * 1.2], size * 2.2, size * 2.6, {
        color: BULL_GLASS,
        alpha: glass,
        width: 2 * stage.scale,
      });
      for (const side of [-1, 1]) {
        const base: Point = [at[0] + side * size * 1.8, at[1] + size * 1.6 + back];
        const tip: Point = [at[0] + side * size * 0.4, at[1] - size * 0.2 + back];

        edge(context, base, tip, size * 0.6, side * size * 0.8, { color: BULL_HIDE, alpha: 0.5 });
        edge(context, base, tip, size * 0.42, side * size * 0.8, { color: BULL_HORN, alpha: 1 });
      }
      return;
    }
    const hit = (share - BULL_LANDS) / (1 - BULL_LANDS);

    orb(context, at, size * (1 + hit * 2.2), { color: '#fff4e0', alpha: decay(hit * 2.5) });
    orb(context, at, size * (1.3 + hit * 1.6), { color: '#e86a3a', alpha: decay(hit) * 0.6 });
    ring(context, at, size * (1 + hit * 3), {
      color: BULL_HORN,
      alpha: decay(hit),
      width: 4 * stage.scale,
    });
    // The screen cracking from the blow out, then its pieces flying
    for (let crack = 0; crack < 6; crack += 1) {
      const angle = (crack / 6) * Math.PI * 2 + noise(seed, crack) * 0.6;
      const out = size * 2.4 * Math.min(1, hit * 4);

      bolt(
        context,
        at,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out],
        seed + crack,
        {
          color: '#ffffff',
          alpha: decay(hit * 1.6),
          width: 2 * stage.scale,
        },
      );
    }
    shards(context, at, size * 4, many(16, weight), seed + 1, hit, {
      color: BULL_GLASS,
      alpha: decay(hit),
      width: 5 * stage.scale,
    });
    burst(context, at, size * (1.6 + hit * 2), 10, seed + 2, {
      color: '#ffffff',
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
  },

  // A shower of gold coins pouring down onto it, glinting as they turn,
  // clinking off and lying scattered round its feet
  Coins(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot = at[1] + size * 1.1;
    const gone = late(share, 0.75);

    orb(context, [at[0], at[1] - size * 3], size * 2.4, {
      color: COIN_GOLD,
      alpha: Math.min(1, share * 5) * late(share, 0.5) * 0.4,
    });
    for (let one = 0; one < COINS; one += 1) {
      const leave = (one / COINS) * (COINS_LANDED - 0.25);
      const lands = leave + 0.25;

      if (share < leave) {
        continue;
      }
      const x = at[0] + spread(seed, one) * size * 1.6;
      const spin = share * 14 + one;

      if (share < lands) {
        const fall = ((share - leave) / 0.25) ** 1.5;
        const y = at[1] - size * 5 + fall * (size * 5 + spread(seed, one + 20) * size * 0.6);

        coin(context, [x, y], size * 0.42, spin, 1);
        continue;
      }
      const after = Math.min(1, (share - lands) / 0.3);
      const out = spread(seed, one + 40) * size * 1.6 * after;
      const hop = Math.sin(Math.PI * Math.min(1, after * 1.4)) * size * 0.9;
      const spot: Point = [x + out, at[1] + (foot - at[1]) * after - hop];

      coin(context, spot, size * 0.42, after < 0.7 ? spin : Math.PI / 2.4, gone);
      if (after < 0.4) {
        star(context, [spot[0], spot[1] - size * 0.3], size * 0.5 * swell(after / 0.4), after * 4, {
          color: COIN_GLINT,
          alpha: gone,
        });
      }
    }
    if (share > 0.3) {
      motes(context, at, size * 2, many(10, weight), seed + 3, (share - 0.3) / 0.7, {
        color: COIN_GLINT,
        alpha: gone,
        width: 2 * stage.scale,
      });
    }
  },

  // A great drill turning as it bores through it, a hexagon of shield
  // cracking where it goes in, and sparks and debris out the far side
  Hyperdrill(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const dx = at[0] - stage.source[0];
    const dy = at[1] - stage.source[1];
    const length = Math.max(1, Math.hypot(dx, dy));
    const way: Point = [dx / length, dy / length];
    const across: Point = [-way[1], way[0]];
    const push =
      share < DRILL_LANDS ? (share / DRILL_LANDS) ** 1.3 : 1 + (share - DRILL_LANDS) * 0.6;
    const tip: Point = [
      at[0] + way[0] * size * (push - 1) * 2.4,
      at[1] + way[1] * size * (push - 1) * 2.4,
    ];
    const shown = late(share, 0.7);
    const long = size * 3;
    const base: Point = [tip[0] - way[0] * long, tip[1] - way[1] * long];
    const bored = Math.max(0, (share - DRILL_LANDS) / (1 - DRILL_LANDS));

    // The shield, whole until the point meets it and cracking after
    hexagon(
      context,
      at,
      size * 1.7,
      DRILL_SHIELD,
      (bored > 0 ? decay(bored * 1.5) : 0.8) * Math.min(1, share * 8),
      2.4 * stage.scale,
    );
    if (bored > 0) {
      for (let crack = 0; crack < 5; crack += 1) {
        const angle = (crack / 5) * Math.PI * 2 + noise(seed, crack);
        const out = size * 1.7 * Math.min(1, bored * 4);

        bolt(
          context,
          at,
          [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out],
          seed + crack,
          {
            color: '#ffffff',
            alpha: decay(bored * 1.5),
            width: 2 * stage.scale,
          },
        );
      }
    }
    // The cone, banded in Dunsparce's colours that run down it as it turns
    for (let band = 0; band < 6; band += 1) {
      const from = band / 6;
      const to = (band + 1) / 6;
      const wide = (t: number): number => size * 1.1 * (1 - t);
      const near: Point = between(base, tip, from);
      const far: Point = between(base, tip, to);
      const turn = (band + share * 12) % 2 < 1;

      context.beginPath();
      context.moveTo(near[0] + across[0] * wide(from), near[1] + across[1] * wide(from));
      context.lineTo(far[0] + across[0] * wide(to), far[1] + across[1] * wide(to));
      context.lineTo(far[0] - across[0] * wide(to), far[1] - across[1] * wide(to));
      context.lineTo(near[0] - across[0] * wide(from), near[1] - across[1] * wide(from));
      context.closePath();
      context.fillStyle = fade(turn ? DRILL_YELLOW : DRILL_BLUE, shown);
      context.fill();
    }
    edge(context, base, tip, size * 0.4, 0, { color: DRILL_STEEL, alpha: shown * 0.6 });
    if (bored > 0) {
      const out: Point = [at[0] + way[0] * size * 1.6, at[1] + way[1] * size * 1.6];

      orb(context, at, size * (1 + bored), { color: DRILL_YELLOW, alpha: decay(bored) * 0.6 });
      burst(context, out, size * (1.4 + bored * 2), 12, seed + Math.floor(share * 20), {
        color: lighten(DRILL_YELLOW, 0.4),
        alpha: decay(bored),
        width: 2.4 * stage.scale,
      });
      shards(context, out, size * 3, many(12, weight), seed + 7, bored, {
        color: mix(DRILL_STEEL, '#5a4a3a', 0.4),
        alpha: decay(bored),
        width: 4 * stage.scale,
      });
    }
  },

  // Two beams, one off the head and one off the tail, crossing to meet on
  // it one after the other
  Twin(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const ends: [Point, string, number][] = [
      [[stage.source[0] - size * 1.6, stage.source[1] - size * 0.8], TWIN_PINK, TWIN_FIRST],
      [[stage.source[0] + size * 1.6, stage.source[1] + size * 0.2], TWIN_GOLD, TWIN_SECOND],
    ];

    for (const [index, [from, colour, leaves]] of ends.entries()) {
      const charge = Math.min(1, share / leaves);
      const run = (share - leaves) / TWIN_CROSS;

      if (run < 0) {
        orb(context, from, size * (0.4 + charge * 0.7), {
          color: colour,
          alpha: 0.5 + charge * 0.5,
        });
        motes(context, from, size * 1.4, 6, seed + index, 1 - charge, {
          color: colour,
          alpha: 0.8,
        });
        continue;
      }
      const hit = Math.min(1, Math.max(0, (run - 1) / 1.6));
      const fading = decay(hit);

      beam(context, from, at, Math.min(1, run), size * 0.7, { color: colour, alpha: fading });
      orb(context, from, size * 0.8, { color: colour, alpha: fading });
      if (run >= 1) {
        orb(context, at, size * (1 + hit * 1.8), { color: colour, alpha: fading * 0.8 });
        ring(context, at, size * (0.8 + hit * 2.4), {
          color: lighten(colour, 0.5),
          alpha: fading,
          width: 3 * stage.scale,
        });
        burst(context, at, size * (1.2 + hit * 1.6), 8, seed + index, {
          color: lighten(colour, 0.3),
          alpha: fading,
          width: 2 * stage.scale,
        });
      }
    }
    if (share > 0.7) {
      motes(context, at, size * 2, many(8, weight), seed + 9, (share - 0.7) / 0.3, {
        color: TWIN_PINK,
        alpha: late(share, 0.8),
      });
    }
  },

  // A fist wreathed in the purple and red flame of its rage landing on it,
  // anger marks going up and a ghostly flare off the blow
  Ragefist(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    if (share < RAGE_LANDS) {
      const run = (share / RAGE_LANDS) ** 1.4;
      const spot: Point = [at[0], at[1] + (1 - run) * size * 3];
      const big = size * (0.8 + run * 0.5);

      for (let tongue = 0; tongue < 6; tongue += 1) {
        const x = spot[0] + (tongue / 5 - 0.5) * big * 2;

        flame(
          context,
          [x, spot[1] + big * 0.6],
          big * (1.4 + noise(seed, tongue) * 0.8),
          (tongue / 5 - 0.5) * big,
          tongue % 2 === 0 ? RAGE_PURPLE : RAGE_RED,
          0.85,
        );
      }
      fist(context, spot, big, 1);
      anger(context, [spot[0] + big * 1.3, spot[1] - big * 1.2], big * 0.35, run);
      return;
    }
    const hit = (share - RAGE_LANDS) / (1 - RAGE_LANDS);
    const flare = swell(Math.min(1, hit * 1.4));

    orb(context, at, size * (1 + hit * 2), { color: '#fff0f4', alpha: decay(hit * 3) });
    orb(context, at, size * (1.4 + hit * 1.4), { color: RAGE_PURPLE, alpha: decay(hit) * 0.7 });
    for (let tongue = 0; tongue < many(8, weight); tongue += 1) {
      const x = at[0] + spread(seed, tongue) * size * 2;

      flame(
        context,
        [x, at[1] + size * 0.8],
        size * (2 + noise(seed, tongue + 9) * 1.6) * flare,
        spread(seed, tongue + 4) * size * 0.6,
        tongue % 2 === 0 ? RAGE_PURPLE : RAGE_RED,
        decay(hit) * 0.9,
      );
    }
    ring(context, at, size * (1 + hit * 2.6), {
      color: RAGE_RED,
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    for (let mark = 0; mark < 3; mark += 1) {
      const spot: Point = [
        at[0] + (mark - 1) * size * 1.6,
        at[1] - size * (1.4 + hit * 1.2 + (mark % 2) * 0.5),
      ];

      anger(context, spot, size * 0.38 * Math.min(1, hit * 4), late(hit, 0.6));
    }
    burst(context, at, size * (1.4 + hit * 1.8), 10, seed + 1, {
      color: RAGE_RED,
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
  },

  // Plates of armour coming off it and shot one after another as burning
  // shells, each going off in a blast on the target
  Armor(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    for (let shell = 0; shell < ARMOR_SHELLS; shell += 1) {
      const fires = ARMOR_FIRES + shell * ARMOR_APART;
      const lands = fires + ARMOR_FLIGHT;
      const home: Point = [
        stage.source[0] + (shell - 1) * size * 1.4,
        stage.source[1] - size * 0.6,
      ];

      if (share < fires) {
        // Lifting off the caster, burning brighter until it is shot
        const lift = share / fires;
        const spot: Point = [home[0], home[1] - lift * size * 0.8];

        orb(context, spot, size * (0.5 + lift * 0.5), {
          color: ARMOR_FIRE,
          alpha: 0.4 + lift * 0.5,
        });
        plate(context, spot, size * 0.55, lift * 2 + shell, 1);
        continue;
      }
      if (share < lands) {
        const run = ((share - fires) / ARMOR_FLIGHT) ** 1.2;
        const head = lofted(home, at, run, size * 1.2);
        const tail = lofted(home, at, Math.max(0, run - 0.35), size * 1.2);

        edge(context, tail, head, size * 0.6, 0, { color: ARMOR_FIRE, alpha: 0.8 });
        orb(context, head, size * 0.9, { color: ARMOR_FIRE, alpha: 1 });
        plate(context, head, size * 0.5, run * 8 + shell, 1);
        continue;
      }
      const hit = Math.min(1, (share - lands) / 0.3);
      const spot: Point = [
        at[0] + (shell - 1) * size * 0.5,
        at[1] + spread(seed, shell) * size * 0.4,
      ];

      orb(context, spot, size * (0.9 + hit * 1.8), { color: '#fff2c8', alpha: decay(hit * 2.5) });
      orb(context, spot, size * (1.2 + hit * 1.4), { color: ARMOR_FIRE, alpha: decay(hit) * 0.8 });
      ring(context, spot, size * (0.8 + hit * 2.4), {
        color: ARMOR_GOLD,
        alpha: decay(hit),
        width: 3 * stage.scale,
      });
      shards(context, spot, size * 2.4, 6, seed + shell, hit, {
        color: ARMOR_RED,
        alpha: decay(hit),
        width: 3 * stage.scale,
      });
    }
    if (share > ARMOR_FIRES + ARMOR_FLIGHT) {
      const smoke = (share - ARMOR_FIRES - ARMOR_FLIGHT) / (1 - ARMOR_FIRES - ARMOR_FLIGHT);

      motes(context, at, size * 2.4, many(10, weight), seed + 5, smoke, {
        color: ARMOR_GOLD,
        alpha: decay(smoke),
        width: 2.4 * stage.scale,
      });
    }
  },

  // Two blades of ghost flame crossing in an X on it, then the blue and
  // violet flame drawn off it back to the caster
  Bitter(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const long = size * 2.4;
    const cuts: [Point, Point, number][] = [
      [[at[0] - long, at[1] - long], [at[0] + long, at[1] + long], 0],
      [[at[0] + long, at[1] - long], [at[0] - long, at[1] + long], 0.14],
    ];

    for (const [from, to, starts] of cuts) {
      const run = Math.min(1, Math.max(0, (share - starts) / 0.18));
      const fading = late(share, 0.6);
      const back = between(from, to, Math.max(0, run - 0.7));

      if (share < starts) {
        // Waiting in the air, a blade of flame poised over it
        edge(context, from, between(from, to, 0.25), size * 0.3, 0, {
          color: BITTER_VIOLET,
          alpha: 0.8,
        });
        continue;
      }
      const head = between(from, to, run);

      edge(context, back, head, size * 0.55, size * 0.3, {
        color: BITTER_VIOLET,
        alpha: fading * 0.7,
      });
      edge(context, back, head, size * 0.3, size * 0.3, { color: BITTER_DARK, alpha: fading });
      edge(context, back, head, size * 0.12, size * 0.3, { color: BITTER_BLUE, alpha: fading });
      motes(context, head, size * 1.2, 5, seed + starts * 10, run, {
        color: BITTER_BLUE,
        alpha: fading,
      });
    }
    if (share < BITTER_CROSSED) {
      return;
    }
    const drain = (share - BITTER_CROSSED) / (1 - BITTER_CROSSED);

    orb(context, at, size * (1 + drain * 1.2), { color: BITTER_VIOLET, alpha: decay(drain) * 0.6 });
    for (let mote = 0; mote < many(10, weight); mote += 1) {
      const t = Math.min(1, Math.max(0, drain * 1.4 - noise(seed, mote) * 0.4));

      if (t <= 0 || t >= 1) {
        continue;
      }
      const spot = lofted(at, stage.source, t, spread(seed, mote + 10) * size * 2);

      orb(context, spot, size * 0.4, {
        color: mote % 2 === 0 ? BITTER_BLUE : BITTER_VIOLET,
        alpha: 1,
      });
    }
    orb(context, stage.source, size * swell(drain), { color: BITTER_BLUE, alpha: 0.6 });
  },

  // The caster crackling bright, two great arcs struck into it one after
  // the other, then the last of the sparks guttering out on the caster
  Doubleshock(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const source = stage.source;
    const charged =
      share < SHOCK_SPENT
        ? Math.min(1, share * 6)
        : decay((share - SHOCK_SPENT) / (1 - SHOCK_SPENT));

    orb(context, source, size * (1 + charged * 0.6), { color: SHOCK_YELLOW, alpha: charged * 0.7 });
    for (let spark = 0; spark < 5; spark += 1) {
      const angle = noise(seed + Math.floor(share * 16), spark) * Math.PI * 2;
      const out = size * (1 + charged * 0.8);

      bolt(
        context,
        source,
        [source[0] + Math.cos(angle) * out, source[1] + Math.sin(angle) * out],
        seed + spark + Math.floor(share * 16),
        {
          color: spark % 2 === 0 ? SHOCK_YELLOW : SHOCK_ORANGE,
          alpha: charged,
          width: 2 * stage.scale * Math.max(0.4, charged),
        },
      );
    }
    for (const [index, strikes] of [SHOCK_FIRST, SHOCK_SECOND].entries()) {
      const after = (share - strikes) / 0.22;

      if (after < 0 || after > 1) {
        continue;
      }
      const flick = seed + index * 7 + Math.floor(after * 6);

      bolt(context, source, at, flick, {
        color: SHOCK_ORANGE,
        alpha: decay(after),
        width: 9 * stage.scale,
      });
      bolt(context, source, at, flick, {
        color: SHOCK_WHITE,
        alpha: decay(after),
        width: 4 * stage.scale,
      });
      bolt(context, source, at, flick + 3, {
        color: SHOCK_YELLOW,
        alpha: decay(after) * 0.8,
        width: 3 * stage.scale,
      });
      orb(context, at, size * (1.2 + after * 1.6), { color: SHOCK_YELLOW, alpha: decay(after) });
      burst(context, at, size * (1.4 + after * 1.6), 10, flick, {
        color: SHOCK_WHITE,
        alpha: decay(after),
        width: 3 * stage.scale,
      });
    }
    if (share > SHOCK_SPENT) {
      const out = (share - SHOCK_SPENT) / (1 - SHOCK_SPENT);

      // The spent charge going up as grey wisps
      motes(context, source, size * 1.6, 8, seed + 4, out, {
        color: '#9a9488',
        alpha: decay(out) * 0.7,
        width: 3 * stage.scale,
      });
    }
  },

  // A giant hammer, pink and steel, brought down out of the sky onto it,
  // and the ground cracking out in a ring from the blow
  Gigaton(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 1];

    if (share < GIGATON_LANDS) {
      const fall = (share / GIGATON_LANDS) ** 2;
      const tilt = (1 - fall) * -0.6;
      const head: Point = [
        at[0] + (1 - fall) * size * 1.5,
        at[1] - size * 1.2 - (1 - fall) * size * 6,
      ];

      context.save();
      context.translate(head[0], head[1]);
      context.rotate(tilt);
      // The handle, running up out of the top of the head
      context.fillStyle = GIGATON_PINK;
      context.fillRect(-size * 0.25, -size * 4.2, size * 0.5, size * 3.4);
      context.fillStyle = GIGATON_DARK;
      context.fillRect(-size * 2, -size * 1.1, size * 4, size * 2.2);
      context.fillStyle = GIGATON_PINK;
      context.fillRect(-size * 1.7, -size * 1, size * 3.4, size * 2);
      context.fillStyle = GIGATON_STEEL;
      context.fillRect(-size * 2.1, -size * 1.2, size * 0.6, size * 2.4);
      context.fillRect(size * 1.5, -size * 1.2, size * 0.6, size * 2.4);
      context.restore();
      if (fall > 0.3) {
        ripple(context, foot, size * 2.4, {
          color: GIGATON_DARK,
          alpha: fall * 0.4,
          width: 2 * stage.scale,
        });
      }
      return;
    }
    const hit = (share - GIGATON_LANDS) / (1 - GIGATON_LANDS);
    const squash = decay(Math.min(1, hit * 3));

    if (squash > 0) {
      context.fillStyle = fade(GIGATON_PINK, squash);
      context.fillRect(at[0] - size * 2, at[1] - size * 2.2, size * 4, size * 2);
      context.fillStyle = fade(GIGATON_STEEL, squash);
      context.fillRect(at[0] - size * 2, at[1] - size * 0.5, size * 4, size * 0.4);
    }
    orb(context, at, size * (1.2 + hit * 2.4), { color: '#fff4fa', alpha: decay(hit * 2.5) });
    orb(context, foot, size * (1.6 + hit * 2), { color: GIGATON_PINK, alpha: decay(hit) * 0.6 });
    for (let wave = 0; wave < 2; wave += 1) {
      ripple(context, foot, size * (1.4 + hit * (3.6 - wave * 1.2)), {
        color: wave === 0 ? GIGATON_STEEL : GIGATON_PINK,
        alpha: decay(hit),
        width: 4 * stage.scale,
      });
    }
    for (let crack = 0; crack < 7; crack += 1) {
      const angle = (crack / 7) * Math.PI * 2 + noise(seed, crack) * 0.5;
      const out = size * 3.4 * Math.min(1, hit * 3);

      bolt(
        context,
        foot,
        [foot[0] + Math.cos(angle) * out, foot[1] + Math.sin(angle) * out * 0.4],
        seed + crack,
        { color: GIGATON_DARK, alpha: decay(hit), width: 3 * stage.scale },
      );
    }
    shards(context, foot, size * 3.6, many(14, weight), seed + 1, hit, {
      color: mix(GIGATON_STEEL, '#6a5a4a', 0.5),
      alpha: decay(hit),
      width: 5 * stage.scale,
    });
  },

  // A huge crimson full moon rising up behind it, then a beam of red
  // moonlight brought down out of it onto the target
  Bloodmoon(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const rise = Math.min(1, share / MOON_RISEN);
    const shown = Math.min(1, share * 6) * late(share, 0.75);
    const moon: Point = [at[0], at[1] - size * (1.4 + swell(rise / 2) * 1.6)];
    const radius = size * 2.4;

    orb(context, moon, radius * 2, { color: MOON_DARK, alpha: shown * 0.35 });
    orb(context, moon, radius * 1.5, { color: MOON_LIGHT, alpha: shown * 0.5 });
    context.fillStyle = fade(MOON_RED, shown);
    context.beginPath();
    context.ellipse(moon[0], moon[1], radius, radius, 0, 0, Math.PI * 2);
    context.fill();
    // The moon's seas, darker patches across its face
    for (let sea = 0; sea < 4; sea += 1) {
      const angle = noise(seed, sea) * Math.PI * 2;
      const out = radius * 0.5 * noise(seed, sea + 9);

      context.fillStyle = fade(MOON_DARK, shown * 0.5);
      context.beginPath();
      context.ellipse(
        moon[0] + Math.cos(angle) * out,
        moon[1] + Math.sin(angle) * out,
        radius * 0.25,
        radius * 0.2,
        angle,
        0,
        Math.PI * 2,
      );
      context.fill();
    }
    if (share < MOON_RISEN) {
      return;
    }
    const shine = (share - MOON_RISEN) / (1 - MOON_RISEN);
    const fading = late(shine, 0.5);

    beam(context, moon, at, Math.min(1, shine * 4), size * 1.4, { color: MOON_RED, alpha: fading });
    if (shine > 0.25) {
      const hit = (shine - 0.25) / 0.75;

      orb(context, at, size * (1.2 + hit * 1.6), { color: MOON_LIGHT, alpha: decay(hit) * 0.8 });
      ring(context, at, size * (1 + hit * 2.6), {
        color: lighten(MOON_RED, 0.4),
        alpha: decay(hit),
        width: 3 * stage.scale,
      });
      ripple(context, [at[0], at[1] + size * 0.9], size * (1.2 + hit * 2.4), {
        color: MOON_RED,
        alpha: decay(hit),
        width: 3 * stage.scale,
      });
      burst(context, at, size * (1.4 + hit * 1.6), 10, seed + 1, {
        color: MOON_LIGHT,
        alpha: decay(hit),
        width: 2.4 * stage.scale,
      });
    }
  },

  // Green tea whisked into a froth over the caster, sprayed across in an
  // arc onto it, going up in splashes and steam, and motes drawn back
  Matcha(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const cup: Point = [stage.source[0] + size * 1.6, stage.source[1] - size * 0.8];
    const whisk = Math.min(1, share / MATCHA_WHISKED);
    const held = late(share, 0.35);

    // The froth, whisked round and round
    orb(context, cup, size * (0.8 + whisk * 0.6), { color: MATCHA_GREEN, alpha: held });
    spiral(context, cup, size * 1.3, 3, share * 6, {
      color: MATCHA_FROTH,
      alpha: held,
      width: 2.4 * stage.scale,
    });
    motes(context, cup, size * 1.4, 8, seed, whisk, {
      color: MATCHA_FROTH,
      alpha: held,
      width: 2.4 * stage.scale,
    });
    if (share < MATCHA_WHISKED) {
      return;
    }
    const spray = Math.min(1, (share - MATCHA_WHISKED) / (MATCHA_LANDS - MATCHA_WHISKED));
    const fading = late(share, 0.6);

    for (let drop = 0; drop < 10; drop += 1) {
      const t = spray - drop * 0.06;

      if (t <= 0 || t >= 1) {
        continue;
      }
      const spot = lofted(cup, at, t, size * 3.2);

      orb(context, spot, size * (0.7 - drop * 0.04), {
        color: drop % 3 === 0 ? MATCHA_FROTH : MATCHA_GREEN,
        alpha: fading,
      });
    }
    if (share < MATCHA_LANDS) {
      return;
    }
    const after = (share - MATCHA_LANDS) / (1 - MATCHA_LANDS);

    orb(context, at, size * (1.2 + after * 1.4), {
      color: MATCHA_GREEN,
      alpha: decay(after) * 0.8,
    });
    ripple(context, [at[0], at[1] + size * 0.9], size * (1 + after * 2.4), {
      color: MATCHA_GREEN,
      alpha: decay(after),
      width: 3 * stage.scale,
    });
    motes(context, at, size * 2.4, many(10, weight), seed + 1, after, {
      color: MATCHA_FROTH,
      alpha: decay(after),
      width: 3 * stage.scale,
    });
    // The steam rising off it
    for (let puff = 0; puff < 4; puff += 1) {
      const rise = (after + puff * 0.2) % 1;

      orb(
        context,
        [at[0] + spread(seed, puff) * size * 1.4, at[1] - size * (0.6 + rise * 2.4)],
        size * (0.6 + rise * 0.8),
        { color: MATCHA_STEAM, alpha: swell(rise) * decay(after) * 0.6 },
      );
    }
    // What it drains, drawn back over to the caster
    for (let mote = 0; mote < 6; mote += 1) {
      const t = Math.min(1, after * 1.3 - noise(seed, mote + 30) * 0.3);

      if (t <= 0 || t >= 1) {
        continue;
      }
      orb(context, lofted(at, stage.source, t, spread(seed, mote) * size * 1.6), size * 0.35, {
        color: lighten(MATCHA_GREEN, 0.4),
        alpha: 1,
      });
    }
  },
} satisfies Partial<Record<EffectShape, ShapePainter>>;

export default paldeaLines;
