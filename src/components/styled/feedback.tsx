import { type JSX, type ParentProps, Show } from 'solid-js';

/**
 * What the game says back.
 *
 * Almost every screen ends the same way: the last thing that happened,
 * said in a sentence, kept until something else happens. It is worth
 * drawing the same way every time — a player should not have to work
 * out whether a line of text is part of the screen or an answer to
 * what they just pressed.
 */

export type BadgeTone = 'neutral' | 'leaf' | 'ember' | 'gold' | 'tide';

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'border-line bg-line-soft text-muted',
  leaf: 'border-leaf bg-leaf-soft text-leaf-dark',
  ember: 'border-ember bg-ember-soft text-ember-dark',
  gold: 'border-gold bg-gold-soft text-gold',
  tide: 'border-tide bg-tide-soft text-tide',
};

/**
 * A word about a thing, attached to it: what a lot stands at, where a
 * bid stands, whether a pokemon can fight.
 *
 * It is set to the same metrics as a button — the same padding, the
 * same text — because the two stand side by side constantly: a level
 * beside the button that raises it, a count beside the button that
 * spends it. A badge half the height of its neighbour makes a row of
 * them read as a mistake rather than as a row
 */
export function Badge(props: ParentProps & { tone?: BadgeTone; class?: string }): JSX.Element {
  return (
    <span
      class={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm font-medium
        whitespace-nowrap ${BADGE_TONES[props.tone ?? 'neutral']} ${props.class ?? ''}`}
    >
      {props.children}
    </span>
  );
}

export interface StatusProps {
  /**
   * Nothing to say draws nothing — an empty box under a form reads as
   * something having gone wrong quietly
   */
  message: string | null | undefined;
  /**
   * Whether this is the game answering or the game refusing. A refusal
   * is announced to a screen reader as one
   */
  tone?: 'status' | 'alert';
}

export function Status(props: StatusProps): JSX.Element {
  return (
    <Show when={props.message}>
      {(message) => <p role={props.tone ?? 'status'}>{message()}</p>}
    </Show>
  );
}

/**
 * The game with nothing to show: an empty bag, a board with no lots, a
 * list still loading. It is quieter than the thing it stands in for
 */
export function Note(props: ParentProps & { class?: string }): JSX.Element {
  return <p class={`text-sm text-muted ${props.class ?? ''}`}>{props.children}</p>;
}
