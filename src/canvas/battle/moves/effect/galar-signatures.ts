import type { Point, Stage } from '../../stage';
import {
  between,
  burst,
  chevrons,
  decay,
  fade,
  late,
  lighten,
  mix,
  motes,
  noise,
  orb,
  petal,
  ring,
  ripple,
  spread,
  star,
  swell,
} from '../__paint';
import { SIGNATURE_SCALE } from './galar';
import type { EffectShape, ShapePainter } from './shapes';
import { REACH, landing, many } from './shapes';

/** Snipe Shot: the share the sight has locked by, and the share the shot lands by */
export const SNIPE_LOCKS = 0.3;
export const SNIPE_LANDS = 0.45;

/** The sight's red, Inteleon's water and the foam at the bullet's head */
export const SIGHT_RED = '#ff3a4a';
export const SNIPE_WATER = '#4aa8ff';
export const SNIPE_FOAM = '#e8f8ff';

/** Jaw Lock: the share the jaws shut by, and the share they let go at */
export const JAW_SHUTS = 0.3;
export const JAW_HOLDS = 0.7;

/** Drednaw's dark jaws, the teal of its shell, its teeth and the lock's gold */
export const JAW_DARK = '#3a3440';
export const JAW_TEAL = '#3aa8a0';
export const JAW_TEETH = '#f4f0e4';
export const LOCK_GOLD = '#ffd25a';

/** Stuff Cheeks: how many berries fly in, and the share the cheeks are full by */
export const CHEEK_BERRIES = 6;
export const CHEEKS_FULL = 0.45;

/** Greedent's brown and cream, the berries, and the warm light of the boost */
export const GREEDENT_BROWN = '#a8643a';
export const CHEEK_CREAM = '#f6dcb0';
export const BERRY_COLOURS = ['#e8243a', '#3a6ae8', '#ff8ac8', '#ffd23a'];
export const BERRY_LEAF = '#4aa83a';
export const BOOST_WARM = '#ff9a4a';

/** No Retreat: how many shields close round it, and the share they have formed up by */
export const RETREAT_SHIELDS = 6;
export const RETREAT_FORMED = 0.4;

/** Falinks' gold shields, the dark of their rims, and the red of the war cry */
export const SHIELD_GOLD = '#f0c050';
export const SHIELD_DARK = '#5a3a20';
export const CRY_RED = '#ff5a3a';

/** Magic Powder: the share the powder has all fallen by */
export const POWDER_FALLS = 0.6;

/** Hatterene's pink, the violet of the powder, and its glitter */
export const POWDER_PINK = '#ff8ad0';
export const POWDER_VIOLET = '#b07aff';
export const POWDER_GLITTER = '#fff0ff';

/** Teatime: the share the berry is in by, and the share the cup is tipped by */
export const TEA_BERRY_IN = 0.3;
export const TEA_TIPPED = 0.5;

/** The cup's white, Polteageist's purple rim, the tea, its steam and the warm glow */
export const TEACUP_WHITE = '#f6f0e6';
export const TEACUP_RIM = '#7a4a9a';
export const TEA_BROWN = '#b0602a';
export const TEA_STEAM = '#f4ecff';
export const TEA_GLOW = '#ffc88a';

/** Octolock: how many arms wrap it, and the share they have wrapped by */
export const OCTO_ARMS = 8;
export const OCTO_WRAPPED = 0.4;

/** The arms' orange, the dark under them, and the suckers */
export const OCTO_ORANGE = '#f07a3a';
export const OCTO_DARK = '#7a2a1a';
export const OCTO_SUCKER = '#ffd8c0';

/** Court Change: the share the ball lands by, and the share the halves have swapped by */
export const COURT_LANDS = 0.4;
export const COURT_SWAPPED = 0.65;

/** The two halves' colours, the ball and the whistle's flash */
export const COURT_RED = '#e8403a';
export const COURT_BLUE = '#3a7ae8';
export const BALL_WHITE = '#f8f8f0';
export const BALL_DARK = '#2a2a30';
export const WHISTLE_FLASH = '#fff6c0';

/** Decorate: the share the cream is all piped by, and how many sweets go on it */
export const DECORATE_PIPED = 0.55;
export const DECORATE_SWEETS = 7;

/** Alcremie's cream, its pink, the fruit and the stars */
export const CREAM_WHITE = '#fff6ec';
export const CREAM_PINK = '#ffb8d4';
export const CHERRY_RED = '#e8203a';
export const SWEET_STAR = '#ffd84a';
export const SWEET_SHADE = '#b8788a';

/** Drum Beating: how many beats, how far apart, and the share the roots burst at */
export const DRUM_BEATS = 3;
export const DRUM_GAP = 0.13;
export const DRUM_ROOTS = 0.4;

/** The stump's bark, its rings and dark, the roots and their leaves */
export const STUMP_BROWN = '#8a5a32';
export const STUMP_RINGS = '#d8a868';
export const STUMP_DARK = '#3a2414';
export const ROOT_BROWN = '#7a4a26';
export const ROOT_LEAF = '#5ac04a';

/** Pyro Ball: the share the pebble catches by, and the share the ball lands by */
export const PYRO_CATCHES = 0.12;
export const PYRO_LANDS = 0.5;

