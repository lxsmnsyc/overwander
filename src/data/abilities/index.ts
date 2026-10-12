import { registerAbility, registerFormSignature, registerSignature } from './__create';
import { readAbilities, readSignatures } from './yaml';

export {
  getAbilityData,
  getRegisteredAbilities,
  getSignatureAbility,
  getSpeciesSignature,
  registerAbility,
  registerFormSignature,
  registerSignature,
} from './__create';
export type { AbilityData } from './__create';

export default function registerAbilities(): void {
  // Written as YAML: the abilities are all text, the grants a file per region (see ./yaml.ts)
  const abilities = readAbilities(
    import.meta.glob('../text/en/abilities/**/*.yaml', { eager: true, import: 'default' }),
  );

  for (const [ability, data] of abilities) {
    registerAbility(ability, data);
  }

  const grants = readSignatures(
    import.meta.glob('./signatures/*.yaml', { eager: true, import: 'default' }),
  );

  for (const [family, ability] of grants.families) {
    registerSignature(family, ability);
  }
  for (const [forms, ability] of grants.forms) {
    registerFormSignature(forms, ability);
  }
}
