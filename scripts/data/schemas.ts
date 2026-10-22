/**
 * The JSON Schemas an editor reads the game data's YAML against, one
 * per kind of file plus `names.json` with every name the data may use.
 *
 * They are for the editor only: completion, hover and squiggles while
 * typing. Each registry's own `yaml.ts` loader stays what decides
 * whether the data is right, so a schema that drifts costs a
 * suggestion, never a bad record. Written by `pnpm id-names`
 */

import { DELAY_SHAPES, EFFECT_SHAPES } from '../../src/data/moves/visual/shape-names.ts';

export const SCHEMA_DIR = 'src/data/schema';

type Schema = Record<string, unknown>;

/** Which `names.json` definition lists each enum's members */
const DEFINITIONS: [enumName: string, definition: string][] = [
  ['Species', 'species'],
  ['Genders', 'gender'],
  ['Natures', 'nature'],
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
  ['ItemTypes', 'item-type'],
  ['ItemFlags', 'item-flag'],
  ['Stages', 'stage'],
  ['Statuses', 'status'],
  ['TeamStatuses', 'team-status'],
  ['Weathers', 'battle-weather'],
  ['Terrains', 'terrain'],
  ['MoveRole', 'move-role'],
  ['BuildRole', 'build-role'],
  ['StatusKind', 'status-kind'],
  ['Regions', 'region'],
  ['Awards', 'award'],
  ['Lairs', 'lair'],
  ['TrainerClass', 'trainer'],
  ['GymLeader', 'gym-leader'],
  ['EliteMember', 'elite-member'],
  ['Champion', 'champion'],
  ['Legend', 'legend'],
  ['FrontierBrain', 'frontier-brain'],
  ['FrontierRule', 'frontier-rule'],
  ['Syndicate', 'syndicate'],
  ['Executive', 'executive'],
  ['Npc', 'npc'],
  ['VendorKind', 'vendor-kind'],
  ['Decoration', 'decoration'],
  ['Landmark', 'landmark'],
  ['Phenomenon', 'phenomenon'],
  ['Weather', 'weather'],
  ['SpawnRarity', 'spawn-rarity'],
  ['PikeCurtain', 'pike-curtain'],
  ['ArcadePanel', 'arcade-panel'],
  ['AchievementTier', 'achievement-tier'],
  ['AchievementLine', 'achievement-line'],
  ['LadderTitle', 'ladder-title'],
  ['Balls', 'ball'],
  ['Quests', 'quest'],
  ['Chains', 'chain'],
  ['Metric', 'metric'],
  ['QuestLandmark', 'quest-landmark'],
  ['Foe', 'foe'],
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
    natures: names('nature', 'The natures that evolve this way, where the nature decides'),
    compare: part(
      {
        stat: name('stat'),
        against: name('stat'),
        order: { enum: ['greater', 'lesser', 'equal'] },
      },
      ['stat', 'against', 'order'],
    ),
    walked: described(COUNT, 'The steps it has to walk as the buddy'),
    candies: described(COUNT, 'The candies of its family the evolution spends'),
    rare: described({ type: 'boolean' }, 'Taken only by the one in a hundred, or only by the rest'),
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
      held: described(
        part(
          {
            common: described(name('item'), 'Carried by half of them'),
            uncommon: described(name('item'), 'One in twenty'),
            rare: described(name('item'), 'One in a hundred'),
          },
          [],
        ),
        'What a wild one carries when it is met',
      ),
      rank: described(
        { enum: ['legendary', 'mythical', 'baby', 'prized', 'mythical-odds'] },
        'A hand-kept class the shape of its line cannot say',
      ),
      awaiting: described(
        { enum: ['baby', 'evolution'] },
        'A stage of its line a later generation adds that is not registered yet',
      ),
      'spawns-as': described(
        { enum: ['water', 'ground'] },
        'The spawn kind it is met as where its types and egg groups say otherwise',
      ),
    },
    ['types', 'egg-groups', 'active'],
  ),
);

const REGIONS: Schema = {
  $schema: DRAFT,
  title: 'Regions',
  type: 'object',
  propertyNames: name('region'),
  additionalProperties: part(
    {
      dex: described(
        { type: 'array', items: COUNT, minItems: 2, maxItems: 2 },
        'The first and last dex number it covers',
      ),
      milestones: described(
        { type: 'array', items: COUNT },
        'How many of its own each rung of its dex chain asks for',
      ),
      medal: described(name('award'), 'What the last rung hangs on the shelf'),
    },
    ['dex'],
  ),
};

const LAIRS: Schema = {
  $schema: DRAFT,
  title: 'Lairs',
  type: 'object',
  propertyNames: name('lair'),
  additionalProperties: part(
    {
      species: names('species', 'Who is at home there, in the order a raid picks from'),
      stands: described(
        { enum: ['water', 'island'] },
        'On the water only, or an island that stands on water and ground; left out for ground only',
      ),
      underground: described({ type: 'boolean' }, 'A cave under its biome stages it too'),
      reserved: described({ type: 'boolean' }, 'Kept out of the world until its batch lists it'),
    },
    ['species'],
  ),
};

const BIOME_LAIRS: Schema = {
  $schema: DRAFT,
  title: 'Biome lairs',
  type: 'object',
  propertyNames: name('biome'),
  additionalProperties: names('lair', 'In the order a landmark draws from them'),
};

const LAIR_TEXT: Schema = {
  $schema: DRAFT,
  title: 'Lair names',
  type: 'object',
  propertyNames: name('lair'),
  additionalProperties: { type: 'string' },
};

const TRAINER_CLASSES: Schema = {
  $schema: DRAFT,
  title: 'Trainer classes',
  type: 'object',
  propertyNames: name('trainer'),
  additionalProperties: part(
    {
      types: names('type', 'What it fields; an empty list is every type'),
      sheets: described(
        { type: 'array', items: { type: 'string' }, minItems: 1 },
        'The charsets it may stand in',
      ),
      trade: described(
        name('trainer'),
        "The trade it is one region's version of, left out where it is its own",
      ),
      ace: described(
        { const: true },
        'One of the Aces: every type, five fully grown, higher levels',
      ),
    },
    ['types', 'sheets'],
  ),
};

const BIOME_TRAINERS: Schema = {
  $schema: DRAFT,
  title: 'Biome trainers',
  type: 'object',
  propertyNames: name('biome'),
  additionalProperties: names('trainer', 'In the order a stop rolls from them'),
};

