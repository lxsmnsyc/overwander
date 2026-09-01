import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { SpriteAnim, asSpriteAnim, spriteAnimName } from '../src/data/ids/sprite-anims.ts';
import writeCoats from '../src/server/sprites/coats.ts';

/**
 * Brings the pokemon sheets in from the SpriteCollab checkout.
 *
 * The sheets are built there, in `compact/`, and copied here whole: a
 * folder per pokemon holding `sheet.json`, `frames.bin` and a PNG per
 * coat. Nothing is repacked on the way, so what the game draws is what
 * the collection built, pixel for pixel.
 *
 * The one thing that changes is the name. The collection files a form
 * as `{region}/{dex}/{form}`; the game files it under the **species
 * id** it knows it by, which is the dex number for a base form and a
 * number past a hundred thousand for the three things that are drawn
 * like pokemon without being pokemon. A form the game has no id for is
 * skipped and counted.
 *
 * ```bash
 * pnpm import-sprites                    # from ../SpriteCollab
 * pnpm import-sprites ../elsewhere       # from another checkout
 * pnpm import-sprites --dry-run
 * ```
 *
 * Run `pnpm compact-sprites` afterwards, which records the new sheets
 * in the pipeline ledger.
 */

const SOURCE = '../SpriteCollab';

const DESTINATION = 'public/sprites/pokemon';

/**
 * Which regions are carried over, and what they are called here. The
 * game's own answer is `getSpeciesRegion`, which cannot be imported
 * into a script: it is written in `const enum`s, which node refuses
 */
const REGIONS: Partial<Record<string, string>> = { kanto: 'kanto', johto: 'johto' };

/**
 * The three drawn like pokemon without being pokemon, by the form the
 * collection files them under. Their ids are in
 * [`src/data/ids/species.ts`](../src/data/ids/species.ts)
 */
const MISC: Partial<Record<number, { species: number; name: string }>> = {
  0: { species: 100000, name: 'Missingno' },
  4: { species: 100001, name: 'Egg' },
  1: { species: 100002, name: 'Substitute' },
};

/** Where the misc three are filed, being of no region. */
const UNKNOWN = 'unknown';

/**
 * The six a sheet cannot be put on screen without. Written out rather
 * than imported from [`MINIMUM_CAST`](../src/data/constants/cast.ts),
 * which reaches the `const enum`s node refuses to load
 */
const MINIMUM = new Set<number>([
  SpriteAnim.Idle,
  SpriteAnim.Attack,
  SpriteAnim.Walk,
  SpriteAnim.Sleep,
  SpriteAnim.Hurt,
  SpriteAnim.Hop,
]);

/**
 * Which species this game has form ids for, and how many forms it
 * knows counting the default. A form past the count is skipped: the
 * ids are `Species` members, and arithmetic alone cannot say whether
 * one was ever written down
 */
const FORMS: Partial<Record<number, number>> = { 201: 28 };

/**
 * Where form ids start, matching `SPECIES_FORM_BAND` in
 * [`src/data/ids/species.ts`](../src/data/ids/species.ts). Repeated
 * rather than imported, since node refuses a `const enum`'s file
 */
const FORM_BAND = 1000000;
const FORMS_PER_SPECIES = 100;

interface Slot {
  region: string;
  dex: number;
  form: number;
  path: string;
  coats: string[];
  missing: number[];
}

interface Wanted extends Slot {
  species: number;
  under: string;
}

