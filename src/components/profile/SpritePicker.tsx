import { For, type JSX, Show, Suspense, createResource } from 'solid-js';
import { listMySprites } from '../../auth/achievements';
import { getCharsetName } from '../../data/overworld/charsets';
import TrainerSprite from '../sprites/TrainerSprite';
import { Note, createPager } from '../styled';

/**
 * Which character a trainer goes about as, chosen from the ones they
 * have earned.
 *
 * Shown as the characters themselves rather than as a list of names:
 * a player picking a look is looking, and "Brock (LGPE)" is not a
 * picture of Brock. What has not been earned is not drawn at all,
 * since the shelf is the same list the save is checked against and a
 * locked square is an offer the server would refuse.
 */

/** How many fit a page: six across, three down. */
const PAGE = 18;

/** How tall one character is drawn in the shelf, in pixels. */
const SQUARE = 44;

export interface SpritePickerProps {
  /** The sheet worn now */
  value: string;
  onChange: (sheet: string) => void;
  disabled?: boolean;
}

/**
 * The shelf itself, which reads the list. The resource is declared by
 * the picker and read here, so nothing suspends the dialog around it
 */
function Shelf(props: SpritePickerProps & { earned: () => string[] }): JSX.Element {
  const pager = createPager(() => props.earned(), PAGE);

  return (
    <Show
      when={props.earned().length > 0}
      fallback={<Note>Nothing to choose from yet. Beat a gym or a trainer class.</Note>}
    >
      <div class="flex flex-col gap-2">
        <div class="grid grid-cols-6 gap-1.5">
          <For each={pager.shown()}>
            {(sheet) => (
              <button
                type="button"
                disabled={props.disabled}
                aria-pressed={sheet === props.value}
                title={getCharsetName(sheet)}
                class={`flex items-end justify-center rounded-xl border-2 p-1
                  ${sheet === props.value ? 'border-tide bg-tide-soft' : 'border-line bg-paper'}`}
                onClick={() => {
                  props.onChange(sheet);
                }}
              >
                <TrainerSprite sheet={sheet} size={SQUARE} label={getCharsetName(sheet)} />
              </button>
            )}
          </For>
        </div>
        {pager.controls()}
      </div>
    </Show>
  );
}

export default function SpritePicker(props: SpritePickerProps): JSX.Element {
  const [earned] = createResource(async () => listMySprites());

  return (
    <div class="flex flex-col gap-1">
      <span class="text-sm font-bold">Character</span>
      <Suspense fallback={<Note>Reading what you have earned…</Note>}>
        <Shelf
          value={props.value}
          disabled={props.disabled}
          earned={() => earned() ?? []}
          onChange={props.onChange}
        />
      </Suspense>
      <span class="text-xs text-muted">
        Earned from badges, the Elite Four, and the trainer classes you have beaten. This is who you
        walk the world as.
      </span>
    </div>
  );
}
