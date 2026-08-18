import { describe, expect, it } from 'vitest';
import PaintedVisual, { type Painter } from '../../src/canvas/battle/moves/__painted';
import { fade, lighten, noise } from '../../src/canvas/battle/moves/__paint';
import abilityCueFor, {
  itemCueFor,
  statusCueFor,
  statusTickFor,
} from '../../src/canvas/battle/cues';
import {
  delayShapeFor,
  effectShapeFor,
  moveDelayVisual,
  moveEffectVisual,
  moveMissVisual,
  weightOf,
} from '../../src/canvas/battle/moves';
import attackMarkVisual from '../../src/canvas/battle/attack';
import type { Stage } from '../../src/canvas/battle/stage';
import { Types } from '../../src/data/constants/types';
import Abilities from '../../src/data/ids/abilities';
import { Items } from '../../src/data/ids/items';
import { Moves } from '../../src/data/ids/moves';
import { Statuses } from '../../src/data/ids/status';
import registerGameData from '../../src/data';

/**
 * Everything the field draws over a fight is a painter: a function of
 * how far through its phase it is, drawing on the 2D context. So what
 * these check is that each one is reachable, draws at every instant of
 * its span rather than only at the start, and always draws the same
 * instant the same way.
 */

registerGameData();

const STAGE: Stage = { source: [100, 300], targets: [[300, 100]], scale: 1 };

/**
 * A context that counts what was asked of it. The painters draw with
 * strokes, fills and gradients rather than images, so what "it drew
 * something" means here is that one of those happened
 */
function canvas(): { context: CanvasRenderingContext2D; marks: () => number } {
  let marks = 0;
  const gradient = { addColorStop: () => {} };
  const context = {
    globalAlpha: 1,
    lineWidth: 1,
    lineCap: 'butt',
    strokeStyle: '',
    fillStyle: '',
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    bezierCurveTo: () => {},
    quadraticCurveTo: () => {},
    ellipse: () => {},
    arc: () => {},
    createRadialGradient: () => gradient,
    createLinearGradient: () => gradient,
    stroke: () => {
      marks += 1;
    },
    fill: () => {
      marks += 1;
    },
    fillRect: () => {
      marks += 1;
    },
  };

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return { context: context as unknown as CanvasRenderingContext2D, marks: () => marks };
}

/** One move that lands as each shape, so every shape is exercised. */
const SHAPES: [shape: string, move: Moves][] = [
  ['Impact', Moves.Tackle],
  ['Blast', Moves.Explosion],
  ['Bloom', Moves.DragonRage],
  ['Beam', Moves.HyperBeam],
  ['Zap', Moves.Thunderbolt],
  ['Strike', Moves.Thunder],
  ['Flame', Moves.Ember],
  ['Splash', Moves.WaterGun],
  ['Frost', Moves.Blizzard],
  ['Leafy', Moves.PetalDance],
  ['Haze', Moves.PoisonPowder],
  ['Mark', Moves.Glare],
  ['Mend', Moves.Recover],
  ['Ward', Moves.Harden],
  ['Quake', Moves.Earthquake],
  ['Drain', Moves.Absorb],
  ['Volley', Moves.PinMissile],
  ['Jaws', Moves.Bite],
  ['Claw', Moves.Scratch],
  ['Coil', Moves.Wrap],
  ['Sound', Moves.Growl],
  ['Spike', Moves.Peck],
  ['Drill', Moves.HornDrill],
  ['Swirl', Moves.Gust],
  ['Trance', Moves.Hypnosis],
  ['Rocks', Moves.RockSlide],
  ['Warp', Moves.Psychic],
  ['Lash', Moves.VineWhip],
  ['Boost', Moves.SwordsDance],
];

