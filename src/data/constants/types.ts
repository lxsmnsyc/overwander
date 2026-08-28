export const enum Types {
  Unknown = 0,
  Normal = 1,
  Fighting = 2,
  Flying = 3,
  Poison = 4,
  Ground = 5,
  Rock = 6,
  Bug = 7,
  Ghost = 8,
  Steel = 9,
  Fire = 10,
  Water = 11,
  Grass = 12,
  Electric = 13,
  Psychic = 14,
  Ice = 15,
  Dragon = 16,
  Dark = 17,
  Fairy = 18,
  Stellar = 19,
}

/**
 * What each type is called, for anywhere a type is read rather than
 * matched: a move's line on a catch sheet, a species' line on a dex
 * entry. `Unknown` is the type nothing is, and it says so
 */
export const TYPE_NAMES: Record<Types, string> = {
  [Types.Unknown]: 'Unknown',
  [Types.Normal]: 'Normal',
  [Types.Fighting]: 'Fighting',
  [Types.Flying]: 'Flying',
  [Types.Poison]: 'Poison',
  [Types.Ground]: 'Ground',
  [Types.Rock]: 'Rock',
  [Types.Bug]: 'Bug',
  [Types.Ghost]: 'Ghost',
  [Types.Steel]: 'Steel',
  [Types.Fire]: 'Fire',
  [Types.Water]: 'Water',
  [Types.Grass]: 'Grass',
  [Types.Electric]: 'Electric',
  [Types.Psychic]: 'Psychic',
  [Types.Ice]: 'Ice',
  [Types.Dragon]: 'Dragon',
  [Types.Dark]: 'Dark',
  [Types.Fairy]: 'Fairy',
  [Types.Stellar]: 'Stellar',
};

/**
 * What each type is drawn in. They are the colours the series has used
 * for them since the beginning: a player who knows what Water looks
 * like should not have to read the word to know it.
 *
 * `Unknown` is deliberately the colour of nothing in particular — it
 * is the type a move has when it has not decided
 */
export const TYPE_COLORS: Record<Types, string> = {
  [Types.Unknown]: '#8a8a8a',
  [Types.Normal]: '#9fa19f',
  [Types.Fighting]: '#ff8000',
  [Types.Flying]: '#81b9ef',
  [Types.Poison]: '#9141cb',
  [Types.Ground]: '#915121',
  [Types.Rock]: '#afa981',
  [Types.Bug]: '#91a119',
  [Types.Ghost]: '#704170',
  [Types.Steel]: '#60a1b8',
  [Types.Fire]: '#e62829',
  [Types.Water]: '#2980ef',
  [Types.Grass]: '#3fa129',
  [Types.Electric]: '#fac000',
  [Types.Psychic]: '#ef4179',
  [Types.Ice]: '#3dcef3',
  [Types.Dragon]: '#5060e1',
  [Types.Dark]: '#624d4e',
  [Types.Fairy]: '#ef70ef',
  [Types.Stellar]: '#40b5a5',
};

export const enum TypeEffectiveness {
  Effective = 0,
  Resistant = 1,
  Immune = 2,
}

export const TYPE_EFFECTIVENESS_FACTOR: Record<TypeEffectiveness, number> = {
  [TypeEffectiveness.Effective]: 2.0,
  [TypeEffectiveness.Resistant]: 0.5,
  [TypeEffectiveness.Immune]: 0,
};