const TRAINER_TEXT: Schema = {
  $schema: DRAFT,
  title: 'Trainer class text',
  type: 'object',
  propertyNames: name('trainer'),
  additionalProperties: part(
    {
      name: described({ type: 'string' }, 'What the mainline calls the class'),
      quote: described({ type: 'string' }, 'What it says as the duel is put to the player'),
    },
    ['name', 'quote'],
  ),
};

const TRAINER_SHEET_TEXT: Schema = {
  $schema: DRAFT,
  title: 'Trainer sheet names',
  type: 'object',
  additionalProperties: { type: 'string' },
};

const SHEETS: Schema = { type: 'array', items: { type: 'string' }, minItems: 1 };

const GYM_LEADERS: Schema = {
  $schema: DRAFT,
  title: 'Gym leaders',
  type: 'object',
  propertyNames: name('gym-leader'),
  additionalProperties: part(
    {
      type: described(name('type'), 'What they field'),
      badge: described(name('award'), 'What beating them pays'),
      sheets: described(SHEETS, 'The charsets they are seen in'),
      prize: described(SHEETS, 'Coats the badge pays that they are never seen in'),
      later: described(SHEETS, "Coats that also ask for the next league's crown"),
      signature: described(name('species'), 'Their ace, standing sixth'),
    },
    ['type', 'badge', 'sheets', 'signature'],
  ),
};

const BIOME_GYM_LEADERS: Schema = {
  $schema: DRAFT,
  title: 'Biome gym leaders',
  type: 'object',
  propertyNames: name('biome'),
  additionalProperties: names('gym-leader', 'In the order a gym rolls from them'),
};

const ELITE: Schema = {
  $schema: DRAFT,
  title: 'Elite Four',
  type: 'object',
  propertyNames: name('elite-member'),
  additionalProperties: part(
    {
      type: described(name('type'), 'The type they are known for'),
      honor: described(name('award'), 'What beating them pays'),
      sheets: described(SHEETS, 'The charsets they are seen in'),
      signature: described(name('species'), 'Their ace, standing last'),
      pool: described(
        part(
          {
            types: names('type', 'The types that count as theirs'),
            'egg-groups': names('egg-group', 'Egg groups that count as theirs besides'),
            also: names('species', 'Named species no rule reaches'),
          },
          ['types'],
        ),
        'What they field out of',
      ),
    },
    ['type', 'honor', 'sheets', 'signature', 'pool'],
  ),
};

const BIOME_ELITE: Schema = {
  $schema: DRAFT,
  title: 'Biome elite',
  type: 'object',
  propertyNames: name('biome'),
  additionalProperties: names('elite-member', 'In the order a seat rolls from them'),
};

const PARTY: Schema = { ...names('species'), minItems: 6, maxItems: 6 };

const CHAMPIONS: Schema = {
  $schema: DRAFT,
  title: 'Champions',
  type: 'object',
  propertyNames: name('champion'),
  additionalProperties: part(
    {
      title: described(name('award'), 'The title the seat is worth'),
      league: described(name('region'), 'Whose Elite Four they ask to see beaten first'),
      sheets: described(SHEETS, 'The charsets they are seen in'),
      prize: described(SHEETS, 'Coats the title pays besides'),
      party: described(PARTY, 'Their own six'),
    },
    ['title', 'league', 'sheets', 'party'],
  ),
};

const LEGENDS: Schema = {
  $schema: DRAFT,
  title: 'Legends',
  type: 'object',
  propertyNames: name('legend'),
  additionalProperties: part(
    {
      honor: described(name('award'), 'The mark beating them pays'),
      sheets: described(SHEETS, 'The charsets they are seen in'),
      prize: described(SHEETS, 'Coats the mark unlocks'),
      party: described(PARTY, 'Their own six'),
    },
    ['honor', 'sheets', 'prize', 'party'],
  ),
};

const TRIO: Schema = { ...names('species'), maxItems: 3 };

const FRONTIER: Schema = {
  $schema: DRAFT,
  title: 'Frontier Brains',
  type: 'object',
  propertyNames: name('frontier-brain'),
  additionalProperties: part(
    {
      rule: described(name('frontier-rule'), 'The house rule the fight is held under'),
      crown: described(name('award'), 'The region crown they ask to see'),
      sheets: described(SHEETS, 'The charsets they are seen in'),
      symbols: described(
        { type: 'array', items: name('award'), minItems: 2, maxItems: 2 },
        'The silver symbol, then the gold',
      ),
      party: described(TRIO, 'The three they field first; empty when the house draws them'),
      'gold-party': described(TRIO, 'The three once the challenger holds the silver'),
    },
    ['rule', 'crown', 'sheets', 'symbols', 'party', 'gold-party'],
  ),
};

const FRONTIER_TEXT: Schema = {
  $schema: DRAFT,
  title: 'Frontier Brain words',
  type: 'object',
  propertyNames: name('frontier-brain'),
  additionalProperties: part(
    {
      name: { type: 'string' },
      house: described({ type: 'string' }, 'The house they keep'),
      greeting: described({ type: 'string' }, 'What they say as the house is entered'),
    },
    ['name', 'house', 'greeting'],
  ),
};

const RANK: Schema = part(
  {
    sheets: described(SHEETS, 'The charsets they are met in'),
    honor: described(name('award'), 'The mark putting them down pays'),
  },
  ['sheets', 'honor'],
);

const SYNDICATES: Schema = {
  $schema: DRAFT,
  title: 'Syndicates',
  type: 'object',
  propertyNames: name('syndicate'),
  additionalProperties: part(
    {
      grunt: described(RANK, 'The rank and file'),
      executives: names('executive', 'Who answers to the boss'),
      boss: described(RANK, 'The boss'),
      biomes: names('biome', "What it holds; a biome nobody holds is Rocket's"),
    },
    ['grunt', 'executives', 'boss', 'biomes'],
  ),
};

const EXECUTIVES: Schema = {
  $schema: DRAFT,
  title: 'Executives',
  type: 'object',
  propertyNames: name('executive'),
  additionalProperties: RANK,
};

function spoken(
  title: string,
  definition: string,
  fields: Record<string, string>,
  required: string[],
): Schema {
  const properties: Record<string, Schema> = {};

  for (const [field, description] of Object.entries(fields)) {
    properties[field] = described({ type: 'string' }, description);
  }
  return {
    $schema: DRAFT,
    title,
    type: 'object',
    propertyNames: name(definition),
    additionalProperties: part(properties, required),
  };
}

