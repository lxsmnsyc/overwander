import { MoveCategories, MoveFlags, MoveTargetFlags, Moves } from '../../../data/ids/moves';
import { TYPE_COLORS } from '../../../data/constants/types';
import { getMoveData } from '../../../data/moves';
import PaintedVisual, { type Painter } from './__painted';
import type { Point, Stage } from '../stage';
import {
  type Painted,
  between,
  bone,
  bubble,
  decay,
  motes,
  noise,
  orb,
  ring,
  ripple,
  shards,
  swell,
} from './__paint';

/**
 * What a move looks like in the gap before it lands.
 *
 * Every move has one: the engine holds a move open between firing and
 * resolving, `MOVE_DELAY` unless it names its own, and the gap is
 * mechanical.
 *
 * A longer delay is **not** a flight. A burrow, a charge held for the
 * sun and a leap are the same wait to the engine, so the picture is
 * chosen per move rather than from the delay. A contact move draws
 * nothing here: what crosses the gap is the pokemon itself, which
 * `BattleCanvas` lunges
 */

/** How big the gap's picture is, in canvas pixels before the scale. */
const REACH = 22;

/** Every way a move can spend the gap. */
export type DelayShape =
  | 'Thrown'
  | 'Bubbles'
  | 'Spun'
  | 'Lobbed'
  | 'Charge'
  | 'Vanish'
  | 'Surface'
  | 'Dive'
  | 'Reach'
  | 'Rise';

function landing(stage: Stage): Point {
  return stage.targets[0] ?? stage.source;
}

const PAINTERS: Record<
  DelayShape,
  (
    context: CanvasRenderingContext2D,
    stage: Stage,
    share: number,
    paint: Painted,
    seed: number,
  ) => void
