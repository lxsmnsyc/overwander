import { For, type JSX, Show } from 'solid-js';
import { Items } from '../../../../data/ids/items';
import type { Species } from '../../../../data/ids/species';
import type { SpeciesData } from '../../../../data/species';
import { getSpeciesSignature } from '../../../../data/abilities';
import { describeAbility, describeItem, detailAbility } from '../../../details';
import { Badge, DialogSection, Hint, HintList, TooltipHost } from '../../../styled';
import { m } from '../../../../i18n/paraglide/messages.js';

/** The abilities it is born with, its hidden ones, and its signature */
export default function Abilities(props: { species: Species; data: SpeciesData }): JSX.Element {
  return (
    <DialogSection
      title={m.catch_abilities()}
      hint={
        <Hint title={m.catch_abilities_help()}>
          <HintList>
            <li>{m.dex_abilities_help_born()}</li>
            <li>{m.dex_abilities_help_hidden()}</li>
            <li>{m.dex_abilities_help_signature({ patch: describeItem(Items.AbilityPatch) })}</li>
            <li>{m.dex_abilities_help_more({ capsule: describeItem(Items.AbilityCapsule) })}</li>
          </HintList>
        </Hint>
      }
    >
      <ul class="m-0 grid list-none grid-cols-2 gap-1 p-0">
        <For each={props.data.abilities}>
          {(ability) => (
            <li>
              <TooltipHost class="block" kind="ability" {...detailAbility(ability)}>
                <Badge class="w-full justify-center" wrap>
                  {describeAbility(ability)}
                </Badge>
              </TooltipHost>
            </li>
          )}
        </For>
        <For each={props.data.hiddenAbilities}>
          {(hidden) => (
            <li>
              <TooltipHost class="block" kind="ability" {...detailAbility(hidden)}>
                <Badge tone="tide" class="w-full justify-center" wrap>
                  {describeAbility(hidden)}
                </Badge>
              </TooltipHost>
            </li>
          )}
        </For>
        <Show when={getSpeciesSignature(props.species)}>
          {(signature) => (
            <li>
              <TooltipHost class="block" kind="ability" {...detailAbility(signature())}>
                <Badge tone="gold" class="w-full justify-center" wrap>
                  {describeAbility(signature())}
                </Badge>
              </TooltipHost>
            </li>
          )}
        </Show>
      </ul>
    </DialogSection>
  );
}
