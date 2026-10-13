import type { Point, Stage } from '../../stage';
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
  petal,
  ring,
  ripple,
  shards,
  spread,
  star,
  swell,
} from '../__paint';
import { SIGNATURE_SCALE } from './galar';
import type { EffectShape, ShapePainter } from './shapes';
import { REACH, landing, many } from './shapes';

/** Syrup Bomb: the share the candy apple has landed by */
export const SYRUP_LANDS = 0.35;

/** The apple's candy red, the syrup's amber and its gloss */
export const SYRUP_APPLE = '#d8342e';
export const SYRUP_AMBER = '#e8961e';
export const SYRUP_GLOSS = '#ffd98a';
export const APPLE_LEAF = '#4fae3a';

/** Electro Shot: the share the charge has built up by before the beam fires */
export const ELECTRO_CHARGES = 0.4;

/** Archaludon's steel blue and the lightning laced through its beam */
export const ELECTRO_STEEL = '#4a78b8';
export const ELECTRO_YELLOW = '#ffe24a';

/** Fickle Beam: the share the beams have reached the target by, and how many heads fire */
export const FICKLE_LANDS = 0.4;
export const FICKLE_HEADS = 4;

/** Hydrapple's green beams, the one that swells, and the dragon light under them */
export const FICKLE_GREEN = '#6ad24a';
export const FICKLE_GOLD = '#ffcf4a';
export const FICKLE_DRAGON = '#7a4cff';

/** Burning Bulwark: the share the wall of fire has risen by, and how many spikes it has */
export const FIREWALL_RISES = 0.35;
export const FIREWALL_SPIKES = 7;

/** The wall's scorched red, its flames' gold and the glow behind it */
export const FIREWALL_RED = '#e8442a';
export const FIREWALL_GOLD = '#ffb02e';
export const FIREWALL_DARK = '#7a1e12';

/** Thunderclap: the share the bolt has struck down by */
export const CLAP_STRIKES = 0.12;

/** Raging Bolt's thunder: yellow, with violet round it */
export const CLAP_YELLOW = '#ffe04a';
export const CLAP_VIOLET = '#8a5cff';

/** Mighty Cleave: the share the blade has come down onto the shield by */
export const CLEAVE_FALLS = 0.3;

/** The blade's white light, its blue edge, the split shield and the rock thrown off */
export const CLEAVE_LIGHT = '#eef6ff';
export const CLEAVE_BLUE = '#6ab8ff';
export const CLEAVE_SHIELD = '#7affc0';
export const CLEAVE_ROCK = '#8a6a4a';

/** Tachyon Cutter: when each blade leaves, and the share of the span each takes to cross */
export const TACHYON_LEAVES = [0, 0.25];
export const TACHYON_FLIGHT = 0.35;

/** The particle blades' cyan and the white of their edge */
export const TACHYON_CYAN = '#4ae8ff';
export const TACHYON_WHITE = '#eaffff';

/** Psyblade: the share the blade has cut across by */
export const PSYBLADE_CUTS = 0.3;

/** The blade's neon pink, its pale core and the grid behind it */
export const PSY_PINK = '#ff3ab4';
export const PSY_NEON = '#ffb4f0';
export const PSY_GRID = '#c070ff';

/** Hydro Steam: the share the jet has reached the target by */
export const STEAM_LANDS = 0.3;

/** The boiling water, the steam off it and the warm glare of the sun on it */
export const STEAM_BLUE = '#3a9aff';
export const STEAM_WHITE = '#f2f6ff';
export const STEAM_GLARE = '#ffb070';

/** Chilly Reception: the share the speech bubble has frozen over by */
export const RECEPTION_FREEZES = 0.4;

/** The bubble's paper white, its ink, and the ice it freezes into */
export const RECEPTION_PAPER = '#ffffff';
export const RECEPTION_INK = '#3a4a6a';
export const RECEPTION_ICE = '#8ad8ff';

/** The Torques: the share the wheel has rolled into the target by, and how many spokes it has */
export const TORQUE_LANDS = 0.4;
export const TORQUE_SPOKES = 5;

/** The tyre under every Starmobile wheel */
export const TORQUE_TYRE = '#1e1a22';

/** Blazing Torque's fire wheel and its flame */
export const BLAZING_RED = '#ff5a1e';
export const BLAZING_FLAME = '#ffb02e';

/** Wicked Torque's dark wheel, its black smoke and the red sparks off it */
export const WICKED_DARK = '#5a3a6a';
export const WICKED_SMOKE = '#1a141e';
export const WICKED_SPARK = '#ff3a3a';

/** Noxious Torque's purple wheel and its toxic green fumes */
export const NOXIOUS_PURPLE = '#a63ae0';
export const NOXIOUS_FUMES = '#9aff5a';

/** Combat Torque's orange wheel and the dust off it */
export const COMBAT_ORANGE = '#ff8a2a';
export const COMBAT_DUST = '#c8a882';

/** Magical Torque's pink wheel and its sparkles */
export const MAGICAL_PINK = '#ff7ac8';
export const MAGICAL_SPARKLE = '#fff0a0';

