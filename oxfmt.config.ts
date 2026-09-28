import { defineConfig } from 'oxfmt';

export default defineConfig({
  singleQuote: true,
  // The compact species rows are written by pnpm species-compact, one row to a line
  ignorePatterns: ['example.js', 'public/**', 'src/data/species/compact/**'],
});