/** The flames' orange, their hot middle, and the pebble's grey */
export const PYRO_FLAME = '#ff6a1a';
export const PYRO_HOT = '#ffd04a';
export const PYRO_PEBBLE = '#8a7a6a';

/** A line through points, with a wider dark line under it when `under` is given */
function strokeThrough(
  context: CanvasRenderingContext2D,
  points: Point[],
  width: number,
  color: string,
  alpha: number,
  under?: string,
): void {
  if (points.length < 2 || alpha <= 0) {
    return;
  }
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.beginPath();
  for (const [index, [x, y]] of points.entries()) {
    context[index === 0 ? 'moveTo' : 'lineTo'](x, y);
  }
  if (under != null) {
    context.strokeStyle = fade(under, alpha * 0.6);
    context.lineWidth = width * 2;
    context.stroke();
  }
  context.strokeStyle = fade(color, alpha);
  context.lineWidth = width;
  context.stroke();
  context.lineCap = 'butt';
  context.lineJoin = 'miter';
}

/** A filled oval with a dark rim, so a pale thing reads on snow */
function blob(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  across: number,
  up: number,
  color: string,
  alpha: number,
  rim: string,
): void {
  if (alpha <= 0) {
    return;
  }
  context.beginPath();
  context.ellipse(x, y, Math.max(0.5, across), Math.max(0.5, up), 0, 0, Math.PI * 2);
  context.fillStyle = fade(color, alpha);
  context.fill();
  context.strokeStyle = fade(rim, alpha * 0.8);
  context.lineWidth = Math.max(1, Math.min(across, up) * 0.18);
  context.stroke();
}

/** A berry: a round fruit with a leaf on top */
function berry(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  color: string,
  alpha: number,
): void {
  blob(context, [x, y], size, size, color, alpha, mix(color, '#000000', 0.5));
  petal(context, [x + size * 0.35, y - size * 1.05], size * 0.5, 0.8, {
    color: BERRY_LEAF,
    alpha,
  });
}

/** A football: white with a dark patch in the middle and four round its edge */
function football(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  turn: number,
  alpha: number,
): void {
  blob(context, [x, y], size, size, BALL_WHITE, alpha, BALL_DARK);
  context.beginPath();
  for (let corner = 0; corner < 5; corner += 1) {
    const angle = turn + (corner / 5) * Math.PI * 2;

    context[corner === 0 ? 'moveTo' : 'lineTo'](
      x + Math.cos(angle) * size * 0.36,
      y + Math.sin(angle) * size * 0.36,
    );
  }
  context.closePath();
  context.fillStyle = fade(BALL_DARK, alpha);
  context.fill();
  for (let patch = 0; patch < 5; patch += 1) {
    const angle = turn + Math.PI / 5 + (patch / 5) * Math.PI * 2;

    orb(
      context,
      [x + Math.cos(angle) * size * 0.8, y + Math.sin(angle) * size * 0.8],
      size * 0.22,
      {
        color: BALL_DARK,
        alpha: alpha * 0.9,
      },
    );
  }
}

/** A soldier's shield: a flat top, a pointed foot and a boss in the middle */
function shield(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  alpha: number,
): void {
  if (alpha <= 0) {
    return;
  }
  context.beginPath();
  context.moveTo(x - size * 0.6, y - size * 0.7);
  context.lineTo(x + size * 0.6, y - size * 0.7);
  context.lineTo(x + size * 0.6, y);
  context.quadraticCurveTo(x + size * 0.5, y + size * 0.6, x, y + size * 0.9);
  context.quadraticCurveTo(x - size * 0.5, y + size * 0.6, x - size * 0.6, y);
  context.closePath();
  context.fillStyle = fade(SHIELD_GOLD, alpha);
  context.fill();
  context.strokeStyle = fade(SHIELD_DARK, alpha);
  context.lineWidth = Math.max(1, size * 0.16);
  context.stroke();
  blob(context, [x, y - size * 0.05], size * 0.2, size * 0.2, CRY_RED, alpha, SHIELD_DARK);
}

/** One half of a turtle's jaw: a dome over a row of teeth, `way` -1 for the upper */
function jawHalf(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  width: number,
  depth: number,
  way: 1 | -1,
  alpha: number,
): void {
  context.beginPath();
  context.ellipse(x, y, width, depth, 0, way < 0 ? Math.PI : 0, way < 0 ? Math.PI * 2 : Math.PI);
  context.closePath();
  context.fillStyle = fade(JAW_DARK, alpha);
  context.fill();
  context.strokeStyle = fade(JAW_TEAL, alpha);
  context.lineWidth = Math.max(1, depth * 0.16);
  context.stroke();
  context.beginPath();
  for (let tooth = 0; tooth < 5; tooth += 1) {
    const tx = x - width * 0.75 + (tooth / 4) * width * 1.5;
    const half = width * 0.13;

    context.moveTo(tx - half, y);
    context.lineTo(tx + half, y);
    context.lineTo(tx, y - way * depth * 0.5);
    context.closePath();
  }
  context.fillStyle = fade(JAW_TEETH, alpha);
  context.fill();
}

