import { type Accessor, createEffect, createSignal } from 'solid-js';

/**
 * Whether the browser has taken over: false while the page is being
 * drawn, true from the first effect onwards.
 *
 * `isServer` answers the same question and cannot be used to draw
 * with. It is a build-time constant, so it is already false during
 * hydration, and markup drawn from it does not match what the server
 * sent: the two disagree and Solid keeps whichever it finds first.
 * This one is false for the hydrating pass as well, and turns over
 * afterwards, so what is drawn from it appears rather than clashes.
 *
 * Effects run in a browser and nowhere else, which is the whole of how
 * it knows. It only ever turns on, so anything gated behind it is
 * something the server was never going to have: a canvas, a stored
 * preference, a measurement of the window.
 *
 * Belongs in a component body like any other computation, so its
 * effect has an owner to be disposed with.
 */
export default function createClientSignal(): Accessor<boolean> {
  const [client, setClient] = createSignal(false);

  createEffect(() => {
    setClient(true);
  });

  return client;
}
