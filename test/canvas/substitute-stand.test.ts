import { describe, expect, it } from 'vitest';
import type { Slot, Stand } from '../../src/components/battle/battle-canvas/field';
import type SpeciesSpriteAnimation from '../../src/canvas/species-sprite-animation';
import { drawSlot } from '../../src/components/battle/battle-canvas/draw';
import { createBattle, createUnit } from '../battle/harness';
import type Unit from '../../src/battle/unit';

/**
 * The doll a substituted pokemon stands behind.
 *
 * Both bodies are drawn on the same spot and crossfaded: the pokemon
 * dims as the substitute comes up and comes back as it breaks, so what
 * is being hit is always what is in front.
 */

/** A context that says what was drawn and at what alpha. */
function canvas(): {
  context: CanvasRenderingContext2D;
  alphas: () => number[];
} {
  const alphas: number[] = [];
  const context = {
    globalAlpha: 1,
    lineWidth: 1,
    lineCap: 'butt',
    strokeStyle: '',
    fillStyle: '',
    font: '',
    textAlign: 'left',
    textBaseline: 'top',
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    ellipse: () => {},
    arc: () => {},
    roundRect: () => {},
    measureText: () => ({ width: 10 }),
    fillText: () => {},
    strokeText: () => {},
    createRadialGradient: () => ({ addColorStop: () => {} }),
    createLinearGradient: () => ({ addColorStop: () => {} }),
    stroke: () => {},
    fill: () => {},
    fillRect: () => {},
  };

  return {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    context: context as unknown as CanvasRenderingContext2D,
    alphas: () => alphas,
  };
}

/** A sheet that says where it was drawn and how faint it was */
function sheet(
  drawn: { at: [number, number]; alpha: number }[],
  context: { globalAlpha: number },
): SpeciesSpriteAnimation {
  const sprite = {
    ready: true,
    finished: false,
    playing: null,
    frameSize: { width: 40, height: 40 },
    has: () => true,
    play: () => true,
    stop: () => {},
    update: () => {},
    quadOf: () => null,
    shadowOf: () => null,
    shadowRadius: () => ({ x: 10, y: 4 }),
    drawShadow: () => {},
    draw: (_: unknown, x: number, y: number) => {
      drawn.push({ at: [x, y], alpha: context.globalAlpha });
    },
  };

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return sprite as unknown as SpeciesSpriteAnimation;
}

function slotOf(unit: Unit, sprite: SpeciesSpriteAnimation, stand: Stand | null): Slot {
  return {
    unit,
    x: 100,
    y: 200,
    radius: 20,
    color: '#fff',
    sprite,
    stand,
    facing: 'Down',
    depth: 1,
    offset: [0, 0],
    spin: 0,
    visible: true,
  };
}

describe('a substituted pokemon', () => {
  it('crossfades with its doll rather than swapping for it', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);
    const { context } = canvas();
    const bodies: { at: [number, number]; alpha: number }[] = [];
    const dolls: { at: [number, number]; alpha: number }[] = [];

    // Nothing standing in front: the pokemon is drawn whole and alone
    drawSlot(context, slotOf(unit, sheet(bodies, context), null), new Map(), 0);
    expect(bodies).toHaveLength(1);
    expect(bodies[0].alpha).toBe(1);
    expect(dolls).toHaveLength(0);

    bodies.length = 0;

    // Halfway in: both are on the field, and neither is whole
    drawSlot(
      context,
      slotOf(unit, sheet(bodies, context), { sprite: sheet(dolls, context), share: 0.5 }),
      new Map(),
      0,
    );
    expect(bodies).toHaveLength(1);
    expect(dolls).toHaveLength(1);
    expect(bodies[0].alpha).toBeLessThan(1);
    expect(dolls[0].alpha).toBeCloseTo(0.5);

    bodies.length = 0;
    dolls.length = 0;

    // All the way in: the doll is whole and the pokemon is behind it,
    // dimmed rather than gone
    drawSlot(
      context,
      slotOf(unit, sheet(bodies, context), { sprite: sheet(dolls, context), share: 1 }),
      new Map(),
      0,
    );
    expect(dolls[0].alpha).toBe(1);
    expect(bodies[0].alpha).toBeGreaterThan(0);
    expect(bodies[0].alpha).toBeLessThan(0.5);
    // On the same spot, so the substitute takes the pokemon's place
    // rather than standing beside it
    expect(dolls[0].at).toEqual(bodies[0].at);
  });
});
