import type { JSX, ParentProps } from 'solid-js';
import { InformationIcon } from '../icons';
import HoverCard, { type HoverCardPlacement } from './hover-card';

/**
 * A small info icon that explains something on hover or focus. It sits
 * beside the heading it is about, so help is there without taking room
 */
export interface HintProps extends ParentProps {
  /** The card's heading, and what the icon is called for a screen reader */
  title: string;
  /** A line under the heading, where the body needs one */
  description?: string;
  placement?: HoverCardPlacement;
}

export default function Hint(props: HintProps): JSX.Element {
  return (
    <HoverCard
      title={props.title}
      description={props.description}
      placement={props.placement ?? 'bottom'}
      class="inline-flex rounded text-muted transition-colors hover:text-ink
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tide"
      trigger={<InformationIcon class="size-5" role="img" aria-label={props.title} />}
    >
      {props.children}
    </HoverCard>
  );
}

/** A hint's body as a short list, one fact per line */
export function HintList(props: ParentProps): JSX.Element {
  return <ul class="flex list-disc flex-col gap-1 pl-4 text-xs text-muted">{props.children}</ul>;
}
