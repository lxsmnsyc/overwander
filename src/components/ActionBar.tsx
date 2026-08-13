import { For, type JSX, Show } from 'solid-js';
import { GameDialog, useGame } from './game-context';
import { ThemeToggle } from './theme';

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
  'cursor-pointer rounded-full border-0 bg-transparent px-4 py-1.5 text-sm font-bold text-ink' +
  ' shadow-none transition-colors hover:border-0 hover:bg-tide hover:text-on-accent' +
  ' active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2' +
  ' focus-visible:outline-tide';

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
          border-2 border-tide bg-paper/95 p-1 shadow-pop backdrop-blur-sm"
      >
        {/* Where the player is standing, first on the bar and before
            anything to press. It was painted into the corner of the
            board, on top of four cells of a world the player is trying
            to read; here it costs nothing and stands with the rest of
            the furniture. Nothing to press, so it is set apart from
            the buttons by a rule rather than by being one */}
        <Show when={game.place()}>
          {(place) => (
            <>
              <span class="px-3 py-1.5 text-sm text-muted whitespace-nowrap">{place()}</span>
              <span aria-hidden="true" class="h-5 w-px shrink-0 bg-line" />
            </>
          )}
        </Show>
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
        {/* Day or night, last on the bar and set apart from the four
            that open something: it changes how the game looks rather
            than what is on the screen */}
        <span aria-hidden="true" class="h-5 w-px shrink-0 bg-line" />
        <ThemeToggle class={`${BUTTON} px-3`} />
      </div>
    </nav>
  );
}