/** What a Starmobile wheel is painted in */
interface Torque {
  rim: string;
  exhaust: string;
  /** How thick the exhaust hangs, from 0 to 1 */
  fumes: number;
}

/** Where a Torque has got to: rolling in at `head`, or `hit` from 0 once it has landed */
interface Rolled {
  at: Point;
  size: number;
  head: Point;
  run: number;
  hit: number;
}

/** A candy apple: red and glossy, with a stem and a leaf */
function apple(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  radius: number,
  turn: number,
  alpha: number,
): void {
  context.beginPath();
  context.ellipse(x, y, radius, radius * 0.92, 0, 0, Math.PI * 2);
  context.fillStyle = fade(SYRUP_APPLE, alpha);
  context.fill();
  context.strokeStyle = fade(SYRUP_AMBER, alpha);
  context.lineWidth = Math.max(1, radius * 0.18);
  context.stroke();
  context.beginPath();
  context.ellipse(
    x - radius * 0.35,
    y - radius * 0.35,
    radius * 0.25,
    radius * 0.18,
    -0.6,
    0,
    Math.PI * 2,
  );
  context.fillStyle = fade('#ffffff', alpha * 0.8);
  context.fill();
  petal(context, [x + radius * 0.4, y - radius * 1.05], radius * 0.4, 0.9 + Math.sin(turn) * 0.2, {
    color: APPLE_LEAF,
    alpha,
  });
}

/** A hexagon shield, whole or only one half of it (`keep` -1 for left, 1 for right) */
function shield(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  radius: number,
  keep: -1 | 0 | 1,
  alpha: number,
): void {
  context.save();
  if (keep !== 0) {
    context.beginPath();
    context.rect(keep < 0 ? x - radius * 2 : x, y - radius * 2, radius * 2, radius * 4);
    context.clip();
  }
  context.beginPath();
  for (let corner = 0; corner < 6; corner += 1) {
    const angle = Math.PI / 6 + (corner / 6) * Math.PI * 2;

    context[corner === 0 ? 'moveTo' : 'lineTo'](
      x + Math.cos(angle) * radius,
      y + Math.sin(angle) * radius,
    );
  }
  context.closePath();
  context.fillStyle = fade(CLEAVE_SHIELD, alpha * 0.3);
  context.fill();
  context.strokeStyle = fade(CLEAVE_SHIELD, alpha);
  context.lineWidth = Math.max(1.5, radius * 0.08);
  context.stroke();
  context.restore();
}

/** A six-armed snowflake */
function snowflake(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  turn: number,
  alpha: number,
): void {
  context.strokeStyle = fade('#ffffff', alpha);
  context.lineWidth = Math.max(1, size * 0.2);
  context.lineCap = 'round';
  context.beginPath();
  for (let arm = 0; arm < 3; arm += 1) {
    const angle = turn + (arm / 3) * Math.PI;

    context.moveTo(x - Math.cos(angle) * size, y - Math.sin(angle) * size);
    context.lineTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
  }
  context.stroke();
  context.lineCap = 'butt';
}

/** A Starmobile wheel: a dark tyre, a coloured rim, spokes turned by `turn` and a lit hub */
function wheel(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  radius: number,
  turn: number,
  rim: string,
  alpha: number,
): void {
  context.beginPath();
  context.ellipse(x, y, radius, radius, 0, 0, Math.PI * 2);
  context.strokeStyle = fade(TORQUE_TYRE, alpha);
  context.lineWidth = radius * 0.4;
  context.stroke();
  context.strokeStyle = fade(rim, alpha);
  context.lineWidth = radius * 0.16;
  context.stroke();
  context.strokeStyle = fade(lighten(rim, 0.3), alpha);
  context.lineWidth = Math.max(1, radius * 0.12);
  context.beginPath();
  for (let spoke = 0; spoke < TORQUE_SPOKES; spoke += 1) {
    const angle = turn + (spoke / TORQUE_SPOKES) * Math.PI * 2;

    context.moveTo(x, y);
    context.lineTo(x + Math.cos(angle) * radius * 0.85, y + Math.sin(angle) * radius * 0.85);
  }
  context.stroke();
  orb(context, [x, y], radius * 0.35, { color: rim, alpha });
}

/**
 * The frame every Torque shares: a spinning wheel rolling in from the
 * caster with its exhaust trailing, then spinning out on the target
 * under a shock ring. Each Torque draws its own flavour over it
 */
