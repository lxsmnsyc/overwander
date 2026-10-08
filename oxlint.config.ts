import config from '@lxsmnsyc/oxlint-config';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [config],
  ignorePatterns: ['example.js', '.output', '.vinxi'],
  rules: {
    'new-cap': 'off',
    'no-underscore-dangle': 'off',
  },
  overrides: [
    {
      // An item family's file is what is left beside its YAML: a table or
      // a describer, often only one, read by name like its neighbours
      files: ['src/data/items/*.ts'],
      rules: { 'import/prefer-default-export': 'off' },
    },
  ],
});
