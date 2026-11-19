import { For, Loading, Show, createMemo } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { listMySprites } from '../../auth/achievements';
import { getCharsetName } from '../../data/overworld/charsets';
import TrainerSprite from '../sprites/TrainerSprite';
import { Note, createPager, spellAria } from '../styled';
import { m } from '../../i18n/paraglide/messages.js';

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

/** How many fit a page: eight across, two down. */
const PAGE = 16;

/** How tall one character is drawn in the shelf, in pixels. */
const SQUARE = 36;

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
    <Show when={props.earned().length > 0} fallback={<Note>{m.profile_sprite_none()}</Note>}>
      <div class="flex flex-col gap-2">
        <div class="grid grid-cols-4 gap-1.5 rounded-card border-4 border-tide bg-parchment p-2 sm:grid-cols-8">
          <For each={pager.shown()}>
            {(sheet) => (
              <button
                type="button"
                disabled={props.disabled}
                aria-pressed={spellAria(sheet === props.value)}
                title={getCharsetName(sheet)}
                class={`flex h-[54px] items-end justify-center rounded-button border-2 p-1
                  transition-[translate,border-color] duration-(--motion-quick) ease-spring
                  hover:-translate-y-0.5 hover:border-tide ${
                    sheet === props.value
                      ? 'border-leaf bg-leaf-soft ring-3 ring-leaf/20'
                      : 'border-line bg-paper'
                  }`}
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
  const earned = createMemo(async () => listMySprites());

  return (
    <div class="flex flex-col gap-1">
      <span class="text-[11px] font-extrabold tracking-[0.12em] text-muted uppercase">
        {m.profile_character()}
      </span>
      <Loading fallback={<Note>{m.profile_sprite_reading()}</Note>}>
        <Shelf
          value={props.value}
          disabled={props.disabled}
          earned={earned}
          onChange={props.onChange}
        />
      </Loading>
      <span class="text-xs text-muted">{m.profile_sprite_note()}</span>
    </div>
  );
}
