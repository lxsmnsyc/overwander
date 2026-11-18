import type { JSX } from '@solidjs/web';
import { type ParentProps, Show } from 'solid-js';
import { CARD, CARD_TITLE, SETTING_ROW } from '../styled';

/**
 * The furniture of a settings pane: a card of rows, a note between
 * rows, a labelled line of fact, and a row that states something and
 * has a button for it.
 */

/** A card with its title and rows close together, ruled off by the rows' own lines */
export function SettingCard(props: ParentProps<{ title?: string; loose?: boolean }>): JSX.Element {
  return (
    <section class={`${CARD} px-4 py-2 ${props.loose === true ? 'gap-2' : 'gap-0.5'}`}>
      <Show when={props.title}>{(title) => <h3 class={`${CARD_TITLE} pt-1`}>{title()}</h3>}</Show>
      {props.children}
    </section>
  );
}

/** A sentence between rows: what the rows are about */
export function SettingNote(props: ParentProps): JSX.Element {
  return <p class="max-w-140 py-2.5 text-[13px] text-muted">{props.children}</p>;
}

/** One fact with its label over it, as the about page lists them */
export function SettingLine(props: ParentProps<{ label: string }>): JSX.Element {
  return (
    <div class="flex flex-col py-1.5">
      <span class="text-[11px] font-extrabold tracking-[0.12em] text-muted uppercase">
        {props.label}
      </span>
      <span class="text-sm">{props.children}</span>
    </div>
  );
}

/** A choice set drawn as cards sits in the card like any other row */
export function SettingChoice(props: ParentProps): JSX.Element {
  return (
    <div class="flex flex-col border-b-2 border-line-soft/60 px-1 pt-2.5 pb-3 last:border-b-0">
      {props.children}
    </div>
  );
}

export interface SettingStateProps extends ParentProps {
  label: string;
  description?: string;
  /** What it is now, in a pill: On, Off */
  state?: JSX.Element;
}

/** A row that says what it is and where it stands, with its buttons at the end */
export function SettingState(props: SettingStateProps): JSX.Element {
  return (
    <div class={`flex flex-wrap ${SETTING_ROW}`}>
      <span class="flex min-w-0 grow flex-col">
        <span class="text-sm font-extrabold">{props.label}</span>
        <Show when={props.description}>
          {(said) => <span class="text-xs text-muted">{said()}</span>}
        </Show>
      </span>
      {props.state}
      <div class="flex shrink-0 items-center gap-2">{props.children}</div>
    </div>
  );
}
