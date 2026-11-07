import type { JSX } from 'solid-js';
import { getSpeciesData } from '../../../../data/species';
import type { SideUnit } from '../summary';
import { formatNumber } from '../../../../i18n/format';
import { m } from '../../../../i18n/paraglide/messages.js';
import UnitArt from './UnitArt';

/**
 * The fight's top damage dealer standing on a gold block, between the
 * two teams. The whole sentence is what a screen reader hears
 */
export default function Podium(props: {
  unit: SideUnit;
  side: string;
  delay: number;
}): JSX.Element {
  const damage = (): string => formatNumber(Math.round(props.unit.dealt));
  const name = (): string => getSpeciesData(props.unit.species).name;

  return (
    <div
      class="motion-crossfade flex shrink-0 flex-col items-center gap-1.5
        animate-[rise-in_var(--motion-move)_var(--ease-spring)_backwards]"
      style={{ 'animation-delay': `${props.delay}ms` }}
      role="img"
      aria-label={m.verdict_best({ species: name(), side: props.side, damage: damage() })}
    >
      <span class="flex size-18 items-center justify-center rounded-card border-2 border-line bg-paper">
        <UnitArt
          species={props.unit.species}
          shiny={props.unit.shiny}
          female={props.unit.female}
          fainted={false}
          size={64}
        />
      </span>
      <div
        class="flex h-[78px] w-[150px] flex-col items-center justify-center rounded-t-[14px] bg-gold
          px-2 text-center text-on-gold"
      >
        <span class="text-xs font-extrabold">{m.verdict_podium()}</span>
        <span class="max-w-full truncate font-display font-semibold">
          {m.verdict_podium_line({ species: name(), damage: damage() })}
        </span>
        <span class="max-w-full truncate text-[11px] font-bold opacity-80">{props.side}</span>
      </div>
    </div>
  );
}
