import * as v from 'valibot';
import { Stages } from '../constants/stats';
import type { Types } from '../constants/types';
import type { Moves } from '../ids/moves';
import type MoveRole from '../ids/move-roles';
import {
  BATTLE_WEATHER_IDS,
  MOVE_IDS,
  MOVE_ROLE_IDS,
  SPECIES_IDS,
  STAGE_IDS,
  STATUS_IDS,
  TEAM_STATUS_IDS,
  TERRAIN_IDS,
  TYPE_IDS,
} from '../ids/names';
import type { Species } from '../ids/species';
import type { Statuses, TeamStatuses, Terrains, Weathers } from '../ids/status';
import { idOf, idsOf } from '../yaml';
import addedStagesFile from './added-stages.yaml';
import addedStatusesFile from './added-statuses.yaml';
import drainFile from './drain.yaml';
import healFile from './heal.yaml';
import multiHitFile from './multi-hit.yaml';
import recoilFile from './recoil.yaml';
import stagesFile from './stages.yaml';
import statusesFile from './statuses.yaml';
import zPowerFile from './z-power.yaml';
import maxPowerFile from './max-power.yaml';
import zEffectsFile from './z-effects.yaml';
import rechargeFile from './recharge.yaml';
import tutorOnlyFile from './tutor-only.yaml';
import pseudoFile from './pseudo.yaml';
import gmaxFile from './gmax.yaml';
import maxMovesFile from './max-moves.yaml';
import zMovesFile from './z-moves.yaml';
import guardsFile from './guards.yaml';
import aiRolesFile from './ai-roles.yaml';

/**
 * The numbers the battle reads off each move, out of their YAML: what
 * a move puts down, how hard it pushes a stage, how many times it
 * strikes, what it costs or hands back. A file per mechanic, each
 * keyed by move.
 *
 * Only the numbers live here. What a mechanic does with them is the
 * matching file in `src/battle/moves/`, and the move itself (its type,
 * power and the rest) is in `src/data/moves/`
 */

/** A move's table: what each move reads, for the moves that have one */
export type MoveTable<T> = { [key in Moves]?: T };

const NAME = v.string();

/** A share written as a number or as a fraction, `1/3` */
const SHARE = v.pipe(
  v.union([v.number(), v.pipe(v.string(), v.regex(/^\d+\/\d+$/))]),
  v.transform((share) => {
    if (typeof share === 'number') {
      return share;
    }

    const [over, under] = share.split('/');

    return Number(over) / Number(under);
  }),
);

const CHANCE = v.pipe(v.number(), v.minValue(0), v.maxValue(100));

const COUNT = v.pipe(v.number(), v.integer(), v.minValue(1));

/** A file keyed by move, each value read by `read` */
function table<S extends v.GenericSchema, T>(
  file: unknown,
  where: string,
  schema: S,
  read: (value: v.InferOutput<S>, at: string) => T,
): MoveTable<T> {
  const out: MoveTable<T> = {};

  for (const [name, written] of Object.entries(v.parse(v.record(NAME, v.unknown()), file))) {
    const at = `${where}: ${name}`;

    out[idOf<Moves>(MOVE_IDS, name, at)] = read(v.parse(schema, written), at);
  }
  return out;
}

const STATUSES = v.object({
  target: v.record(NAME, NAME),
  self: v.record(NAME, NAME),
  team: v.record(NAME, NAME),
});

const statuses = v.parse(STATUSES, statusesFile);

export const STATUS_MOVES = table(statuses.target, 'statuses.yaml', NAME, (status, at) =>
  idOf<Statuses>(STATUS_IDS, status, at),
);

export const SELF_STATUS_MOVES = table(statuses.self, 'statuses.yaml', NAME, (status, at) =>
  idOf<Statuses>(STATUS_IDS, status, at),
);

export const TEAM_STATUS_MOVES = table(statuses.team, 'statuses.yaml', NAME, (status, at) =>
  idOf<TeamStatuses>(TEAM_STATUS_IDS, status, at),
);

export const EFFECT_STATUS_MOVES = table(
  addedStatusesFile,
  'added-statuses.yaml',
  v.object({ status: NAME, chance: CHANCE }),
  ({ status, chance }, at) => ({ status: idOf<Statuses>(STATUS_IDS, status, at), chance }),
);

/**
 * A stage a move pushes on the side as it lands. `self` is which side:
 * a Metal Claw sharpens its own claws, an Iron Tail dents what it hit
 */
export interface AttackStageEffect {
  stage: Stages | Stages[];
  value: number;
  chance: number;
  self?: boolean;
}

