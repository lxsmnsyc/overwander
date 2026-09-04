import { Show, createContext, useContext } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import type { MDXBuiltinComponents } from 'solid-marked';

/**
 * What a page of markdown is drawn with.
 *
 * The base layer already sets the headings, links and text the rest of
 * the game is written in, so most of these only add what a page of
 * prose needs on top of it: the space between blocks, and the markers
 * the game's own lists do without.
 *
 * Every construct is here rather than only the ones today's pages use.
 * A builtin that is missing draws nothing at all, so the first release
 * page to carry a table would lose it silently.
 */

/** The heading levels, so a depth picks a tag without a cast. */
const HEADINGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

/** Whether the cells being drawn are in a table's head row. */
const InHead = createContext(false);

/** Somewhere off the page, rather than a file beside this one. */
function isAway(url: string): boolean {
  return /^[a-z]+:/.test(url);
}

const MARKDOWN: MDXBuiltinComponents = {
  Root: (props) => <div class="flex flex-col gap-3">{props.children}</div>,

  Heading: (props) => (
    <Dynamic
      component={HEADINGS[props.depth - 1]}
      id={props.id}
      // Above the block it introduces rather than between two of them
      class="mt-3 first:mt-0"
    >
      {props.children}
    </Dynamic>
  ),

  Paragraph: (props) => <p class="max-w-prose">{props.children}</p>,

  Strong: (props) => <strong class="font-bold text-ink">{props.children}</strong>,
  Emphasis: (props) => <em>{props.children}</em>,
  Delete: (props) => <s class="text-muted">{props.children}</s>,

  // The game's own lists are stacks of rows and drop their markers.
  // Prose wants them back, and a marker needs a block rather than the
  // flex column the base layer sets
  List: (props) => (
    <Dynamic
      component={props.ordered === true ? 'ol' : 'ul'}
      start={props.start ?? undefined}
      class={`block max-w-prose space-y-1 pl-5 ${
        props.ordered === true ? 'list-decimal' : 'list-disc'
      }`}
    >
      {props.children}
    </Dynamic>
  ),

  ListItem: (props) => (
    <li class="marker:text-tide">
      {/* A task list says what is done and what is not, and neither is
          something to press: the page is a reading */}
      <Show when={props.checked != null}>
        <input
          type="checkbox"
          checked={props.checked === true}
          disabled
          class="mr-2 align-middle"
          aria-hidden="true"
        />
      </Show>
      {props.children}
    </li>
  ),

  // Off the page opens away from the game. Anything else is a file in
  // the repository, which the game has nowhere to send a reader, so it
  // is left as the words it was written as
  Link: (props) => (
    <Show when={isAway(props.url)} fallback={<span>{props.children}</span>}>
      <a href={props.url} title={props.title ?? undefined} target="_blank" rel="noreferrer">
        {props.children}
      </a>
    </Show>
  ),

  Image: (props) => (
    <img
      src={props.url}
      alt={props.alt ?? ''}
      title={props.title ?? undefined}
      class="rounded-panel border-2 border-line-soft"
    />
  ),

  InlineCode: (props) => (
    <code class="rounded border-2 border-line-soft bg-parchment px-1 text-[0.85em]">
      {props.children}
    </code>
  ),

  Code: (props) => (
    <pre class="overflow-x-auto rounded-panel border-2 border-line-soft bg-parchment p-3 text-xs">
      <code>{props.children}</code>
    </pre>
  ),

  Blockquote: (props) => (
    <blockquote class="max-w-prose border-l-4 border-tide pl-3 text-muted italic">
      {props.children}
    </blockquote>
  ),

  // Wide content scrolls inside its own box: a table is the one thing
  // on a page of prose that will not narrow to a phone
  Table: (props) => (
    <div class="overflow-x-auto">
      {/* The rows are wrapped rather than left loose: a browser adds
          the body itself when it parses one, and a page rendered on
          the server and picked up in the browser has to be the same
          tree both times */}
      <table class="w-full border-collapse text-left text-sm">
        <tbody>{props.children}</tbody>
      </table>
    </div>
  ),

  TableRow: (props) => (
    <InHead.Provider value={props.isHead}>
      <tr class={props.isHead ? 'border-b-2 border-line' : 'border-b-2 border-line-soft'}>
        {props.children}
      </tr>
    </InHead.Provider>
  ),

  TableCell: (props) => (
    <Dynamic
      component={useContext(InHead) ? 'th' : 'td'}
      class="px-2 py-1 align-top first:pl-0 last:pr-0"
    >
      {props.children}
    </Dynamic>
  ),

  ThematicBreak: () => <hr class="border-t-2 border-line-soft" />,
  Break: () => <br />,

  // Raw HTML is handed over as text rather than injected, so what
  // there is to do with it is show it
  HTML: (props) => <span class="text-muted">{props.children}</span>,

  // A footnote is a block at the foot of the page and a mark in the
  // text pointing at it
  FootnoteDefinition: (props) => (
    <div id={`note-${props.identifier}`} class="max-w-prose text-sm text-muted">
      {props.children}
    </div>
  ),
  FootnoteReference: (props) => (
    <sup>
      <a href={`#note-${props.identifier}`}>{props.label ?? props.identifier}</a>
    </sup>
  ),

  // A definition is the target of a reference and says nothing itself
  Definition: () => null,
  LinkReference: (props) => <span>{props.children}</span>,
  ImageReference: (props) => <span class="text-muted">{props.alt ?? ''}</span>,
};

export default MARKDOWN;
