import * as v from 'valibot';
import type Abilities from '../ids/abilities';
import type { StatusKind } from '../ids/builds';
import type { MoveCategories, Moves } from '../ids/moves';
import { ABILITY_IDS, MOVE_CATEGORY_IDS, MOVE_IDS, STATUS_KIND_IDS } from '../ids/names';
import { idOf } from '../yaml';
import abilitiesFile from './abilities.yaml';
import attacksFile from './attacks.yaml';
import statusMovesFile from './status-moves.yaml';

/**
 * What the expert builder pays for a move or an ability, out of their
 * YAML. How the prices are spent is `src/overworld/builds/`
 */

const NAME = v.string();
const PRICE = v.pipe(v.number(), v.minValue(0));

/** A file keyed by name, each entry read by its own schema */
function entries<S extends v.GenericSchema>(
  file: unknown,
  schema: S,
): [name: string, entry: v.InferOutput<S>][] {
  return Object.entries(v.parse(v.record(NAME, schema), file));
}

/** What a status move is worth a slot for. A move left out is never priced */
export const STATUS_WORTH: Partial<Record<Moves, number>> = {};

/** What each status move is for. Anything absent is read as a cripple */
export const STATUS_KINDS: Partial<Record<Moves, StatusKind>> = {};

/** Which half of the split a setup move sharpens. One that serves either is absent */
export const SETUP_CATEGORY: Partial<Record<Moves, MoveCategories>> = {};

for (const [name, entry] of entries(
  statusMovesFile,
  v.strictObject({
    worth: v.optional(PRICE),
    kind: v.optional(NAME),
    serves: v.optional(NAME),
  }),
)) {
  const at = `status-moves.yaml: ${name}`;
  const move = idOf<Moves>(MOVE_IDS, name, at);

  if (entry.worth != null) {
    STATUS_WORTH[move] = entry.worth;
  }
  if (entry.kind != null) {
    STATUS_KINDS[move] = idOf<StatusKind>(STATUS_KIND_IDS, entry.kind, at);
  }
  if (entry.serves != null) {
    SETUP_CATEGORY[move] = idOf<MoveCategories>(MOVE_CATEGORY_IDS, entry.serves, at);
  }
}

/** What a damaging move costs beyond its entry, as a factor. 0 is never built with */
export const MOVE_DRAWBACKS: Partial<Record<Moves, number>> = {};

/** What a move with no power of its own is worth, as the power a plain move would need */
export const ESTIMATED_POWER: Partial<Record<Moves, number>> = {};

for (const [name, entry] of entries(
  attacksFile,
  v.strictObject({ drawback: v.optional(PRICE), power: v.optional(PRICE) }),
)) {
  const move = idOf<Moves>(MOVE_IDS, name, `attacks.yaml: ${name}`);

  if (entry.drawback != null) {
    MOVE_DRAWBACKS[move] = entry.drawback;
  }
  if (entry.power != null) {
    ESTIMATED_POWER[move] = entry.power;
  }
}

/** What an ability is worth to a built pokemon, against 100 for an ordinary one */
export const ABILITY_WORTH: Partial<Record<Abilities, number>> = {};

/** The abilities that are there to hit with */
export const OFFENSE_ABILITIES = new Set<Abilities>();

/** The abilities that are there to still be standing */
export const GUARD_ABILITIES = new Set<Abilities>();

for (const [name, entry] of entries(
  abilitiesFile,
  v.strictObject({
    worth: v.optional(PRICE),
    lean: v.optional(v.picklist(['offense', 'guard'])),
  }),
)) {
  const ability = idOf<Abilities>(ABILITY_IDS, name, `abilities.yaml: ${name}`);

  if (entry.worth != null) {
    ABILITY_WORTH[ability] = entry.worth;
  }
  if (entry.lean === 'offense') {
    OFFENSE_ABILITIES.add(ability);
  } else if (entry.lean === 'guard') {
    GUARD_ABILITIES.add(ability);
  }
}
