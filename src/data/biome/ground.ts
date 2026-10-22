import * as v from 'valibot';
import type { Types } from '../constants/types';
import type Biome from '../ids/biome';
import type { Moves } from '../ids/moves';
import { BIOME_IDS, MOVE_IDS, STATUS_IDS, TYPE_IDS } from '../ids/names';
import type { Statuses } from '../ids/status';
import { idOf } from '../yaml';
import groundFile from './ground.yaml';

/**
 * What the ground a fight is had on counts as, out of `ground.yaml`.
 * What the three moves that read it do with it is
 * `src/battle/moves/ground.ts`
 */

const NAME = v.string();

const ground = v.parse(
  v.strictObject({
    biomes: v.record(NAME, NAME),
    effects: v.record(NAME, v.strictObject({ move: NAME, status: NAME })),
  }),
  groundFile,
);

/** What the ground underfoot counts as */
export const BIOME_TYPES: { [key in Biome]?: Types } = {};

for (const [biome, type] of Object.entries(ground.biomes)) {
  const at = `ground.yaml: ${biome}`;

  BIOME_TYPES[idOf<Biome>(BIOME_IDS, biome, at)] = idOf<Types>(TYPE_IDS, type, at);
}

/** What each ground throws, and what it leaves behind */
export const GROUND_EFFECTS: { [key in Types]?: { move: Moves; status: Statuses } } = {};

for (const [type, { move, status }] of Object.entries(ground.effects)) {
  const at = `ground.yaml: ${type}`;

  GROUND_EFFECTS[idOf<Types>(TYPE_IDS, type, at)] = {
    move: idOf<Moves>(MOVE_IDS, move, at),
    status: idOf<Statuses>(STATUS_IDS, status, at),
  };
}
