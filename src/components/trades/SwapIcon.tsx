import type { ComponentProps, JSX } from 'solid-js';

/** Two arrows passing each other: the mark between the sides of a trade */
export default function SwapIcon(props: ComponentProps<'svg'>): JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4 8h15M15 4l4 4-4 4" />
      <path d="M20 16H5M9 12l-4 4 4 4" />
    </svg>
  );
}