export const TYPE_EFFECTIVENESS: Record<Types, { [type in Types]?: TypeEffectiveness }> = {
  [Types.Normal]: {
    [Types.Ghost]: TypeEffectiveness.Immune,

    [Types.Rock]: TypeEffectiveness.Resistant,
    [Types.Steel]: TypeEffectiveness.Resistant,
  },
  [Types.Fighting]: {
    [Types.Ghost]: TypeEffectiveness.Immune,

    [Types.Normal]: TypeEffectiveness.Effective,
    [Types.Rock]: TypeEffectiveness.Effective,
    [Types.Steel]: TypeEffectiveness.Effective,
    [Types.Ice]: TypeEffectiveness.Effective,
    [Types.Dark]: TypeEffectiveness.Effective,

    [Types.Flying]: TypeEffectiveness.Resistant,
    [Types.Poison]: TypeEffectiveness.Resistant,
    [Types.Bug]: TypeEffectiveness.Resistant,
    [Types.Psychic]: TypeEffectiveness.Resistant,
    [Types.Fairy]: TypeEffectiveness.Resistant,
  },
  [Types.Flying]: {
    [Types.Fighting]: TypeEffectiveness.Effective,
    [Types.Bug]: TypeEffectiveness.Effective,
    [Types.Grass]: TypeEffectiveness.Effective,

    [Types.Rock]: TypeEffectiveness.Resistant,
    [Types.Steel]: TypeEffectiveness.Resistant,
    [Types.Electric]: TypeEffectiveness.Resistant,
  },
  [Types.Poison]: {
    [Types.Steel]: TypeEffectiveness.Immune,

    [Types.Grass]: TypeEffectiveness.Effective,
    [Types.Fairy]: TypeEffectiveness.Effective,

    [Types.Poison]: TypeEffectiveness.Resistant,
    [Types.Ground]: TypeEffectiveness.Resistant,
    [Types.Rock]: TypeEffectiveness.Resistant,
    [Types.Ghost]: TypeEffectiveness.Resistant,
  },
  [Types.Ground]: {
    [Types.Flying]: TypeEffectiveness.Immune,

    [Types.Poison]: TypeEffectiveness.Effective,
    [Types.Electric]: TypeEffectiveness.Effective,
    [Types.Rock]: TypeEffectiveness.Effective,
    [Types.Steel]: TypeEffectiveness.Effective,
    [Types.Fire]: TypeEffectiveness.Effective,

    [Types.Bug]: TypeEffectiveness.Resistant,
    [Types.Grass]: TypeEffectiveness.Resistant,
  },
  [Types.Rock]: {
    [Types.Flying]: TypeEffectiveness.Effective,
    [Types.Bug]: TypeEffectiveness.Effective,
    [Types.Fire]: TypeEffectiveness.Effective,
    [Types.Ice]: TypeEffectiveness.Effective,

    [Types.Fighting]: TypeEffectiveness.Resistant,
    [Types.Ground]: TypeEffectiveness.Resistant,
    [Types.Steel]: TypeEffectiveness.Resistant,
  },
  [Types.Bug]: {
    [Types.Grass]: TypeEffectiveness.Effective,
    [Types.Psychic]: TypeEffectiveness.Effective,
    [Types.Dark]: TypeEffectiveness.Effective,

    [Types.Fighting]: TypeEffectiveness.Resistant,
    [Types.Flying]: TypeEffectiveness.Resistant,
    [Types.Poison]: TypeEffectiveness.Resistant,
    [Types.Ghost]: TypeEffectiveness.Resistant,
    [Types.Steel]: TypeEffectiveness.Resistant,
    [Types.Fire]: TypeEffectiveness.Resistant,
    [Types.Fairy]: TypeEffectiveness.Resistant,
  },
  [Types.Ghost]: {
    [Types.Normal]: TypeEffectiveness.Immune,

    [Types.Ghost]: TypeEffectiveness.Effective,
    [Types.Psychic]: TypeEffectiveness.Effective,

    [Types.Dark]: TypeEffectiveness.Resistant,
  },
  [Types.Steel]: {
    [Types.Rock]: TypeEffectiveness.Effective,
    [Types.Ice]: TypeEffectiveness.Effective,
    [Types.Fairy]: TypeEffectiveness.Effective,

    [Types.Steel]: TypeEffectiveness.Resistant,
    [Types.Fire]: TypeEffectiveness.Resistant,
    [Types.Water]: TypeEffectiveness.Resistant,
    [Types.Electric]: TypeEffectiveness.Resistant,
  },
  [Types.Fire]: {
    [Types.Bug]: TypeEffectiveness.Effective,
    [Types.Steel]: TypeEffectiveness.Effective,
    [Types.Grass]: TypeEffectiveness.Effective,
    [Types.Ice]: TypeEffectiveness.Effective,

    [Types.Rock]: TypeEffectiveness.Resistant,
    [Types.Fire]: TypeEffectiveness.Resistant,
    [Types.Water]: TypeEffectiveness.Resistant,
    [Types.Dragon]: TypeEffectiveness.Resistant,
  },
  [Types.Water]: {
    [Types.Rock]: TypeEffectiveness.Effective,
    [Types.Ground]: TypeEffectiveness.Effective,
    [Types.Fire]: TypeEffectiveness.Effective,

    [Types.Water]: TypeEffectiveness.Resistant,
    [Types.Grass]: TypeEffectiveness.Resistant,
    [Types.Dragon]: TypeEffectiveness.Resistant,
  },
  [Types.Grass]: {
    [Types.Rock]: TypeEffectiveness.Effective,
    [Types.Ground]: TypeEffectiveness.Effective,
    [Types.Water]: TypeEffectiveness.Effective,

    [Types.Flying]: TypeEffectiveness.Resistant,
    [Types.Poison]: TypeEffectiveness.Resistant,
    [Types.Bug]: TypeEffectiveness.Resistant,
    [Types.Steel]: TypeEffectiveness.Resistant,
    [Types.Fire]: TypeEffectiveness.Resistant,
    [Types.Grass]: TypeEffectiveness.Resistant,
    [Types.Dragon]: TypeEffectiveness.Resistant,
  },
  [Types.Electric]: {
    [Types.Ground]: TypeEffectiveness.Immune,

    [Types.Flying]: TypeEffectiveness.Effective,
    [Types.Water]: TypeEffectiveness.Effective,

    [Types.Grass]: TypeEffectiveness.Resistant,
    [Types.Electric]: TypeEffectiveness.Resistant,
    [Types.Dragon]: TypeEffectiveness.Resistant,
  },
  [Types.Psychic]: {
    [Types.Dark]: TypeEffectiveness.Immune,

    [Types.Fighting]: TypeEffectiveness.Effective,
    [Types.Poison]: TypeEffectiveness.Effective,

    [Types.Steel]: TypeEffectiveness.Resistant,
    [Types.Psychic]: TypeEffectiveness.Resistant,
  },
  [Types.Ice]: {
    [Types.Flying]: TypeEffectiveness.Effective,
    [Types.Ground]: TypeEffectiveness.Effective,
    [Types.Grass]: TypeEffectiveness.Effective,
    [Types.Dragon]: TypeEffectiveness.Effective,

    [Types.Steel]: TypeEffectiveness.Resistant,
    [Types.Fire]: TypeEffectiveness.Resistant,
    [Types.Water]: TypeEffectiveness.Resistant,
    [Types.Ice]: TypeEffectiveness.Resistant,
  },
  [Types.Dragon]: {
    [Types.Fairy]: TypeEffectiveness.Immune,

    [Types.Dragon]: TypeEffectiveness.Effective,

    [Types.Steel]: TypeEffectiveness.Resistant,
  },
  [Types.Dark]: {
    [Types.Psychic]: TypeEffectiveness.Effective,
    [Types.Ghost]: TypeEffectiveness.Effective,

    [Types.Fighting]: TypeEffectiveness.Resistant,
    [Types.Dark]: TypeEffectiveness.Resistant,
    [Types.Fairy]: TypeEffectiveness.Resistant,
  },
  [Types.Fairy]: {
    [Types.Fighting]: TypeEffectiveness.Effective,
    [Types.Dragon]: TypeEffectiveness.Effective,
    [Types.Dark]: TypeEffectiveness.Effective,

    [Types.Poison]: TypeEffectiveness.Resistant,
    [Types.Steel]: TypeEffectiveness.Resistant,
    [Types.Fire]: TypeEffectiveness.Resistant,
  },
  [Types.Stellar]: {},
  [Types.Unknown]: {},
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
