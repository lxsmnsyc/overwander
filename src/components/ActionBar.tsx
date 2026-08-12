import { For, type JSX } from 'solid-js';
import { GameDialog, useGame } from './game-context';

/**
 * The one piece of furniture the game has.
 *
 * Everything that is not the world lives behind these four: the
 * player's own things, the world map, the raid lobbies and the
 * auction board. It floats over the world rather than sitting above
 * it in the page, because the world is the page — a bar with a row of
 * its own would take a strip of map away from every screen to say
 * four words that are always the same.
 */

interface BarAction {
  dialog: GameDialog;
  label: string;
}

const ACTIONS: BarAction[] = [
  { dialog: GameDialog.Profile, label: 'Profile' },
  { dialog: GameDialog.Map, label: 'Map' },
  { dialog: GameDialog.Raids, label: 'Raids' },
  { dialog: GameDialog.Auctions, label: 'Auctions' },
];

const BUTTON =
  'cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium text-ink transition-colors' +
  ' hover:bg-parchment focus-visible:outline-2 focus-visible:outline-offset-2' +
  ' focus-visible:outline-leaf';

export default function ActionBar(): JSX.Element {
  const game = useGame();

  return (
    <nav
      aria-label="Game"
      // Held to the bottom of the window and centred on it, above the
      // map and below anything opened over the map
      class="pointer-events-none fixed inset-x-0 bottom-4 z-10 flex justify-center px-4"
    >
      <div
        class="pointer-events-auto flex flex-wrap items-center justify-center gap-1 rounded-full
          border border-line bg-paper/95 p-1 shadow-lg shadow-ink/20 backdrop-blur-sm"
      >
        <For each={ACTIONS}>
          {(action) => (
            <button
              type="button"
              class={BUTTON}
              onClick={() => {
                game.setDialog(action.dialog);
              }}
            >
              {action.label}
            </button>
          )}
        </For>
      </div>
    </nav>
  );
}
