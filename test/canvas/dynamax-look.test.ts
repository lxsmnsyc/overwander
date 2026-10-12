import { describe, expect, it } from 'vitest';
import type { Slot } from '../../src/components/battle/battle-canvas/field';
import type SpeciesSpriteAnimation from '../../src/canvas/species-sprite-animation';
import type Bakery from '../../src/canvas/bakery';
import type { Painter, QuadBlend } from '../../src/canvas/gl/quad-batch';
import { type SlotBatch, drawSlot } from '../../src/components/battle/battle-canvas/draw';
import {
  BOSS_RADIUS,
  DYNAMAX_GLOW,
  GIGANTAMAX_GLOW,
  PARTY_SLOT,
} from '../../src/components/battle/battle-canvas/metrics';
import { createBattle, createUnit } from '../battle/harness';
import type Unit from '../../src/battle/unit';
import {
  CLOUDS,
  type GiantBody,
  type Puff,
  cloudsOf,
} from '../../src/components/battle/battle-canvas/dynamax';

/**
 * A Dynamaxed pokemon is drawn washed in red, ringed by a glow and
 * crowned with three swirling storm clouds, on both renderers and at
 * every instant, whether it is a party member or a raid boss.
 */

/** The frame every sheet here draws, and the baked puff */
const FRAME = { x: 0, y: 0, width: 40, height: 40 };
const SHEET = { width: 64, height: 64 };
const PUFF_SHEET = { width: 1024, height: 1024 };

interface Written {
  sheet: unknown;
  colour: unknown;
  blend: QuadBlend;
  across: number;
}

/** A batch that writes down every quad it is handed */
function recorder(): { onto: SlotBatch; quads: Written[] } {
  const quads: Written[] = [];
  const painter = {
    quad: (
      picture: unknown,
      _source: unknown,
      corners: { x: number }[],
      _alpha?: number,
      colour?: unknown,
      _sampling?: unknown,
      blend: QuadBlend = 'over',
    ) => {
      quads.push({ sheet: picture, colour, blend, across: Math.abs(corners[1].x - corners[0].x) });
    },
    solid: () => {},
    line: () => {},
    outline: () => {},
    triangle: () => {},
    invalidate: () => {},
  };
  const bakery = {
    sheet: PUFF_SHEET,
    revision: 0,
    take: () => ({ x: 0, y: 0, width: 96, height: 96 }),
  };

  return {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    onto: { batch: painter as unknown as Painter, bakery: bakery as unknown as Bakery },
    quads,
  };
}

/** A context that counts the shapes it fills */
function canvas(): { context: CanvasRenderingContext2D; arcs: () => number } {
  let arcs = 0;
  const gradient = { addColorStop: () => {} };
  const context = {
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    shadowColor: '',
    shadowBlur: 0,
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
    scale: () => {},
    rotate: () => {},
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    ellipse: () => {},
    arc: () => {
      arcs += 1;
    },
    roundRect: () => {},
    measureText: () => ({ width: 10 }),
    fillText: () => {},
    strokeText: () => {},
    createRadialGradient: () => gradient,
    createLinearGradient: () => gradient,
    stroke: () => {},
    fill: () => {},
    fillRect: () => {},
    drawImage: () => {},
  };

  return {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    context: context as unknown as CanvasRenderingContext2D,
    arcs: () => arcs,
  };
}

/** A sheet placed as a quad, with a body a slot's radius wide */
function sheet(radius: number): SpeciesSpriteAnimation {
  const sprite = {
    ready: true,
    finished: false,
    playing: null,
    frameSize: { width: 40, height: 40 },
    heightOf: () => 0,
    has: () => true,
    play: () => true,
    stop: () => {},
    update: () => {},
    quadOf: (x: number, y: number) => ({
      sheet: SHEET,
      source: FRAME,
      left: x - radius,
      top: y - radius * 2,
      width: radius * 2,
      height: radius * 2,
    }),
    locate: (_: string, x: number, y: number) => [x, y - radius],
    shadowOf: () => null,
    shadowRadius: () => ({ x: radius, y: radius / 3 }),
    drawShadow: () => {},
    draw: () => {},
  };

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return sprite as unknown as SpeciesSpriteAnimation;
}

function slotOf(unit: Unit, radius: number, giant: number): Slot {
  return {
    unit,
    x: 300,
    y: 300,
    radius,
    color: '#fff',
    sprite: sheet(radius),
    stand: null,
    facing: 'Down',
    depth: 1,
    offset: [0, 0],
    visible: true,
    giant,
  };
}

/** The quads one frame of a slot is drawn with */
function frameOf(slot: Slot, clock: number): Written[] {
  const { onto, quads } = recorder();

  drawSlot(canvas().context, slot, new Map(), clock, new Map(), false, onto);
  return quads;
}

const INSTANTS = [0, 130, 260, 900, 1700, 2600, 5000];

/** Where the body itself is written, which splits behind from in front */
function bodyAt(quads: Written[]): number {
  for (const [at, quad] of quads.entries()) {
    if (quad.sheet === SHEET && quad.blend === 'over') {
      return at;
    }
  }
  return -1;
}

/** How many of these quads are washes, and how many are puffs */
function count(quads: Written[]): { washes: number; puffs: number } {
  let washes = 0;
  let puffs = 0;

  for (const quad of quads) {
    washes += quad.blend === 'wash' ? 1 : 0;
    puffs += quad.sheet === PUFF_SHEET ? 1 : 0;
  }
  return { washes, puffs };
}

/** The colours the washes are drawn in */
function washColours(quads: Written[]): Set<unknown> {
  const colours = new Set<unknown>();

  for (const quad of quads) {
    if (quad.blend === 'wash') {
      colours.add(quad.colour);
    }
  }
  return colours;
}

