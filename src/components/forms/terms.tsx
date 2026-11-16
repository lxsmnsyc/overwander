import { For, type JSX, Show } from 'solid-js';
import { getCatchName, isShiny } from '../../model/caught-record';
import { Genders } from '../../data/ids/species';
import type { Items } from '../../data/ids/items';
import { getItemData } from '../../data/items';
import CatchPicker, { type CatchOption } from '../catches/catch-picker';
import ItemSprite from '../items/ItemSprite';
import AnimatedSprite from '../sprites/AnimatedSprite';
import { Button, ListRow, Meta, Pill } from '../styled';
import { formatNumber } from '../../i18n/format';
import { m } from '../../i18n/paraglide/messages.js';

/**
 * The furniture every counter shares, so each reads the same: what it
 * costs and how often, what is picked, and what is left once it is spent
 */

/** What a counter charges: gold, or some of an item (one unless it says) */
export type CounterCost = { gold: number } | { item: Items; amount?: number };

/** The price written out: gold, or the item, how many, and its name */
function costChip(cost: CounterCost): JSX.Element {
  if ('gold' in cost) {
    return m.ui_gold({ amount: formatNumber(cost.gold) });
  }
  return (
    <>
      <ItemSprite item={cost.item} size={16} label="" />
      {m.terms_item_cost({ count: cost.amount ?? 1, item: getItemData(cost.item).name })}
    </>
  );
}

/**
 * The price as a white pill, for the button that pays it: it stands on
 * the button's fill so the cost reads without leaving the button
 */
export function CostBadge(props: { cost: CounterCost }): JSX.Element {
  return (
    <span
      class="inline-flex h-[22px] items-center gap-1 rounded-full bg-paper px-2 text-[11px]
        font-extrabold whitespace-nowrap text-gold-dark"
    >
      {'gold' in props.cost ? (
        m.ui_gold({ amount: formatNumber(props.cost.gold) })
      ) : (
        <>
          <ItemSprite item={props.cost.item} size={16} label="" />
          {props.cost.amount ?? 1}
        </>
      )}
    </span>
  );
}

export interface CounterTermsProps {
  /** Left out for a counter that charges nothing, or prices each option */
  cost?: CounterCost;
  /** What the player holds of what is charged */
  have?: { amount: number; short: boolean; unit: string };
  /** Anything else a player reads before pressing: levels, stakes */
  rows?: { label: string; value: JSX.Element; tone?: 'leaf' | 'ember' | 'gold' | 'tide' }[];
  /** How often the counter serves, or that it already has this while */
  often?: string;
  /** Anything else that stands at the end of the row, such as a button to change the terms */
  children?: JSX.Element;
}

/**
 * Always the first thing in a counter, as a row of chips: the price,
 * what the player carries, and anything else read before pressing
 */
export function CounterTerms(props: CounterTermsProps): JSX.Element {
  return (
    <div class="flex flex-wrap gap-1.5">
      <Show when={props.cost}>
        {(cost) => (
          <Pill size="medium" tone="gold" class="gap-1.5">
            {costChip(cost())}
          </Pill>
        )}
      </Show>
      <Show when={props.have}>
        {(have) => (
          <Pill size="medium" tone={have().short ? 'ember' : 'plain'} class="gap-1.5">
            {m.terms_you_carry({ amount: formatNumber(have().amount), unit: have().unit })}
          </Pill>
        )}
      </Show>
      <For each={props.rows ?? []}>
        {(row) => (
          <Pill size="medium" tone={row.tone ?? 'plain'} class="gap-1.5">
            <span class="font-bold text-muted">{row.label}</span>
            {row.value}
          </Pill>
        )}
      </For>
      <Show when={props.often}>
        {(often) => (
          <Pill size="medium" tone="plain" class="gap-1.5">
            {often()}
          </Pill>
        )}
      </Show>
      {props.children}
    </div>
  );
}

/** The person or the place, drawn small enough for the face on a dialog's nameplate */
export function HeadingPortrait(props: { children: JSX.Element }): JSX.Element {
  return <span class="flex size-7 items-end justify-center">{props.children}</span>;
}