function say(message: string): void {
  console.log(message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null;
}

function slotsOf(root: string): Slot[] {
  const index: unknown = JSON.parse(readFileSync(join(root, 'index.json'), 'utf8'));
  const held = isRecord(index) && Array.isArray(index.slots) ? index.slots : [];

  return held.filter(isRecord).map((slot) => ({
    region: String(slot.region),
    dex: Number(slot.dex),
    form: Number(slot.form),
    path: String(slot.path),
    coats: Array.isArray(slot.coats) ? slot.coats.map(String) : [],
    missing: Array.isArray(slot.missing) ? slot.missing.map(Number) : [],
  }));
}

/** The species id this form is known by here, or nothing for one it is not. */
function wanted(slot: Slot): Wanted | null {
  if (slot.region === 'misc' && slot.dex === 0) {
    const known = MISC[slot.form];

    return known == null ? null : { ...slot, species: known.species, under: UNKNOWN };
  }
  const region = REGIONS[slot.region];

  if (region == null) {
    return null;
  }
  if (slot.form === 0) {
    return { ...slot, species: slot.dex, under: region };
  }

  // An alternate form is filed beside its species, under the id the
  // reserved band gives it, and skipped where the game has no id
  if (slot.form >= (FORMS[slot.dex] ?? 0)) {
    return null;
  }
  return {
    ...slot,
    species: FORM_BAND + slot.dex * FORMS_PER_SPECIES + slot.form,
    under: region,
  };
}

/** What the clips are called, for a line somebody has to read. */
function named(anims: number[]): string {
  return anims
    .map((anim) => {
      const known = asSpriteAnim(anim);

      return known == null ? String(anim) : spriteAnimName(known);
    })
    .join(', ');
}

/** Which animations one copied sheet carries. */
function animsOf(folder: string): number[] {
  const sheet: unknown = JSON.parse(readFileSync(join(folder, 'sheet.json'), 'utf8'));
  const held = isRecord(sheet) && Array.isArray(sheet.anims) ? sheet.anims : [];

  return held.filter(isRecord).map((anim) => Number(anim.anim));
}

/** Everything the collection put in one form's folder. */
function filesOf(root: string, slot: Slot): string[] {
  return readdirSync(join(root, slot.path)).filter((file) => !file.startsWith('.'));
}

export default function importSprites(source: string, dryRun: boolean): void {
  const root = join(source, 'compact');

  if (!existsSync(join(root, 'index.json'))) {
    throw new Error(`No compact sheets at ${root}. Build them in the SpriteCollab checkout first`);
  }
  const slots = slotsOf(root);
  const taking: Wanted[] = [];

  for (const slot of slots) {
    const held = wanted(slot);

    if (held != null) {
      taking.push(held);
    }
  }
  taking.sort((one, two) => one.species - two.species);

  say(`${taking.length} of ${slots.length} forms, from ${root}`);

  if (dryRun) {
    for (const slot of taking) {
      say(`  ${slot.path} -> ${slot.under}/${slot.species} (${slot.coats.join(', ')})`);
    }
    return;
  }

  // The whole tree is replaced rather than written over: a species
  // whose folder is no longer built has to stop being served, and its
  // files would otherwise sit there being drawn
  for (const region of new Set(taking.map((slot) => slot.under))) {
    rmSync(join(DESTINATION, region), { recursive: true, force: true });
  }

  let files = 0;

  for (const slot of taking) {
    const folder = join(DESTINATION, slot.under, String(slot.species));

    mkdirSync(folder, { recursive: true });
    for (const file of filesOf(root, slot)) {
      copyFileSync(join(root, slot.path, file), join(folder, file));
      files += 1;
    }
  }
  say(`${files} files under ${DESTINATION}`);

  for (const slot of taking.filter((one) => one.missing.length > 0)) {
    const bare = slot.missing.filter((anim) => MINIMUM.has(anim));

    // A gap in the other four is a sheet drawn plainer; a gap in the
    // six is a pokemon that cannot be put on screen properly at all
    say(
      bare.length > 0
        ? `  ${slot.species} has no ${named(bare)}, which a sheet cannot be drawn without`
        : `  ${slot.species} has no ${named(slot.missing)}: unfinished art, cast falls back`,
    );
  }

  // A clip this game has no number for cannot be asked to play, so it
  // would ship as bytes nothing reads. It is a gap in `SpriteAnim`
  // rather than a bad sheet
  const unknown = new Set<number>();

  for (const slot of taking) {
    for (const anim of animsOf(join(DESTINATION, slot.under, String(slot.species)))) {
      if (asSpriteAnim(anim) == null) {
        unknown.add(anim);
      }
    }
  }
  if (unknown.size > 0) {
    say(`animations with no id here: ${[...unknown].sort((one, two) => one - two).join(', ')}`);
  }
}

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const from = argv.find((arg) => !arg.startsWith('--')) ?? SOURCE;

importSprites(from, dryRun);

if (!dryRun) {
  say(`public/${await writeCoats()}`);
}
