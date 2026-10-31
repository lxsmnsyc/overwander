import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { brotliCompressSync, gzipSync } from 'node:zlib';

/**
 * What a player downloads before the world can be drawn, read from the
 * last build.
 *
 * The browser starts at the client entry and, for the page it landed
 * on, that route's chunk. Both pull in their static imports at once,
 * and those pull in theirs, so the startup cost is the whole static
 * graph under the two. A dynamic import is fetched later, when it is
 * asked for, and is listed apart with what it adds on top.
 *
 * Run `pnpm build` first, then `pnpm measure-boot [route]`. The route
 * is a file under `src/routes`, `index.tsx` by default. Sizes are raw,
 * gzip and brotli, since what is sent over the wire is compressed.
 */

interface ManifestChunk {
  file: string;
  src?: string;
  isEntry?: boolean;
  imports?: string[];
  dynamicImports?: string[];
  css?: string[];
}

type Manifest = Partial<Record<string, ManifestChunk>>;

interface Size {
  raw: number;
  gzip: number;
  brotli: number;
}

const PUBLIC = '.output/public';
const MANIFEST = join(PUBLIC, '.vite/manifest.json');
const CLIENT_ENTRY = 'src/entry-client.tsx';

const sizes = new Map<string, Size>();

function measureFile(file: string): Size {
  // Each file is read and compressed once, however many lists it is in
  let size = sizes.get(file);

  if (size == null) {
    const bytes = readFileSync(join(PUBLIC, file));

    size = {
      raw: bytes.length,
      gzip: gzipSync(bytes, { level: 9 }).length,
      brotli: brotliCompressSync(bytes).length,
    };
    sizes.set(file, size);
  }
  return size;
}

function addSize(total: Size, size: Size): void {
  total.raw += size.raw;
  total.gzip += size.gzip;
  total.brotli += size.brotli;
}

function sumFiles(files: Iterable<string>): Size {
  const total = { raw: 0, gzip: 0, brotli: 0 };

  for (const file of files) {
    addSize(total, measureFile(file));
  }
  return total;
}

function formatKib(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function formatRow(size: Size, label: string): string {
  return `${formatKib(size.raw).padStart(12)} ${formatKib(size.gzip).padStart(12)} ${formatKib(size.brotli).padStart(12)}  ${label}`;
}

function collectStatic(
  manifest: Manifest,
  key: string,
  files: Set<string>,
  seen: Set<string>,
): void {
  // A chunk two others import is counted once
  if (seen.has(key)) {
    return;
  }
  seen.add(key);

  // The chunk's own file and its CSS load with it
  const chunk = manifest[key];

  if (chunk == null) {
    throw new Error(`The manifest has no chunk "${key}"`);
  }
  files.add(chunk.file);
  for (const css of chunk.css ?? []) {
    files.add(css);
  }

  // And so does everything it imports statically, all the way down
  for (const imported of chunk.imports ?? []) {
    collectStatic(manifest, imported, files, seen);
  }
}

function findRoute(manifest: Manifest, route: string): string {
  // SolidStart keys a route by its file with a query after it
  const prefix = `src/routes/${route}?`;

  for (const key of Object.keys(manifest)) {
    if (key.startsWith(prefix)) {
      return key;
    }
  }
  throw new Error(`No route "${route}" in the manifest`);
}

function main(): void {
  // The manifest of the last build
  if (!existsSync(MANIFEST)) {
    throw new Error(`No ${MANIFEST}: run \`pnpm build\` first`);
  }

  // The build wrote it, in Vite's manifest shape
  const parsed: unknown = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const manifest = parsed as Manifest;
  const route = process.argv[2] ?? 'index.tsx';
  const routeKey = findRoute(manifest, route);

  // The startup set: the entry and the route, with everything they import statically
  const startup = new Set<string>();
  const seen = new Set<string>();

  collectStatic(manifest, CLIENT_ENTRY, startup, seen);
  collectStatic(manifest, routeKey, startup, seen);

  // Printed largest first, then the total
  const ordered = [...startup];

  ordered.sort((a, b) => measureFile(b).raw - measureFile(a).raw);

  const header = `${'raw'.padStart(12)} ${'gzip'.padStart(12)} ${'brotli'.padStart(12)}  file`;

  console.log(`Startup for src/routes/${route}: ${startup.size} files\n`);
  console.log(header);
  for (const file of ordered) {
    console.log(formatRow(measureFile(file), file));
  }
  console.log(formatRow(sumFiles(startup), 'total'));

  // What each dynamic import made from the startup set adds once it is
  // asked for. Other routes are left out: they are other pages
  const later = new Set<string>();

  for (const key of seen) {
    for (const imported of manifest[key]?.dynamicImports ?? []) {
      if (manifest[imported]?.isEntry !== true && !seen.has(imported)) {
        later.add(imported);
      }
    }
  }

  if (later.size > 0) {
    console.log(`\nLoaded later, beyond the startup set\n`);
    console.log(header);
    const rows: { size: Size; label: string }[] = [];

    for (const key of later) {
      // Seeded with the startup chunks, so only what this import adds is counted
      const files = new Set<string>();

      collectStatic(manifest, key, files, new Set(seen));
      rows.push({
        size: sumFiles(files),
        label: `${key} (${files.size} ${files.size === 1 ? 'file' : 'files'})`,
      });
    }
    rows.sort((a, b) => b.size.raw - a.size.raw);
    for (const { size, label } of rows) {
      console.log(formatRow(size, label));
    }
  }
}

main();