describe('a painted move', () => {
  it('draws something at every instant of every shape it can land as', () => {
    for (const [shape, move] of SHAPES) {
      expect(effectShapeFor(move), `${shape} is what ${move} lands as`).toBe(shape);

      const visual = moveEffectVisual(move);

      expect(visual, shape).not.toBeNull();
      // A shape that draws at the start and not in the middle is the
      // "incomplete effect" bug: it is one beat of a picture rather
      // than a picture
      for (const at of [0.05, 0.35, 0.7]) {
        const { context, marks } = canvas();
        const playing = moveEffectVisual(move);

        playing?.advance((visual?.duration ?? 0) * at);
        playing?.draw(context, STAGE);
        expect(marks(), `${shape} at ${at}`).toBeGreaterThan(0);
      }
    }
  });

  it('draws something at every instant of every way it can spend the gap', () => {
    const gaps: [shape: string, move: Moves, steps: number][] = [
      ['Thrown', Moves.Ember, 0],
      ['Charge', Moves.Thunderbolt, 0],
      ['Vanish', Moves.Dig, 1],
      ['Surface', Moves.Dig, 0],
      ['Dive', Moves.Fly, 0],
      ['Reach', Moves.Growl, 0],
      ['Rise', Moves.Earthquake, 0],
    ];

    for (const [shape, move, steps] of gaps) {
      expect(delayShapeFor(move, steps), shape).toBe(shape);
      for (const at of [0.05, 0.5, 0.9]) {
        const { context, marks } = canvas();
        const gap = moveDelayVisual(move, steps, 800);

        gap?.advance(800 * at);
        gap?.draw(context, STAGE);
        expect(marks(), `${shape} at ${at}`).toBeGreaterThan(0);
      }
    }
  });

  it('spends the gap differently depending on the move', () => {
    // The pokemon is the projectile: nothing else crosses the gap
    expect(delayShapeFor(Moves.Tackle, 0)).toBeNull();
    // Named its own delay because it is shot
    expect(delayShapeFor(Moves.Ember, 0)).toBe('Thrown');
    // A two-step move is two different waits: down, then up through
    // the floor under whatever it is hitting
    expect(delayShapeFor(Moves.Dig, 1)).toBe('Vanish');
    expect(delayShapeFor(Moves.Dig, 0)).toBe('Surface');
    expect(delayShapeFor(Moves.Fly, 1)).toBe('Vanish');
    expect(delayShapeFor(Moves.Fly, 0)).toBe('Dive');
    // Still winding up: one step left to run
    expect(delayShapeFor(Moves.Thrash, 1)).toBe('Charge');
    // Nothing is thrown, but something reaches
    expect(delayShapeFor(Moves.Growl, 0)).toBe('Reach');
    // Its own side: nothing crosses anything
    expect(delayShapeFor(Moves.Harden, 0)).toBe('Charge');
  });

  it('draws nothing on a step that was only the wind-up', () => {
    // The engine resolves an effect on the burrow step — it is what
    // puts the caster underground — and drawing a hit on what the
    // move is aimed at would be a lie about what happened
    expect(moveEffectVisual(Moves.Dig, 1)).toBeNull();
    expect(moveEffectVisual(Moves.Dig, 0)).not.toBeNull();
    // A move that hits on every step keeps its picture on every step
    expect(moveEffectVisual(Moves.Thrash, 1)).not.toBeNull();
  });

  it('sizes a move by how hard it hits', () => {
    // The one thing a player most needs to tell apart, and the game
    // already knows it
    expect(weightOf(Moves.Tackle)).toBeLessThan(weightOf(Moves.HyperBeam));
    expect(weightOf(Moves.Growl)).toBeLessThan(weightOf(Moves.Tackle));
    // No power at all is one of two opposite things: a status move,
    // which is quiet, or a one-hit knockout, which is not
    expect(weightOf(Moves.HornDrill)).toBeGreaterThan(weightOf(Moves.HyperBeam));
  });

  it('lands as what the move is, read off its own data', () => {
    expect(effectShapeFor(Moves.Tackle)).toBe('Impact');
    expect(effectShapeFor(Moves.Ember)).toBe('Flame');
    expect(effectShapeFor(Moves.WaterGun)).toBe('Splash');
    expect(effectShapeFor(Moves.Thunderbolt)).toBe('Zap');
    expect(effectShapeFor(Moves.Thunder)).toBe('Strike');
    expect(effectShapeFor(Moves.Absorb)).toBe('Drain');
    expect(effectShapeFor(Moves.Recover)).toBe('Mend');
    // Named, because the shape can say the move rather than only its
    // element: a growl is heard
    expect(effectShapeFor(Moves.Growl)).toBe('Sound');
    expect(effectShapeFor(Moves.Bite)).toBe('Jaws');
    expect(effectShapeFor(Moves.Wrap)).toBe('Coil');
    // A fury of swipes is claws, drawn several times over — the
    // barrage shape is for the moves whose repeat is the whole point
    expect(effectShapeFor(Moves.FurySwipes)).toBe('Claw');
    expect(effectShapeFor(Moves.PinMissile)).toBe('Volley');
    expect(effectShapeFor(Moves.Glare)).toBe('Mark');
    expect(effectShapeFor(Moves.Harden)).toBe('Ward');
  });

  it('draws the same instant the same way however it got there', () => {
    const mark: Painter = (context, stage, share) => {
      context.fillRect(share, stage.scale, 1, 1);
    };
    const one = new PaintedVisual(400, mark);
    const two = new PaintedVisual(400, mark);
    const first = canvas();
    const second = canvas();

    one.advance(200);
    for (let step = 0; step < 20; step += 1) {
      two.advance(10);
    }
    one.draw(first.context, STAGE);
    two.draw(second.context, STAGE);
    expect(first.marks()).toBe(second.marks());
    expect(first.marks()).toBeGreaterThan(0);
    expect(one.finished).toBe(false);

    one.advance(200);
    expect(one.finished).toBe(true);
  });

  it('draws a move that went past rather than nothing at all', () => {
    // The one-hit knockouts miss far more often than they land, so a
    // miss that shows nothing is nearly every cast of them
    expect(moveMissVisual(Moves.HornDrill).duration).toBeGreaterThan(0);
  });

  it('scatters the same way every time the same move goes off', () => {
    // A hash rather than a generator, so a scatter drifts instead of
    // boiling as it is redrawn
    expect(noise(7, 3)).toBe(noise(7, 3));
    expect(noise(7, 3)).not.toBe(noise(7, 4));
  });

  it('colours by the move rather than by the sheet it found', () => {
    expect(fade('#3fa129', 0.5)).toBe('rgba(63, 161, 41, 0.5)');
    expect(lighten('#000000', 0.5)).toBe('#808080');
  });
});