const WORDS: Schema = { type: 'array', items: { type: 'string' }, uniqueItems: true };

const TOWN_NAMES: Schema = {
  $schema: DRAFT,
  title: 'Town names',
  type: 'object',
  properties: {
    heads: described(
      {
        type: 'object',
        propertyNames: name('biome'),
        additionalProperties: { ...WORDS, minItems: 8, maxItems: 8 },
      },
      'Exactly 8 heads per biome a town can stand on',
    ),
    tails: described(WORDS, 'Welded onto the head'),
    titles: described(WORDS, 'What the place calls itself'),
    marks: described(WORDS, 'The word in front, where there is one'),
    counties: described(WORDS, 'The counties, 8 to a row'),
  },
  required: ['heads', 'tails', 'titles', 'marks', 'counties'],
  additionalProperties: false,
};

const PICTURES: Schema = { type: 'array', items: { type: 'string' }, minItems: 1 };

const DECORATIONS: Schema = {
  $schema: DRAFT,
  title: 'Decorations',
  type: 'object',
  propertyNames: name('decoration'),
  additionalProperties: part(
    {
      sheet: described({ enum: ['trees', 'decorations'] }, 'The sheet it is drawn from'),
      pictures: described(PICTURES, 'The pictures it is drawn as, in the order cells pick them'),
    },
    ['sheet', 'pictures'],
  ),
};

const BIOME_DECORATIONS: Schema = {
  $schema: DRAFT,
  title: 'Biome decorations',
  type: 'object',
  propertyNames: name('biome'),
  additionalProperties: part(
    {
      grows: names('decoration', 'What grows there; a kind written twice is twice as likely'),
      blocker: described(name('decoration'), 'What a blocked cell shows, a tree where left out'),
      island: names('decoration', 'What grows on an island in this sea'),
      pictures: described(
        { type: 'object', propertyNames: name('decoration'), additionalProperties: PICTURES },
        'What this biome draws a kind as instead',
      ),
    },
    ['grows'],
  ),
};

const SNOW_TREES: Schema = {
  $schema: DRAFT,
  title: 'Snow trees',
  type: 'object',
  additionalProperties: { type: 'string' },
};

const LANDMARKS: Schema = {
  $schema: DRAFT,
  title: 'Landmarks',
  type: 'object',
  propertyNames: name('landmark'),
  additionalProperties: part(
    {
      weight: described(COUNT, 'How often it is rolled; 0 for one that is placed'),
      picture: described({ type: 'string' }, 'Its picture on the landmarks sheet'),
      taken: described({ type: 'string' }, 'What it looks like once this player has been'),
      underground: described({ type: 'string' }, 'What it looks like from below'),
    },
    ['weight'],
  ),
};

const BIOME_PHENOMENA: Schema = {
  $schema: DRAFT,
  title: 'Biome phenomena',
  type: 'object',
  propertyNames: name('biome'),
  additionalProperties: names('phenomenon', 'In the order the window rolls from them'),
};

const COLOR: Schema = { type: 'string', pattern: '^#[0-9a-f]{6}$' };

/** A file of named sections, each its own map */
function sections(title: string, parts: Record<string, Schema>): Schema {
  const properties: Record<string, Schema> = {};

  for (const [key, schema] of Object.entries(parts)) {
    properties[key] = { type: 'object', ...schema };
  }
  return {
    $schema: DRAFT,
    title,
    type: 'object',
    properties,
    required: Object.keys(parts),
    additionalProperties: false,
  };
}

function namesText(title: string, definition: string): Schema {
  return {
    $schema: DRAFT,
    title,
    type: 'object',
    propertyNames: name(definition),
    additionalProperties: { type: 'string' },
  };
}

const BIOME_WEATHER: Schema = {
  $schema: DRAFT,
  title: 'Biome weather',
  type: 'object',
  properties: {
    corners: described(
      part(
        {
          wildest: name('weather'),
          stillest: name('weather'),
          bleakest: name('weather'),
          thickest: name('weather'),
        },
        ['wildest', 'stillest', 'bleakest', 'thickest'],
      ),
      'The four rarest skies, shared by every country',
    ),
    biomes: {
      type: 'object',
      propertyNames: name('biome'),
      additionalProperties: part(
        {
          clear: described(name('weather'), 'Driest and calmest'),
          stirred: described(name('weather'), 'Dry, with the air moving'),
          damp: described(name('weather'), 'The edge of a front'),
          wet: described(name('weather'), 'Inside a front'),
          storm: described(name('weather'), 'The core of a front'),
          rare: described(name('weather'), 'Its own showpiece, where it has one'),
          corners: described({ const: false }, 'Leaves the four rarest skies out'),
        },
        ['clear', 'stirred', 'damp', 'wet', 'storm'],
      ),
    },
  },
  required: ['corners', 'biomes'],
  additionalProperties: false,
};

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
        'egg-cycles': described(COUNT, 'Hatch cycles, where not the default 20'),
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

/** A Megas or Zeniths file: each keyed by its own species, and read off its `base` */
function worn(
  title: string,
  stats: string[],
  properties: Record<string, Schema>,
  required: string[],
): Schema {
  const values: Record<string, Schema> = {};

  for (const stat of stats) {
    values[stat] = COUNT;
  }
  return {
    $schema: DRAFT,
    title,
    type: 'object',
    propertyNames: name('species'),
    additionalProperties: part(
      {
        base: described(
          name('species'),
          'Whose shape it is, and what it does not change is read off',
        ),
        stats: part(values, stats),
        types: names('type', 'One or two types'),
        ...properties,
      },
      ['base', 'stats', 'types', ...required],
    ),
  };
}

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

const MOVE_VISUAL = keyed(
  'Moves: visual',
  'move',
  part(
    {
      landing: described(name('effect-shape'), 'The shape it lands as'),
      winding: described(
        { anyOf: [{ const: 'none' }, name('effect-shape')] },
        'What its wind-up step lands as, or `none` for nothing',
      ),
      wait: described(
        part({ winding: name('delay-shape'), striking: name('delay-shape') }, []),
        'How it spends the gap on its wind-up step and on its strike',
      ),
      color: described(
        { anyOf: [{ type: 'string', pattern: '^#[0-9a-f]{6}$' }, name('stage')] },
        'A hex colour, or the stage whose colour it takes',
      ),
    },
    [],
  ),
);

