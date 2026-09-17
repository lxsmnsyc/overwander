import { type JSX, type ParentProps, children } from 'solid-js';

/**
 * The things the game is written on.
 *
 * A tab is a page: a title, a sentence saying what the page is for,
 * and a stack of blocks under it. A dialog is the same page shrunk
 * onto a panel. Both are built out of these, so a list of catches
 * looks the same whether it is being browsed or being picked from.
 */

export interface PanelProps extends ParentProps {
  title?: string;
  /**
   * A sentence under the title saying what this is and what it costs.
   * The game explains its own rules where they apply rather than in a
   * manual nobody opens
   */
  lede?: string;
  class?: string;
}

/**
 * A page of the game: what a tab renders into
 */
export function Panel(props: PanelProps): JSX.Element {
  return (
    <section class={`flex flex-col gap-4 ${props.class ?? ''}`}>
      {props.title == null ? null : (
        <header class="flex flex-col gap-1">
          <h2>{props.title}</h2>
          {props.lede == null ? null : <p class="max-w-prose text-sm text-muted">{props.lede}</p>}
        </header>
      )}
      {props.children}
    </section>
  );
}

export interface CardProps extends ParentProps {
  title?: string;
  /** Something to press, standing opposite the title */
  aside?: JSX.Element;
  class?: string;
}

/**
 * A block within a page — the bag, the board, the sell form. It is
 * drawn as paper on parchment so the eye can tell one from the next
 * without a rule between them
 */
export function Card(props: CardProps): JSX.Element {
  // Resolved once: a JSX prop is a getter, and each read builds it again
  const aside = children(() => props.aside);

  return (
    <section
      class={`flex flex-col gap-2 rounded-panel border-2 border-line bg-paper p-3 shadow-pop
        sm:p-4 ${props.class ?? ''}`}
    >
      {props.title == null ? null : (
        <div class="flex items-center justify-between gap-2">
          <h3>{props.title}</h3>
          {aside()}
        </div>
      )}
      {props.children}
    </section>
  );
}

/**
 * The line between two things standing side by side.
 *
 * A row of facts — what kind of pokemon, what it fights as, how big
 * it is, which gender — reads as one long phrase without something
 * between them, and a middle dot is easy to miss at the size these
 * are set in. It is hidden from a screen reader, which hears the
 * facts as separate elements already
 */
export function Divider(): JSX.Element {
  return <span aria-hidden="true" class="h-4 w-px shrink-0 bg-line" />;
}

/**
 * A row of things to press, laid out so it wraps rather than runs off
 * a narrow screen
 */
export function Row(props: ParentProps & { class?: string }): JSX.Element {
  return (
    <div class={`flex flex-wrap items-center gap-2 ${props.class ?? ''}`}>{props.children}</div>
  );
}