function torque(
  context: CanvasRenderingContext2D,
  stage: Stage,
  share: number,
  seed: number,
  weight: number,
  look: Torque,
): Rolled {
  const at = landing(stage);
  const size = REACH * stage.scale * weight;
  const run = Math.min(1, share / TORQUE_LANDS) ** 1.3;
  const head = between(stage.source, at, run);
  const hit = share < TORQUE_LANDS ? -1 : (share - TORQUE_LANDS) / (1 - TORQUE_LANDS);

  // Exhaust left behind along the road, thinning the older it is
  for (let puff = 1; puff <= 6; puff += 1) {
    const back = run - puff * 0.07;

    if (back < 0) {
      break;
    }
    orb(
      context,
      between(stage.source, at, back),
      size * (0.5 + puff * 0.14 + noise(seed, puff) * 0.2),
      { color: look.exhaust, alpha: look.fumes * (1 - puff / 7) * late(share, 0.55) },
    );
  }
  if (hit < 0) {
    edge(context, between(stage.source, at, Math.max(0, run - 0.3)), head, size * 0.5, 0, {
      color: look.rim,
      alpha: 0.5,
    });
    wheel(context, head, size * 1.1, share * 40, look.rim, 1);
    return { at, size, head, run, hit };
  }
  wheel(context, at, size * (1.1 + hit * 0.3), share * 60, look.rim, decay(hit * 1.6));
  ring(context, at, size * (1 + hit * 3), {
    color: lighten(look.rim, 0.3),
    alpha: decay(hit),
    width: 3 * stage.scale,
  });
  return { at, size, head, run, hit };
}