const MOVE_VISUAL_SHAPES = keyed(
  'Moves: visual shapes',
  'effect-shape',
  part(
    {
      span: described(COUNT, 'How long it runs at ordinary weight, in milliseconds'),
      jolt: described(COUNT, 'How hard it shakes the scene at ordinary weight'),
      arrives: described({ const: true }, 'Crosses the gap or comes down by itself'),
      wait: described(name('delay-shape'), 'How the gap before it is spent'),
      color: { type: 'string', pattern: '^#[0-9a-f]{6}$' },
      staged: described({ const: true }, "Pictures a stat moving, so takes the stat's colour"),
      types: names('type', 'The types a move falls back on it for'),
    },
    [],
  ),
);

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

const ITEM_RECORDS = keyed(
  'Items: records',
  'item',
  part(
    {
      type: name('item-type'),
      icon: described({ type: 'string' }, 'The picture, as `sheet/name`'),
      flags: names('item-flag'),
      buy: described(COUNT, 'What the market charges, or left out for none'),
      sell: described(COUNT, 'What a vendor pays, or left out for nothing'),
      mega: described(name('species'), 'The Mega a stone opens'),
      forms: names('species', "The Megas a stone opens for the species' other forms"),
      'z-type': described(name('type'), 'The type whose damaging moves a type crystal turns'),
      'z-move': described(name('move'), 'The Z-Move a crystal turns a move into'),
      holders: names('species', 'Who may use a signature crystal, every form included'),
      move: described(name('move'), 'The one move a signature crystal turns'),
      species: described(name('species'), 'What a whole fossil brings back'),
      pairs: described(
        { type: 'object', propertyNames: name('item'), additionalProperties: name('species') },
        'What a top half brings back beside each bottom',
      ),
      lifts: described(name('type'), 'The type whose moves it lifts'),
      'move-type': described(name('type'), 'The type it gives Techno Blast or Multi-Attack'),
      tera: described(name('type'), "A Tera Shard's type"),
      stat: described(name('stat'), 'The stat a vitamin, wing or power item works on'),
      fills: described(name('stat'), 'The stat a Max vitamin or wing fills'),
      nature: described(name('nature'), 'The nature a mint leaves behind'),
      calls: described(name('species'), 'The mythical a raid item calls'),
      stage: described(name('stage'), 'The stage an X item puts back up'),
      restore: described(
        { oneOf: [{ const: 'full' }, COUNT] },
        'Health a medicine gives back, or `full` for the whole pool',
      ),
      cures: described(
        { oneOf: [{ const: 'all' }, names('status')] },
        'What a medicine takes off, or `all` for every status',
      ),
      revives: described(COUNT, 'The share of the pool a revive brings a fainted pokemon back at'),
      bitter: described(COUNT, 'How many mouthfuls of herbal bitterness it costs'),
    },
    ['type', 'icon'],
  ),
);

const ITEM_TEXT: Schema = {
  $schema: DRAFT,
  title: 'Items: text',
  type: 'object',
  properties: {
    templates: described(
      { type: 'object', additionalProperties: { type: 'string' } },
      "Sentences the family's code fills in, with `{placeholders}`",
    ),
  },
  propertyNames: { anyOf: [name('item'), { const: 'templates' }] },
  additionalProperties: part(
    {
      name: { type: 'string' },
      description: described(
        { type: 'string' },
        "One player-facing line, ending in a full stop. Left out where the family's code writes it from a template",
      ),
    },
    ['name'],
  ),
};

const SHARE: Schema = described(
  {
    anyOf: [
      { type: 'number', minimum: 0 },
      { type: 'string', pattern: '^\\d+/\\d+$' },
    ],
  },
  'A share, as a number or a fraction such as `1/3`',
);

const CHANCE: Schema = described(
  { type: 'number', minimum: 0, maximum: 100 },
  'The chance, out of 100',
);

const SPAWN_BAND: Schema = described(
  {
    type: 'object',
    propertyNames: name('species'),
    additionalProperties: {
      anyOf: [
        { type: 'number', minimum: 0 },
        described({ const: 'prized' }, 'The weight every prized species shares'),
        described({ const: 'forms' }, 'Unown only: each of its forms at weight 1'),
      ],
    },
  },
  'Species and weight, in hundredths of a percent of every roll outside the fixed bands, heaviest first',
);

const SPAWN_GROUPS: Schema = part(
  {
    base: SPAWN_BAND,
    uncommon: SPAWN_BAND,
    rare: SPAWN_BAND,
    scarce: SPAWN_BAND,
    elusive: SPAWN_BAND,
    prized: SPAWN_BAND,
    special: SPAWN_BAND,
    mythical: SPAWN_BAND,
  },
  ['base', 'uncommon', 'rare', 'special'],
);

const SPAWN_TIMES: Schema = part(
  { morning: SPAWN_GROUPS, day: SPAWN_GROUPS, evening: SPAWN_GROUPS, night: SPAWN_GROUPS },
  ['morning', 'day', 'evening', 'night'],
);

const SPAWN_POOLS: Schema = {
  $schema: DRAFT,
  title: 'Biome: spawn pools',
  type: 'object',
  properties: {
    land: SPAWN_TIMES,
    water: SPAWN_TIMES,
    ice: SPAWN_TIMES,
    pool: described(SPAWN_TIMES, 'The one pool the caves or the towns share'),
    'cave-legends': described(SPAWN_BAND, 'The legendaries met wild in the caves under it'),
  },
  additionalProperties: false,
};

const BATTLE_STATUSES: Schema = {
  $schema: DRAFT,
  title: 'Battle: statuses',
  type: 'object',
  properties: {
    target: described(
      { type: 'object', propertyNames: name('move'), additionalProperties: name('status') },
      'What a status move puts on what it is aimed at',
    ),
    self: described(
      { type: 'object', propertyNames: name('move'), additionalProperties: name('status') },
      'What a move puts on its own user',
    ),
    team: described(
      { type: 'object', propertyNames: name('move'), additionalProperties: name('team-status') },
      'What a move lays over its own side',
    ),
  },
  required: ['target', 'self', 'team'],
  additionalProperties: false,
};