/**
 * A line in the dock between the way out and the action: what happens
 * next, or how far the picking has got. Handed to `DialogActions`'s `note`
 */
export function DockNote(props: { children: JSX.Element }): JSX.Element {
  return <span class="text-[13px] text-muted">{props.children}</span>;
}

/** The label over a counter's picker */
export function CounterStep(props: { children: JSX.Element }): JSX.Element {
  return (
    <span class="text-xs font-extrabold tracking-[0.12em] text-muted uppercase">
      {props.children}
    </span>
  );
}

/**
 * The pokemon picked, standing in for the picker until it is paid for
 * or changed: the press that spends is the button at the foot
 */
export function PickedRow(props: {
  option: CatchOption;
  /** What the counter would do to it, such as "Friendship 70 → 170" */
  detail?: string;
  busy?: boolean;
  onChange: () => void;
}): JSX.Element {
  return (
    <ListRow class="min-h-[52px] flex-nowrap rounded-card" selected>
      <span class="flex size-12 shrink-0 items-center justify-center">
        <AnimatedSprite
          species={props.option.caught.species}
          shiny={isShiny(props.option.caught)}
          female={props.option.caught.gender === Genders.Female}
          direction="DownLeft"
          still
          fill
          label=""
        />
      </span>
      <span class="flex min-w-0 grow flex-col text-left">
        <span class="truncate font-semibold">
          {m.ui_level_name({
            level: props.option.caught.level,
            name: getCatchName(props.option.caught),
          })}
        </span>
        <Show when={props.detail}>{(said) => <Meta class="truncate">{said()}</Meta>}</Show>
      </span>
      <Button disabled={props.busy} onClick={props.onChange}>
        {m.ui_change()}
      </Button>
    </ListRow>
  );
}

/** What stands in for a counter once it has done its one thing this while */
export function CounterSpent(props: {
  says: string;
  /** The headline, for a spent state that is not this while's */
  title?: string;
  /** Whether `says` is somebody speaking, which is written as a quote */
  quoted?: boolean;
}): JSX.Element {
  return (
    <div
      class="flex flex-col gap-1 rounded-card border-2 border-dashed border-line bg-line-soft/50
        px-3 py-3.5 text-center"
    >
      <span class="text-sm font-extrabold">{props.title ?? m.terms_spent_title()}</span>
      <span class={`text-xs text-muted ${props.quoted === false ? '' : 'italic'}`}>
        {props.quoted === false ? props.says : m.ui_quoted({ text: props.says })}
      </span>
    </div>
  );
}

export interface PickOneProps {
  options: CatchOption[];
  picked: string | null;
  onPick: (id: string | null) => void;
  verb: string;
  empty: string;
  filter: (option: CatchOption) => boolean;
  note?: (option: CatchOption) => string | null;
  reason?: (option: CatchOption) => string | null;
  /** What the counter would do to the picked one, under its name */
  detail?: (option: CatchOption) => string;
  busy?: boolean;
  disabled?: boolean;
}

/**
 * One pokemon picked out of the box, then held in a row until the
 * button at the foot pays for it or Change puts the box back
 */
export function PickOne(props: PickOneProps): JSX.Element {
  const chosen = (): CatchOption | null => {
    for (const option of props.options) {
      if (option.id === props.picked) {
        return option;
      }
    }
    return null;
  };

  return (
    <Show
      when={chosen()}
      fallback={
        <>
          <CounterStep>{m.terms_choose_pokemon()}</CounterStep>
          <CatchPicker
            fill
            inline
            disabled={props.disabled}
            options={props.options}
            value={null}
            verb={props.verb}
            empty={props.empty}
            filter={props.filter}
            note={props.note}
            reason={props.reason}
            onPick={props.onPick}
          />
        </>
      }
    >
      {(option) => (
        <PickedRow
          option={option()}
          detail={props.detail?.(option())}
          busy={props.busy}
          onChange={() => {
            props.onPick(null);
          }}
        />
      )}
    </Show>
  );
}
