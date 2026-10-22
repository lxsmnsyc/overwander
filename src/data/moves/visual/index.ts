import * as v from 'valibot';
import type { Stages } from '../../constants/stats';
import type { Types } from '../../constants/types';
import type { Moves } from '../../ids/moves';
import { MOVE_IDS, STAGE_IDS, TYPE_IDS } from '../../ids/names';
import { idOf } from '../../yaml';
import { DELAY_SHAPES, type DelayShape, EFFECT_SHAPES, type EffectShape } from './shape-names';
import shapesFile from './shapes.yaml';

export { DELAY_SHAPES, EFFECT_SHAPES, type DelayShape, type EffectShape } from './shape-names';

/**
 * How each move is drawn in battle, out of its YAML: the canvas's
 * lookup tables, with the painters themselves left in
 * `src/canvas/battle/moves/`.
 *
 * - `shapes.yaml` is each landing shape: its span, jolt, wait, colour
 * - the rest is filed the way `cast/` is, each move keyed by name, for
 *   the moves whose picture the rules in the canvas would get wrong
 *
 * Shape names are not an enum, so they are checked against the lists
 * in `shape-names.ts` here instead of through `ids/names.ts`
 */

const NAME = v.string();
const HEX = v.pipe(v.string(), v.regex(/^#[0-9a-f]{6}$/));

const SHAPE = v.strictObject({
  span: v.optional(v.pipe(v.number(), v.minValue(0))),
  jolt: v.optional(v.pipe(v.number(), v.minValue(0))),
  arrives: v.optional(v.literal(true)),
  wait: v.optional(NAME),
  color: v.optional(HEX),
  staged: v.optional(v.literal(true)),
  types: v.optional(v.array(NAME)),
});

const MOVE = v.strictObject({
  landing: v.optional(NAME),
  winding: v.optional(NAME),
  wait: v.optional(v.strictObject({ winding: v.optional(NAME), striking: v.optional(NAME) })),
  color: v.optional(NAME),
});

const FILE = v.record(NAME, v.unknown());

/** Written for `winding` where the wind-up step draws no landing at all */
const NO_LANDING = 'none';

/** A list of names as a table from each name to itself, for `idOf` */
function namesOf<T extends string>(names: readonly T[]): Readonly<Record<string, T>> {
  const table: Record<string, T> = {};

  for (const name of names) {
    table[name] = name;
  }
  return table;
}

const EFFECT_SHAPE_NAMES = namesOf(EFFECT_SHAPES);
const DELAY_SHAPE_NAMES = namesOf(DELAY_SHAPES);

/** How long each shape runs at ordinary weight, but for the ones timed in code */
export const SHAPE_SPANS: Partial<Record<EffectShape, number>> = {};
/** How hard each shape shakes the scene at ordinary weight, in drawing pixels */
export const JOLTS: Partial<Record<EffectShape, number>> = {};
/**
 * Landings that already cross the gap or come down onto the target, so
 * the wait before them is the caster winding up rather than a throw
 */
export const ARRIVES_ITSELF = new Set<EffectShape>();
/** How the gap is spent where the landing already says it */
export const WAIT_BY_LANDING: Partial<Record<EffectShape, DelayShape>> = {};
/** The shapes about something other than the move's element, and their colour */
export const SHAPE_COLORS: Partial<Record<EffectShape, string>> = {};
/** The shapes that picture a stat moving, and so take the stat's colour */
export const STAGED = new Set<EffectShape>();
/** Which shape a type reaches for when the move has not asked for one */
export const SHAPE_BY_TYPE: Partial<Record<Types, EffectShape>> = {};

{
  const seen = new Set<string>();

  for (const [name, record] of Object.entries(v.parse(FILE, shapesFile))) {
    const where = `shapes.yaml: ${name}`;
    const shape = idOf(EFFECT_SHAPE_NAMES, name, where);
    const read = v.parse(SHAPE, record);

    seen.add(shape);
    if (read.span != null) {
      SHAPE_SPANS[shape] = read.span;
    }
    if (read.jolt != null) {
      JOLTS[shape] = read.jolt;
    }
    if (read.arrives === true) {
      ARRIVES_ITSELF.add(shape);
    }
    if (read.wait != null) {
      WAIT_BY_LANDING[shape] = idOf(DELAY_SHAPE_NAMES, read.wait, where);
    }
    if (read.color != null) {
      SHAPE_COLORS[shape] = read.color;
    }
    if (read.staged === true) {
      STAGED.add(shape);
    }
    for (const typeName of read.types ?? []) {
      const type = idOf<Types>(TYPE_IDS, typeName, where);

      if (SHAPE_BY_TYPE[type] != null) {
        throw new Error(`${where}: ${typeName} already falls back on ${SHAPE_BY_TYPE[type]}`);
      }
      SHAPE_BY_TYPE[type] = shape;
    }
  }
  for (const shape of EFFECT_SHAPES) {
    if (!seen.has(shape)) {
      throw new Error(`shapes.yaml: ${shape} is missing`);
    }
  }
}

/**
 * Every shape's span, the YAML's and the ones timed in code together.
 * A shape with neither, or with both, fails the load
 */
export function spansWith(
  computed: Partial<Record<EffectShape, number>>,
): Record<EffectShape, number> {
  const spans: Partial<Record<EffectShape, number>> = {};

  for (const shape of EFFECT_SHAPES) {
    const written = SHAPE_SPANS[shape];
    const timed = computed[shape];

    if ((written == null) === (timed == null)) {
      throw new Error(`shapes.yaml: ${shape} needs a span written or timed in code, and not both`);
    }
    spans[shape] = written ?? timed;
  }
  if (!isEveryShape(spans)) {
    throw new Error('shapes.yaml: a shape has no span');
  }
  return spans;
}

function isEveryShape<T>(table: Partial<Record<EffectShape, T>>): table is Record<EffectShape, T> {
  for (const shape of EFFECT_SHAPES) {
    if (table[shape] == null) {
      return false;
    }
  }
  return true;
}

/** What each move lands as, where the shape should say the move's name */
export const LANDINGS: Partial<Record<Moves, EffectShape>> = {};
/**
 * The moves whose wind-up step does nothing to anybody, a charge, a
 * burrow, a climb, so it draws no landing
 */
export const WINDING_UP = new Set<Moves>();
/** The moves whose wind-up step is a blow of its own, and what it lands as */
export const WINDING_AS: Partial<Record<Moves, EffectShape>> = {};
/** How a move spends the gap, as **[winding up, striking]**; a gap left out falls back */
export const WAITS: Partial<Record<Moves, [winding?: DelayShape, striking?: DelayShape]>> = {};
/** A move's own colour: a hex, or the stage whose colour it shares */
export const MOVE_COLORS: Partial<Record<Moves, string | Stages>> = {};

{
  const files = import.meta.glob<unknown>(['./**/*.yaml', '!./shapes.yaml'], {
    eager: true,
    import: 'default',
  });
  const seen = new Set<Moves>();

  for (const [path, file] of Object.entries(files)) {
    for (const [name, record] of Object.entries(v.parse(FILE, file))) {
      const where = `${path}: ${name}`;
      const move = idOf<Moves>(MOVE_IDS, name, where);
      const read = v.parse(MOVE, record);

      if (seen.has(move)) {
        throw new Error(`${where}: written twice`);
      }
      seen.add(move);
      if (read.landing != null) {
        LANDINGS[move] = idOf(EFFECT_SHAPE_NAMES, read.landing, where);
      }
      if (read.winding === NO_LANDING) {
        WINDING_UP.add(move);
      } else if (read.winding != null) {
        WINDING_AS[move] = idOf(EFFECT_SHAPE_NAMES, read.winding, where);
      }
      if (read.wait != null) {
        const { winding, striking } = read.wait;

        WAITS[move] = [
          winding == null ? undefined : idOf(DELAY_SHAPE_NAMES, winding, where),
          striking == null ? undefined : idOf(DELAY_SHAPE_NAMES, striking, where),
        ];
      }
      if (read.color != null) {
        MOVE_COLORS[move] = v.is(HEX, read.color)
          ? read.color
          : idOf<Stages>(STAGE_IDS, read.color, where);
      }
    }
  }
}
