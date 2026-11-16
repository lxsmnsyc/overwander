import { type JSX, Show } from 'solid-js';
import { Pill, RailCount, RailTab, RailTabs } from '../../styled';
import { formatNumber } from '../../../i18n/format';
import { m } from '../../../i18n/paraglide/messages.js';

/** What the rail filters the board to */
export const enum LotKind {
  Everything = 0,
  Items = 1,
  Pokemon = 2,
}

/** The kind a rail row's number stands for */
export function readKind(value: number): LotKind {
  if (value === 1) {
    return LotKind.Items;
  }
  return value === 2 ? LotKind.Pokemon : LotKind.Everything;
}

/** A kind's colour, as the square on its row */
const DOTS: Record<LotKind, string> = {
  [LotKind.Everything]: '#2360C8',
  [LotKind.Items]: '#36B26F',
  [LotKind.Pokemon]: '#F0584A',
};

function Dot(props: { kind: LotKind }): JSX.Element {
  return (
    <span
      aria-hidden="true"
      class="size-4 shrink-0 rounded-[5px] md:size-[22px] md:rounded-[7px]"
      style={{ background: DOTS[props.kind] }}
    />
  );
}

/**
 * The rail down the board's left: what the player holds, then
 * Everything, Items and Pokemon with how many lots each holds. The
 * kinds only narrow what is already loaded. On a phone it is a row of
 * chips across the top.
 */
export default function LotRail(props: {
  /** The purse, left out where the board is only being looked at */
  gold?: number;
  everything: number;
  items: number;
  pokemon: number;
}): JSX.Element {
  return (
    <RailTabs label={m.panel_auctions()} class="md:w-[190px]">
      <Show when={props.gold != null}>
        {(_) => (
          <div class="flex shrink-0 items-center gap-2 md:flex-col md:items-start md:gap-1.5 md:pb-3">
            <span class="hidden px-0.5 text-[11px] font-extrabold tracking-[0.12em] text-muted uppercase md:block">
              {m.auction_your_gold()}
            </span>
            <Pill tone="gold" size="large">
              {m.ui_gold({ amount: formatNumber(props.gold ?? 0) })}
            </Pill>
          </div>
        )}
      </Show>
      <RailTab value={LotKind.Everything}>
        <Dot kind={LotKind.Everything} />
        <span class="truncate">{m.auction_filter_all()}</span>
        <RailCount>{props.everything}</RailCount>
      </RailTab>
      <RailTab value={LotKind.Items}>
        <Dot kind={LotKind.Items} />
        <span class="truncate">{m.auction_items()}</span>
        <RailCount>{props.items}</RailCount>
      </RailTab>
      <RailTab value={LotKind.Pokemon}>
        <Dot kind={LotKind.Pokemon} />
        <span class="truncate">{m.auction_pokemon()}</span>
        <RailCount>{props.pokemon}</RailCount>
      </RailTab>
    </RailTabs>
  );
}
