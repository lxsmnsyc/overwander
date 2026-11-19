import type { JSX } from '@solidjs/web';
import type { ParentProps } from 'solid-js';

/**
 * The band under a dialog's nameplate that says who or what the dialog
 * is about: a stage with a person or a landmark standing on it, and the
 * line they say (or the line about the place) in a bubble beside it.
 *
 * The band is washed in the colour of the place, so a Rocket stop, a
 * Factory, a portal, a gym seat, a honey tree and a nest each read as
 * themselves before a word is read. It is handed to `Dialog`'s `hero`
 * prop, which lets it reach the sheet's edges and start under the
 * nameplate; the dialog's description is still announced to a screen
 * reader and is drawn here as the bubble.
 */
export type HeroTone = 'ember' | 'gold' | 'arcane' | 'tide' | 'leaf';

/** How a tone washes the band, from the top down into the sheet's white */
const WASH: Record<HeroTone, string> = {
  ember: 'from-ember-soft',
  gold: 'from-gold-soft',
  arcane: 'from-arcane-soft',
  tide: 'from-tide-soft',
  leaf: 'from-leaf-soft',
};

/** How large the stage is: a counter's, or the smaller one a conversation has */
const STAGES = {
  counter: 'size-[76px]',
  talk: 'size-16',
} as const;

export interface HeroBandProps extends ParentProps {
  tone: HeroTone;
  /** What stands on the stage: a sprite sized to fit it */
  stage: JSX.Element;
  /** 76px for a counter, 64px for a conversation */
  size?: keyof typeof STAGES;
  class?: string;
}

export default function HeroBand(props: HeroBandProps): JSX.Element {
  return (
    <div
      class={`flex flex-col items-center gap-3 border-b-2 border-line-soft bg-linear-to-b px-4
        pt-7 pb-4 sm:flex-row sm:gap-4 sm:px-5 ${WASH[props.tone]} to-paper ${props.class ?? ''}`}
    >
      <div
        class={`flex shrink-0 items-end justify-center rounded-[22px] border-2 border-line-soft
          bg-paper pb-1.5 shadow-[inset_0_-10px_0_0_rgb(20_32_58/0.06)] ${STAGES[props.size ?? 'counter']}`}
      >
        {props.stage}
      </div>
      <div
        class="min-w-0 grow rounded-card border-2 border-line-soft bg-paper px-4 py-3 text-base
          text-ink italic"
      >
        {props.children}
      </div>
    </div>
  );
}
