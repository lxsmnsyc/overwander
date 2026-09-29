import type { JSX } from 'solid-js';

/** One number with a short label over it, for a row of them in a card */
export default function StatTile(props: { label: string; children: JSX.Element }): JSX.Element {
  return (
    <div class="flex flex-col items-center gap-px rounded-lg bg-line-soft px-0.5 pt-1 pb-1.5">
      <span class="text-[9.5px] font-extrabold tracking-wide text-muted uppercase">
        {props.label}
      </span>
      <span class="text-sm font-extrabold text-ink tabular-nums">{props.children}</span>
    </div>
  );
}