export const EFFECT_STAGE_MOVES = table(
  addedStagesFile,
  'added-stages.yaml',
  v.object({
    stages: v.array(NAME),
    value: v.number(),
    chance: CHANCE,
    self: v.optional(v.literal(true)),
  }),
  ({ stages, value, chance, self }, at): AttackStageEffect => {
    const read: Stages[] = [];

    for (const stage of stages) {
      read.push(idOf<Stages>(STAGE_IDS, stage, at));
    }

    const effect: AttackStageEffect = {
      stage: read.length === 1 ? read[0] : read,
      value,
      chance,
    };

    if (self === true) {
      effect.self = true;
    }
    return effect;
  },
);

export interface StageMoveEffect {
  stage: Stages;
  value: number;
}

/** The stages each status move changes, in the order it changes them */
export const STAGE_MOVES = table(
  stagesFile,
  'stages.yaml',
  v.record(NAME, v.number()),
  (stages, at): StageMoveEffect[] => {
    const effects: StageMoveEffect[] = [];

    for (const [stage, value] of Object.entries(stages)) {
      effects.push({ stage: idOf<Stages>(STAGE_IDS, stage, at), value });
    }
    return effects;
  },
);

export interface MultiHitConfig {
  min: number;
  max: number;
  /**
   * Each strike lands harder than the last, by its own number: a
   * Triple Kick's third kick is three times the first
   */
  escalating?: boolean;
}

export const MULTI_HIT_MOVES = table(
  multiHitFile,
  'multi-hit.yaml',
  v.object({ min: COUNT, max: COUNT, escalating: v.optional(v.literal(true)) }),
  ({ min, max, escalating }): MultiHitConfig =>
    escalating === true ? { min, max, escalating } : { min, max },
);

export const RECOIL_MOVES = table(recoilFile, 'recoil.yaml', SHARE, (share) => share);

/** The drains, and the share of what each deals that it hands back */
export const DRAIN_SHARES = table(drainFile, 'drain.yaml', SHARE, (share) => share);

/** Self-healing moves and the fraction of max health they restore */
export const HEAL_FRACTION = table(healFile, 'heal.yaml', SHARE, (share) => share);

/**
 * What a type Z-Move hits with, for the moves the table by power gets
 * wrong
 */
export const Z_POWER_OVERRIDES = table(zPowerFile, 'z-power.yaml', COUNT, (power) => power);

/**
 * What a Max Move hits with, for the moves the table by power gets
 * wrong
 */
export const MAX_POWER_OVERRIDES = table(maxPowerFile, 'max-power.yaml', COUNT, (power) => power);

/** What a type crystal adds to a status move of its type, just before the move goes off */
export type ZStatusEffect =
  | { kind: 'stages'; stages: readonly Stages[]; value: number }
  /** Back to full HP */
  | { kind: 'heal' }
  /** Every lowered stage back to 0 */
  | { kind: 'clear' }
  /** Critical hit ratio 2 stages up, as Focus Energy */
  | { kind: 'critical' }
  /** Draws the other side's moves, as Follow Me */
  | { kind: 'centre' }
  /** Full HP for a Ghost, Attack a stage for anything else */
  | { kind: 'curse' };

const ALL_STATS = [
  Stages.Attack,
  Stages.Defense,
  Stages.SpecialAttack,
  Stages.SpecialDefense,
  Stages.Speed,
] as const;

/** Each status move's Z-effect, for the moves the mainline gives one */
export const Z_STATUS_EFFECTS = table(
  zEffectsFile,
  'z-effects.yaml',
  v.union([
    v.picklist(['heal', 'clear', 'critical', 'centre', 'curse']),
    v.object({ stages: v.union([v.literal('all'), v.array(NAME)]), value: v.number() }),
  ]),
  (effect, at): ZStatusEffect => {
    if (typeof effect === 'string') {
      return { kind: effect };
    }
    if (effect.stages === 'all') {
      return { kind: 'stages', stages: ALL_STATS, value: effect.value };
    }

    const stages: Stages[] = [];

    for (const stage of effect.stages) {
      stages.push(idOf<Stages>(STAGE_IDS, stage, at));
    }
    return { kind: 'stages', stages, value: effect.value };
  },
);

/** A list of moves, in the order it is written */
function moveSet(file: unknown, where: string): ReadonlySet<Moves> {
  return new Set(idsOf<Moves>(MOVE_IDS, v.parse(v.array(NAME), file), where));
}

/** A map of names to names, each side looked up in its own table, in the order it is written */
function nameMap<K, T>(
  written: Record<string, string>,
  where: string,
  keys: Readonly<Record<string, K>>,
  values: Readonly<Record<string, T>>,
): Map<K, T> {
  const out = new Map<K, T>();

  for (const [key, value] of Object.entries(written)) {
    const at = `${where}: ${key}`;

    out.set(idOf(keys, key, at), idOf(values, value, at));
  }
  return out;
}

