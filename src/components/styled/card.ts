import type { JSX } from 'solid-js';

/**
 * A card on a sheet: a soft keyline round one part of a page. It rises
 * into place as the sheet opens, and reduce motion leaves only the
 * fade. The rise fills backwards only, so a card at rest carries no
 * transform and stays no containing block for what is fixed inside it
 */
export const CARD =
  'motion-crossfade flex min-w-0 flex-col gap-2 rounded-card border-2 border-line-soft p-3' +
  ' animate-[rise-in_var(--motion-base)_var(--ease-settle)_backwards]';

/** A card's title, the label face */
export const CARD_TITLE = 'text-left text-xs font-extrabold tracking-[0.12em] text-muted uppercase';

/**
 * How long a card waits before it rises: two stagger steps for each
 * card before it, so the sheet fills from the left
 */
export function riseAfter(cards: number): JSX.CSSProperties {
  return { 'animation-delay': `calc(var(--motion-stagger) * ${cards * 2})` };
}

/**
 * A wash of a colour over the panel, for a tile or a header tinted by a
 * type. Mixed into `paper`, so it reads in both themes
 */
export function tint(colour: string, amount: number): string {
  return `color-mix(in srgb, ${colour} ${amount}%, var(--color-paper))`;
}
