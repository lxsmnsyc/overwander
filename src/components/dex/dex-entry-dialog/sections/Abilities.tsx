import { For, type JSX, Show } from 'solid-js';
import { Items } from '../../../../data/ids/items';
import type { Species } from '../../../../data/ids/species';
import type { SpeciesData } from '../../../../data/species';
import { getSpeciesSignature } from '../../../../data/abilities';
import type AbilityId from '../../../../data/ids/abilities';
import { describeAbility, describeItem, detailAbility } from '../../../details';
import { CARD, CARD_TITLE, Hint, HintList, TooltipHost, riseAfter } from '../../../styled';
import { m } from '../../../../i18n/paraglide/messages.js';

/** How each kind of ability is drawn: plain, hidden in tide, a signature in gold */
const PILLS = {
  born: 'border-line bg-paper text-ink',
  hidden: 'border-tide/40 bg-tide-soft text-tide-dark',
  signature: 'border-gold/40 bg-gold-soft text-gold-dark',
};

/** One ability as a pill, its card on the tooltip */
function Pill(props: { ability: AbilityId; kind: keyof typeof PILLS; said: string }): JSX.Element {
  return (
    <li>
      <TooltipHost class="block" kind="ability" {...detailAbility(props.ability)}>
        <span
          class={`flex min-h-[30px] items-center rounded-full border-2 px-3 py-0.5 text-[11px]
            font-extrabold ${PILLS[props.kind]}`}
        >
          {props.said}
        </span>
      </TooltipHost>
    </li>
  );
}

/** The abilities it is born with, its hidden ones, and its signature */
export default function Abilities(props: { species: Species; data: SpeciesData }): JSX.Element {
  return (
    <section class={CARD} style={riseAfter(3)}>
      <span class="flex items-center gap-1.5">
        <h3 class={CARD_TITLE}>{m.catch_abilities()}</h3>
        <Hint title={m.catch_abilities_help()}>
          <HintList>
            <li>{m.dex_abilities_help_born()}</li>
            <li>{m.dex_abilities_help_hidden()}</li>
            <li>{m.dex_abilities_help_signature({ patch: describeItem(Items.AbilityPatch) })}</li>
            <li>{m.dex_abilities_help_more({ capsule: describeItem(Items.AbilityCapsule) })}</li>
          </HintList>
        </Hint>
      </span>
      <ul class="m-0 grid list-none grid-cols-2 gap-1.5 p-0">
        <For each={props.data.abilities}>
          {(ability) => <Pill ability={ability} kind="born" said={describeAbility(ability)} />}
        </For>
        <For each={props.data.hiddenAbilities}>
          {(hidden) => (
            <Pill
              ability={hidden}
              kind="hidden"
              said={m.dex_ability_hidden({ name: describeAbility(hidden) })}
            />
          )}
        </For>
        <Show when={getSpeciesSignature(props.species)}>
          {(signature) => (
            <Pill
              ability={signature()}
              kind="signature"
              said={m.dex_ability_signature({ name: describeAbility(signature()) })}
            />
          )}
        </Show>
      </ul>
    </section>
  );
}
