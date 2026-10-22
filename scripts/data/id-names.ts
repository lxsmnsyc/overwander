import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import renderDataSchemas, { SCHEMA_DIR } from './schemas.ts';

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
  /** Imported under this name, where two enums share one */
  alias?: string;
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
  { name: 'SPAWN_RARITY_IDS', enumName: 'SpawnRarity', from: './biome' },
  { name: 'EGG_GROUP_IDS', enumName: 'EggGroups', from: './egg-groups' },
  { name: 'FAMILY_IDS', enumName: 'Families', from: './families', isDefault: true },
  { name: 'TYPE_IDS', enumName: 'Types', from: './types' },
  { name: 'STAT_IDS', enumName: 'Stats', from: './stats' },
  { name: 'STAGE_IDS', enumName: 'Stages', from: './stats' },
  { name: 'STATUS_IDS', enumName: 'Statuses', from: './status' },
  { name: 'TEAM_STATUS_IDS', enumName: 'TeamStatuses', from: './status' },
  { name: 'BATTLE_WEATHER_IDS', enumName: 'Weathers', from: './status' },
  { name: 'TERRAIN_IDS', enumName: 'Terrains', from: './status' },
  { name: 'MOVE_ROLE_IDS', enumName: 'MoveRole', from: './move-roles', isDefault: true },
  { name: 'BUILD_ROLE_IDS', enumName: 'BuildRole', from: './builds' },
  { name: 'STATUS_KIND_IDS', enumName: 'StatusKind', from: './builds' },
  { name: 'REGION_IDS', enumName: 'Regions', from: './regions', isDefault: true },
  { name: 'NATURE_IDS', enumName: 'Natures', from: './natures', isDefault: true },
  { name: 'AWARD_IDS', enumName: 'Awards', from: './awards', isDefault: true },
  { name: 'LAIR_IDS', enumName: 'Lairs', from: './lairs', isDefault: true },
  { name: 'TRAINER_IDS', enumName: 'TrainerClass', from: './trainers', isDefault: true },
  { name: 'GYM_LEADER_IDS', enumName: 'GymLeader', from: './gym-leaders', isDefault: true },
  { name: 'ELITE_MEMBER_IDS', enumName: 'EliteMember', from: './elite', isDefault: true },
  { name: 'CHAMPION_IDS', enumName: 'Champion', from: './champions', isDefault: true },
  { name: 'LEGEND_IDS', enumName: 'Legend', from: './legends', isDefault: true },
  { name: 'FRONTIER_BRAIN_IDS', enumName: 'FrontierBrain', from: './frontier', isDefault: true },
  { name: 'FRONTIER_RULE_IDS', enumName: 'FrontierRule', from: './frontier' },
  { name: 'PIKE_CURTAIN_IDS', enumName: 'PikeCurtain', from: './frontier' },
  { name: 'ARCADE_PANEL_IDS', enumName: 'ArcadePanel', from: './frontier' },
  { name: 'SYNDICATE_IDS', enumName: 'Syndicate', from: './syndicates', isDefault: true },
  { name: 'EXECUTIVE_IDS', enumName: 'Executive', from: './executives', isDefault: true },
  { name: 'NPC_IDS', enumName: 'Npc', from: './npcs', isDefault: true },
  { name: 'VENDOR_KIND_IDS', enumName: 'VendorKind', from: './vendor-kinds', isDefault: true },
  { name: 'DECORATION_IDS', enumName: 'Decoration', from: './decorations', isDefault: true },
  { name: 'LANDMARK_IDS', enumName: 'Landmark', from: './landmarks', isDefault: true },
  { name: 'PHENOMENON_IDS', enumName: 'Phenomenon', from: './phenomena', isDefault: true },
  { name: 'WEATHER_IDS', enumName: 'Weather', from: './weather', isDefault: true },
  { name: 'ACHIEVEMENT_TIER_IDS', enumName: 'AchievementTier', from: './achievements' },
  { name: 'ACHIEVEMENT_LINE_IDS', enumName: 'AchievementLine', from: './achievements' },
  { name: 'LADDER_TITLE_IDS', enumName: 'LadderTitle', from: './ladder-titles', isDefault: true },
  { name: 'BALL_IDS', enumName: 'Balls', from: './items' },
  { name: 'QUEST_IDS', enumName: 'Quests', from: '../quests/types' },
  { name: 'CHAIN_IDS', enumName: 'Chains', from: '../quests/types' },
  { name: 'METRIC_IDS', enumName: 'Metric', from: '../../model/quest-record' },
  {
    name: 'QUEST_LANDMARK_IDS',
    enumName: 'Landmark',
    from: '../../model/quest-record',
    alias: 'QuestLandmark',
  },
  { name: 'FOE_IDS', enumName: 'Foe', from: '../../model/quest-record' },
];

/** The member names of one enum, in the order they are declared */
function membersOf(table: Table): string[] {
  const path = new URL(`../../src/data/ids/${table.from}.ts`, import.meta.url);
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
    members.set(table.alias ?? table.enumName, membersOf(table));
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
    const local = table.alias ?? table.enumName;
    const imported = table.alias == null ? local : `${table.enumName} as ${local}`;

    imports.set(
      table.from,
      table.isDefault === true ? [local, named] : [fallback, [...named, imported]],
    );

    const entries: string[] = [];

    for (const member of membersOf(table)) {
      entries.push(`  ${member}: ${local}.${member},`);
    }
    blocks.push(
      `export const ${table.name} = {\n${entries.join('\n')}\n} as const satisfies Record<string, ${local}>;`,
    );
  }

  const lines = [
    '// Written by scripts/data/id-names.ts from the enums it lists; run `pnpm id-names`',
    '// rather than editing it',
  ];

  for (const [from, [fallback, named]] of imports) {
    // Sorted by the name each is bound to, which is what the linter reads
    const bound = (spec: string): string => spec.slice(spec.lastIndexOf(' ') + 1);
    const sorted = [...named].sort((one, two) => (bound(one) < bound(two) ? -1 : 1));
    const braces = named.length === 0 ? '' : `{ ${sorted.join(', ')} }`;
    const what = [fallback, braces].filter((part) => part !== '').join(', ');

    lines.push(`import ${what} from '${from}';`);
  }
  return `${lines.join('\n')}\n\n${blocks.join('\n\n')}\n`;
}

if (import.meta.main) {
  writeFileSync(new URL(`../../${OUTPUT}`, import.meta.url), renderIdNames());
  console.log(`${OUTPUT} written`);
  mkdirSync(new URL(`../../${SCHEMA_DIR}`, import.meta.url), { recursive: true });
  for (const [file, schema] of renderDataSchemas(enumMembers())) {
    writeFileSync(new URL(`../../${SCHEMA_DIR}/${file}`, import.meta.url), schema);
  }
  console.log(`${SCHEMA_DIR} written`);
}