const BATTLE_FILES: [file: string, title: string, entry: Schema][] = [
  [
    'battle-added-statuses.json',
    'Battle: added statuses',
    part({ status: name('status'), chance: CHANCE }, ['status', 'chance']),
  ],
  [
    'battle-added-stages.json',
    'Battle: added stages',
    part(
      {
        stages: names('stage'),
        value: { type: 'number' },
        chance: CHANCE,
        self: described({ const: true }, 'Pushed on its own user rather than on what it hit'),
      },
      ['stages', 'value', 'chance'],
    ),
  ],
  [
    'battle-stages.json',
    'Battle: stages',
    { type: 'object', propertyNames: name('stage'), additionalProperties: { type: 'number' } },
  ],
  [
    'battle-multi-hit.json',
    'Battle: multi-hit',
    part(
      {
        min: { type: 'integer', minimum: 1 },
        max: { type: 'integer', minimum: 1 },
        escalating: described({ const: true }, 'Each strike lands harder than the last'),
      },
      ['min', 'max'],
    ),
  ],
  ['battle-share.json', 'Battle: shares', SHARE],
  ['battle-z-power.json', 'Battle: Z-power', { type: 'integer', minimum: 1 }],
  ['battle-max-power.json', 'Battle: Max power', { type: 'integer', minimum: 1 }],
  [
    'battle-z-effects.json',
    'Battle: Z-effects',
    {
      oneOf: [
        { enum: ['heal', 'clear', 'critical', 'centre', 'curse'] },
        part(
          {
            stages: described(
              { oneOf: [{ const: 'all' }, names('stage')] },
              'The stages raised, or `all` for the five stats',
            ),
            value: { type: 'number' },
          },
          ['stages', 'value'],
        ),
      ],
    },
  ],
];

/** A list of names, in the order it is written */
function nameList(title: string, definition: string): Schema {
  return { $schema: DRAFT, title, ...names(definition) };
}

/** A map from one kind of name to another */
function mapping(key: string, value: string): Schema {
  return { type: 'object', propertyNames: name(key), additionalProperties: name(value) };
}

/** A file of named sections, each closed so a misspelt key is flagged */
function closedSections(title: string, properties: Record<string, Schema>): Schema {
  return { $schema: DRAFT, title, ...part(properties, Object.keys(properties)) };
}

/** The battle files that are not keyed by move */
const BATTLE_LISTS: [file: string, schema: Schema][] = [
  ['battle-recharge.json', nameList('Battle: recharging moves', 'move')],
  ['battle-tutor-only.json', nameList('Battle: tutor-only moves', 'move')],
  ['battle-pseudo.json', nameList('Battle: pseudo-moves', 'move')],
  [
    'battle-guards.json',
    {
      $schema: DRAFT,
      title: 'Battle: guards',
      type: 'object',
      propertyNames: name('move'),
      additionalProperties: described(name('status'), 'What the guard puts on the user'),
    },
  ],
  [
    'battle-ai-roles.json',
    {
      $schema: DRAFT,
      title: 'Battle: AI roles',
      type: 'object',
      propertyNames: name('move-role'),
      additionalProperties: names('move', 'The moves filed under this role by hand'),
    },
  ],
  [
    'battle-gmax.json',
    closedSections('Battle: G-Max Moves', {
      species: {
        type: 'object',
        propertyNames: name('species'),
        additionalProperties: part({ move: name('move'), type: name('type') }, ['move', 'type']),
      },
      fixed: names('move', 'The ones that hit at 160 whatever they replace'),
    }),
  ],
  [
    'battle-max-moves.json',
    closedSections('Battle: Max Moves', {
      types: mapping('type', 'move'),
      weathers: mapping('move', 'battle-weather'),
      terrains: mapping('move', 'terrain'),
      'foe-stages': mapping('move', 'stage'),
      'ally-stages': mapping('move', 'stage'),
    }),
  ],
  [
    'battle-z-moves.json',
    closedSections('Battle: Z-Moves', { types: mapping('type', 'move'), signatures: names('move') }),
  ],
];

/** The expert build's prices, in `src/data/builds/` */
const BUILD_FILES: [file: string, schema: Schema][] = [
  [
    'builds-status-moves.json',
    keyed(
      'Builds: status moves',
      'move',
      part(
        {
          worth: described({ type: 'number' }, 'What a slot for it is worth'),
          kind: described(name('status-kind'), 'What it is for; none is a Cripple'),
          serves: described(name('move-category'), 'The half of the split a setup sharpens'),
        },
        [],
      ),
    ),
  ],
  [
    'builds-attacks.json',
    keyed(
      'Builds: attacks',
      'move',
      part(
        {
          drawback: described(
            { type: 'number', minimum: 0 },
            'A factor for a cost the entry has no field for',
          ),
          power: described(COUNT, 'What a move with no power of its own is worth'),
        },
        [],
      ),
    ),
  ],
  [
    'builds-abilities.json',
    keyed(
      'Builds: abilities',
      'ability',
      part(
        {
          worth: described({ type: 'number', minimum: 0 }, 'Against 100 for an ordinary ability'),
          lean: { enum: ['offense', 'guard'] },
        },
        [],
      ),
    ),
  ],
];

/** The other tables that moved out of the code, each in its own folder */
const OTHER_FILES: [file: string, schema: Schema][] = [
  [
    'biome-ground.json',
    closedSections('Biome ground', {
      biomes: mapping('biome', 'type'),
      effects: {
        type: 'object',
        propertyNames: name('type'),
        additionalProperties: part({ move: name('move'), status: name('status') }, [
          'move',
          'status',
        ]),
      },
    }),
  ],
  [
    'abilities-flags.json',
    closedSections('Ability flags', {
      unreceivable: names('ability', 'What Receiver and Power of Alchemy will not take up'),
      protected: names('ability', 'What nothing can disable'),
      'mold-proof': names('ability', 'What Mold Breaker cannot see past'),
      'always-known': names('ability', 'What the AI knows about without seeing it cue'),
    }),
  ],
  ['boss-banned.json', nameList('Moves a boss is never staged with', 'move')],
];

const BIOME_ITEMS: Schema = {
  $schema: DRAFT,
  title: 'Biome items',
  ...part(
    {
      groups: described(
        {
          type: 'object',
          propertyNames: { type: 'string', pattern: '^[a-z][a-z-]*$' },
          additionalProperties: names('biome'),
        },
        'Named runs of biomes an item can list by the group name',
      ),
      items: described(
        {
          type: 'object',
          propertyNames: name('item'),
          additionalProperties: {
            type: 'array',
            items: { anyOf: [name('biome'), { type: 'string', pattern: '^[a-z][a-z-]*$' }] },
          },
        },
        'The ground each item is buried in; an item not listed is buried everywhere',
      ),
    },
    ['groups', 'items'],
  ),
};

