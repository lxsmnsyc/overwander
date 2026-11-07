import { type JSX, Show } from 'solid-js';
import type { Species } from '../../../../data/ids/species';
import { SpriteAnim } from '../../../../data/ids/sprite-anims';
import type { SpeciesData } from '../../../../data/species';
import SpeciesCoat from '../../../sprites/SpeciesCoat';
import { ROTATION } from '../species-facts';
import { m } from '../../../../i18n/paraglide/messages.js';

/** One half of a two-way switch, pressed or not */
function Toggle(props: {
  pressed: boolean;
  onPress: () => void;
  children: JSX.Element;
}): JSX.Element {
  return (
    <button
      type="button"
      aria-pressed={props.pressed}
      class={`rounded-none border-2 px-2 py-0.5 text-xs font-bold shadow-none first:rounded-l-lg
        last:rounded-r-lg active:translate-y-0 ${
          props.pressed
            ? 'border-tide bg-tide text-on-accent hover:text-on-accent'
            : 'border-line bg-paper text-ink'
        }`}
      onClick={() => {
        props.onPress();
      }}
    >
      {props.children}
    </button>
  );
}

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

/** The species turning on its stage, with the coat and sex it is drawn in */
export default function Portrait(props: PortraitProps): JSX.Element {
  return (
    <>
      {/* A fixed square the sprite is fitted to, so every species
          takes the same room */}
      <div class="relative size-36 shrink-0">
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
            ...(props.hasFemale ? [props.female ? m.dex_coat_female() : m.dex_coat_male()] : []),
          ].join(', ')}
        />
      </div>

      <div class="flex flex-wrap items-center justify-center gap-1.5">
        <div class="flex" role="group" aria-label={m.dex_coat()}>
          <Toggle
            pressed={!props.shiny}
            onPress={() => {
              props.onShiny(false);
            }}
          >
            {m.dex_coat_regular()}
          </Toggle>
          <Toggle
            pressed={props.shiny}
            onPress={() => {
              props.onShiny(true);
            }}
          >
            {m.catch_shiny()}
          </Toggle>
        </div>
        {/* Only where the females were drawn differently */}
        <Show when={props.hasFemale}>
          <div class="flex" role="group" aria-label={m.dex_sex()}>
            <Toggle
              pressed={!props.female}
              onPress={() => {
                props.onFemale(false);
              }}
            >
              ♂
            </Toggle>
            <Toggle
              pressed={props.female}
              onPress={() => {
                props.onFemale(true);
              }}
            >
              ♀
            </Toggle>
          </div>
        </Show>
      </div>
    </>
  );
}
