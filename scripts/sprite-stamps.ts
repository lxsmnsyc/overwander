import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * A digest per sprite sheet, so a sheet can be cached forever and a
 * repacked one is still fetched.
 *
 * The pokemon sheets already carry one: `coats.json` stamps each
 * species with a digest of its description and coats, and the board
 * asks for them at `?v=<stamp>`. Everything else under
 * `public/sprites` was asked for at a bare path, so a browser told to
 * keep it for a year would keep a sheet that has since been redrawn.
 * This writes the same kind of stamp for those, keyed by the folder
 * the sheet lives in.
 *
 * It runs as part of the build, so what ships is always a digest of
 * what shipped beside it. The committed copy is for `pnpm dev`, where
 * nothing rebuilds it.
 */

/** Where the sheets are, relative to the working directory */
const ROOT = 'public/sprites';

/** What the file is called, and the key it is served under */
const OUTPUT = join(ROOT, 'stamps.json');

/**
 * The pokemon folder is left out: `coats.json` stamps it already, per
 * species rather than per folder, and two stamps for one sheet is one
 * of them going stale
 */
const SKIPPED = new Set(['pokemon']);

/** What is not a sheet: the two indexes themselves */
const IGNORED = new Set(['stamps.json']);

/**
 * How much of the digest is kept. Eight hex characters is four bytes
 * of SHA-256, the same length `coats.json` keeps
 */
const STAMP_LENGTH = 8;

/** Every file under the folder, deepest last, as paths below `ROOT` */
async function walk(folder: string): Promise<string[]> {
  const found: string[] = [];

  for (const entry of await readdir(join(ROOT, folder), { withFileTypes: true })) {
    if (IGNORED.has(entry.name) || (folder === '' && SKIPPED.has(entry.name))) {
      continue;
    }

    const path = folder === '' ? entry.name : `${folder}/${entry.name}`;

    if (entry.isDirectory()) {
      found.push(...(await walk(path)));
    } else {
      found.push(path);
    }
  }
  return found;
}

/** The sheet a file belongs to: its folder, or the file's own name for a loose pair */
function sheetOf(path: string): string {
  const cut = path.lastIndexOf('/');
  const folder = cut < 0 ? '' : path.slice(0, cut);
  const name = path.slice(cut + 1);

  // A sheet is a folder holding `data.json` and `image.png`, so the
  // folder is the address. The terrain pack and the processor's extras
  // are a loose pair named after the sheet instead, and there the name
  // without its extension is
  if (name === 'data.json' || name === 'image.png') {
    return folder;
  }
  const dot = name.lastIndexOf('.');

  return `${folder === '' ? '' : `${folder}/`}${dot < 0 ? name : name.slice(0, dot)}`;
}

/** A digest of every file the sheet is drawn from, in a settled order */
async function stampOf(files: string[]): Promise<string> {
  const hash = createHash('sha256');

  for (const file of [...files].sort()) {
    hash.update(file);
    hash.update(await readFile(join(ROOT, file)));
  }
  return hash.digest('hex').slice(0, STAMP_LENGTH);
}

/**
 * The file as text: one sheet a line, so a diff says which sheets
 * changed rather than reflowing the whole thing
 */
function format(stamps: Map<string, string>): string {
  const lines: string[] = [];

  for (const sheet of [...stamps.keys()].sort()) {
    lines.push(`    ${JSON.stringify(sheet)}: ${JSON.stringify(stamps.get(sheet))}`);
  }
  return `{\n  "version": 1,\n  "stamps": {\n${lines.join(',\n')}\n  }\n}\n`;
}

async function main(): Promise<void> {
  // The sprites are published to their own host, so a build for the
  // app alone has none of them on disk. There is nothing to stamp
  // then, and the file that is served is the one already committed
  if (!existsSync(ROOT)) {
    process.stdout.write(`${ROOT}: not here, so nothing to stamp\n`);
    return;
  }

  const sheets = new Map<string, string[]>();

  for (const file of await walk('')) {
    const sheet = sheetOf(file);
    const held = sheets.get(sheet);

    if (held == null) {
      sheets.set(sheet, [file]);
    } else {
      held.push(file);
    }
  }

  const stamps = new Map<string, string>();

  for (const [sheet, files] of sheets) {
    stamps.set(sheet, await stampOf(files));
  }
  await writeFile(OUTPUT, format(stamps), 'utf8');
  process.stdout.write(`${OUTPUT}: ${stamps.size} sheets\n`);
}

await main();
