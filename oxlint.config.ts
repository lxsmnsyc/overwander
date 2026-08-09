import config from '@lxsmnsyc/oxlint-config';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [config],
  ignorePatterns: ['example.js', '.output', '.vinxi'],
  rules: {
    'new-cap': 'off',
    'no-underscore-dangle': 'off',
  },
});
