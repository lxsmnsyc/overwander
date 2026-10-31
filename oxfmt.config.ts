import { defineConfig } from 'oxfmt';

export default defineConfig({
  singleQuote: true,
  ignorePatterns: ['public/**', 'src/data/schema/**', 'src/i18n/paraglide/**'],
});