const TOTEMS: Schema = {
  $schema: DRAFT,
  title: 'Totems',
  type: 'object',
  propertyNames: name('species'),
  additionalProperties: part(
    {
      aura: described(
        {
          type: 'object',
          propertyNames: { anyOf: [name('stage'), { const: 'all' }] },
          additionalProperties: { type: 'integer' },
        },
        'The stages each stat starts the fight raised by, or `all` for the five',
      ),
      height: described(COUNT, 'In meters'),
      weight: described(COUNT, 'In kilograms'),
      crystal: described(name('item'), 'What the trial hands over'),
    },
    ['aura', 'height', 'weight', 'crystal'],
  ),
};

const COUNTER_ASK: Schema = part(
  {
    metric: described(name('metric'), 'The lifetime counter it reads'),
    count: described(COUNT, 'The total it asks for'),
    species: name('species'),
    family: name('family'),
    type: name('type'),
    item: name('item'),
    npc: name('npc'),
    landmark: name('quest-landmark'),
    move: name('move'),
    foe: name('foe'),
    trainer: name('trainer'),
  },
  ['metric', 'count'],
);

const QUEST_REQUIREMENT: Schema = {
  anyOf: [
    COUNTER_ASK,
    part({ dex: described(COUNT, 'Distinct species caught'), region: name('region') }, ['dex']),
    part({ 'turn-in': described(name('item'), 'Taken from the bag'), count: COUNT }, [
      'turn-in',
      'count',
    ]),
  ],
};

const QUEST_REWARD: Schema = {
  anyOf: [
    part({ item: name('item'), amount: COUNT }, ['item', 'amount']),
    part(
      {
        catch: described(name('species'), 'A finished record'),
        level: COUNT,
        shiny: { type: 'boolean' },
        ball: name('ball'),
      },
      ['catch', 'level'],
    ),
    part(
      {
        encounter: described(name('species'), 'A meeting staged in the world'),
        level: COUNT,
        shiny: { type: 'boolean' },
      },
      ['encounter', 'level'],
    ),
    part({ egg: name('species') }, ['egg']),
    part({ award: name('award') }, ['award']),
  ],
};

const QUESTS: Schema = {
  $schema: DRAFT,
  title: 'Quests',
  ...part(
    {
      chains: described(
        { type: 'object', propertyNames: name('chain'), additionalProperties: names('quest') },
        'Each chain in the order the board shows it, its quests in the order they are claimed',
      ),
      quests: {
        type: 'object',
        propertyNames: name('quest'),
        additionalProperties: part(
          {
            requirements: { type: 'array', items: QUEST_REQUIREMENT },
            rewards: { type: 'array', items: QUEST_REWARD },
          },
          ['requirements', 'rewards'],
        ),
      },
    },
    ['chains', 'quests'],
  ),
};

const DAILY_QUESTS: Schema = {
  $schema: DRAFT,
  title: 'Daily quest pool',
  type: 'object',
  additionalProperties: part(
    {
      requirement: COUNTER_ASK,
      rewards: {
        type: 'array',
        items: part({ item: name('item'), amount: COUNT }, ['item', 'amount']),
      },
    },
    ['requirement', 'rewards'],
  ),
};

const QUEST_TEXT: Schema = {
  $schema: DRAFT,
  title: 'Quest names',
  ...part(
    {
      chains: {
        type: 'object',
        propertyNames: name('chain'),
        additionalProperties: { type: 'string' },
      },
      quests: {
        type: 'object',
        propertyNames: name('quest'),
        additionalProperties: { type: 'string' },
      },
      daily: { type: 'object', additionalProperties: { type: 'string' } },
    },
    ['chains', 'quests', 'daily'],
  ),
};

const THRESHOLDS: Schema = described(
  { type: 'array', items: COUNT, minItems: 4, maxItems: 4 },
  'Bronze, Silver, Gold and Platinum, ascending',
);

const ACHIEVEMENTS: Schema = {
  $schema: DRAFT,
  title: 'Achievements',
  ...part(
    {
      lines: {
        type: 'object',
        propertyNames: name('achievement-line'),
        additionalProperties: part(
          {
            metric: described(name('metric'), 'The lifetime counter it climbs'),
            npc: name('npc'),
            landmark: name('quest-landmark'),
            tiers: THRESHOLDS,
          },
          ['metric', 'tiers'],
        ),
      },
      types: names('type', 'The type lines, in the order the shelf shows them'),
      'type-tiers': THRESHOLDS,
      'trainer-tiers': THRESHOLDS,
      colors: described(
        {
          type: 'object',
          propertyNames: name('achievement-tier'),
          additionalProperties: { type: 'string' },
        },
        "Each metal's colour",
      ),
    },
    ['lines', 'types', 'type-tiers', 'trainer-tiers', 'colors'],
  ),
};

const SPECIES_PAIRS: Schema = {
  type: 'object',
  propertyNames: name('species'),
  additionalProperties: name('species'),
};

const TRUE_SHADOWS: Schema = {
  $schema: DRAFT,
  title: 'True shadows',
  ...part(
    {
      shadows: described(SPECIES_PAIRS, 'Each counterpart and its true shadow'),
      shapes: described(SPECIES_PAIRS, "Each counterpart's worn shape and the shadow's"),
    },
    ['shadows', 'shapes'],
  ),
};

const FUSIONS: Schema = keyed(
  'Fusions',
  'species',
  part(
    {
      husk: described(name('species'), 'The pokemon the partner is folded into'),
      partner: described(name('species'), 'The pokemon kept inside it'),
      item: described(name('item'), 'What joins and parts the pair'),
      'wears-partner': described({ type: 'boolean' }, "Fights with the partner's abilities too"),
    },
    ['husk', 'partner', 'item'],
  ),
);

const FEATS: Schema = keyed(
  'Battle feats',
  'species',
  part(
    {
      criticals: described(COUNT, 'Critical hits landed'),
      endured: described(COUNT, 'Damage taken without fainting'),
      landed: part({ move: name('move'), count: COUNT }, ['move', 'count']),
      recoil: described(COUNT, 'Recoil taken without fainting'),
      cumulative: described({ const: true }, 'Counted across every fight'),
    },
    [],
  ),
);

