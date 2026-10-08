import * as v from 'valibot';
import { CAST_ANIMATIONS, type CastAnimation } from '../constants/cast';
import type { Types } from '../constants/types';
import type { MoveCategories, MoveTargets, Moves } from '../ids/moves';
import {
  MOVE_AFFECT_IDS,
  MOVE_CATEGORY_IDS,
  MOVE_FLAG_IDS,
  MOVE_IDS,
  MOVE_TARGET_IDS,
  SPRITE_ANIM_IDS,
  TYPE_IDS,
} from '../ids/names';
import { flagsOf, idOf, idsOf } from '../yaml';
import { PROJECTILE_DELAY, type RegisterMoveData } from './__create';

/**
 * The moves, read out of their YAML.
 *
 * Each part of a move lives in a folder of its own, filed by the
 * generation and the stretch of moves it was written in
 * (`gen-1/bulbasaur-to-blastoise.yaml`), each move keyed by its name:
 *
 * - `battle/` is what a fight reads: type, category, power, accuracy,
 *   priority, PP, who it reaches and how
 * - `cast/` is what the caster looks like doing it, most wanted first
 * - `text/<locale>/moves/` holds each name and description
 *
 * What a move does beyond its numbers is code, in `src/battle/moves/`
 */

const NAME = v.string();
const NAMES = v.array(NAME);
const COUNT = v.pipe(v.number(), v.minValue(0));

const BATTLE = v.object({
  type: NAME,
  category: NAME,
  power: v.optional(COUNT),
  accuracy: v.optional(COUNT),
  priority: v.optional(v.number()),
  pp: COUNT,
  target: NAME,
  affects: v.optional(NAMES),
  flags: v.optional(NAMES, []),
  steps: v.optional(COUNT),
  projectile: v.optional(v.boolean()),
});

const TEXT = v.object({ name: v.string(), description: v.string() });

const FILE = v.record(NAME, v.unknown());

/** One part's files merged into one map from move name to its part */
function collect(files: Record<string, unknown>): Map<string, { where: string; part: unknown }> {
  const parts = new Map<string, { where: string; part: unknown }>();

  for (const [path, file] of Object.entries(files)) {
    for (const [name, part] of Object.entries(v.parse(FILE, file))) {
      if (parts.has(name)) {
        throw new Error(`${path}: ${name} is written twice`);
      }
      parts.set(name, { where: path, part });
    }
  }
  return parts;
}

const CASTS = new Set<number>(CAST_ANIMATIONS);

function isCast(anim: number): anim is CastAnimation {
  return CASTS.has(anim);
}

/** The clips a move asks for, each one a clip a cast may name */
function castOf(names: string[], where: string): CastAnimation[] {
  const clips: CastAnimation[] = [];

  for (const anim of idsOf(SPRITE_ANIM_IDS, names, where)) {
    if (!isCast(anim)) {
      throw new Error(`${where}: ${anim} is not a clip a move can play`);
    }
    clips.push(anim);
  }
  return clips;
}

/** Every move file, as the build hands them over */
export interface MoveFiles {
  battle: Record<string, unknown>;
  cast: Record<string, unknown>;
  text: Record<string, unknown>;
}

/** Every move the files describe, in id order, which is what Metronome draws from */
export function readMoves(files: MoveFiles): [Moves, RegisterMoveData][] {
  const battle = collect(files.battle);
  const cast = collect(files.cast);
  const text = collect(files.text);
  const read: [Moves, RegisterMoveData][] = [];

  for (const [name, placed] of battle) {
    const where = `${placed.where}: ${name}`;
    const need = (part: Map<string, { part: unknown }>, kind: string): unknown => {
      const found = part.get(name);

      if (found == null) {
        throw new Error(`${name} has no ${kind}`);
      }
      return found.part;
    };
    const numbers = v.parse(BATTLE, placed.part);
    const words = v.parse(TEXT, need(text, 'text'));
    const data: RegisterMoveData = {
      name: words.name,
      description: words.description,
      type: idOf<Types>(TYPE_IDS, numbers.type, where),
      category: idOf<MoveCategories>(MOVE_CATEGORY_IDS, numbers.category, where),
      pp: numbers.pp,
      target: idOf<MoveTargets>(MOVE_TARGET_IDS, numbers.target, where),
      flags: flagsOf(MOVE_FLAG_IDS, numbers.flags, where),
      cast: castOf(v.parse(NAMES, need(cast, 'cast')), where),
    };

    if (numbers.power != null) {
      data.power = numbers.power;
    }
    if (numbers.accuracy != null) {
      data.accuracy = numbers.accuracy;
    }
    if (numbers.priority != null) {
      data.priority = numbers.priority;
    }
    if (numbers.affects != null) {
      data.affects = flagsOf(MOVE_AFFECT_IDS, numbers.affects, where);
    }
    if (numbers.steps != null) {
      data.steps = numbers.steps;
    }
    if (numbers.projectile === true) {
      data.delay = PROJECTILE_DELAY;
    }
    read.push([idOf<Moves>(MOVE_IDS, name, where), data]);
  }

  for (const [kind, part] of [
    ['cast', cast],
    ['text', text],
  ] as const) {
    for (const name of part.keys()) {
      if (!battle.has(name)) {
        throw new Error(`${name} has ${kind} but no battle numbers`);
      }
    }
  }

  read.sort(([one], [two]) => one - two);
  return read;
}
