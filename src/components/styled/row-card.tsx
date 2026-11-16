import type { JSX, ParentProps } from 'solid-js';

/**
 * The row card the social panes and their lists share: a face or a
 * picture, two lines of words, a state pill and the buttons at the
 * right. On a phone the buttons drop to a line of their own.
 */

export type RowCardTone = 'plain' | 'leaf' | 'quiet' | 'ember' | 'gold';

const TONES: Record<RowCardTone, string> = {
  plain: 'border-line-soft bg-paper',
  leaf: 'border-leaf bg-leaf-soft',
  quiet: 'border-line-soft bg-parchment',
  ember: 'border-ember/50 bg-ember-soft',
  gold: 'border-gold/60 bg-gold-soft',
};

export interface RowCardProps extends ParentProps {
  tone?: RowCardTone;
  class?: string;
  /** The row's own tooltip, for a row written in shorthand */
  title?: string;
}

/** One row of a list: 52px tall at least, a soft keyline, a 14px corner */
export function RowCard(props: RowCardProps): JSX.Element {
  return (
    <li
      title={props.title}
      class={`flex min-h-[52px] min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1.5 rounded-[14px]
        border-2 px-3 py-2 text-sm ${TONES[props.tone ?? 'plain']} ${props.class ?? ''}`}
    >
      {props.children}
    </li>
  );
}

/** A name over a quieter line, taking the room the buttons leave */
export function RowText(props: {
  name: JSX.Element;
  line?: JSX.Element;
  class?: string;
}): JSX.Element {
  return (
    <div class={`flex min-w-0 grow basis-40 flex-col ${props.class ?? ''}`}>
      <span class="truncate text-sm font-extrabold">{props.name}</span>
      {props.line == null ? null : <span class="text-xs text-muted">{props.line}</span>}
    </div>
  );
}

/** The buttons of a row: at its right from `sm`, on their own line under it on a phone */
export function RowActions(props: ParentProps): JSX.Element {
  return (
    <div class="flex basis-full items-center gap-2 sm:basis-auto sm:justify-end">
      {props.children}
    </div>
  );
}

export type PillTone = 'leaf' | 'ember' | 'gold' | 'tide' | 'arcane' | 'neutral';

const PILLS: Record<PillTone, string> = {
  leaf: 'bg-leaf-soft text-leaf-dark',
  ember: 'bg-ember-soft text-ember-dark',
  gold: 'bg-gold-soft text-gold-dark',
  tide: 'bg-tide-soft text-tide-dark',
  arcane: 'bg-arcane-soft text-arcane-dark',
  neutral: 'bg-line-soft text-muted',
};

/** How tall a pill is: a row's state, a term beside a heading, a purse */
const PILL_SIZES = {
  small: 'h-[22px] px-2 text-[11px]',
  medium: 'h-7 px-2.5 text-xs',
  large: 'h-8 px-3 text-sm',
} as const;

/** The state of a row in one word: 22px, a soft fill and no edge */
export function Pill(
  props: ParentProps<{ tone?: PillTone; size?: keyof typeof PILL_SIZES; class?: string }>,
): JSX.Element {
  return (
    <span
      class={`inline-flex shrink-0 items-center rounded-full font-extrabold whitespace-nowrap ${
        PILL_SIZES[props.size ?? 'small']
      } ${PILLS[props.tone ?? 'neutral']} ${props.class ?? ''}`}
    >
      {props.children}
    </span>
  );
}

/** The label face over a group of rows: "Asked of you", "On the block" */
export function GroupLabel(props: ParentProps<{ class?: string; title?: string }>): JSX.Element {
  return (
    <h4
      title={props.title}
      class={`pt-0.5 text-left text-[11px] font-extrabold tracking-[0.12em] text-muted uppercase
        ${props.class ?? ''}`}
    >
      {props.children}
    </h4>
  );
}