describe('a Dynamaxed pokemon', () => {
  it('is washed red, glows and wears clouds at every instant', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);

    for (const clock of INSTANTS) {
      const quads = frameOf(slotOf(unit, PARTY_SLOT, 1), clock);
      const body = bodyAt(quads);
      const behind = count(quads.slice(0, body));
      const over = count(quads.slice(body));

      expect(body).toBeGreaterThanOrEqual(0);
      // The glow behind it and the red over it, all in the Dynamax red
      expect(behind.washes).toBeGreaterThanOrEqual(2);
      expect(over.washes).toBeGreaterThanOrEqual(1);
      expect(washColours(quads)).toEqual(new Set([DYNAMAX_GLOW]));
      // Clouds on both sides of it: the far pieces behind, the near ones in front
      expect(behind.puffs).toBeGreaterThan(0);
      expect(over.puffs).toBeGreaterThan(0);
    }
  });

  it('takes the deeper magenta as a Gigantamax', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);

    unit.gigantamax = true;

    expect(washColours(frameOf(slotOf(unit, PARTY_SLOT, 1), 0))).toEqual(
      new Set([GIGANTAMAX_GLOW]),
    );
  });

  it('gives a raid boss the whole look at its own size', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);
    const widest = (quads: Written[]): number => {
      let most = 0;

      for (const quad of quads) {
        if (quad.sheet === PUFF_SHEET) {
          most = Math.max(most, quad.across);
        }
      }
      return most;
    };

    for (const clock of INSTANTS) {
      const boss = frameOf(slotOf(unit, BOSS_RADIUS, 1), clock);
      const party = frameOf(slotOf(unit, PARTY_SLOT, 1), clock);

      expect(count(boss).washes).toBeGreaterThan(0);
      // Its clouds are scaled to it rather than to a party member
      expect(widest(boss)).toBeGreaterThan(widest(party));
    }
  });

  it('fades the look in with the growth and has none of it at its own size', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);
    const plain = count(frameOf(slotOf(unit, PARTY_SLOT, 0), 0));

    expect(plain).toEqual({ washes: 0, puffs: 0 });
    expect(count(frameOf(slotOf(unit, PARTY_SLOT, 0.3), 0)).washes).toBeGreaterThan(0);
  });

  it('draws its clouds on the 2D context too', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);

    for (const clock of INSTANTS) {
      const grown = canvas();
      const plain = canvas();

      drawSlot(grown.context, slotOf(unit, BOSS_RADIUS, 1), new Map(), clock, new Map());
      drawSlot(plain.context, slotOf(unit, BOSS_RADIUS, 0), new Map(), clock, new Map());
      expect(grown.arcs()).toBeGreaterThan(plain.arcs());
    }
  });
});

/** A body placed as the test sheet places it, a slot's radius wide */
function bodyOf(radius: number): GiantBody {
  const quad = sheet(radius).quadOf(300, 300);

  if (quad == null) {
    throw new Error('the test sheet places every frame');
  }
  return { quad, foot: [300, 300], middle: [300, 300 - radius], reach: radius };
}

/** The head of a cloud, which is drawn last over its own tail */
function headOf(cloud: Puff[] | undefined): Puff {
  const head = cloud?.at(-1);

  if (head == null) {
    throw new Error('a cloud with no pieces');
  }
  return head;
}

describe('the storm clouds over a Dynamaxed pokemon', () => {
  it('are three comets evenly spaced on an orbit above the head', () => {
    const body = bodyOf(PARTY_SLOT);

    expect(CLOUDS).toBe(3);
    for (const clock of INSTANTS) {
      const clouds = cloudsOf(body, clock);
      let x = 0;
      let y = 0;

      expect(clouds).toHaveLength(CLOUDS);
      for (const cloud of clouds) {
        const head = headOf(cloud);

        x += head.x / CLOUDS;
        y += head.y / CLOUDS;
      }
      // Evenly spaced heads balance out on the orbit's middle, which sits over the crown
      expect(x).toBeCloseTo(300, 6);
      expect(y).toBeLessThan(body.quad.top);
    }
  });

  it('gives each a head and a tail that thins out behind it', () => {
    for (const cloud of cloudsOf(bodyOf(PARTY_SLOT), 900)) {
      expect(cloud.length).toBeGreaterThan(2);
      let last: Puff | null = null;

      for (const piece of cloud) {
        if (last != null) {
          expect(last.size).toBeLessThan(piece.size);
        }
        last = piece;
      }
    }
  });

  it('keeps some behind the head and some in front of it at every instant', () => {
    for (const clock of INSTANTS) {
      let front = 0;
      let behind = 0;

      for (const cloud of cloudsOf(bodyOf(PARTY_SLOT), clock)) {
        for (const piece of cloud) {
          front += piece.front ? 1 : 0;
          behind += piece.front ? 0 : 1;
        }
      }
      expect(front).toBeGreaterThan(0);
      expect(behind).toBeGreaterThan(0);
    }
  });

  it('stays small against the body, and scales with it', () => {
    for (const clock of INSTANTS) {
      const party = headOf(cloudsOf(bodyOf(PARTY_SLOT), clock)[0]);
      const boss = headOf(cloudsOf(bodyOf(BOSS_RADIUS), clock)[0]);

      // A head is well under the body's width, so the pokemon shows between them
      expect(party.size).toBeLessThan(PARTY_SLOT);
      expect(boss.size / party.size).toBeCloseTo(BOSS_RADIUS / PARTY_SLOT, 6);
    }
  });
});
