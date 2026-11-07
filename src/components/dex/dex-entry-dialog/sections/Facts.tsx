import type { JSX, Resource } from 'solid-js';
import { EGG_HATCH_STEPS } from '../../../../model/egg';
import { type SpeciesData, getFamilyName } from '../../../../data/species';
import { failed, readable } from '../../../app/resource-reads';
import { Badge } from '../../../styled';
import { m } from '../../../../i18n/paraglide/messages.js';

/** How big it is, what the reader holds of its candy, and how long its egg walks */
export default function Facts(props: { data: SpeciesData; candy: Resource<number> }): JSX.Element {
  return (
    <div class="flex flex-wrap items-center justify-center gap-1.5">
      <Badge>{props.data.height} m</Badge>
      <Badge>{props.data.weight} kg</Badge>
      <Badge tone="gold">
        {m.battle_candy_earned({
          count: failed(props.candy) == null ? (readable(props.candy) ?? 0) : '?',
          family: getFamilyName(props.data.family),
        })}
      </Badge>
      <Badge>{m.dex_hatch_steps({ count: EGG_HATCH_STEPS })}</Badge>
    </div>
  );
}