/** The moves that leave the user standing still once they land */
export const RECHARGE_MOVES = moveSet(rechargeFile, 'recharge.yaml');

/** The signature moves only the Move Tutor teaches */
export const TUTOR_ONLY_MOVES = moveSet(tutorOnlyFile, 'tutor-only.yaml');

/** The moves that are not a pokemon's own: confusion, Struggle and the bare swing */
export const PSEUDO_MOVES = moveSet(pseudoFile, 'pseudo.yaml');

const gmax = v.parse(
  v.object({
    species: v.record(NAME, v.object({ move: NAME, type: NAME })),
    fixed: v.array(NAME),
  }),
  gmaxFile,
);

/** Each species with a Gigantamax form, with its G-Max Move and that move's type */
export const GMAX_SPECIES = new Map<Species, { move: Moves; type: Types }>();

for (const [name, { move, type }] of Object.entries(gmax.species)) {
  const at = `gmax.yaml: ${name}`;

  GMAX_SPECIES.set(idOf<Species>(SPECIES_IDS, name, at), {
    move: idOf<Moves>(MOVE_IDS, move, at),
    type: idOf<Types>(TYPE_IDS, type, at),
  });
}

/** The G-Max Moves that hit at 160 whatever they replace, and through any ability */
export const FIXED_G_MAX_MOVES = moveSet(gmax.fixed, 'gmax.yaml: fixed');

const MAPPING = v.record(NAME, NAME);

const maxMoves = v.parse(
  v.object({
    types: MAPPING,
    weathers: MAPPING,
    terrains: MAPPING,
    'foe-stages': MAPPING,
    'ally-stages': MAPPING,
  }),
  maxMovesFile,
);

/** The Max Move a damaging move of each type becomes */
export const TYPE_MAX_MOVES = nameMap<Types, Moves>(
  maxMoves.types,
  'max-moves.yaml: types',
  TYPE_IDS,
  MOVE_IDS,
);

/** The sky each weather Max Move calls up */
export const MAX_MOVE_WEATHERS = nameMap<Moves, Weathers>(
  maxMoves.weathers,
  'max-moves.yaml: weathers',
  MOVE_IDS,
  BATTLE_WEATHER_IDS,
);

/** The terrain each terrain Max Move lays */
export const MAX_MOVE_TERRAINS = nameMap<Moves, Terrains>(
  maxMoves.terrains,
  'max-moves.yaml: terrains',
  MOVE_IDS,
  TERRAIN_IDS,
);

/** The stage each Max Move drops a stage on every foe */
export const MAX_MOVE_FOE_STAGES = nameMap<Moves, Stages>(
  maxMoves['foe-stages'],
  'max-moves.yaml: foe-stages',
  MOVE_IDS,
  STAGE_IDS,
);

/** The stage each Max Move raises a stage on the user's whole side */
export const MAX_MOVE_ALLY_STAGES = nameMap<Moves, Stages>(
  maxMoves['ally-stages'],
  'max-moves.yaml: ally-stages',
  MOVE_IDS,
  STAGE_IDS,
);

const zMoves = v.parse(v.object({ types: MAPPING, signatures: v.array(NAME) }), zMovesFile);

/** The Z-Move each type's crystal turns a damaging move of that type into */
export const TYPE_Z_MOVES = nameMap<Types, Moves>(
  zMoves.types,
  'z-moves.yaml: types',
  TYPE_IDS,
  MOVE_IDS,
);

/** The Z-Moves that belong to one line and one move each */
export const SIGNATURE_Z_MOVES = moveSet(zMoves.signatures, 'z-moves.yaml: signatures');

/** The guards, and what each one puts on the user */
export const GUARD_MOVES = table(guardsFile, 'guards.yaml', NAME, (status, at) =>
  idOf<Statuses>(STATUS_IDS, status, at),
);

/**
 * The moves the AI files under a role by hand, since no registry groups
 * them. They add to the roles read off the move's own data
 */
export const AI_ROLE_MOVES = new Map<MoveRole, ReadonlySet<Moves>>();

for (const [role, moves] of Object.entries(v.parse(v.record(NAME, v.array(NAME)), aiRolesFile))) {
  const at = `ai-roles.yaml: ${role}`;

  AI_ROLE_MOVES.set(
    idOf<MoveRole>(MOVE_ROLE_IDS, role, at),
    new Set(idsOf<Moves>(MOVE_IDS, moves, at)),
  );
}
