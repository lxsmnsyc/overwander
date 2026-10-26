import { describe, expect, it } from 'vitest';
import type { Slot } from '../../src/canvas/battle/field/field';
import type SpeciesSpriteAnimation from '../../src/canvas/sprites/species-sprite-animation';
import type Bakery from '../../src/canvas/bakery';
import type { Painter, QuadBlend } from '../../src/canvas/gl/quad-batch';
import { type SlotBatch, drawSlot } from '../../src/canvas/battle/field/draw';
import { BOSS_RADIUS, PARTY_SLOT } from '../../src/canvas/battle/field/metrics';
import { JEWEL_REACH, jewelFacets } from '../../src/canvas/battle/field/terastal';
import { terastallize } from '../../src/battle/gimmicks/terastal';
import { TYPE_COLORS, Types } from '../../src/data/constants/types';
import { createBattle, createUnit } from '../battle/harness';
import type Unit from '../../src/battle/unit';

/**
 * A Terastallized pokemon is drawn glazed in its Tera type's colour,
 * edged in it, and crowned with a faceted jewel of that colour, on both
 * renderers and at every instant.
 */

const FRAME = { x: 0, y: 0, width: 40, height: 40 };
const SHEET = { width: 64, height: 64 };
const GLOW_SHEET = { width: 1024, height: 1024 };

interface Written {
  kind: 'quad' | 'triangle';
  sheet: unknown;
  colour: unknown;
  blend: QuadBlend;
  top: number;
}

function recorder(): { onto: SlotBatch; written: Written[] } {
  const written: Written[] = [];
  const painter = {
    quad: (
      picture: unknown,
      _source: unknown,
      corners: { y: number }[],
      _alpha?: number,
      colour?: unknown,
      _sampling?: unknown,
      blend: QuadBlend = 'over',
    ) => {
      written.push({ kind: 'quad', sheet: picture, colour, blend, top: corners[0].y });
    },
    triangle: (
      colour: string,
      corners: { y: number }[],
      _alpha?: number,
      blend: QuadBlend = 'over',
    ) => {
      written.push({
        kind: 'triangle',
        sheet: null,
        colour,
        blend,
        top: Math.min(corners[0].y, corners[1].y, corners[2].y),
      });
    },
    solid: () => {},
    line: () => {},
    outline: () => {},
    invalidate: () => {},
  };
  const bakery = {
    sheet: GLOW_SHEET,
    revision: 0,
    take: () => ({ x: 0, y: 0, width: 64, height: 64 }),
  };

  return {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    onto: { batch: painter as unknown as Painter, bakery: bakery as unknown as Bakery },
    written,
  };
}

/** A context that counts the paths it fills */
function canvas(): { context: CanvasRenderingContext2D; fills: () => number } {
  let fills = 0;
  const gradient = { addColorStop: () => {} };
  const context = {
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    shadowColor: '',
    shadowBlur: 0,
    lineWidth: 1,
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
    arc: () => {},
    roundRect: () => {},
    measureText: () => ({ width: 10 }),
    fillText: () => {},
    strokeText: () => {},
    createRadialGradient: () => gradient,
    createLinearGradient: () => gradient,
    stroke: () => {},
    fill: () => {
      fills += 1;
    },
    fillRect: () => {},
    drawImage: () => {},
  };

  return {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    context: context as unknown as CanvasRenderingContext2D,
    fills: () => fills,
  };
}

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

function slotOf(unit: Unit, radius: number): Slot {
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
  };
}

function frameOf(slot: Slot, clock: number): Written[] {
  const { onto, written } = recorder();

  drawSlot(canvas().context, slot, new Map(), clock, new Map(), false, onto);
  return written;
}

const INSTANTS = [0, 130, 260, 900, 1700, 2600, 5000];

function bodyAt(written: Written[]): number {
  for (const [at, quad] of written.entries()) {
    if (quad.sheet === SHEET && quad.blend === 'over') {
      return at;
    }
  }
  return -1;
}

function washes(written: Written[]): Written[] {
  const found: Written[] = [];

  for (const piece of written) {
    if (piece.blend === 'wash') {
      found.push(piece);
    }
  }
  return found;
}

/** The jewel's facets: solid triangles drawn over the plate, above the body */
function jewelOf(written: Written[], above: number): Written[] {
  const found: Written[] = [];

  for (const piece of written) {
    if (piece.kind === 'triangle' && piece.blend === 'over' && piece.top < above) {
      found.push(piece);
    }
  }
  return found;
}

function teraUnit(type: Types): Unit {
  const { battle, teamA } = createBattle();
  const unit = createUnit(battle, teamA);

  unit.teraType = type;
  terastallize(unit);
  return unit;
}

describe('a Terastallized pokemon', () => {
  it('is edged and glazed in its Tera colour at every instant', () => {
    const unit = teraUnit(Types.Fire);

    for (const clock of INSTANTS) {
      const written = frameOf(slotOf(unit, PARTY_SLOT), clock);
      const body = bodyAt(written);

      expect(body).toBeGreaterThanOrEqual(0);
      // The edge behind it, and the glaze over it
      expect(washes(written.slice(0, body))).toHaveLength(1);
      expect(washes(written.slice(body)).length).toBeGreaterThanOrEqual(1);
      expect(washes(written)[0].colour).toBe(TYPE_COLORS[Types.Fire]);
    }
  });

  it('wears its jewel over its head in the Tera colour', () => {
    const unit = teraUnit(Types.Water);

    for (const clock of INSTANTS) {
      const written = frameOf(slotOf(unit, PARTY_SLOT), clock);
      const crown = 300 - PARTY_SLOT * 2;
      const jewel = jewelOf(written, crown);

      expect(jewel).toHaveLength(jewelFacets(0, 0, TYPE_COLORS[Types.Water]).length);
      // Its middle facets are the type colour itself
      const colours = new Set<unknown>();

      for (const cut of jewel) {
        colours.add(cut.colour);
      }
      expect(colours.has(TYPE_COLORS[Types.Water])).toBe(true);
    }
  });

  it('wears the jewel over a raid boss too', () => {
    const unit = teraUnit(Types.Dragon);
    const written = frameOf(slotOf(unit, BOSS_RADIUS), 0);

    expect(jewelOf(written, 300 - BOSS_RADIUS * 2)).not.toHaveLength(0);
  });

  it('has none of it before it Terastallizes', () => {
    const { battle, teamA } = createBattle();
    const unit = createUnit(battle, teamA);

    unit.teraType = Types.Fire;
    const written = frameOf(slotOf(unit, PARTY_SLOT), 0);

    expect(washes(written)).toHaveLength(0);
    expect(jewelOf(written, 300)).toHaveLength(0);
  });

  it('draws its jewel on the 2D context too', () => {
    const tera = canvas();
    const plain = canvas();
    const { battle, teamA } = createBattle();

    drawSlot(tera.context, slotOf(teraUnit(Types.Ice), PARTY_SLOT), new Map(), 0, new Map());
    drawSlot(plain.context, slotOf(createUnit(battle, teamA), PARTY_SLOT), new Map(), 0, new Map());
    expect(tera.fills() - plain.fills()).toBeGreaterThanOrEqual(
      jewelFacets(0, 0, '#000000').length,
    );
  });

  it('cuts a jewel about as wide as a held stone', () => {
    let left = Infinity;
    let right = -Infinity;

    for (const cut of jewelFacets(0, 0, '#808080')) {
      for (const point of cut.points) {
        left = Math.min(left, point.x);
        right = Math.max(right, point.x);
      }
    }
    expect(right - left).toBe(JEWEL_REACH * 2);
  });
});