const ULTRA_BEASTS: Schema = {
  $schema: DRAFT,
  title: 'Ultra Beasts',
  ...names('species'),
};

const NOBLES: Schema = keyed(
  'Nobles',
  'species',
  part(
    {
      treasure: described(name('item'), 'What it leaves its calmers beside the purse'),
      burst: described(name('move'), 'The Frenzy burst it unleashes'),
    },
    ['treasure', 'burst'],
  ),
);

const STATUS_CAST: Schema = {
  $schema: DRAFT,
  title: 'Status casts',
  type: 'object',
  propertyNames: name('status'),
  additionalProperties: names('sprite-anim', 'Most wanted first, ending on a common clip'),
};

const FRONTIER_ROOMS: Schema = {
  $schema: DRAFT,
  title: 'Frontier rooms',
  ...part(
    {
      curtains: described(
        {
          type: 'object',
          propertyNames: name('pike-curtain'),
          additionalProperties: { anyOf: [name('status'), { type: 'null' }] },
        },
        'In the order the roll draws them: the status each leaves, or null',
      ),
      panels: described(
        {
          type: 'object',
          propertyNames: name('arcade-panel'),
          additionalProperties: { anyOf: [name('weather'), { type: 'null' }] },
        },
        'In the order the roll draws them: the sky each puts up, or null',
      ),
    },
    ['curtains', 'panels'],
  ),
};

const ITEM_BAND: Schema = described(
  {
    type: 'object',
    propertyNames: { anyOf: [name('item'), { type: 'string', pattern: '^[a-z][a-z-]*$' }] },
    additionalProperties: COUNT,
  },
  'Item and weight in the order a roll walks them; a lowercase key is a whole family at that weight apiece',
);

