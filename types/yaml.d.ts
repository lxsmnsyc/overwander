/** A YAML data file, as the build turns it into a module (see `plugins/yaml.ts`) */
declare module '*.yaml' {
  const data: unknown;
  export default data;
}
