import type { JSX } from '@solidjs/web';
import { type Accessor, Show, createMemo, createSignal } from 'solid-js';

/**
 * Where the shutter is: put away, closing over the world, or opening on
 * the field
 */
export type ShutterPhase = 'idle' | 'closing' | 'opening';

/** What `createBattleShutter` hands back to the page that swaps scenes */
export interface BattleShutterState<T> {
  /** The battle to draw, held back while the shutter closes over the world */
  shown: Accessor<T | null>;
  phase: Accessor<ShutterPhase>;
  /** Called once the halves have met: the field goes in behind them */
  close: () => void;
  /** Called once the halves have left the screen */
  open: () => void;
}

/**
 * Holds a battle back while the shutter closes over the world, so the
 * player sees the world shut before the field opens.
 *
 * A battle already running when the page loads is shown at once, and
 * leaving a battle goes straight back to the world: the shutter only
 * plays on the way in, as the Motion board in docs/design/field-kit draws it
 */
export function createBattleShutter<T>(battle: Accessor<T | null>): BattleShutterState<T> {
  const fighting = createMemo(() => battle() != null);

  // Derived rather than set from an effect, so the battle is held back in
  // the same flush that starts it. The first read is the page loading:
  // a reload in the middle of a fight shows it at once. After that a
  // battle starting closes the shutter, and anything else keeps the
  // phase the handlers last wrote
  const [phase, setPhase] = createSignal<ShutterPhase>((was) => {
    const isFighting = fighting();
    if (was == null) {
      return 'idle';
    }
    if (isFighting && was === 'idle') {
      return 'closing';
    }
    return was;
  });
  const shown = createMemo(() => (phase() === 'closing' ? null : battle()));

  return {
    shown,
    phase,
    close: () => {
      setPhase('opening');
    },
    open: () => {
      setPhase('idle');
    },
  };
}

interface BattleShutterProps {
  phase: ShutterPhase;
  onClosed: () => void;
  onOpened: () => void;
}

/**
 * The shutter itself: two halves that close over the screen like a ball
 * snapping shut, hold a beat on the button, then open on the field.
 *
 * Its timing is the CSS animations', so reduce motion (a 120ms fade
 * with nothing travelling) needs nothing of its own here. While it is on
 * screen it takes every press, so nothing is pressed on a world that is
 * going away
 */
export default function BattleShutter(props: BattleShutterProps): JSX.Element {
  function isClosing(): boolean {
    return props.phase === 'closing';
  }

  return (
    <Show when={props.phase !== 'idle'}>
      <div
        aria-hidden="true"
        class="pointer-events-auto fixed inset-0 z-[80] overflow-hidden"
        onAnimationEnd={(event) => {
          // The shutter is shut once the button has landed, last of the
          // four, and open once the halves have left the screen
          if (event.animationName === 'shutter-knob-in') {
            props.onClosed();
          } else if (event.animationName === 'shutter-top-out') {
            props.onOpened();
          }
        }}
      >
        <div
          class={`motion-crossfade absolute inset-x-0 top-0 h-1/2 bg-ember ${
            isClosing()
              ? 'animate-[shutter-top-in_var(--motion-scene)_var(--ease-exit)_both]'
              : 'animate-[shutter-top-out_var(--motion-scene)_var(--ease-spring)_var(--motion-move)_both]'
          }`}
        />
        <div
          class={`motion-crossfade absolute inset-x-0 bottom-0 h-1/2 bg-white ${
            isClosing()
              ? 'animate-[shutter-bottom-in_var(--motion-scene)_var(--ease-exit)_both]'
              : 'animate-[shutter-bottom-out_var(--motion-scene)_var(--ease-spring)_var(--motion-move)_both]'
          }`}
        />
        <div
          class={`motion-crossfade absolute inset-x-0 top-1/2 h-4 -translate-y-1/2 bg-shade ${
            isClosing()
              ? 'animate-[shutter-band-in_var(--motion-quick)_var(--ease-settle)_calc(var(--motion-scene)_-_var(--motion-quick))_both]'
              : 'animate-[shutter-band-out_var(--motion-quick)_var(--ease-exit)_var(--motion-move)_both]'
          }`}
        />
        <div class="absolute top-1/2 left-1/2 -translate-1/2">
          <div
            class={`motion-crossfade size-20 rounded-full border-8 border-shade bg-white ${
              isClosing()
                ? 'animate-[shutter-knob-in_var(--motion-base)_var(--ease-spring)_calc(var(--motion-scene)_-_var(--motion-tap))_both]'
                : 'animate-[shutter-knob-out_var(--motion-quick)_var(--ease-exit)_var(--motion-move)_both]'
            }`}
          />
        </div>
      </div>
    </Show>
  );
}
