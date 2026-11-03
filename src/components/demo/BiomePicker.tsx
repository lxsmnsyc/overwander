import type { JSX } from 'solid-js';
import { BIOME_NAMES } from '../../data/biome';
import Biome from '../../data/ids/biome';
import { Select } from '../styled';

/**
 * Which ground a demo fight stands on. Alpine Tundra by default, since
 * a bright snowfield is the hardest backdrop to read a fight against
 */
export const DEFAULT_DEMO_BIOME = Biome.AlpineTundra;

const OPTIONS: { value: Biome; label: string }[] = [];

for (const key of Object.keys(BIOME_NAMES)) {
  const value = Number(key);

  // Read each time, so the label follows the player's language
  OPTIONS.push({
    value,
    get label() {
      return BIOME_NAMES[value];
    },
  });
}

/** A biome read back out of the address, or the default */
export function biomeFrom(value: string | undefined): Biome {
  const read = Number(value);

  return value != null && value !== '' && read in BIOME_NAMES ? read : DEFAULT_DEMO_BIOME;
}

export default function BiomePicker(props: {
  value: Biome;
  onChange: (biome: Biome) => void;
}): JSX.Element {
  return (
    <Select
      label="Ground"
      class="w-56"
      value={props.value}
      options={OPTIONS}
      onChange={(chosen) => {
        props.onChange(chosen);
      }}
    />
  );
}
