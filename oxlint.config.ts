import config from '@lxsmnsyc/oxlint-config';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [config],
  ignorePatterns: ['.output', 'src/i18n/paraglide'],
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
      // The game's logic and its drawing run without a UI framework;
      // components reach them through createStoreSignal and plain calls
      files: ['src/game/**', 'src/canvas/**'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['solid-js', 'solid-js/*', '@solidjs/*', '**/components/**'],
                message:
                  'src/game and src/canvas stay free of Solid and the components: expose a Store or a plain function instead.',
              },
            ],
          },
        ],
      },
    },
  ],
});