> = {
  // Something crossing: drawn where the engine says the move is, since
  // the share of the gap that has passed *is* how far along it is
  Thrown(context, stage, share, paint, seed) {
    const at = between(stage.source, landing(stage), share);
    const size = REACH * stage.scale;

    orb(context, at, size * 0.42, paint);
    // A short tail of where it has just been, which is what makes it
    // read as travelling rather than as a dot that moved
    for (let step = 1; step <= 3; step += 1) {
      const behind = between(stage.source, landing(stage), Math.max(0, share - step * 0.06));

      orb(context, behind, size * 0.3 * (1 - step * 0.22), {
        ...paint,
        alpha: 0.45 - step * 0.12,
      });
    }
    motes(context, at, size * 0.9, 4, seed, share, {
      ...paint,
      alpha: 0.7,
      width: 1.6 * stage.scale,
    });
  },

  // A spray rather than a single thing thrown: the bubbles leave in a
  // stream and keep arriving, and staggering them by index is what
  // holds a line of them in the air at every instant
  Bubbles(context, stage, share, paint, seed) {
    const size = REACH * stage.scale;

    for (let one = 0; one < 7; one += 1) {
      const held = share * 1.35 - one * 0.05;

      if (held <= 0 || held >= 1) {
        continue;
      }
      const at = between(stage.source, landing(stage), held);
      // Bubbles do not fly straight, and the wobble is most of what
      // separates a stream of them from a burst of pellets
      const sway = Math.sin(held * Math.PI * 3 + one) * size * 0.3;

      bubble(context, [at[0], at[1] + sway], size * (0.16 + noise(seed, one) * 0.18), {
        ...paint,
        alpha: 0.55 + swell(held) * 0.45,
        width: 1.6 * stage.scale,
      });
    }
  },

  // Something thrown end over end. The tumble is the point: a bone
  // drawn as an orb crossing is every other projectile in the game
  Spun(context, stage, share, paint) {
    const at = between(stage.source, landing(stage), share);
    const size = REACH * stage.scale;

    bone(context, at, size * 1.1, share * Math.PI * 8, {
      ...paint,
      alpha: 1,
      width: 3 * stage.scale,
    });
  },

  // Lobbed rather than shot: it rises on the way out and drops onto
  // whatever it was aimed at
  Lobbed(context, stage, share, paint, seed) {
    const at = between(stage.source, landing(stage), share);
    const size = REACH * stage.scale;
    const arc = Math.sin(Math.PI * share) * size * 2.6;

    orb(context, [at[0], at[1] - arc], size * 0.38, paint);
    // Turning over as it goes, so the arc reads as a throw rather
    // than as something floating across
    ring(context, [at[0], at[1] - arc], size * 0.38, {
      ...paint,
      alpha: 0.7,
      width: 1.8 * stage.scale,
    });
    motes(context, [at[0], at[1] - arc], size * 0.7, 3, seed, share, {
      ...paint,
      alpha: 0.5,
      width: 1.4 * stage.scale,
    });
  },

  // Winding up: what the caster gathers before it lets go
  Charge(context, stage, share, paint, seed) {
    const size = REACH * stage.scale;

    orb(context, stage.source, size * (0.3 + share * 0.8), { ...paint, alpha: 0.35 + share * 0.5 });
    // Drawn inward rather than outward: everything here is being
    // collected, and motes leaving the body would read as a hit
    for (let mote = 0; mote < 8; mote += 1) {
      const held = (share * 1.6 + noise(seed, mote)) % 1;
      const angle = noise(seed, mote + 30) * Math.PI * 2;
      const reach = size * 2.4 * (1 - held);

      orb(
        context,
        [stage.source[0] + Math.cos(angle) * reach, stage.source[1] + Math.sin(angle) * reach],
        2.4 * stage.scale,
        { ...paint, alpha: swell(held) },
      );
    }
  },

  // Gone: the caster is under the ground or above the field, and what
  // is left is the hole it went through
  Vanish(context, stage, share, paint, seed) {
    const size = REACH * stage.scale;

    ripple(context, stage.source, size * (0.5 + share * 1.4), {
      ...paint,
      alpha: decay(share) * 0.9,
      width: 2.5 * stage.scale,
    });
    shards(context, stage.source, size * 1.2, 6, seed, share, {
      ...paint,
      alpha: decay(share) * 0.8,
      width: 2 * stage.scale,
    });
  },

  // Coming back up, under whatever it is about to hit: the ground
  // breaks first and the caster arrives through it
  Surface(context, stage, share, paint, seed) {
    const at = landing(stage);
    const size = REACH * stage.scale;

    ripple(context, at, size * (0.4 + share * 1.3), {
      ...paint,
      alpha: swell(share),
      width: 3 * stage.scale,
    });
    shards(context, at, size * 1.3, 7, seed, share, {
      ...paint,
      alpha: share * 0.9,
      width: 2.4 * stage.scale,
    });
  },

  // Coming down out of the sky onto it
  Dive(context, stage, share, paint, seed) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const above: Point = [at[0], at[1] - size * 6 * (1 - share)];

    for (let streak = 0; streak < 3; streak += 1) {
      const off = (noise(seed, streak) - 0.5) * size;

      ring(context, [above[0] + off, above[1] + size * streak * 0.4], size * 0.16, {
        ...paint,
        alpha: swell(share) * 0.9,
        width: 2 * stage.scale,
      });
    }
    if (share > 0.7) {
      ripple(context, at, size * (share - 0.7) * 4, {
        ...paint,
        alpha: (share - 0.7) * 2,
        width: 2.5 * stage.scale,
      });
    }
  },

  // A status crossing the gap: nothing is thrown, but something
  // reaches — so it is drawn as rings arriving rather than as a thing
  Reach(context, stage, share, paint) {
    const size = REACH * stage.scale;

    for (let pulse = 0; pulse < 3; pulse += 1) {
      const held = (share * 1.4 + pulse * 0.33) % 1;
      const at = between(stage.source, landing(stage), held);

      ring(context, at, size * (0.4 + held * 0.5), {
        ...paint,
        alpha: swell(held) * 0.8,
        width: 2 * stage.scale,
      });
    }
  },

  // Something building under the whole field
  Rise(context, stage, share, paint, seed) {
    const size = REACH * stage.scale;

    for (let wave = 0; wave < 2; wave += 1) {
      const held = (share * 1.3 + wave * 0.5) % 1;

      ripple(context, stage.source, size * held * 2.6, {
        ...paint,
        alpha: decay(held) * 0.7,
        width: 2.5 * stage.scale,
      });
    }
    motes(context, stage.source, size * 1.4, 6, seed, share, {
      ...paint,
      alpha: 0.6,
      width: 2 * stage.scale,
    });
  },
};

