import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import renderDataSchemas, { SCHEMA_DIR } from './data-schemas.ts';

/**
 * Writes `src/data/ids/names.ts`: every member of the enums the YAML
 * data refers to, keyed by its own name. Also writes the JSON Schemas
 * in `src/data/schema/`, which hand the same names to an editor for
 * completion and squiggles.
 *
 * The data files name things the way the code does (`Arcanine`,
 * `FlareBlitz`), and these tables are how a name becomes an id. They
 * are written out rather than built at runtime because the enums are
 * `const`, which cannot be walked. Run after adding a member:
 *
 * ```bash
 * pnpm id-names
 * ```
 */

const OUTPUT = 'src/data/ids/names.ts';

interface Table {
  /** The exported table */
  name: string;
  /** The enum it lists */
  enumName: string;
  /** Where the enum is declared, from `src/data/ids/` */
  from: string;
  /** Whether the enum is the file's default export */
  isDefault?: boolean;
  /** Written as a frozen object rather than an `enum` */
  isObject?: boolean;
}

const TABLES: Table[] = [
  { name: 'SPECIES_IDS', enumName: 'Species', from: './species' },
  { name: 'GENDER_IDS', enumName: 'Genders', from: './species' },
  { name: 'HABITAT_IDS', enumName: 'Habitat', from: './species' },
  { name: 'EVOLUTION_METHOD_IDS', enumName: 'EvolutionMethod', from: './species' },
  { name: 'MOVE_IDS', enumName: 'Moves', from: './moves' },
  { name: 'MOVE_CATEGORY_IDS', enumName: 'MoveCategories', from: './moves' },
  { name: 'MOVE_TARGET_IDS', enumName: 'MoveTargets', from: './moves' },
  { name: 'MOVE_AFFECT_IDS', enumName: 'MoveAffects', from: './moves' },
  { name: 'MOVE_FLAG_IDS', enumName: 'MoveFlags', from: './moves' },
  { name: 'SPRITE_ANIM_IDS', enumName: 'SpriteAnim', from: './sprite-anims', isObject: true },
  { name: 'ABILITY_IDS', enumName: 'Abilities', from: './abilities', isDefault: true },
  { name: 'ITEM_IDS', enumName: 'Items', from: './items' },
  { name: 'ITEM_TYPE_IDS', enumName: 'ItemTypes', from: './items' },
  { name: 'ITEM_FLAG_IDS', enumName: 'ItemFlags', from: './items' },
  { name: 'BIOME_IDS', enumName: 'Biome', from: './biome', isDefault: true },
  { name: 'TIME_OF_DAY_IDS', enumName: 'TimeOfDay', from: './biome' },
  { name: 'EGG_GROUP_IDS', enumName: 'EggGroups', from: './egg-groups' },
  { name: 'FAMILY_IDS', enumName: 'Families', from: './families', isDefault: true },
  { name: 'TYPE_IDS', enumName: 'Types', from: '../constants/types' },
  { name: 'STAT_IDS', enumName: 'Stats', from: '../constants/stats' },
  { name: 'STAGE_IDS', enumName: 'Stages', from: '../constants/stats' },
  { name: 'STATUS_IDS', enumName: 'Statuses', from: './status' },
  { name: 'TEAM_STATUS_IDS', enumName: 'TeamStatuses', from: './status' },
  { name: 'REGION_IDS', enumName: 'Regions', from: './regions', isDefault: true },
  { name: 'AWARD_IDS', enumName: 'Awards', from: './awards', isDefault: true },
  { name: 'LAIR_IDS', enumName: 'Lairs', from: './lairs', isDefault: true },
  { name: 'TRAINER_IDS', enumName: 'TrainerClass', from: './trainers', isDefault: true },
  { name: 'GYM_LEADER_IDS', enumName: 'GymLeader', from: './gym-leaders', isDefault: true },
  { name: 'ELITE_MEMBER_IDS', enumName: 'EliteMember', from: './elite', isDefault: true },
  {
    name: 'WEATHER_IDS',
    enumName: 'Weather',
    from: '../overworld/weather/kinds',
    isDefault: true,
  },
];

/** The member names of one enum, in the order they are declared */
function membersOf(table: Table): string[] {
  const path = new URL(`../src/data/ids/${table.from}.ts`, import.meta.url);
  const source = readFileSync(path, 'utf8');
  const start = source.search(
    new RegExp(
      table.isObject === true ? `const ${table.enumName} = \\{` : `enum ${table.enumName} \\{`,
    ),
  );

  if (start < 0) {
    throw new Error(`No enum ${table.enumName} in ${table.from}`);
  }

  const body = source
    .slice(source.indexOf('{', start) + 1, source.indexOf('\n}', start))
    .replaceAll(/\/\*[\s\S]*?\*\//g, '')
    .replaceAll(/\/\/.*$/gm, '');
  const names: string[] = [];

  for (const [, name] of body.matchAll(/^\s*([A-Za-z_]\w*)\s*(?:=|:|,|$)/gm)) {
    names.push(name);
  }
  return names;
}

/** Every listed enum's members, by the enum's name */
export function enumMembers(): Map<string, string[]> {
  const members = new Map<string, string[]>();

  for (const table of TABLES) {
    members.set(table.enumName, membersOf(table));
  }
  return members;
}

/** The whole generated file, so a test can tell whether it is current */
export default function renderIdNames(): string {
  /** Each file's default import, and its named ones */
  const imports = new Map<string, [string, string[]]>();
  const blocks: string[] = [];

  for (const table of TABLES) {
    const [fallback, named] = imports.get(table.from) ?? ['', []];

    imports.set(
      table.from,
      table.isDefault === true ? [table.enumName, named] : [fallback, [...named, table.enumName]],
    );

    const entries: string[] = [];

    for (const member of membersOf(table)) {
      entries.push(`  ${member}: ${table.enumName}.${member},`);
    }
    blocks.push(
      `export const ${table.name} = {\n${entries.join('\n')}\n} as const satisfies Record<string, ${table.enumName}>;`,
    );
  }

  const lines = [
    '// Written by scripts/id-names.ts from the enums it lists; run `pnpm id-names`',
    '// rather than editing it',
  ];

  for (const [from, [fallback, named]] of imports) {
    const braces = named.length === 0 ? '' : `{ ${[...named].sort().join(', ')} }`;
    const what = [fallback, braces].filter((part) => part !== '').join(', ');

    lines.push(`import ${what} from '${from}';`);
  }
  return `${lines.join('\n')}\n\n${blocks.join('\n\n')}\n`;
}

if (import.meta.main) {
  writeFileSync(new URL(`../${OUTPUT}`, import.meta.url), renderIdNames());
  console.log(`${OUTPUT} written`);
  mkdirSync(new URL(`../${SCHEMA_DIR}`, import.meta.url), { recursive: true });
  for (const [file, schema] of renderDataSchemas(enumMembers())) {
    writeFileSync(new URL(`../${SCHEMA_DIR}/${file}`, import.meta.url), schema);
  }
  console.log(`${SCHEMA_DIR} written`);
}