/** A teacup on its saucer, the cup tipped by `tilt` about its foot */
function teacup(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  tilt: number,
  tea: number,
  alpha: number,
): void {
  blob(context, [x, y + size * 0.65], size * 1.25, size * 0.24, TEACUP_WHITE, alpha, TEACUP_RIM);
  context.save();
  context.translate(x, y + size * 0.55);
  context.rotate(tilt);
  context.translate(0, -size * 0.55);
  context.beginPath();
  context.arc(size * 0.85, 0, size * 0.3, -Math.PI / 2, Math.PI / 2);
  context.strokeStyle = fade(TEACUP_RIM, alpha);
  context.lineWidth = Math.max(1, size * 0.14);
  context.stroke();
  context.beginPath();
  context.moveTo(-size * 0.8, -size * 0.5);
  context.lineTo(size * 0.8, -size * 0.5);
  context.quadraticCurveTo(size * 0.75, size * 0.55, 0, size * 0.55);
  context.quadraticCurveTo(-size * 0.75, size * 0.55, -size * 0.8, -size * 0.5);
  context.closePath();
  context.fillStyle = fade(TEACUP_WHITE, alpha);
  context.fill();
  context.strokeStyle = fade(TEACUP_RIM, alpha);
  context.stroke();
  if (tea > 0) {
    blob(context, [0, -size * 0.5], size * 0.75, size * 0.16, TEA_BROWN, alpha * tea, TEACUP_RIM);
  }
  context.restore();
}

/** The far side of the field: the first body reached, or straight up the picture */
function farSide(stage: Stage, size: number): Point {
  for (const target of stage.targets) {
    if (Math.hypot(target[0] - stage.source[0], target[1] - stage.source[1]) > size) {
      return target;
    }
  }
  return [stage.source[0], stage.source[1] - size * 7];
}

