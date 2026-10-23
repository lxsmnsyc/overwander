import config from '@lxsmnsyc/oxlint-config';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [config],
  ignorePatterns: ['.output'],
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
    {
      // The game's logic runs without a UI framework; components reach
      // its stores through createStoreSignal
      files: ['src/game/**'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['solid-js', 'solid-js/*', '@solidjs/*', '**/components/**'],
                message: 'src/game stays free of Solid and the components: expose a Store instead.',
              },
            ],
          },
        ],
      },
    },
  ],
});