describe('a blow landing', () => {
  const landed = {
    move: Moves.Tackle,
    type: Types.Normal,
    share: 0.2,
    effectiveness: 1,
    critical: false,
    struck: true,
  };

  it('draws every blow, however it resolved', () => {
    const ways = [
      landed,
      { ...landed, effectiveness: 2, share: 0.4 },
      { ...landed, effectiveness: 0.5 },
      // An immunity and a refusal still say something happened
      { ...landed, effectiveness: 0, share: 0 },
      { ...landed, struck: false, share: 0 },
      { ...landed, critical: true },
    ];

    for (const way of ways) {
      for (const at of [0.1, 0.5, 0.9]) {
        const mark = attackMarkVisual(way);
        const { context, marks } = canvas();

        mark.advance(mark.duration * at);
        mark.draw(context, STAGE);
        expect(marks(), `${JSON.stringify(way)} at ${at}`).toBeGreaterThan(0);
      }
    }
  });

  it('draws a heavier blow bigger than a graze', () => {
    // Both are the same picture; what differs is what it is given, so
    // the check is that the size actually moves with the damage
    const graze = attackMarkVisual({ ...landed, share: 0.02 });
    const heavy = attackMarkVisual({ ...landed, share: 0.6 });
    const size = (visual: typeof graze): number => {
      const widths: number[] = [];
      const { context } = canvas();

      // The ring's radius is the first number the ellipse is given
      const spy = context;

      spy.ellipse = (_x: number, _y: number, radius: number): void => {
        widths.push(radius);
      };

      visual.advance(visual.duration * 0.5);
      visual.draw(spy, STAGE);
      return Math.max(...widths, 0);
    };

    expect(size(heavy)).toBeGreaterThan(size(graze));
  });
});

describe('the cues', () => {
  it('draws every status that has a picture, at every instant of it', () => {
    const carried = [
      Statuses.Poisoned,
      Statuses.BadlyPoisoned,
      Statuses.Burned,
      Statuses.Paralyzed,
      Statuses.Frozen,
      Statuses.Sleeping,
      Statuses.Confused,
      Statuses.Flinched,
      Statuses.Raging,
      Statuses.Infatuated,
      Statuses.Seeding,
      Statuses.Substituted,
      Statuses.FocusEnergy,
    ];

    for (const status of carried) {
      const landing = statusCueFor(status);

      expect(landing, `${status} landing`).not.toBeNull();
      expect(statusTickFor(status), `${status} biting`).not.toBeNull();
      for (const at of [0.05, 0.4, 0.85]) {
        const { context, marks } = canvas();
        const playing = statusCueFor(status);

        playing?.advance((landing?.duration ?? 0) * at);
        playing?.draw(context, STAGE);
        expect(marks(), `${status} at ${at}`).toBeGreaterThan(0);
      }
    }
  });

  it('says nothing about a posture', () => {
    // A position is not something that happened to a pokemon
    expect(statusCueFor(Statuses.Minimized)).toBeNull();
    expect(statusCueFor(Statuses.Invulnerable)).toBeNull();
  });

  it('draws every item that fires, by what it did', () => {
    // A berry is eaten whatever it does; a held thing does one of
    // several things and the shape says which
    const spent = [Items.OranBerry, Items.FocusBand, Items.RockyHelmet, Items.QuickClaw];

    for (const item of spent) {
      const cue = itemCueFor(item);
      const { context, marks } = canvas();

      cue.advance(cue.duration * 0.5);
      cue.draw(context, STAGE);
      expect(marks(), `${item}`).toBeGreaterThan(0);
    }
  });

  it('draws every ability, whether or not it has a picture of its own', () => {
    // The default says "that was the ability" without claiming which,
    // so an ability that is not in the table still shows
    const shown = [
      Abilities.Static,
      Abilities.Intimidate,
      Abilities.Regenerator,
      Abilities.Pressure,
      Abilities.SwiftSwim,
      Abilities.Overgrow,
    ];

    for (const ability of shown) {
      const cue = abilityCueFor(ability);
      const { context, marks } = canvas();

      cue.advance(cue.duration * 0.4);
      cue.draw(context, STAGE);
      expect(marks(), `${ability}`).toBeGreaterThan(0);
    }
  });
});