const galarSignatures = {
  // A red sight closing in and locking onto it, then a thin water
  // bullet fired from the caster's finger with a long trail behind
  // and a tight splash where it hits
  Snipe(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const lock = Math.min(1, share / SNIPE_LOCKS);
    const sighted = Math.min(1, share * 12) * late(share, SNIPE_LANDS + 0.1);
    const radius = size * (2.6 - lock * 1.4);
    const turn = (1 - lock) * Math.PI * 0.5;
    const finger: Point = [stage.source[0] + size * 0.5, stage.source[1] - size * 0.6];

    ring(context, at, radius, { color: SIGHT_RED, alpha: sighted, width: 2.2 * stage.scale });
    for (let tick = 0; tick < 4; tick += 1) {
      const angle = turn + (tick * Math.PI) / 2;

      strokeThrough(
        context,
        [
          [at[0] + Math.cos(angle) * radius * 0.55, at[1] + Math.sin(angle) * radius * 0.55],
          [at[0] + Math.cos(angle) * radius * 1.3, at[1] + Math.sin(angle) * radius * 1.3],
        ],
        2 * stage.scale,
        SIGHT_RED,
        sighted,
      );
    }
    if (lock >= 1) {
      orb(context, at, size * 0.3, { color: SIGHT_RED, alpha: sighted });
    }
    if (share < SNIPE_LOCKS) {
      orb(context, finger, size * (0.2 + lock * 0.3), { color: SNIPE_FOAM, alpha: lock });
      return;
    }
    const flight = Math.min(1, (share - SNIPE_LOCKS) / (SNIPE_LANDS - SNIPE_LOCKS));
    const head = between(finger, at, flight);
    const trailing = late(share, 0.6);

    strokeThrough(context, [finger, head], 2.4 * stage.scale, SNIPE_WATER, trailing * 0.7);
    strokeThrough(
      context,
      [between(finger, head, 0.4), head],
      1 * stage.scale,
      SNIPE_FOAM,
      trailing,
    );
    if (flight < 1) {
      orb(context, head, size * 0.35, { color: SNIPE_FOAM, alpha: 1 });
      return;
    }
    const hit = (share - SNIPE_LANDS) / (1 - SNIPE_LANDS);

    orb(context, at, size * (0.5 + hit * 0.6), { color: SNIPE_FOAM, alpha: decay(hit * 1.5) });
    ring(context, at, size * (0.4 + hit * 1.2), {
      color: SNIPE_WATER,
      alpha: decay(hit),
      width: 2.4 * stage.scale,
    });
    motes(context, at, size * 1.4, many(10, weight), seed, hit, {
      color: lighten(SNIPE_WATER, 0.3),
      alpha: decay(hit),
      width: 2.2 * stage.scale,
    });
    burst(context, at, size * (0.8 + hit), 8, seed + 1, {
      color: SNIPE_FOAM,
      alpha: decay(hit),
      width: 2 * stage.scale,
    });
  },

  // Great dark turtle jaws snapping shut over it and holding on,
  // shaking it, with a gold lock glinting by them
  Jawlock(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const shut = Math.min(1, share / JAW_SHUTS) ** 2;
    const held = Math.min(1, share * 10) * late(share, JAW_HOLDS);
    const shake = share > JAW_SHUTS ? Math.sin(share * 70) * size * 0.08 : 0;
    const gap = size * (2.2 - shut * 1.75);
    const width = size * 2.4;

    jawHalf(context, [at[0] + shake, at[1] - gap], width, size * 1.3, -1, held);
    jawHalf(context, [at[0] + shake, at[1] + gap], width, size * 1, 1, held);
    if (share < JAW_SHUTS) {
      return;
    }
    const bite = (share - JAW_SHUTS) / (1 - JAW_SHUTS);
    const lock: Point = [at[0] + size * 2.2, at[1] - size * 1.8];

    burst(context, at, size * (1.6 + bite * 1.6), 10, seed, {
      color: JAW_TEETH,
      alpha: decay(bite * 2.5),
      width: 2.6 * stage.scale,
    });
    ring(context, at, size * (1.2 + bite * 2), {
      color: JAW_TEAL,
      alpha: decay(bite * 2),
      width: 3 * stage.scale,
    });
    // The padlock: a shackle over a gold body
    context.beginPath();
    context.arc(lock[0], lock[1] - size * 0.3, size * 0.35, Math.PI, 0);
    context.strokeStyle = fade(SHIELD_DARK, held);
    context.lineWidth = Math.max(1, size * 0.16);
    context.stroke();
    context.fillStyle = fade(LOCK_GOLD, held);
    context.fillRect(lock[0] - size * 0.5, lock[1] - size * 0.3, size, size * 0.8);
    context.strokeRect(lock[0] - size * 0.5, lock[1] - size * 0.3, size, size * 0.8);
    star(context, [lock[0] + size * 0.5, lock[1] - size * 0.4], size * 0.7, share * 4, {
      color: '#ffffff',
      alpha: swell(Math.min(1, bite * 2)) * held,
    });
  },

  // Berries flying in from all round into the caster's cheeks, the
  // cheeks swelling and munching, then a warm glow and rising arrows
  Cheeks(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const full = Math.min(1, share / CHEEKS_FULL);
    const shown = late(share, 0.8);
    const munch = share > CHEEKS_FULL && share < 0.7 ? Math.abs(Math.sin(share * 45)) * 0.14 : 0;
    const cheek = size * (0.35 + full * 0.4) * (1 - munch);

    for (const side of [-1, 1]) {
      blob(
        context,
        [at[0] + side * size * 0.75, at[1] - size * 0.1],
        cheek,
        cheek * 0.9,
        CHEEK_CREAM,
        shown,
        GREEDENT_BROWN,
      );
    }
    for (let one = 0; one < CHEEK_BERRIES; one += 1) {
      const leave = (one / CHEEK_BERRIES) * (CHEEKS_FULL - 0.25);
      const flight = (share - leave) / 0.25;

      if (flight < 0 || flight > 1) {
        continue;
      }
      const side = one % 2 === 0 ? -1 : 1;
      const angle = -Math.PI / 2 + side * (0.5 + noise(seed, one) * 0.8);
      const from: Point = [
        at[0] + Math.cos(angle) * size * 3.4,
        at[1] + Math.sin(angle) * size * 3,
      ];
      const to: Point = [at[0] + side * size * 0.75, at[1] - size * 0.1];
      const spot = between(from, to, flight);

      berry(
        context,
        [spot[0], spot[1] - swell(flight) * size * 0.8],
        size * 0.28 * (1 - flight * 0.4),
        BERRY_COLOURS[one % BERRY_COLOURS.length],
        1,
      );
    }
    if (munch > 0) {
      motes(context, at, size * 1.2, 6, seed + Math.floor(share * 20), 0.5, {
        color: GREEDENT_BROWN,
        alpha: 0.8,
        width: 1.8 * stage.scale,
      });
    }
    const boost = Math.max(0, (share - CHEEKS_FULL) / (1 - CHEEKS_FULL));

    if (boost <= 0) {
      return;
    }
    orb(context, at, size * 1.4, { color: BOOST_WARM, alpha: swell(boost) * 0.5 });
    chevrons(context, at, size, 3, boost, {
      color: lighten(BOOST_WARM, 0.2),
      alpha: swell(boost) + 0.2,
      width: 2.8 * stage.scale,
    });
  },

  // A line of small gold shields marching in and locking into a ring
  // round the caster, then a war cry ringing out and arrows rising
  Retreat(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const shown = late(share, 0.8);

    for (let one = 0; one < RETREAT_SHIELDS; one += 1) {
      const leave = (one / RETREAT_SHIELDS) * (RETREAT_FORMED - 0.2);
      const run = Math.min(1, (share - leave) / 0.2);

      if (run < 0) {
        continue;
      }
      const angle = (one / RETREAT_SHIELDS) * Math.PI * 2 + Math.PI / 2;
      const post: Point = [
        at[0] + Math.cos(angle) * size * 1.6,
        at[1] + size * 0.3 + Math.sin(angle) * size * 0.55,
      ];
      const side = Math.cos(angle) >= 0 ? 1 : -1;
      const step = Math.abs(Math.sin(run * Math.PI * 4)) * size * 0.15 * decay(run);
      const spot: Point = [post[0] + side * decay(run) ** 1.5 * size * 3.5, post[1] - step];

      shield(context, spot, size * 0.55, shown);
    }
    if (share < RETREAT_FORMED) {
      return;
    }
    const cry = (share - RETREAT_FORMED) / (1 - RETREAT_FORMED);

    for (let wave = 0; wave < 2; wave += 1) {
      const out = Math.max(0, cry * 1.4 - wave * 0.25);

      if (out > 0 && out < 1) {
        ring(context, at, size * (0.8 + out * 2.4), {
          color: CRY_RED,
          alpha: decay(out),
          width: 3 * stage.scale,
        });
      }
    }
    burst(context, [at[0], at[1] - size * 0.6], size * (1 + cry), 8, seed, {
      color: lighten(CRY_RED, 0.3),
      alpha: decay(cry * 1.5),
      width: 2.4 * stage.scale,
    });
    chevrons(context, at, size, 3, cry, {
      color: SHIELD_GOLD,
      alpha: swell(cry) + 0.2,
      width: 3 * stage.scale,
    });
  },

  // Sparkling pink and violet powder sprinkled down over it from
  // above, glittering as it settles, and it glows with a new colour
  Powder(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const top: Point = [at[0], at[1] - size * 2.8];
    const pouring = Math.min(1, share * 10) * late(share, POWDER_FALLS - 0.1);

    orb(context, top, size * 0.8, { color: POWDER_PINK, alpha: pouring * 0.7 });
    for (let pinch = 0; pinch < 3; pinch += 1) {
      star(context, [top[0] + (pinch - 1) * size * 0.45, top[1]], size * 0.25, share * 6 + pinch, {
        color: POWDER_GLITTER,
        alpha: pouring,
      });
    }
    for (let grain = 0; grain < many(26, weight); grain += 1) {
      const fall = (share * 1.8 + noise(seed, grain)) % 1;
      const alive = share < POWDER_FALLS ? 1 : decay((share - POWDER_FALLS) / 0.2);
      const spot: Point = [
        top[0] + spread(seed, grain + 30) * size * (0.3 + fall * 1.3),
        top[1] + fall * size * 3.4,
      ];
      const color = grain % 2 === 0 ? POWDER_PINK : POWDER_VIOLET;

      if (grain % 4 === 0) {
        star(context, spot, size * 0.18, share * 8 + grain, {
          color: POWDER_GLITTER,
          alpha: swell(fall) * alive,
        });
      } else {
        orb(context, spot, size * 0.1, { color, alpha: swell(fall) * alive });
      }
    }
    const turned = Math.max(0, (share - 0.35) / 0.65);

    if (turned <= 0) {
      return;
    }
    orb(context, at, size * 1.3, {
      color: mix(POWDER_PINK, POWDER_VIOLET, turned),
      alpha: swell(turned) * 0.6,
    });
    ring(context, at, size * (0.9 + turned * 1.4), {
      color: POWDER_VIOLET,
      alpha: decay(turned),
      width: 2.4 * stage.scale,
    });
    for (let glint = 0; glint < 6; glint += 1) {
      const twinkle = (turned * 2.2 + noise(seed, glint + 60)) % 1;

      star(
        context,
        [
          at[0] + spread(seed, glint + 70) * size * 1.6,
          at[1] + spread(seed, glint + 80) * size * 1.3,
        ],
        size * 0.35,
        glint,
        { color: POWDER_GLITTER, alpha: swell(twinkle) * decay(turned * 0.8) },
      );
    }
  },

  // A teacup on its saucer by the caster, a berry popped into it,
  // the cup tipping and the tea pouring out with steam, and a warm
  // cosy glow round the caster
  Teatime(context, stage, share, { seed, weight }) {
    const at = stage.source;
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const cup: Point = [at[0] + size * 1.5, at[1] - size * 1.4];
    const shown = Math.min(1, share * 10) * late(share, 0.8);
    const tip = Math.min(1, Math.max(0, (share - TEA_BERRY_IN) / (TEA_TIPPED - TEA_BERRY_IN)));
    const tilt = -tip * 1.1;
    const pour = Math.max(0, (share - TEA_BERRY_IN - 0.08) / 0.4);

    teacup(context, cup, size * 0.6, tilt, decay(pour), shown);
    for (let wisp = 0; wisp < 3; wisp += 1) {
      const rise = (share * 1.6 + wisp / 3) % 1;
      const points: Point[] = [];

      for (let step = 0; step <= 5; step += 1) {
        points.push([
          cup[0] + (wisp - 1) * size * 0.2 + Math.sin(step + share * 14 + wisp) * size * 0.1,
          cup[1] - size * 0.5 - rise * size * 1.2 - step * size * 0.14,
        ]);
      }
      strokeThrough(context, points, 1.8 * stage.scale, TEA_STEAM, swell(rise) * shown * 0.8);
    }
    if (share < TEA_BERRY_IN) {
      const pop = share / TEA_BERRY_IN;
      const from: Point = [cup[0] + size * 1.6, cup[1] - size * 0.4];
      const spot = between(from, [cup[0], cup[1] - size * 0.3], pop);

      berry(
        context,
        [spot[0], spot[1] - swell(pop) * size * 1.4],
        size * 0.22,
        BERRY_COLOURS[0],
        1,
      );
    } else {
      ring(context, [cup[0], cup[1] - size * 0.3], size * (0.3 + tip * 0.6), {
        color: TEA_BROWN,
        alpha: decay(tip * 2),
        width: 1.6 * stage.scale,
      });
    }
    if (pour > 0 && pour < 1) {
      // The cup's left lip, turned with the cup about its foot
      const [dx, dy] = [-size * 0.48, -size * 0.63];
      const lip: Point = [
        cup[0] + dx * Math.cos(tilt) - dy * Math.sin(tilt),
        cup[1] + size * 0.33 + dx * Math.sin(tilt) + dy * Math.cos(tilt),
      ];
      const land: Point = [at[0] + size * 0.3, at[1] - size * 0.4];

      strokeThrough(
        context,
        [lip, [lip[0] - size * 0.2, lip[1] + size * 0.4], between(lip, land, 0.7), land],
        3 * stage.scale,
        TEA_BROWN,
        swell(pour),
        mix(TEA_BROWN, '#000000', 0.4),
      );
    }
    const cosy = Math.max(0, (share - 0.35) / 0.65);

    if (cosy <= 0) {
      return;
    }
    orb(context, at, size * (1.2 + cosy * 0.6), { color: TEA_GLOW, alpha: swell(cosy) * 0.6 });
    motes(context, at, size * 1.8, many(8, weight), seed, cosy, {
      color: lighten(TEA_GLOW, 0.3),
      alpha: decay(cosy),
      width: 2.4 * stage.scale,
    });
  },

  // Eight orange arms curling in from all round and wrapping it,
  // their suckers showing, then squeezing tight in pulses
  Octolock(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const wrap = Math.min(1, share / OCTO_WRAPPED);
    const shown = late(share, 0.78);
    const squeeze =
      share > OCTO_WRAPPED ? Math.abs(Math.sin((share - OCTO_WRAPPED) * 22)) * 0.18 : 0;

    for (let arm = 0; arm < OCTO_ARMS; arm += 1) {
      const start = (arm / OCTO_ARMS) * Math.PI * 2 + noise(seed, arm) * 0.3;
      const way = arm % 2 === 0 ? 1 : -1;
      const points: Point[] = [];
      const steps = Math.max(2, Math.ceil(wrap * 14));

      for (let step = 0; step <= steps; step += 1) {
        const along = (step / 14) * Math.min(1, wrap * 1.2);
        const out = size * (2.8 - Math.min(1, along * 1.6) * (1.7 + squeeze));
        const angle = start + along * Math.PI * 1.3 * way;

        points.push([at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out * 0.85]);
      }
      // Tapering towards the tip, segment by segment
      for (let step = 0; step < points.length - 1; step += 1) {
        strokeThrough(
          context,
          [points[step], points[step + 1]],
          size * 0.34 * (1 - (step / 14) * 0.65),
          OCTO_ORANGE,
          shown,
          OCTO_DARK,
        );
      }
      for (let sucker = 2; sucker < points.length - 1; sucker += 3) {
        ring(context, points[sucker], size * 0.08, {
          color: OCTO_SUCKER,
          alpha: shown,
          width: 1.4 * stage.scale,
        });
      }
    }
    if (share < OCTO_WRAPPED) {
      return;
    }
    const hold = (share - OCTO_WRAPPED) / (1 - OCTO_WRAPPED);

    ring(context, at, size * (1.2 - squeeze), {
      color: OCTO_ORANGE,
      alpha: squeeze * 4 * shown,
      width: 3 * stage.scale,
    });
    burst(context, at, size * 1.6, 8, seed + Math.floor(hold * 6), {
      color: OCTO_SUCKER,
      alpha: squeeze * 4 * shown,
      width: 2 * stage.scale,
    });
  },

  // A football flicked across the field in a high arc, a whistle's
  // flash, and the two halves under each side swapping colours
  Court(context, stage, share, { seed, weight }) {
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const near: Point = [stage.source[0], stage.source[1] + size * 0.6];
    const far = farSide(stage, size);
    const across: Point = [far[0], far[1] + size * 0.6];
    const swap = Math.min(1, Math.max(0, (share - COURT_LANDS) / (COURT_SWAPPED - COURT_LANDS)));
    const shown = Math.min(1, share * 10) * late(share, 0.8);

    for (const [index, foot] of [near, across].entries()) {
      const [from, to] = index === 0 ? [COURT_BLUE, COURT_RED] : [COURT_RED, COURT_BLUE];
      const color = mix(from, to, swap);

      context.beginPath();
      context.ellipse(foot[0], foot[1], size * 2, size * 0.68, 0, 0, Math.PI * 2);
      context.fillStyle = fade(color, shown * 0.35);
      context.fill();
      ripple(context, foot, size * 2, { color, alpha: shown, width: 3 * stage.scale });
    }
    strokeThrough(
      context,
      [between(near, across, 0.47), between(near, across, 0.53)],
      size * 0.08,
      BALL_WHITE,
      shown * 0.6,
    );
    if (share < COURT_LANDS) {
      const flight = share / COURT_LANDS;
      const spot = between(stage.source, far, flight);

      football(
        context,
        [spot[0], spot[1] - swell(flight) * size * 3],
        size * 0.4,
        flight * Math.PI * 6,
        1,
      );
      return;
    }
    const blown = (share - COURT_LANDS) / (1 - COURT_LANDS);
    const middle = between(stage.source, far, 0.5);

    orb(context, middle, size * (0.6 + blown * 1.2), {
      color: WHISTLE_FLASH,
      alpha: decay(blown * 2.5),
    });
    star(context, middle, size * (0.8 + swell(Math.min(1, blown * 3)) * 0.6), blown * 2, {
      color: '#ffffff',
      alpha: decay(blown * 2),
    });
    burst(context, middle, size * (1 + blown * 1.4), 10, seed, {
      color: WHISTLE_FLASH,
      alpha: decay(blown * 1.5),
      width: 2.2 * stage.scale,
    });
    football(context, [far[0], far[1] + size * 0.2], size * 0.4, Math.PI * 6, late(blown, 0.3));
  },

  // Cream piped round it in a rising swirl, cherries, strawberries
  // and stars popping on along it, and a sweet sparkle
  Decorate(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const piped = Math.min(1, share / DECORATE_PIPED);
    const shown = late(share, 0.8);
    const along = (part: number): Point => {
      const angle = part * Math.PI * 2 * 2.5;

      return [
        at[0] + Math.cos(angle) * size * 1.3,
        at[1] + size * 0.9 - part * size * 2.2 + Math.sin(angle) * size * 0.3,
      ];
    };
    const points: Point[] = [];

    for (let step = 0; step <= Math.ceil(piped * 50); step += 1) {
      points.push(along(Math.min(piped, step / 50)));
    }
    strokeThrough(context, points, size * 0.26, CREAM_WHITE, shown, CREAM_PINK);
    strokeThrough(context, points, size * 0.07, '#ffffff', shown * 0.8);
    if (piped < 1) {
      orb(context, points[points.length - 1], size * 0.3, { color: '#ffffff', alpha: 1 });
    }
    for (let sweet = 0; sweet < DECORATE_SWEETS; sweet += 1) {
      const part = (sweet + 0.5) / DECORATE_SWEETS;
      const pop = Math.min(1, (piped - part) * 8);

      if (pop <= 0) {
        continue;
      }
      const [x, y] = along(part);
      const grow = pop + swell(pop) * 0.4;
      const spot: Point = [x, y - size * 0.25];

      if (sweet % 3 === 0) {
        blob(context, spot, size * 0.22 * grow, size * 0.22 * grow, CHERRY_RED, shown, SWEET_SHADE);
        strokeThrough(
          context,
          [spot, [spot[0] + size * 0.15, spot[1] - size * 0.45 * grow]],
          1.4 * stage.scale,
          BERRY_LEAF,
          shown,
        );
      } else if (sweet % 3 === 1) {
        petal(context, spot, size * 0.3 * grow, Math.PI, { color: CHERRY_RED, alpha: shown });
        petal(context, [spot[0], spot[1] - size * 0.28 * grow], size * 0.12 * grow, Math.PI / 2, {
          color: BERRY_LEAF,
          alpha: shown,
        });
      } else {
        star(context, spot, size * 0.32 * grow, -Math.PI / 2, { color: SWEET_SHADE, alpha: shown });
        star(context, spot, size * 0.24 * grow, -Math.PI / 2, { color: SWEET_STAR, alpha: shown });
      }
    }
    const sparkle = Math.max(0, (share - 0.4) / 0.6);

    for (let glint = 0; glint < 5; glint += 1) {
      const twinkle = (sparkle * 2 + noise(seed, glint)) % 1;

      star(
        context,
        [
          at[0] + spread(seed, glint + 10) * size * 1.6,
          at[1] + spread(seed, glint + 20) * size * 1.4,
        ],
        size * 0.4,
        glint,
        { color: '#ffffff', alpha: swell(twinkle) * Math.min(1, sparkle * 4) * shown },
      );
    }
  },

  // A great tree-stump drum by the caster pounded in beats, each beat
  // a wave rolling over the ground, and roots bursting up under it
  Drumming(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const drum: Point = [stage.source[0] - size * 1.6, stage.source[1] + size * 0.4];
    const drumFoot: Point = [drum[0], drum[1] + size * 0.7];
    const foot: Point = [at[0], at[1] + size * 0.8];
    const shown = Math.min(1, share * 12) * late(share, 0.6);
    let squash = 0;

    for (let beat = 0; beat < DRUM_BEATS; beat += 1) {
      const since = share - beat * DRUM_GAP;

      if (since >= 0 && since < 0.06) {
        squash = Math.max(squash, decay(since / 0.06));
      }
    }
    const top: Point = [drum[0], drum[1] - size * 0.6 + squash * size * 0.15];

    // The stump: its bark, then its ringed top
    context.fillStyle = fade(STUMP_BROWN, shown);
    context.fillRect(drum[0] - size, top[1], size * 2, drumFoot[1] - top[1]);
    context.strokeStyle = fade(STUMP_DARK, shown);
    context.lineWidth = Math.max(1, size * 0.1);
    context.strokeRect(drum[0] - size, top[1], size * 2, drumFoot[1] - top[1]);
    blob(context, top, size * 1.05, size * 0.36, STUMP_RINGS, shown, STUMP_DARK);
    for (let band = 1; band < 3; band += 1) {
      context.beginPath();
      context.ellipse(top[0], top[1], size * 0.33 * band, size * 0.11 * band, 0, 0, Math.PI * 2);
      context.strokeStyle = fade(STUMP_BROWN, shown);
      context.lineWidth = Math.max(1, size * 0.06);
      context.stroke();
    }
    // The sticks, coming down on each beat
    const lift = decay(squash) * size * 0.9;

    for (const side of [-1, 1]) {
      strokeThrough(
        context,
        [
          [top[0] + side * size * 1.4, top[1] - size * 0.8 - lift],
          [top[0] + side * size * 0.35, top[1] - size * 0.05 - lift * 0.3],
        ],
        size * 0.16,
        STUMP_BROWN,
        shown,
        STUMP_DARK,
      );
    }
    for (let beat = 0; beat < DRUM_BEATS; beat += 1) {
      const travel = (share - beat * DRUM_GAP) / 0.3;

      if (travel < 0 || travel > 1) {
        continue;
      }
      ring(context, top, size * (0.8 + travel * 1.6), {
        color: ROOT_LEAF,
        alpha: decay(travel * 1.6),
        width: 2.6 * stage.scale,
      });
      ripple(context, between(drumFoot, foot, travel), size * (0.9 + travel * 0.6), {
        color: lighten(ROOT_LEAF, 0.2),
        alpha: swell(travel),
        width: 3 * stage.scale,
      });
    }
    if (share < DRUM_ROOTS) {
      return;
    }
    const burstOut = (share - DRUM_ROOTS) / (1 - DRUM_ROOTS);
    const held = late(burstOut, 0.6);

    for (let root = 0; root < 5; root += 1) {
      const rise = Math.min(1, Math.max(0, (burstOut - root * 0.05) / 0.25));

      if (rise <= 0) {
        continue;
      }
      const base: Point = [
        foot[0] + (root - 2) * size * 0.65 + spread(seed, root) * size * 0.2,
        foot[1] + spread(seed, root + 10) * size * 0.25,
      ];
      const lean = (root - 2) * 0.25 + spread(seed, root + 20) * 0.3;
      const height = size * (1.6 + noise(seed, root + 30) * 1.2) * rise;
      const points: Point[] = [];

      for (let step = 0; step <= 5; step += 1) {
        const up = step / 5;

        points.push([base[0] + Math.sin(up * 2.2) * lean * height * 0.5, base[1] - up * height]);
      }
      strokeThrough(context, points, size * 0.32, ROOT_BROWN, held, STUMP_DARK);
      petal(context, points[points.length - 1], size * 0.3, lean, {
        color: ROOT_LEAF,
        alpha: held,
      });
    }
    motes(context, foot, size * 2.2, many(12, weight), seed + 1, burstOut, {
      color: STUMP_BROWN,
      alpha: decay(burstOut),
      width: 3 * stage.scale,
    });
  },

  // A pebble kicked up that bursts into a flaming football, blazing
  // across the gap in an arc, then bursting into flames on it
  Pyroball(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const kick: Point = [stage.source[0] + size * 0.5, stage.source[1] + size * 0.5];
    const height = size * 4;
    const flightOf = (when: number): Point => {
      const flight = Math.min(1, Math.max(0, (when - PYRO_CATCHES) / (PYRO_LANDS - PYRO_CATCHES)));
      const spot = between(kick, at, flight);

      return [spot[0], spot[1] - swell(flight) * height];
    };

    if (share < PYRO_CATCHES) {
      const catching = share / PYRO_CATCHES;

      orb(context, kick, size * (0.4 + catching * 0.6), {
        color: PYRO_FLAME,
        alpha: catching,
      });
      blob(context, kick, size * 0.3, size * 0.26, PYRO_PEBBLE, 1, BALL_DARK);
      return;
    }
    if (share < PYRO_LANDS) {
      // The flames trailing behind, oldest smallest
      for (let flame = 5; flame >= 1; flame -= 1) {
        const back = flightOf(share - flame * 0.025);

        orb(context, back, size * (0.7 - flame * 0.1), {
          color: flame > 2 ? PYRO_FLAME : PYRO_HOT,
          alpha: 0.9 - flame * 0.12,
        });
      }
      const spot = flightOf(share);

      orb(context, spot, size * 0.9, { color: PYRO_FLAME, alpha: 0.9 });
      football(context, spot, size * 0.42, share * 40, 1);
      return;
    }
    const hit = (share - PYRO_LANDS) / (1 - PYRO_LANDS);

    orb(context, at, size * (1.2 + hit * 1.6), { color: PYRO_HOT, alpha: decay(hit * 1.6) });
    orb(context, at, size * (1.6 + hit * 1.6), { color: PYRO_FLAME, alpha: decay(hit) * 0.8 });
    ring(context, at, size * (1 + hit * 2.6), {
      color: PYRO_HOT,
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    for (let flame = 0; flame < many(6, weight); flame += 1) {
      const rise = (hit * 1.4 + noise(seed, flame)) % 1;

      petal(
        context,
        [at[0] + spread(seed, flame + 10) * size * 1.4, at[1] - rise * size * 1.8],
        size * 0.5 * decay(rise),
        0,
        { color: flame % 2 === 0 ? PYRO_FLAME : PYRO_HOT, alpha: decay(hit) },
      );
    }
    burst(context, at, size * (1.6 + hit * 2), 12, seed + 1, {
      color: PYRO_HOT,
      alpha: decay(hit),
      width: 2.6 * stage.scale,
    });
    motes(context, at, size * 3, many(12, weight), seed + 2, hit, {
      color: PYRO_FLAME,
      alpha: decay(hit),
      width: 2.6 * stage.scale,
    });
  },
} satisfies Partial<Record<EffectShape, ShapePainter>>;

export default galarSignatures;
