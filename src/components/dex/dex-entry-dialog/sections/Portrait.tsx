import { type JSX, Show } from 'solid-js';
import type { Species } from '../../../../data/ids/species';
import { SpriteAnim } from '../../../../data/ids/sprite-anims';
import type { SpeciesData } from '../../../../data/species';
import SpeciesCoat from '../../../sprites/SpeciesCoat';
import { Segmented } from '../../../styled';
import { ROTATION } from '../species-facts';
import { m } from '../../../../i18n/paraglide/messages.js';

export interface PortraitProps {
  species: Species;
  data: SpeciesData;
  /** Whether the reader has met it, owns it, and owns a shiny one */
  met: boolean;
  owned: boolean;
  ownedShiny: boolean;
  shiny: boolean;
  female: boolean;
  /** Whether the females were drawn differently, so the sex toggle is offered */
  hasFemale: boolean;
  onShiny: (shiny: boolean) => void;
  onFemale: (female: boolean) => void;
}

/**
 * The species turning on the field stage the catch sheet stands its
 * pokemon on, with the coat and sex it is drawn in under it
 */
export default function Portrait(props: PortraitProps): JSX.Element {
  return (
    <div class="flex flex-col gap-2.5">
      <div class="relative h-40 shrink-0 md:h-44">
        {/* The field is a layer of its own, clipped to its corners, so
            the species standing on it is never clipped with it */}
        <div
          aria-hidden="true"
          class="absolute inset-0 overflow-hidden rounded-card"
          style={{
            background:
              'linear-gradient(var(--field-sky), var(--field-haze) 58%, var(--field-grass) 58%, var(--field-grass-deep))',
          }}
        >
          <span
            class="absolute bottom-3 left-1/2 h-7 w-32 -translate-x-1/2 rounded-[50%]
              shadow-[inset_0_-4px_0_rgb(0_0_0/0.15)]"
            style={{ background: 'var(--field-base)' }}
          />
        </div>
        {/* A fixed square the sprite is fitted to, so every species takes
            the same room */}
        <div class="absolute inset-x-0 top-3 bottom-4 flex justify-center">
          <div class="relative aspect-square h-full">
            <SpeciesCoat
              species={props.species}
              met={props.met}
              revealed={props.shiny ? props.ownedShiny : props.owned}
              shiny={props.shiny}
              female={props.female}
              animation={SpriteAnim.Rotate}
              duration={ROTATION}
              direction="DownLeft"
              fill
              sized
              called={[
                props.data.name,
                ...(props.shiny ? [m.dex_coat_shiny()] : []),
                ...(props.hasFemale
                  ? [props.female ? m.dex_coat_female() : m.dex_coat_male()]
                  : []),
              ].join(', ')}
            />
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Segmented
          label={m.dex_coat()}
          value={props.shiny}
          options={[
            { value: false, label: m.dex_coat_regular() },
            { value: true, label: m.catch_shiny() },
          ]}
          onChange={(shiny) => {
            props.onShiny(shiny);
          }}
        />
        {/* Only where the females were drawn differently */}
        <Show when={props.hasFemale}>
          <Segmented
            label={m.dex_sex()}
            value={props.female}
            options={[
              { value: false, label: '♂' },
              { value: true, label: '♀' },
            ]}
            onChange={(female) => {
              props.onFemale(female);
            }}
          />
        </Show>
      </div>
    </div>
  );
}
