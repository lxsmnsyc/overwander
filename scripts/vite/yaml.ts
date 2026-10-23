import { parse } from 'yaml';
import type { Plugin } from 'vite';

/**
 * Game data written as YAML, turned into plain modules at build time.
 *
 * Each `.yaml` file becomes a module whose default export is what the
 * file holds, so nothing parses YAML in the browser and a file that
 * does not parse fails the build. What the data means, and whether
 * it names real things, is checked where it is read
 * (`src/data/species/yaml.ts`)
 */
export default function yamlData(): Plugin {
  return {
    name: 'overwander:yaml-data',
    transform(code, id) {
      if (!id.endsWith('.yaml')) {
        return null;
      }
      return { code: `export default ${JSON.stringify(parse(code))};`, map: null };
    },
  };
}
