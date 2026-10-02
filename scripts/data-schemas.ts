/**
 * The JSON Schemas an editor reads the game data's YAML against, one
 * per kind of file plus `names.json` with every name the data may use.
 *
 * They are for the editor only: completion, hover and squiggles while
 * typing. Each registry's own `yaml.ts` loader stays what decides
 * whether the data is right, so a schema that drifts costs a
 * suggestion, never a bad record. Written by `pnpm id-names`
 */

export const SCHEMA_DIR = 'src/data/schema';

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
  ['MoveCategories', 'move-category'],
  ['MoveTargets', 'move-target'],
  ['MoveAffects', 'move-affect'],
  ['MoveFlags', 'move-flag'],
  ['SpriteAnim', 'sprite-anim'],
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

const SPECIES_TEXT = block(
  'Species: text',
  part({ name: { type: 'string' }, category: described({ type: 'string' }, 'As `Seed Pokemon`') }, [
    'name',
    'category',
  ]),
);

/** A file of entries keyed by their own name, as the moves and abilities are */
function keyed(title: string, definition: string, entry: Schema): Schema {
  return {
    $schema: DRAFT,
    title,
    type: 'object',
    propertyNames: name(definition),
    additionalProperties: entry,
  };
}

const DESCRIBED = part(
  {
    name: { type: 'string' },
    description: described({ type: 'string' }, 'One player-facing line, ending in a full stop'),
  },
  ['name', 'description'],
);

const MOVE_BATTLE = keyed(
  'Moves: battle',
  'move',
  part(
    {
      type: name('type'),
      category: name('move-category'),
      power: COUNT,
      accuracy: described(COUNT, 'Left out for a move that never misses'),
      priority: { type: 'number' },
      pp: COUNT,
      target: described(name('move-target'), 'What the move is cast at'),
      affects: names('move-affect', 'Who it reaches, where not the enemy the way it is cast'),
      flags: names('move-flag'),
      steps: described(COUNT, 'Later steps it channels after the first'),
      projectile: described({ type: 'boolean' }, 'Flies across the gap before it lands'),
    },
    ['type', 'category', 'pp', 'target'],
  ),
);

const MOVE_CAST = keyed(
  'Moves: cast',
  'move',
  names('sprite-anim', 'The clips the caster plays, most wanted first, ending on a common one'),
);

const MOVE_TEXT = keyed('Moves: text', 'move', DESCRIBED);

const ABILITY_TEXT = keyed('Abilities: text', 'ability', DESCRIBED);

const SIGNATURES: Schema = {
  $schema: DRAFT,
  title: 'Abilities: signatures',
  type: 'object',
  properties: {
    families: described(
      { type: 'object', propertyNames: name('family'), additionalProperties: name('ability') },
      "Each family's signature, shared by every stage of the line",
    ),
    forms: described(
      { type: 'object', propertyNames: name('ability'), additionalProperties: names('species') },
      "A regional line's own signature, by the forms that carry it",
    ),
  },
  required: ['families'],
  additionalProperties: false,
};

function json(schema: Schema): string {
  return `${JSON.stringify(schema, null, 2)}\n`;
}

/** Each schema file by its name in `SCHEMA_DIR` */
export default function renderDataSchemas(members: Map<string, string[]>): Map<string, string> {
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
    ['names.json', json({ $schema: DRAFT, title: 'Names', definitions })],
    ['species-world.json', json(WORLD)],
    ['species-stats.json', json(renderStats(listed('Stats')))],
    ['species-abilities.json', json(ABILITIES)],
    ['species-learnsets.json', json(LEARNSETS)],
    ['species-text.json', json(SPECIES_TEXT)],
    ['moves-battle.json', json(MOVE_BATTLE)],
    ['moves-cast.json', json(MOVE_CAST)],
    ['moves-text.json', json(MOVE_TEXT)],
    ['abilities-text.json', json(ABILITY_TEXT)],
    ['abilities-signatures.json', json(SIGNATURES)],
  ]);
}