const paldeaLate = {
  // A candy apple lobbed onto it and bursting into amber syrup, which
  // runs down it in sticky strands
  Syrup(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    if (share < SYRUP_LANDS) {
      const lob = share / SYRUP_LANDS;
      const flat = between(stage.source, at, lob);
      const head: Point = [flat[0], flat[1] - Math.sin(Math.PI * lob) * size * 3];

      apple(context, head, size * 0.75, lob * 6, 1);
      motes(context, head, size * 0.9, 5, seed, lob, { color: SYRUP_AMBER, alpha: 0.7 });
      return;
    }
    const hit = (share - SYRUP_LANDS) / (1 - SYRUP_LANDS);
    const stuck = late(hit, 0.5);
    const foot: Point = [at[0], at[1] + size * 0.9];

    orb(context, at, size * (0.8 + hit * 1.6), { color: SYRUP_GLOSS, alpha: decay(hit * 2) });
    ripple(context, foot, size * (1 + Math.min(1, hit * 2) * 0.8), {
      color: SYRUP_AMBER,
      alpha: stuck * 0.8,
      width: 4 * stage.scale,
    });
    for (let blob = 0; blob < many(8, weight); blob += 1) {
      const angle = noise(seed, blob) * Math.PI * 2;
      const out = size * (0.6 + Math.min(1, hit * 3) * (0.8 + noise(seed, blob + 20)));

      orb(
        context,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out * 0.8],
        size * 0.4,
        {
          color: SYRUP_AMBER,
          alpha: stuck,
        },
      );
    }
    // The strands, stretching as the syrup runs down
    for (let strand = 0; strand < 5; strand += 1) {
      const x = at[0] + spread(seed, strand + 10) * size * 1.4;
      const top = at[1] - size * (0.8 - noise(seed, strand + 30) * 0.4);
      const bottom = top + size * (0.5 + noise(seed, strand + 50)) * (0.4 + hit * 1.4);

      edge(context, [x, top], [x, bottom], size * 0.16, 0, { color: SYRUP_AMBER, alpha: stuck });
      orb(context, [x, bottom], size * 0.26, { color: SYRUP_AMBER, alpha: stuck });
      orb(context, [x - size * 0.06, bottom - size * 0.08], size * 0.1, {
        color: SYRUP_GLOSS,
        alpha: stuck,
      });
    }
  },

  // A steel-blue core charging over it, then a beam laced with
  // lightning slamming into it and a ring going out
  Electroshot(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const core: Point = [at[0], at[1] - size * 2.4];
    const flick = Math.floor(share * 16);

    if (share < ELECTRO_CHARGES) {
      const charge = share / ELECTRO_CHARGES;

      orb(context, core, size * (0.6 + charge * 0.9), { color: ELECTRO_STEEL, alpha: 1 });
      orb(context, core, size * (0.3 + charge * 0.4), { color: ELECTRO_YELLOW, alpha: 0.9 });
      ring(context, core, size * (2.4 - charge * 1.6), {
        color: ELECTRO_STEEL,
        alpha: 0.4 + charge * 0.6,
        width: 2 * stage.scale,
      });
      for (let arc = 0; arc < 3; arc += 1) {
        const angle = noise(seed + flick, arc) * Math.PI * 2;
        const out = size * (0.8 + charge);

        bolt(
          context,
          core,
          [core[0] + Math.cos(angle) * out, core[1] + Math.sin(angle) * out],
          seed + flick * 3 + arc,
          { color: ELECTRO_YELLOW, alpha: 0.9, width: 1.6 * stage.scale },
        );
      }
      return;
    }
    const hit = (share - ELECTRO_CHARGES) / (1 - ELECTRO_CHARGES);
    const firing = late(hit, 0.4);
    const reach = Math.min(1, hit * 4);
    const head = between(stage.source, at, reach);

    orb(context, core, size * 1.5 * decay(hit * 3), { color: ELECTRO_STEEL, alpha: 1 });
    beam(context, stage.source, at, reach, size * 1.2, { color: ELECTRO_STEEL, alpha: firing });
    for (let arc = 0; arc < 3; arc += 1) {
      bolt(context, stage.source, head, seed + flick * 5 + arc, {
        color: ELECTRO_YELLOW,
        alpha: firing,
        width: 1.8 * stage.scale,
      });
    }
    if (reach < 1) {
      return;
    }
    const slam = (hit - 0.25) / 0.75;

    orb(context, at, size * (1.2 + slam * 1.8), {
      color: ELECTRO_YELLOW,
      alpha: decay(slam * 1.5),
    });
    ring(context, at, size * (1 + slam * 3.4), {
      color: ELECTRO_STEEL,
      alpha: decay(slam),
      width: 4 * stage.scale,
    });
    burst(context, at, size * (1.4 + slam * 1.8), 10, seed + 1, {
      color: ELECTRO_YELLOW,
      alpha: decay(slam),
      width: 2.4 * stage.scale,
    });
  },

  // A beam from each of Hydrapple's heads, fanned out and meeting on
  // it, one of them swelling far bigger than the rest
  Fickle(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const run = Math.min(1, share / FICKLE_LANDS);
    const firing = late(share, 0.6);
    const big = Math.floor(noise(seed, 1) * FICKLE_HEADS);

    for (let head = 0; head < FICKLE_HEADS; head += 1) {
      const origin: Point = [
        stage.source[0] + (head - (FICKLE_HEADS - 1) / 2) * size * 1.3,
        stage.source[1] - size * 0.8,
      ];
      const fickle = head === big;
      const width = fickle ? size * (0.4 + Math.min(1, share / 0.5) * 1.6) : size * 0.35;
      const colour = fickle ? FICKLE_GOLD : FICKLE_GREEN;

      orb(context, origin, width * 1.2, { color: FICKLE_DRAGON, alpha: firing * 0.6 });
      beam(context, origin, at, run, width * 1.8, { color: FICKLE_DRAGON, alpha: firing * 0.4 });
      beam(context, origin, at, run, width, { color: colour, alpha: firing });
    }
    if (share < FICKLE_LANDS) {
      return;
    }
    const hit = (share - FICKLE_LANDS) / (1 - FICKLE_LANDS);

    orb(context, at, size * (1.2 + hit * 2), { color: FICKLE_GOLD, alpha: decay(hit) * 0.9 });
    ring(context, at, size * (1 + hit * 3), {
      color: FICKLE_DRAGON,
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    burst(context, at, size * (1.4 + hit * 2), 12, seed + 2, {
      color: FICKLE_GREEN,
      alpha: decay(hit),
      width: 2.4 * stage.scale,
    });
  },

  // A spiked wall of fire rising in front of it, flames licking up
  // its spikes
  Firewall(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const rise = Math.min(1, share / FIREWALL_RISES) ** 0.7;
    const shown = late(share, 0.7);
    const base = at[1] + size * 0.7;

    orb(context, [at[0], base - size], size * 2.6, { color: FIREWALL_RED, alpha: shown * 0.35 });
    ripple(context, [at[0], base], size * 2.8, {
      color: FIREWALL_GOLD,
      alpha: shown * 0.7,
      width: 3 * stage.scale,
    });
    for (let spike = 0; spike < FIREWALL_SPIKES; spike += 1) {
      const across = spike / (FIREWALL_SPIKES - 1) - 0.5;
      const x = at[0] + across * size * 5;
      // Tallest in the middle, ragged at the ends
      const height = size * (1.2 + Math.cos(across * Math.PI) * 1.2 + noise(seed, spike) * 0.5);
      const tip = base - height * rise;

      context.beginPath();
      context.moveTo(x - size * 0.42, base);
      context.lineTo(x, tip);
      context.lineTo(x + size * 0.42, base);
      context.closePath();
      context.fillStyle = fade(FIREWALL_DARK, shown);
      context.fill();
      context.strokeStyle = fade(FIREWALL_GOLD, shown);
      context.lineWidth = 2 * stage.scale;
      context.stroke();
      for (let lick = 0; lick < 3; lick += 1) {
        const up = (share * 2.2 + noise(seed, spike * 3 + lick)) % 1;

        orb(
          context,
          [x + spread(seed, spike * 3 + lick) * size * 0.2, base - height * rise * (0.2 + up)],
          size * 0.4 * (1 - up * 0.5),
          { color: up < 0.4 ? FIREWALL_GOLD : FIREWALL_RED, alpha: swell(up) * shown },
        );
      }
    }
  },

  // One huge bolt struck straight down onto it before anything else,
  // a white flash, and a thunder ring going out along the ground
  Clap(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const run = Math.min(1, share / CLAP_STRIKES);
    const top: Point = [at[0] + size * 0.6, at[1] - size * 9];
    const head = between(top, at, run);
    const flick = Math.floor(share * 14);
    const struck = late(share, 0.4);

    bolt(context, top, head, seed + flick, {
      color: CLAP_VIOLET,
      alpha: struck * 0.6,
      width: size * 0.7,
    });
    bolt(context, top, head, seed + flick, {
      color: CLAP_YELLOW,
      alpha: struck,
      width: size * 0.32,
    });
    bolt(context, top, head, seed + flick, { color: '#ffffff', alpha: struck, width: size * 0.12 });
    if (share < CLAP_STRIKES) {
      orb(context, head, size * 0.8, { color: '#ffffff', alpha: 1 });
      return;
    }
    const hit = (share - CLAP_STRIKES) / (1 - CLAP_STRIKES);
    const foot: Point = [at[0], at[1] + size * 0.7];

    orb(context, at, size * (1.5 + hit * 3), { color: '#ffffff', alpha: decay(hit * 3) });
    orb(context, at, size * (1 + hit * 1.4), { color: CLAP_YELLOW, alpha: decay(hit) * 0.7 });
    ripple(context, foot, size * (1 + hit * 4.5), {
      color: CLAP_YELLOW,
      alpha: decay(hit),
      width: 4 * stage.scale,
    });
    ripple(context, foot, size * (0.6 + hit * 3), {
      color: '#ffffff',
      alpha: decay(hit * 1.3),
      width: 2 * stage.scale,
    });
    for (let arc = 0; arc < 4; arc += 1) {
      const angle = (arc / 4) * Math.PI * 2 + noise(seed, arc) * 0.6;
      const out = size * (1.2 + hit * 2);

      bolt(
        context,
        foot,
        [foot[0] + Math.cos(angle) * out, foot[1] + Math.sin(angle) * out * 0.34],
        seed + arc + flick,
        { color: CLAP_YELLOW, alpha: decay(hit), width: 2 * stage.scale },
      );
    }
  },

  // A blade of light coming down in one line straight through it,
  // splitting the shield in front of it in two and throwing off rock
  Cleave(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const top: Point = [at[0] + size * 0.3, at[1] - size * 6];
    const bottom: Point = [at[0] - size * 0.15, at[1] + size * 2.4];
    // The shield stands at about this share of the blade's line
    const meets = 0.7;

    if (share < CLEAVE_FALLS) {
      const fall = (share / CLEAVE_FALLS) ** 1.6 * meets;

      shield(context, at, size * 1.7, 0, Math.min(1, share * 8));
      edge(
        context,
        between(top, bottom, Math.max(0, fall - 0.4)),
        between(top, bottom, fall),
        size * 0.7,
        0,
        {
          color: CLEAVE_BLUE,
          alpha: 0.6,
        },
      );
      edge(
        context,
        between(top, bottom, Math.max(0, fall - 0.4)),
        between(top, bottom, fall),
        size * 0.3,
        0,
        {
          color: CLEAVE_LIGHT,
          alpha: 1,
        },
      );
      return;
    }
    const cut = (share - CLEAVE_FALLS) / (1 - CLEAVE_FALLS);
    const apart = size * cut * 1.6;

    shield(context, [at[0] - apart, at[1] + apart * 0.4], size * 1.7, -1, decay(cut));
    shield(context, [at[0] + apart, at[1] + apart * 0.4], size * 1.7, 1, decay(cut));
    edge(context, top, bottom, size * 0.8 * decay(cut), 0, { color: CLEAVE_BLUE, alpha: 0.7 });
    edge(context, top, bottom, size * 0.35 * decay(cut), 0, { color: CLEAVE_LIGHT, alpha: 1 });
    orb(context, at, size * (1 + cut * 1.6), { color: CLEAVE_LIGHT, alpha: decay(cut * 2) });
    shards(context, at, size * 3, many(14, weight), seed, cut, {
      color: CLEAVE_ROCK,
      alpha: decay(cut),
      width: 4 * stage.scale,
    });
  },

  // Two thin particle blades shot in on trails of light, crossing on
  // it one after the other and leaving their cuts glowing
  Tachyon(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const glowing = late(share, 0.75);

    for (const [blade, leave] of TACHYON_LEAVES.entries()) {
      if (share < leave) {
        continue;
      }
      // The first comes up from the lower left, the second from the lower right
      const angle = blade === 0 ? -0.6 : Math.PI + 0.6;
      const way: Point = [Math.cos(angle), Math.sin(angle)];
      const start: Point = [at[0] - way[0] * size * 6, at[1] - way[1] * size * 6];
      const end: Point = [at[0] + way[0] * size * 2.5, at[1] + way[1] * size * 2.5];
      const flight = Math.min(1, (share - leave) / TACHYON_FLIGHT) ** 1.2;
      // Where on its line the blade passes through the target
      const through = 6 / 8.5;
      const passed = Math.max(0, (flight - through) / (1 - through));

      if (flight < 1) {
        const head = between(start, end, flight);

        edge(context, between(start, end, Math.max(0, flight - 0.45)), head, size * 0.14, 0, {
          color: TACHYON_CYAN,
          alpha: 0.6,
        });
        edge(context, between(start, end, Math.max(0, flight - 0.1)), head, size * 0.3, 0, {
          color: TACHYON_WHITE,
          alpha: 1,
        });
        orb(context, head, size * 0.4, { color: TACHYON_CYAN, alpha: 1 });
      }
      if (passed > 0) {
        const cutFrom: Point = [at[0] - way[0] * size * 1.8, at[1] - way[1] * size * 1.8];
        const cutTo: Point = [at[0] + way[0] * size * 1.8, at[1] + way[1] * size * 1.8];

        edge(context, cutFrom, cutTo, size * 0.4, 0, { color: TACHYON_CYAN, alpha: glowing * 0.6 });
        edge(context, cutFrom, cutTo, size * 0.16, 0, { color: TACHYON_WHITE, alpha: glowing });
        burst(context, at, size * (1 + passed * 0.8), 8, seed + blade, {
          color: TACHYON_CYAN,
          alpha: decay(passed),
          width: 2 * stage.scale,
        });
      }
    }
  },

  // A neon pink blade slashed across it in front of a faint grid of
  // light, the cut glowing and then breaking up into pixels
  Psyblade(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const shown = Math.min(1, share * 6) * late(share, 0.75);
    const from: Point = [at[0] - size * 2.4, at[1] + size * 1.2];
    const to: Point = [at[0] + size * 2.4, at[1] - size * 1.4];

    context.strokeStyle = fade(PSY_GRID, shown * 0.35);
    context.lineWidth = Math.max(1, stage.scale);
    context.beginPath();
    for (let line = -3; line <= 3; line += 1) {
      context.moveTo(at[0] + line * size * 0.7, at[1] - size * 2.1);
      context.lineTo(at[0] + line * size * 0.7, at[1] + size * 2.1);
      context.moveTo(at[0] - size * 2.1, at[1] + line * size * 0.7);
      context.lineTo(at[0] + size * 2.1, at[1] + line * size * 0.7);
    }
    context.stroke();
    if (share < PSYBLADE_CUTS) {
      const swing = (share / PSYBLADE_CUTS) ** 0.8;
      const head = between(from, to, swing);
      const tail = between(from, to, Math.max(0, swing - 0.5));

      edge(context, tail, head, size * 0.55, 0, { color: PSY_PINK, alpha: 0.7 });
      edge(context, tail, head, size * 0.22, 0, { color: PSY_NEON, alpha: 1 });
      orb(context, head, size * 0.5, { color: PSY_PINK, alpha: 1 });
      return;
    }
    const hit = (share - PSYBLADE_CUTS) / (1 - PSYBLADE_CUTS);

    orb(context, at, size * (1 + hit * 1.4), { color: PSY_PINK, alpha: decay(hit * 2) * 0.7 });
    edge(context, from, to, size * 0.5 * decay(hit * 1.6), size * 0.3, {
      color: PSY_PINK,
      alpha: 0.8,
    });
    edge(context, from, to, size * 0.2 * decay(hit * 1.6), size * 0.3, {
      color: PSY_NEON,
      alpha: 1,
    });
    // The cut scattering into square pixels
    for (let pixel = 0; pixel < many(18, weight); pixel += 1) {
      const [x, y] = between(from, to, 0.1 + noise(seed, pixel) * 0.8);
      const side = size * 0.24;

      context.fillStyle = fade(
        pixel % 2 === 0 ? PSY_PINK : PSY_NEON,
        Math.min(1, hit * 4) * decay(hit),
      );
      context.fillRect(
        x + spread(seed, pixel + 30) * size * 2 * hit - side / 2,
        y + (spread(seed, pixel + 60) * 2 - 1) * size * hit - side / 2,
        side,
        side,
      );
    }
  },

  // A jet of boiling water onto it, white steam billowing up round it
  // under a warm glare
  Steamjet(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const run = Math.min(1, share / STEAM_LANDS);
    const flowing = late(share, 0.55);

    beam(context, stage.source, at, run, size * 1.6, { color: STEAM_BLUE, alpha: flowing * 0.5 });
    beam(context, stage.source, at, run, size * 0.8, { color: STEAM_BLUE, alpha: flowing });
    motes(context, between(stage.source, at, run * 0.6), size * 1.4, 7, seed, share, {
      color: STEAM_WHITE,
      alpha: flowing * 0.8,
      width: 2.5 * stage.scale,
    });
    if (share < STEAM_LANDS) {
      return;
    }
    const hit = (share - STEAM_LANDS) / (1 - STEAM_LANDS);

    orb(context, at, size * (1.4 + hit * 1.6), {
      color: STEAM_GLARE,
      alpha: swell(Math.min(1, hit * 1.3)) * 0.5,
    });
    ring(context, at, size * (1 + hit * 2.4), {
      color: lighten(STEAM_BLUE, 0.4),
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    for (let puff = 0; puff < many(8, weight); puff += 1) {
      const rise = hit + noise(seed, puff) * 0.3;

      orb(
        context,
        [at[0] + spread(seed, puff + 10) * size * 1.8, at[1] + size * 0.6 - rise * size * 3],
        size * (0.6 + hit * 1.2),
        { color: STEAM_WHITE, alpha: 0.7 * decay(hit) },
      );
    }
  },

  // A cold joke: a little speech bubble popping up over it and
  // freezing over, then snowflakes and a chill wind swirling out
  Reception(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const pop = Math.min(1, share * 8);
    const shown = late(share, 0.7);
    const freeze = Math.max(0, Math.min(1, (share - 0.15) / (RECEPTION_FREEZES - 0.15)));
    const [x, y] = [at[0] + size * 0.9, at[1] - size * 2.4];
    const wide = size * 1.2 * pop;
    const tall = size * 0.8 * pop;
    const paper = mix(RECEPTION_PAPER, RECEPTION_ICE, freeze);
    const ink = mix(RECEPTION_INK, lighten(RECEPTION_ICE, 0.3), freeze);

    context.beginPath();
    context.ellipse(x, y, wide, tall, 0, 0, Math.PI * 2);
    context.moveTo(x - wide * 0.5, y + tall * 0.7);
    context.lineTo(x - wide * 0.95, y + tall * 1.6);
    context.lineTo(x - wide * 0.1, y + tall * 0.9);
    context.fillStyle = fade(paper, shown);
    context.fill();
    context.strokeStyle = fade(RECEPTION_INK, shown);
    context.lineWidth = 2 * stage.scale;
    context.stroke();
    for (let dot = -1; dot <= 1; dot += 1) {
      orb(context, [x + dot * wide * 0.4, y], size * 0.16 * pop, { color: ink, alpha: shown });
    }
    if (freeze > 0) {
      // Frost creeping over it, and a glint once it is iced through
      for (let crack = 0; crack < 3; crack += 1) {
        const angle = noise(seed, crack) * Math.PI * 2;

        edge(
          context,
          [x, y],
          [x + Math.cos(angle) * wide * freeze, y + Math.sin(angle) * tall * freeze],
          size * 0.08,
          0,
          { color: '#ffffff', alpha: shown },
        );
      }
      star(context, [x + wide * 0.5, y - tall * 0.5], size * 0.35 * freeze, share * 3, {
        color: '#ffffff',
        alpha: shown,
      });
    }
    if (share < RECEPTION_FREEZES) {
      return;
    }
    const chill = (share - RECEPTION_FREEZES) / (1 - RECEPTION_FREEZES);

    context.strokeStyle = fade(lighten(RECEPTION_ICE, 0.4), decay(chill) * 0.9);
    context.lineWidth = 2.4 * stage.scale;
    context.lineCap = 'round';
    for (let strand = 0; strand < 3; strand += 1) {
      const radius = size * (1.3 + chill * 1.6 + strand * 0.3);
      const start = chill * 4 + strand * 2.1;

      context.beginPath();
      context.ellipse(at[0], at[1] + size * 0.2, radius, radius * 0.45, 0, start, start + 1.8);
      context.stroke();
    }
    context.lineCap = 'butt';
    for (let flake = 0; flake < many(9, weight); flake += 1) {
      const angle = noise(seed, flake + 40) * Math.PI * 2 + chill * 2;
      const out = size * (0.6 + chill * 2.4 * (0.5 + noise(seed, flake + 60)));

      snowflake(
        context,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out * 0.6],
        size * 0.3,
        chill * 3 + flake,
        decay(chill),
      );
    }
  },

  // An engine's wheel of fire roaring in with flames trailing out of
  // its exhaust, and fire bursting on the target
  Blazing(context, stage, share, { seed, weight }) {
    const { at, size, head, hit } = torque(context, stage, share, seed, weight, {
      rim: BLAZING_RED,
      exhaust: BLAZING_FLAME,
      fumes: 0.8,
    });

    if (hit < 0) {
      orb(context, head, size * 1.6, { color: BLAZING_FLAME, alpha: 0.4 });
      motes(context, head, size * 1.6, 6, seed, share * 3, { color: BLAZING_FLAME, alpha: 0.9 });
      return;
    }
    orb(context, at, size * (1.2 + hit * 2), { color: BLAZING_FLAME, alpha: decay(hit * 1.5) });
    orb(context, at, size * (1.4 + hit * 1.6), { color: BLAZING_RED, alpha: decay(hit) * 0.7 });
    for (let lick = 0; lick < many(8, weight); lick += 1) {
      const up = (hit * 1.5 + noise(seed, lick)) % 1;

      orb(
        context,
        [at[0] + spread(seed, lick + 10) * size * 1.6, at[1] + size * 0.6 - up * size * 2.4],
        size * 0.5 * (1 - up * 0.5),
        { color: up < 0.4 ? BLAZING_FLAME : BLAZING_RED, alpha: swell(up) * decay(hit) },
      );
    }
  },

  // A dark wheel rushing in under black exhaust smoke, and a dark slam
  // with red sparks flying off it
  Wicked(context, stage, share, { seed, weight }) {
    const { at, size, head, hit } = torque(context, stage, share, seed, weight, {
      rim: WICKED_DARK,
      exhaust: WICKED_SMOKE,
      fumes: 0.4,
    });

    if (hit < 0) {
      motes(context, head, size * 1.4, 4, seed, share * 3, { color: WICKED_SPARK, alpha: 0.8 });
      return;
    }
    orb(context, at, size * (1.4 + hit * 1.6), { color: WICKED_SMOKE, alpha: decay(hit) * 0.4 });
    ring(context, at, size * (0.8 + hit * 2.4), {
      color: WICKED_SPARK,
      alpha: decay(hit),
      width: 2 * stage.scale,
    });
    burst(context, at, size * (1.4 + hit * 2), 12, seed + 1, {
      color: WICKED_SPARK,
      alpha: decay(hit),
      width: 2.4 * stage.scale,
    });
    motes(context, at, size * 2.4, many(10, weight), seed + 2, hit, {
      color: lighten(WICKED_SPARK, 0.3),
      alpha: decay(hit),
      width: 2 * stage.scale,
    });
  },

  // A purple wheel rushing in under toxic exhaust, and a cloud of
  // poison blooming round the target
  Noxious(context, stage, share, { seed, weight }) {
    const { at, size, head, hit } = torque(context, stage, share, seed, weight, {
      rim: NOXIOUS_PURPLE,
      exhaust: NOXIOUS_FUMES,
      fumes: 0.5,
    });

    if (hit < 0) {
      motes(context, head, size * 1.4, 5, seed, share * 3, { color: NOXIOUS_FUMES, alpha: 0.8 });
      return;
    }
    const bloom = Math.min(1, hit * 2);

    for (let cloud = 0; cloud < 6; cloud += 1) {
      const angle = (cloud / 6) * Math.PI * 2 + noise(seed, cloud) * 0.6;
      const out = size * bloom * 1.4;

      orb(
        context,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out * 0.6],
        size * (0.8 + bloom * 0.8),
        { color: cloud % 2 === 0 ? NOXIOUS_PURPLE : NOXIOUS_FUMES, alpha: decay(hit) * 0.5 },
      );
    }
    motes(context, at, size * 2.2, many(10, weight), seed + 3, hit, {
      color: NOXIOUS_FUMES,
      alpha: decay(hit),
      width: 2.4 * stage.scale,
    });
  },

  // An orange wheel hitting hard: impact lines closing on it and a
  // burst like a punch landing
  Combat(context, stage, share, { seed, weight }) {
    const { at, size, head, hit } = torque(context, stage, share, seed, weight, {
      rim: COMBAT_ORANGE,
      exhaust: COMBAT_DUST,
      fumes: 0.5,
    });

    if (hit < 0) {
      motes(context, head, size * 1.4, 4, seed, share * 3, { color: COMBAT_DUST, alpha: 0.8 });
      return;
    }
    // The punch: a spiked star of a burst
    context.beginPath();
    for (let point = 0; point < 20; point += 1) {
      const angle = (point / 20) * Math.PI * 2;
      const out =
        size * (0.8 + hit * 1.4) * (point % 2 === 0 ? 1.5 + noise(seed, point) * 0.4 : 0.8);

      context[point === 0 ? 'moveTo' : 'lineTo'](
        at[0] + Math.cos(angle) * out,
        at[1] + Math.sin(angle) * out,
      );
    }
    context.closePath();
    context.fillStyle = fade(lighten(COMBAT_ORANGE, 0.4), decay(hit * 1.4));
    context.fill();
    context.strokeStyle = fade(COMBAT_ORANGE, decay(hit));
    context.lineWidth = 3 * stage.scale;
    context.stroke();
    for (let line = 0; line < 10; line += 1) {
      const angle = (line / 10) * Math.PI * 2 + noise(seed, line + 30) * 0.3;
      const inner = size * (2 + hit * 0.6);
      const outer = size * (3.6 + hit * 0.6);

      edge(
        context,
        [at[0] + Math.cos(angle) * outer, at[1] + Math.sin(angle) * outer],
        [at[0] + Math.cos(angle) * inner, at[1] + Math.sin(angle) * inner],
        size * 0.14,
        0,
        { color: COMBAT_ORANGE, alpha: decay(hit) },
      );
    }
  },

  // A pink wheel trailing sparkles and stars, and a burst of fairy
  // sparkle on the target
  Magical(context, stage, share, { seed, weight }) {
    const { at, size, head, run, hit } = torque(context, stage, share, seed, weight, {
      rim: MAGICAL_PINK,
      exhaust: lighten(MAGICAL_PINK, 0.5),
      fumes: 0.5,
    });

    if (hit < 0) {
      for (let glint = 0; glint < 5; glint += 1) {
        const back = Math.max(0, run - glint * 0.08);
        const [x, y] = between(stage.source, at, back);

        star(
          context,
          [x + spread(seed, glint) * size, y + spread(seed, glint + 9) * size],
          size * 0.35,
          share * 6 + glint,
          {
            color: glint % 2 === 0 ? MAGICAL_SPARKLE : '#ffffff',
            alpha: 1 - glint * 0.15,
          },
        );
      }
      orb(context, head, size * 1.4, { color: MAGICAL_PINK, alpha: 0.35 });
      return;
    }
    orb(context, at, size * (1.2 + hit * 1.6), { color: MAGICAL_PINK, alpha: decay(hit) * 0.7 });
    for (let glint = 0; glint < many(10, weight); glint += 1) {
      const angle = noise(seed, glint) * Math.PI * 2;
      const out = size * (0.6 + hit * (1.8 + noise(seed, glint + 20)));

      star(
        context,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out],
        size * 0.4 * (1 - hit * 0.4),
        hit * 4 + glint,
        { color: glint % 2 === 0 ? MAGICAL_SPARKLE : MAGICAL_PINK, alpha: decay(hit) },
      );
    }
  },
} satisfies Partial<Record<EffectShape, ShapePainter>>;

export default paldeaLate;
