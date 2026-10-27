import { globSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { dirname, matchesGlob, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { parse } from 'yaml';

/**
 * What vite gives the code in `src` and Playwright does not.
 *
 * The specs import ids and rules from `src`, and Playwright loads them
 * through its own TypeScript transform rather than through vite. Three
 * things the data needs are vite's alone: YAML loaded as a module,
 * `import.meta.env`, and `import.meta.glob`. They are answered here the
 * way the dev server the specs talk to answers them, so a spec works
 * out the same world the server does
 */

const SRC = new URL('../src/', import.meta.url).href;

/**
 * The dev server's view of the environment: development mode, reading
 * `test/env` (see `playwright.config.ts` and `vite.config.ts`)
 */
const ENV = {
  ...loadEnv('development', fileURLToPath(new URL('../test/env', import.meta.url)), 'VITE_'),
  MODE: 'development',
  DEV: true,
  PROD: false,
  SSR: true,
};

/** What a YAML file holds, the way the vite plugin (`scripts/vite/yaml.ts`) builds it */
function readYaml(path: string): unknown {
  return parse(readFileSync(path, 'utf8'));
}

interface GlobOptions {
  eager?: boolean;
  import?: string;
}

/**
 * `import.meta.glob` for one module, for the only shape the data uses:
 * eager, taking each YAML file's default export. Keys are written
 * relative to the module, the way vite writes them
 */
function globFor(moduleUrl: string) {
  const directory = dirname(fileURLToPath(moduleUrl));

  return (patterns: string | string[], options: GlobOptions = {}): Record<string, unknown> => {
    if (options.eager !== true || options.import !== 'default') {
      throw new Error(`e2e: import.meta.glob supports only { eager: true, import: 'default' }`);
    }
    const all = typeof patterns === 'string' ? [patterns] : patterns;
    const found: Record<string, unknown> = {};

    for (const pattern of all) {
      if (pattern.startsWith('!')) {
        continue;
      }
      for (const match of globSync(pattern, { cwd: directory })) {
        const path = resolve(directory, match);
        const written = relative(directory, path);
        const key = written.startsWith('..') ? written : `./${written}`;
        let excluded = false;

        for (const other of all) {
          if (other.startsWith('!') && matchesGlob(key, other.slice(1))) {
            excluded = true;
          }
        }
        if (excluded) {
          continue;
        }
        if (!path.endsWith('.yaml')) {
          throw new Error(`e2e: import.meta.glob reads only YAML, not ${key}`);
        }
        found[key] = readYaml(path);
      }
    }
    return found;
  };
}

// Reached from the line put at the top of each module below
Object.assign(globalThis, { __e2eGlob: globFor });

registerHooks({
  load(url, context, nextLoad) {
    if (!url.startsWith(SRC)) {
      return nextLoad(url, context);
    }
    if (url.endsWith('.yaml')) {
      return {
        format: 'module',
        source: `export default ${JSON.stringify(readYaml(fileURLToPath(url)))};`,
        shortCircuit: true,
      };
    }

    const loaded = nextLoad(url, context);

    if (loaded.format !== 'module' || loaded.source == null) {
      return loaded;
    }
    const source =
      typeof loaded.source === 'string' ? loaded.source : new TextDecoder().decode(loaded.source);

    // On the first line, so the source map's lines still line up
    return {
      ...loaded,
      source: `import.meta.env = ${JSON.stringify(ENV)}; import.meta.glob = globalThis.__e2eGlob(import.meta.url);${source}`,
    };
  },
});