/**
 * The moves that spend the gap doing something the data cannot say,
 * as **[winding up, striking]**.
 *
 * A two-step move is two different waits and used to draw one picture
 * for both: Dig went underground, and then went underground again
 * instead of coming up. The step the engine is on decides which of the
 * pair is drawn — `undefined` in either place falls back to the
 * ordinary rules
 */
const NAMED: Partial<Record<Moves, [winding?: DelayShape, striking?: DelayShape]>> = {
  // Down, then up through the floor underneath whatever it is hitting
  [Moves.Dig]: ['Vanish', 'Surface'],
  // Up out of reach, then down onto it
  [Moves.Fly]: ['Vanish', 'Dive'],
  // Blown across rather than shot: one orb crossing said the same
  // thing as every other projectile in the game
  [Moves.Bubble]: [undefined, 'Bubbles'],
  [Moves.BubbleBeam]: [undefined, 'Bubbles'],
  // Tumbling out rather than shot straight
  [Moves.Bonemerang]: [undefined, 'Spun'],
  [Moves.BoneClub]: [undefined, 'Spun'],
  // Thrown in an arc and coming down on it
  [Moves.EggBomb]: [undefined, 'Lobbed'],
  [Moves.Teleport]: ['Vanish', 'Vanish'],
  [Moves.SolarBeam]: ['Charge', 'Charge'],
  [Moves.SkyAttack]: ['Charge', 'Dive'],
  // Head down and then straight through: the strike is the pokemon
  // itself, which the field already throws at what it is hitting
  [Moves.SkullBash]: ['Charge'],
  [Moves.RazorWind]: ['Charge', 'Reach'],
  [Moves.HyperBeam]: ['Charge', 'Charge'],
  // A jet rather than a thrown thing: what crosses the gap is the beam
  // itself, so the wait is spent drawing it up rather than in flight
  [Moves.HydroPump]: ['Charge', 'Charge'],
  [Moves.Bide]: ['Charge', 'Charge'],
  [Moves.Earthquake]: [undefined, 'Rise'],
  [Moves.Fissure]: [undefined, 'Rise'],
  [Moves.Sandstorm]: [undefined, 'Rise'],
};

/**
 * How this move spends the gap, or nothing where the gap is the
 * pokemon's own business.
 *
 * `steps` is what the engine has left to do: a move part-way through a
 * multi-step cast is winding up whatever it looks like on the way out
 */
export function delayShapeFor(move: Moves, steps: number): DelayShape | null {
  const named = NAMED[move]?.[steps > 0 ? 0 : 1];

  if (named != null) {
    return named;
  }
  const data = getMoveData(move);

  if (steps > 0) {
    return 'Charge';
  }
  // The pokemon is the projectile: the field throws its sprite at
  // whatever it is hitting, and a second thing in the air is one thing
  // too many
  if ((data.flags & MoveFlags.Contact) !== 0) {
    return null;
  }
  if (data.category === MoveCategories.Status) {
    return (data.target & MoveTargetFlags.Enemy) === 0 ? 'Charge' : 'Reach';
  }
  // Something the move itself said takes longer than a swing is
  // something being sent: the data only names a delay for the moves
  // that are shot or thrown
  return data.delay == null ? 'Charge' : 'Thrown';
}

/**
 * The picture of the gap, for as long as the engine is holding it. It
 * is handed the window rather than choosing one: the wait is the
 * engine's, and a picture that outlasts it is a move still crossing
 * after it has landed
 */
export default function moveDelayVisual(
  move: Moves,
  steps: number,
  window: number,
): PaintedVisual | null {
  const shape = delayShapeFor(move, steps);

  if (shape == null || window <= 0) {
    return null;
  }
  const paint: Painted = { color: TYPE_COLORS[getMoveData(move).type] };
  const painter: Painter = (context, stage, share) => {
    PAINTERS[shape](context, stage, share, paint, move + 1);
  };

  return new PaintedVisual(window, painter);
}
