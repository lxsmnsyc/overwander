import * as v from 'valibot';
import type { Stages } from '../constants/stats';
import type { Moves } from '../ids/moves';
import { MOVE_IDS, STAGE_IDS, STATUS_IDS, TEAM_STATUS_IDS } from '../ids/names';
import type { Statuses, TeamStatuses } from '../ids/status';
import { idOf } from '../yaml';
import addedStagesFile from './added-stages.yaml';
import addedStatusesFile from './added-statuses.yaml';
import drainFile from './drain.yaml';
import healFile from './heal.yaml';
import multiHitFile from './multi-hit.yaml';
import recoilFile from './recoil.yaml';
import stagesFile from './stages.yaml';
import statusesFile from './statuses.yaml';
import zPowerFile from './z-power.yaml';

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
