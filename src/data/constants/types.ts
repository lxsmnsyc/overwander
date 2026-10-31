import * as v from 'valibot';
import { TYPE_IDS } from '../ids/names';
import { TypeEffectiveness, Types } from '../ids/types';
import typesFile from '../types.yaml';
import { idOf, localeStringTable } from '../yaml';

export { TypeEffectiveness, Types };

/**
 * What each type is called, for anywhere a type is read rather than
 * matched: a move's line on a catch sheet, a species' line on a dex
 * entry. `Unknown` is the type nothing is, and it says so
 */
export const TYPE_NAMES = localeStringTable<Types>(
  TYPE_IDS,
  import.meta.glob('../text/*/types.yaml', { eager: true, import: 'default' }),
  'text/<locale>/types.yaml',
);

const MATCHUP_LIST = v.optional(v.array(v.string()), []);

const TYPES = v.record(
  v.string(),
  v.strictObject({
    color: v.pipe(v.string(), v.regex(/^#[0-9a-f]{6}$/)),
    effective: MATCHUP_LIST,
    resistant: MATCHUP_LIST,
    immune: MATCHUP_LIST,
  }),
);

/** What each type is drawn in, out of `src/data/types.yaml` */
export const TYPE_COLORS: Record<number, string> = {};

/** The chart, attacker first, out of `src/data/types.yaml` */
export const TYPE_EFFECTIVENESS: Record<number, { [type in Types]?: TypeEffectiveness }> = {};

for (const [name, written] of Object.entries(v.parse(TYPES, typesFile))) {
  const at = `types.yaml: ${name}`;
  const type = idOf<Types>(TYPE_IDS, name, at);
  const row: { [type in Types]?: TypeEffectiveness } = {};

  for (const [list, effectiveness] of [
    [written.effective, TypeEffectiveness.Effective],
    [written.resistant, TypeEffectiveness.Resistant],
    [written.immune, TypeEffectiveness.Immune],
  ] as const) {
    for (const defending of list) {
      row[idOf<Types>(TYPE_IDS, defending, at)] = effectiveness;
    }
  }
  TYPE_COLORS[type] = written.color;
  TYPE_EFFECTIVENESS[type] = row;
}
for (const [name, type] of Object.entries(TYPE_IDS)) {
  if (!Object.hasOwn(TYPE_EFFECTIVENESS, type)) {
    throw new Error(`types.yaml: ${name} is missing`);
  }
}

export const TYPE_EFFECTIVENESS_FACTOR: Record<TypeEffectiveness, number> = {
  [TypeEffectiveness.Effective]: 2.0,
  [TypeEffectiveness.Resistant]: 0.5,
  [TypeEffectiveness.Immune]: 0,
};

export interface TypeMatchups {
  /** What it hits for double */
  strong: Types[];
  /** What hits it for double */
  weak: Types[];
  /** What it takes half from */
  resists: Types[];
  /** What cannot touch it at all */
  immune: Types[];
}

/** How hard an attacking type hits a defender of all these types at once */
export function getTypeFactor(attacking: Types, defending: readonly Types[]): number {
  let factor = 1;

  for (const type of defending) {
    const matchup = TYPE_EFFECTIVENESS[attacking][type];

    if (matchup != null) {
      factor *= TYPE_EFFECTIVENESS_FACTOR[matchup];
    }
  }
  return factor;
}

/**
 * How a type fares both ways round: what it is good against, and what
 * is good against it.
 *
 * The chart is written attacker first, so the attacking half is one
 * row and the defending half is a scan down a column. Worked out once
 * per type and kept, since the chart never changes
 */
const MATCHUPS = new Map<Types, TypeMatchups>();

export function getTypeMatchups(type: Types): TypeMatchups {
  const known = MATCHUPS.get(type);

  if (known != null) {
    return known;
  }

  const found: TypeMatchups = { strong: [], weak: [], resists: [], immune: [] };

  for (const [key, row] of Object.entries(TYPE_EFFECTIVENESS)) {
    const attacking: Types = Number(key);

    if (row[type] === TypeEffectiveness.Effective) {
      found.weak.push(attacking);
    } else if (row[type] === TypeEffectiveness.Resistant) {
      found.resists.push(attacking);
    } else if (row[type] === TypeEffectiveness.Immune) {
      found.immune.push(attacking);
    }

    if (TYPE_EFFECTIVENESS[type][attacking] === TypeEffectiveness.Effective) {
      found.strong.push(attacking);
    }
  }
  MATCHUPS.set(type, found);
  return found;
}
