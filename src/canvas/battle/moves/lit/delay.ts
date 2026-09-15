import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import type { LitStage } from '../__painted';
import { type Painted, decay, lighten, mix, noise, spread, swell } from '../__paint';
import type { DelayShape } from '../delay';
import { TAU, arcing, bone, chevron, debris, dome, gathering, smoke, spiral } from './pieces';
import { aside, floorOf, landed, reachOf, toward } from './shapes';

/**
 * The gap before a move lands, in the battle scene: the same shapes as
 * the painted ones, crossing the field in depth.
 */

type LitGap = (
  kit: EffectBatch,
  stage: LitStage,
  share: number,
  paint: Painted,
  seed: number,
) => void;

/** The painted gap is drawn at 22 pixels a reach where a landing is 26 */
function gapOf(stage: LitStage): number {
  return reachOf(stage) * (22 / 26);
}

const gaps: Record<DelayShape, LitGap> = {
  // Something crossing, where the engine says the move is, with a tail
  Thrown(kit, stage, share, { color }, seed) {
    const to = landed(stage);
    const reach = gapOf(stage);
    const at = toward(stage.source, to, share);
    const tail: Spot[] = [];

    for (let step = 0; step <= 5; step += 1) {
      tail.push(toward(stage.source, to, Math.max(0, share - (5 - step) * 0.035)));
    }
    kit.pool(floorOf(at), reach * 0.7, color, 0.35);
    kit.ribbon(tail, reach * 0.35, color, 0.45, share * 20);
    kit.glow(at, reach * 0.5, color, 0.9, 0.9);
    for (let mote = 0; mote < 4; mote += 1) {
      kit.glow(
        aside(
          kit,
          at,
          spread(seed, mote) * reach * 0.6,
          spread(seed, mote + 4) * reach * 0.6,
          spread(seed, mote + 8) * reach * 0.4,
        ),
        reach * 0.06,
        lighten(color, 0.4),
        0.7,
      );
    }
  },

  // A stream of bubbles, wobbling as they go
  Bubbles(kit, stage, share, { color }, seed) {
    const to = landed(stage);
    const reach = gapOf(stage);

    for (let one = 0; one < 7; one += 1) {
      const held = share * 1.35 - one * 0.05;

      if (held <= 0 || held >= 1) {
        continue;
      }
      const sway = Math.sin(held * Math.PI * 3 + one) * reach * 0.3;

      kit.bubble(
        aside(kit, toward(stage.source, to, held), 0, sway),
        reach * (0.16 + noise(seed, one) * 0.18),
        lighten(color, 0.35),
        0.55 + swell(held) * 0.45,
      );
    }
  },

  // Thrown end over end
  Spun(kit, stage, share, { color }) {
    const reach = gapOf(stage);

    bone(
      kit,
      toward(stage.source, landed(stage), share),
      reach * 1.1,
      share * Math.PI * 8,
      lighten(color, 0.2),
      1,
      reach * 0.13,
    );
  },

  // Lobbed: it rises on the way out and drops on what it was aimed at
  Lobbed(kit, stage, share, { color }) {
    const to = landed(stage);
    const reach = gapOf(stage);
    const height = reach * 2.6;
    const spot = arcing(stage.source, to, share, height);

    kit.pool(floorOf(spot), reach * 0.45, '#140e0a', 0.3, { add: 0 });
    kit.trail(
      arcing(stage.source, to, Math.max(0, share - 0.06), height),
      spot,
      reach * 0.15,
      color,
      0.5,
    );
    kit.glow(spot, reach * 0.42, color, 1, 0.8);
    kit.ring(spot, reach * 0.4, 0.15, lighten(color, 0.3), 0.7);
  },

  // Winding up: what the caster gathers before it lets go
  Charge(kit, stage, share, { color }, seed) {
    const reach = gapOf(stage);

    kit.pool(floorOf(stage.source), reach * (0.8 + share), color, 0.2 + share * 0.3);
    kit.glow(stage.source, reach * (0.3 + share * 0.8), color, 0.35 + share * 0.5, 0.8);
    gathering(kit, stage.source, reach * 2.4, 10, seed, share, lighten(color, 0.4));
  },

  // Gone: what is left is the hole it went through
  Vanish(kit, stage, share, { color }, seed) {
    const floor = floorOf(stage.source);
    const reach = gapOf(stage);

    kit.ripple(floor, reach * (0.5 + share * 1.4), 0.1, color, decay(share) * 0.9);
    smoke(kit, floor, reach, 4, seed, share, mix(color, '#b9a58a', 0.6), decay(share) * 0.4);
    debris(kit, floor, reach * 0.7, 6, seed, share, mix(color, '#5b4636', 0.4), decay(share) * 0.8);
  },

  // Coming back up under what it is about to hit: the ground breaks first
  Surface(kit, stage, share, { color }, seed) {
    const floor = floorOf(landed(stage));
    const reach = gapOf(stage);

    kit.pool(floor, reach * 1.3, '#140e0a', share * 0.4, { add: 0 });
    kit.ripple(floor, reach * (0.4 + share * 1.3), 0.12, color, swell(share));
    debris(kit, floor, reach * 0.7, 7, seed, share, mix(color, '#5b4636', 0.4), share * 0.9);
  },

  // Coming down out of the sky onto it
  Dive(kit, stage, share, { color }, seed) {
    const at = landed(stage);
    const reach = gapOf(stage);

    for (let streak = 0; streak < 3; streak += 1) {
      const above: Spot = [at[0], at[1] + reach * 6 * (1 - share) + streak * reach * 0.4, at[2]];
      const spot = aside(kit, above, spread(seed, streak) * reach * 0.5);

      kit.streak(
        spot,
        reach * 0.5,
        reach * 0.06,
        Math.PI / 2,
        lighten(color, 0.3),
        swell(share) * 0.9,
      );
    }
    if (share > 0.7) {
      kit.ripple(floorOf(at), reach * (share - 0.7) * 4, 0.1, color, (share - 0.7) * 2);
    }
  },

  // Drawn in from what it is taking, converging on the caster
  Gather(kit, stage, share, { color }, seed) {
    const from = landed(stage);
    const reach = gapOf(stage);

    for (let mote = 0; mote < 7; mote += 1) {
      const held = (share * 1.5 + noise(seed, mote)) % 1;
      const wide = spread(seed, mote + 12) * reach * 0.8;
      const along = (through: number): Spot =>
        aside(kit, toward(from, stage.source, through), wide * (1 - through), wide * (1 - through));
      const spot = along(held);

      kit.trail(
        along(Math.max(0, held - 0.06)),
        spot,
        reach * 0.05,
        lighten(color, 0.3),
        swell(held) * 0.6,
      );
      kit.glow(spot, reach * 0.1, lighten(color, 0.4), swell(held) * 0.9);
    }
  },

  // Shells closing round the caster, arriving from outside
  Brace(kit, stage, share, { color }) {
    const floor = floorOf(stage.source);
    const reach = gapOf(stage);

    for (let shell = 0; shell < 2; shell += 1) {
      const held = (share * 1.2 + shell * 0.5) % 1;

      dome(kit, floor, reach * (2.2 - held * 1.1), lighten(color, 0.3), swell(held) * 0.6);
    }
  },

  // Winding itself up: everything runs upward off the caster
  Focus(kit, stage, share, { color }, seed) {
    const at = stage.source;
    const reach = gapOf(stage);

    for (let mark = 0; mark < 3; mark += 1) {
      const held = (share * 1.4 + mark / 3) % 1;

      chevron(
        kit,
        aside(kit, at, 0, (held * 2 - 1) * reach * 1.1),
        reach * 1.1,
        1,
        lighten(color, 0.2),
        swell(share) * 0.9 * Math.min(1, swell(held) * 1.8),
        reach * 0.1,
      );
    }
    for (let mote = 0; mote < 6; mote += 1) {
      const held = (share * 1.4 + noise(seed, mote)) % 1;
      const angle = noise(seed, mote + 9) * TAU;
      const spot: Spot = [
        at[0] + Math.cos(angle) * reach * 0.9,
        Math.max(0, at[1] - reach + held * reach * 2),
        at[2] + Math.sin(angle) * reach * 0.9,
      ];

      kit.glow(spot, reach * 0.08, lighten(color, 0.4), swell(held) * 0.8);
    }
  },

  // Held rather than sent: already turning on what it is aimed at
  Gaze(kit, stage, share, { color }) {
    const reach = gapOf(stage);

    spiral(
      kit,
      landed(stage),
      reach * (0.6 + share * 0.7),
      2,
      share,
      lighten(color, 0.3),
      swell(share) * 0.8,
      reach * 0.08,
    );
    kit.ring(stage.source, reach * 0.5 * (1 + swell(share) * 0.3), 0.1, color, swell(share) * 0.5);
  },

  // Sound leaving the caster every way
  Call(kit, stage, share, { color }) {
    const reach = gapOf(stage);

    for (let pulse = 0; pulse < 3; pulse += 1) {
      const held = (share * 1.5 + pulse * 0.33) % 1;

      kit.ring(
        stage.source,
        reach * (0.3 + held * 2.4),
        0.07,
        lighten(color, 0.3),
        decay(held) * 0.75,
      );
      kit.ripple(floorOf(stage.source), reach * (0.3 + held * 2.4), 0.07, color, decay(held) * 0.4);
    }
  },

  // A cloud spreading as it crosses
  Drift(kit, stage, share, { color }, seed) {
    const to = landed(stage);
    const reach = gapOf(stage);

    for (let puff = 0; puff < 9; puff += 1) {
      const held = Math.min(1, share * 1.2 - noise(seed, puff) * 0.25);

      if (held <= 0) {
        continue;
      }
      const wide = reach * held * 1.2;

      kit.glow(
        aside(
          kit,
          toward(stage.source, to, held),
          spread(seed, puff + 21) * wide,
          spread(seed, puff + 44) * wide * 0.6,
          spread(seed, puff + 60) * wide,
        ),
        reach * (0.25 + noise(seed, puff) * 0.25) * (1 + held),
        color,
        0.5 * (1 - held * 0.5),
        0,
        { add: 0.3 },
      );
    }
  },

  // Light: blowing out from the caster the instant it is let go
  Flare(kit, stage, share, { color }) {
    const reach = gapOf(stage);
    const out = Math.min(1, share * 2.5);

    kit.pool(floorOf(stage.source), reach * (1 + out * 3), color, decay(share) * 0.5);
    kit.glow(stage.source, reach * (0.4 + out * 0.9), color, decay(share) * 0.9);
    kit.ring(stage.source, reach * (0.6 + out * 3.4), 0.06, lighten(color, 0.4), decay(share));
  },

  // A status reaching across: rings arriving rather than a thing thrown
  Reach(kit, stage, share, { color }) {
    const to = landed(stage);
    const reach = gapOf(stage);

    for (let pulse = 0; pulse < 3; pulse += 1) {
      const held = (share * 1.4 + pulse * 0.33) % 1;

      kit.ring(
        toward(stage.source, to, held),
        reach * (0.4 + held * 0.5),
        0.1,
        lighten(color, 0.3),
        swell(held) * 0.8,
      );
    }
  },

  // Something building under the whole field
  Rise(kit, stage, share, { color }, seed) {
    const floor = floorOf(stage.source);
    const reach = gapOf(stage);

    for (let wave = 0; wave < 2; wave += 1) {
      const held = (share * 1.3 + wave * 0.5) % 1;

      kit.ripple(floor, reach * held * 2.6, 0.08, color, decay(held) * 0.7);
    }
    for (let mote = 0; mote < 6; mote += 1) {
      const rise = (share * 1.2 + noise(seed, mote)) % 1;

      kit.glow(
        aside(
          kit,
          floor,
          spread(seed, mote + 3) * reach * 1.4,
          rise * reach * 1.2,
          spread(seed, mote + 6) * reach,
        ),
        reach * 0.08,
        lighten(color, 0.3),
        swell(rise) * 0.6,
      );
    }
  },
};

export default gaps;
