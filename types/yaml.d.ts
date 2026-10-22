/**
 * A YAML data file, as the build turns it into a module (see `scripts/vite/yaml.ts`).
 * `pnpm typecheck` types each import from its content through the YAML content mapper;
 * this stands in for tools that do not run it, such as oxlint's type-aware rules
 */
declare module '*.yaml' {
  const data: unknown;
  export default data;
}