const ITEM_POOL: Schema = {
  $schema: DRAFT,
  title: 'Item pool',
  ...part(
    {
      base: ITEM_BAND,
      uncommon: ITEM_BAND,
      scarce: ITEM_BAND,
      rare: ITEM_BAND,
      prized: ITEM_BAND,
      special: ITEM_BAND,
    },
    ['base', 'uncommon', 'scarce', 'rare', 'prized', 'special'],
  ),
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
  definitions['effect-shape'] = { enum: [...EFFECT_SHAPES] };
  definitions['delay-shape'] = { enum: [...DELAY_SHAPES] };

  const schemas = new Map([
    ['names.json', json({ $schema: DRAFT, title: 'Names', definitions })],
    ['species-world.json', json(WORLD)],
    ['species-stats.json', json(renderStats(listed('Stats')))],
    ['species-abilities.json', json(ABILITIES)],
    ['species-learnsets.json', json(LEARNSETS)],
    ['species-text.json', json(SPECIES_TEXT)],
    [
      'species-megas.json',
      json(
        worn(
          'Species: Megas',
          listed('Stats'),
          {
            ability: described(name('ability'), "The mainline's"),
            filler: described(
              name('ability'),
              "Worn instead, where the line already reaches the mainline's",
            ),
            height: described(COUNT, 'In meters'),
            weight: described(COUNT, 'In kilograms'),
          },
          ['ability', 'height', 'weight'],
        ),
      ),
    ],
    ['species-megas-text.json', json(namesText('Mega names', 'species'))],
    [
      'species-zeniths.json',
      json(
        worn(
          'Species: Zeniths',
          listed('Stats'),
          {
            ability: described(name('ability'), 'One the line can never be born with'),
            shard: described(name('item'), 'The shard held to reach it'),
          },
          ['ability', 'shard'],
        ),
      ),
    ],
    ['species-zeniths-text.json', json(namesText('Zenith holders', 'species'))],
    ['moves-battle.json', json(MOVE_BATTLE)],
    ['moves-cast.json', json(MOVE_CAST)],
    ['moves-text.json', json(MOVE_TEXT)],
    ['moves-visual.json', json(MOVE_VISUAL)],
    ['moves-visual-shapes.json', json(MOVE_VISUAL_SHAPES)],
    ['abilities-text.json', json(ABILITY_TEXT)],
    ['abilities-signatures.json', json(SIGNATURES)],
    ['items-records.json', json(ITEM_RECORDS)],
    ['items-text.json', json(ITEM_TEXT)],
    ['battle-statuses.json', json(BATTLE_STATUSES)],
    ['biome-pools.json', json(SPAWN_POOLS)],
    ['regions.json', json(REGIONS)],
    ['lairs.json', json(LAIRS)],
    ['biome-lairs.json', json(BIOME_LAIRS)],
    ['lairs-text.json', json(LAIR_TEXT)],
    ['biome-weather.json', json(BIOME_WEATHER)],
    ['trainer-classes.json', json(TRAINER_CLASSES)],
    ['biome-trainers.json', json(BIOME_TRAINERS)],
    ['trainers-text.json', json(TRAINER_TEXT)],
    ['trainer-sheets-text.json', json(TRAINER_SHEET_TEXT)],
    ['gym-leaders.json', json(GYM_LEADERS)],
    ['biome-gym-leaders.json', json(BIOME_GYM_LEADERS)],
    [
      'gym-leaders-text.json',
      json(
        spoken(
          'Gym leader words',
          'gym-leader',
          { name: 'What they are called', quote: 'What they say as the challenge is put' },
          ['name', 'quote'],
        ),
      ),
    ],
    ['elite.json', json(ELITE)],
    ['biome-elite.json', json(BIOME_ELITE)],
    [
      'elite-text.json',
      json(
        spoken(
          'Elite Four words',
          'elite-member',
          { name: 'What they are called', quote: 'What they say as they rise' },
          ['name', 'quote'],
        ),
      ),
    ],
    ['champions.json', json(CHAMPIONS)],
    [
      'champions-text.json',
      json(
        spoken(
          'Champion words',
          'champion',
          {
            name: 'What they are called',
            greeting: 'The whole line as the last fight of their league is put',
          },
          ['name', 'greeting'],
        ),
      ),
    ],
    ['legends.json', json(LEGENDS)],
    [
      'legends-text.json',
      json(
        spoken(
          'Legend words',
          'legend',
          { name: 'What they are called', greeting: 'The whole line as they are met' },
          ['name', 'greeting'],
        ),
      ),
    ],
    ['frontier.json', json(FRONTIER)],
    ['frontier-text.json', json(FRONTIER_TEXT)],
    ['syndicates.json', json(SYNDICATES)],
    ['executives.json', json(EXECUTIVES)],
    [
      'syndicates-text.json',
      json(
        spoken(
          'Syndicate words',
          'syndicate',
          {
            name: 'What the team is called',
            boss: "The boss's name",
            'boss-title': 'What the team calls its boss',
            'executive-title': 'What the team calls its executives',
            'boss-quote': 'What the boss says as they bar the cell',
            'grunt-quote': 'What the rank and file say',
          },
          ['name', 'boss', 'boss-title', 'executive-title', 'boss-quote', 'grunt-quote'],
        ),
      ),
    ],
    [
      'executives-text.json',
      json(
        spoken(
          'Executive words',
          'executive',
          { name: 'What they are called', quote: 'What they say as they bar the cell' },
          ['name', 'quote'],
        ),
      ),
    ],
    [
      'npcs-text.json',
      json(
        spoken(
          'NPC words',
          'npc',
          {
            name: 'What they are called',
            description: 'What they are for, in a line',
            quote: 'What they open with',
            spent: 'What they say once their one visit this window is spent',
          },
          ['name', 'description', 'quote'],
        ),
      ),
    ],
    ['vendor-stalls-text.json', json(namesText('Vendor stall names', 'vendor-kind'))],
    ['town-names-text.json', json(TOWN_NAMES)],
    ['decorations.json', json(DECORATIONS)],
    ['biome-decorations.json', json(BIOME_DECORATIONS)],
    ['snow-trees.json', json(SNOW_TREES)],
    ['decorations-text.json', json(namesText('Decoration names', 'decoration'))],
    ['landmarks.json', json(LANDMARKS)],
    ['landmarks-text.json', json(namesText('Landmark names', 'landmark'))],
    ['biome-phenomena.json', json(BIOME_PHENOMENA)],
    ['phenomena-text.json', json(namesText('Phenomenon names', 'phenomenon'))],
    ['biomes-text.json', json(namesText('Biome names', 'biome'))],
    ['biome-colors.json', json(keyed('Biome colors', 'biome', COLOR))],
    ['times-of-day-text.json', json(namesText('Time of day names', 'time-of-day'))],
    ['spawn-rarities-text.json', json(namesText('Spawn rarity names', 'spawn-rarity'))],
    [
      'stats-text.json',
      json(
        sections('Stat names', {
          stats: { propertyNames: name('stat'), additionalProperties: { type: 'string' } },
          stages: { propertyNames: name('stage'), additionalProperties: { type: 'string' } },
        }),
      ),
    ],
    ['item-types-text.json', json(namesText('Item type names', 'item-type'))],
    [
      'achievements-text.json',
      json(
        sections('Achievement words', {
          tiers: {
            propertyNames: name('achievement-tier'),
            additionalProperties: { type: 'string' },
          },
          lines: {
            propertyNames: name('achievement-line'),
            additionalProperties: part(
              {
                name: described({ type: 'string' }, 'What the line is called, and its title'),
                deed: described({ type: 'string' }, 'What it counts, for the hover card'),
              },
              ['name', 'deed'],
            ),
          },
        }),
      ),
    ],
    [
      'frontier-rooms-text.json',
      json(
        sections('Frontier room names', {
          curtains: {
            propertyNames: name('pike-curtain'),
            additionalProperties: { type: 'string' },
          },
          panels: { propertyNames: name('arcade-panel'), additionalProperties: { type: 'string' } },
        }),
      ),
    ],
    [
      'dex-rungs-text.json',
      json({ $schema: DRAFT, title: 'Dex rung names', type: 'array', items: { type: 'string' } }),
    ],
    ['statuses-text.json', json(namesText('Status names', 'status'))],
    ['awards-text.json', json(namesText('Award names', 'award'))],
    [
      'awards.json',
      json(
        keyed(
          'Awards',
          'award',
          part(
            {
              color: described(COLOR, 'The earned state of its disc'),
              sprite: described(
                {
                  type: 'array',
                  items: [{ type: 'string' }, { type: 'string' }],
                  minItems: 2,
                  maxItems: 2,
                },
                'The extras sheet and the name on it, where a picture ships',
              ),
            },
            ['color'],
          ),
        ),
      ),
    ],
    ['families-text.json', json(namesText('Family names', 'family'))],
    ['natures-text.json', json(namesText('Nature names', 'nature'))],
    ['egg-groups-text.json', json(namesText('Egg group names', 'egg-group'))],
    ['titles-text.json', json(namesText('Ladder title names', 'ladder-title'))],
    [
      'weather-kinds.json',
      json(
        keyed(
          'Weather kinds',
          'weather',
          part(
            {
              color: described(COLOR, 'What it is drawn as on the world map'),
              favours: described(
                { oneOf: [{ const: 'everything' }, names('type')] },
                'The types it is kind to: `[]` for none, `everything` for all',
              ),
              battle: described(
                name('battle-weather'),
                'The sky a fight met under it is fought in',
              ),
            },
            ['color', 'favours', 'battle'],
          ),
        ),
      ),
    ],
    [
      'weather-text.json',
      json(
        spoken(
          'Weather words',
          'weather',
          { name: 'What it is called', description: 'What a picture of it cannot say' },
          ['name', 'description'],
        ),
      ),
    ],
    ['item-pool.json', json(ITEM_POOL)],
    ['biome-items.json', json(BIOME_ITEMS)],
    ['totems.json', json(TOTEMS)],
    ['quests.json', json(QUESTS)],
    ['quests-daily.json', json(DAILY_QUESTS)],
    ['quests-text.json', json(QUEST_TEXT)],
    ['achievements.json', json(ACHIEVEMENTS)],
    ['true-shadows.json', json(TRUE_SHADOWS)],
    ['fusions.json', json(FUSIONS)],
    ['feats.json', json(FEATS)],
    ['ultra-beasts.json', json(ULTRA_BEASTS)],
    ['nobles.json', json(NOBLES)],
    ['status-cast.json', json(STATUS_CAST)],
    ['frontier-rooms.json', json(FRONTIER_ROOMS)],
    ['honey-tree.json', json({ $schema: DRAFT, title: 'Honey tree pool', ...SPAWN_GROUPS })],
  ]);

  for (const [file, title, entry] of BATTLE_FILES) {
    schemas.set(file, json(keyed(title, 'move', entry)));
  }
  for (const [file, schema] of [...BATTLE_LISTS, ...BUILD_FILES, ...OTHER_FILES]) {
    schemas.set(file, json(schema));
  }
  return schemas;
}
