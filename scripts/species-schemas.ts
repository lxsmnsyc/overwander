/**
 * The JSON Schemas an editor reads the species YAML against, one per
 * field folder plus `names.json` with every name the data may use.
 *
 * They are for the editor only: completion, hover and squiggles while
 * typing. The loader in `src/data/species/yaml.ts` stays what decides
 * whether the data is right, so a schema that drifts costs a
 * suggestion, never a bad record. Written by `pnpm id-names`
 */

export const SCHEMA_DIR = 'src/data/species/schema';

type Schema = Record<string, unknown>;

/** Which `names.json` definition lists each enum's members */
const DEFINITIONS: [enumName: string, definition: string][] = [
  ['Species', 'species'],
  ['Genders', 'gender'],
  ['Habitat', 'habitat'],
  ['EvolutionMethod', 'evolution-method'],
  ['Moves', 'move'],
  ['Abilities', 'ability'],
  ['Items', 'item'],
  ['Biome', 'biome'],
  ['TimeOfDay', 'time-of-day'],
  ['EggGroups', 'egg-group'],
  ['Families', 'family'],
  ['Types', 'type'],
  ['Stats', 'stat'],
];

const DRAFT = 'http://json-schema.org/draft-07/schema#';

const FAMILY_TEACHABLE_KEY = 'family-teachable';

function name(definition: string): Schema {
  return { $ref: `names.json#/definitions/${definition}` };
}

function names(definition: string, description?: string): Schema {
  return {
    type: 'array',
    items: name(definition),
    ...(description == null ? {} : { description }),
  };
}

const COUNT: Schema = { type: 'number', minimum: 0 };

function described(schema: Schema, description: string): Schema {
  return { ...schema, description };
}

/** A part, closed so a misspelt key is flagged */
function part(properties: Record<string, Schema>, required: string[]): Schema {
  return { type: 'object', properties, required, additionalProperties: false };
}

/** A block file: families keyed by name, each holding its species' parts */
function block(title: string, species: Schema, family: Record<string, Schema> = {}): Schema {
  return {
    $schema: DRAFT,
    title,
    type: 'object',
    propertyNames: name('family'),
    additionalProperties: {
      type: 'object',
      description: 'A family, with each of its species beneath it',
      properties: family,
      propertyNames:
        Object.keys(family).length === 0
          ? name('species')
          : { anyOf: [name('species'), { enum: Object.keys(family) }] },
      additionalProperties: species,
    },
  };
}

const EVOLUTION = part(
  {
    species: described(name('species'), 'What it evolves into'),
    method: names('evolution-method', 'Every condition the evolution needs'),
    level: described(COUNT, 'The level it evolves at'),
    item: described(name('item'), 'The item used on it or held by it'),
    partner: described(name('species'), 'The species that has to come the other way in a trade'),
    time: names('time-of-day', 'The hours it evolves in'),
    gender: described(name('gender'), 'The gender that evolves'),
    move: described(name('move'), 'The move it has to know'),
    compare: part(
      {
        stat: name('stat'),
        against: name('stat'),
        order: { enum: ['greater', 'lesser', 'equal'] },
      },
      ['stat', 'against', 'order'],
    ),
    shed: described({ type: 'boolean' }, 'Left behind beside the evolution taken, as Shedinja'),
  },
  ['species', 'method'],
);

const WORLD = block(
  'Species: world',
  part(
    {
      types: names('type', 'One or two types'),
      'egg-groups': names('egg-group'),
      habitat: described(name('habitat'), 'Ground when absent'),
      biomes: names('biome', 'Where it spawns'),
      active: described(
        { anyOf: [{ const: 'any' }, names('time-of-day')] },
        'The hours it is about, or `any`',
      ),
      'base-form': described({ type: 'boolean' }, '`false` for a variant form'),
      worn: described({ type: 'boolean' }, 'A shape put on mid-fight, never met or caught'),
      dex: described(COUNT, 'The dex number, where it differs from the id'),
      'evolves-from': name('species'),
      'evolves-into': { type: 'array', items: EVOLUTION },
      'egg-species': described(
        name('species'),
        'What its eggs hatch into, when not the bottom of its line',
      ),
    },
    ['types', 'egg-groups', 'active'],
  ),
);

function renderStats(stats: string[]): Schema {
  const values: Record<string, Schema> = {};

  for (const stat of stats) {
    values[stat] = COUNT;
  }
  return block(
    'Species: stats',
    part(
      {
        stats: part(values, stats),
        'catch-rate': described(COUNT, 'From 3, hardest, to 255, easiest'),
        height: described(COUNT, 'In meters'),
        weight: described(COUNT, 'In kilograms'),
        gender: described(
          {
            anyOf: [
              { const: 'genderless' },
              { type: 'array', items: COUNT, minItems: 2, maxItems: 2 },
            ],
          },
          'Male to female, as `[1, 1]`, or `genderless`',
        ),
      },
      ['stats', 'catch-rate', 'height', 'weight', 'gender'],
    ),
  );
}

const ABILITIES = block(
  'Species: abilities',
  part(
    {
      abilities: names('ability', 'What it is born with'),
      hidden: names('ability', 'What it is rarely born with'),
    },
    ['abilities'],
  ),
);

const MOVES = names('move');

const LEARNSETS = block(
  'Species: learnsets',
  part(
    {
      level: described(
        {
          type: 'object',
          patternProperties: { '^\\d+$': MOVES },
          additionalProperties: false,
        },
        'Moves by the level they are learnt at',
      ),
      teachable: names('move', 'TM, HM and tutor moves this species alone is taught'),
      egg: names('move', 'Egg moves'),
    },
    [],
  ),
  { [FAMILY_TEACHABLE_KEY]: names('move', 'TM, HM and tutor moves the whole family is taught') },
);

const TEXT: Schema = {
  $schema: DRAFT,
  title: 'Species: text',
  type: 'object',
  propertyNames: name('species'),
  additionalProperties: part(
    { name: { type: 'string' }, category: described({ type: 'string' }, 'As `Seed Pokemon`') },
    ['name', 'category'],
  ),
};

function json(schema: Schema): string {
  return `${JSON.stringify(schema, null, 2)}\n`;
}

/** Each schema file by its name in `SCHEMA_DIR` */
export default function renderSpeciesSchemas(members: Map<string, string[]>): Map<string, string> {
  const listed = (enumName: string): string[] => {
    const found = members.get(enumName);

    if (found == null) {
      throw new Error(`No members for ${enumName}`);
    }
    return found;
  };
  const definitions: Record<string, Schema> = {};

  for (const [enumName, definition] of DEFINITIONS) {
    definitions[definition] = { enum: listed(enumName) };
  }

  return new Map([
    ['names.json', json({ $schema: DRAFT, title: 'Species: names', definitions })],
    ['world.json', json(WORLD)],
    ['stats.json', json(renderStats(listed('Stats')))],
    ['abilities.json', json(ABILITIES)],
    ['learnsets.json', json(LEARNSETS)],
    ['text.json', json(TEXT)],
  ]);
}
