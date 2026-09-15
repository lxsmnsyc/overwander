import { For, type JSX, Show, createMemo, createSignal } from 'solid-js';
import { Button, Meta, Row, Select } from '../styled';
import AnimatedSprite from '../sprites/AnimatedSprite';
import type { AuraKind } from '../../canvas/auras';
import { getRegisteredSpecies, getSpeciesData } from '../../data/species';
import type { Species } from '../../data/ids/species';
import { SpriteAnim } from '../../data/ids/sprite-anims';

/** What each row stands the pokemon in: nothing, then each aura */
const STANDS: { label: string; aura: AuraKind | undefined }[] = [
  { label: 'Plain shadow', aura: undefined },
  { label: 'Shadow', aura: 'shadow' },
  { label: 'Purified', aura: 'purified' },
];

/** The sizes the game draws a pokemon at: a dialog portrait, and smaller */
const SCALES = [4, 2];

/**
 * Both auras side by side on a light panel and a dark one, since an aura
 * that only reads against one of them is the thing this page is for
 */
export default function AuraDemo(): JSX.Element {
  const [species, setSpecies] = createSignal<Species>(getRegisteredSpecies()[0]);
  const [replay, setReplay] = createSignal(0);

  const pokemon = createMemo(() => {
    const options: { value: Species; label: string }[] = [];

    for (const entry of getRegisteredSpecies()) {
      options.push({ value: entry, label: getSpeciesData(entry).name });
    }
    return options.sort((left, right) => left.label.localeCompare(right.label));
  });

  const panel = (dark: boolean): JSX.Element => (
    <div class={dark ? 'dark' : ''}>
      <div class="flex flex-col gap-4 rounded-panel border-4 border-tide bg-paper p-4 text-ink">
        <span class="font-bold">{dark ? 'Dark' : 'Light'}</span>
        <For each={SCALES}>
          {(scale) => (
            <div class="flex flex-wrap items-end justify-around gap-6">
              <For each={STANDS}>
                {(stand) => (
                  <div class="flex flex-col items-center gap-2">
                    <AnimatedSprite
                      species={species()}
                      aura={stand.aura}
                      animation={SpriteAnim.Idle}
                      direction="DownLeft"
                      scale={scale}
                      shadow
                      label=""
                    />
                    <span class="text-sm text-muted">{stand.label}</span>
                  </div>
                )}
              </For>
            </div>
          )}
        </For>
        <div class="flex flex-wrap items-end justify-around gap-6">
          <For each={SCALES}>
            {(scale) => (
              <div class="flex flex-col items-center gap-2">
                {/* Keyed on the replay count, so each press mounts a
                    fresh sprite and the sparkle runs again */}
                <Show when={`${species()}:${replay()}`} keyed>
                  <AnimatedSprite
                    species={species()}
                    shiny
                    sparkle
                    animation={SpriteAnim.Idle}
                    direction="DownLeft"
                    scale={scale}
                    shadow
                    label=""
                  />
                </Show>
                <span class="text-sm text-muted">Shiny sparkle</span>
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );

  return (
    <div class="flex flex-col gap-4 p-4">
      <h1 class="text-2xl">Auras</h1>
      <Meta>
        A shadow pokemon's storm cloud and a purified one's light, through the same painter the
        dialogs and the battle use, on both themes at once.
      </Meta>
      <Row>
        <Select
          label="Pokemon"
          class="w-56"
          value={species()}
          options={pokemon()}
          onChange={(chosen) => {
            setSpecies(chosen);
          }}
        />
        <Button
          onClick={() => {
            setReplay((count) => count + 1);
          }}
        >
          Replay sparkle
        </Button>
      </Row>
      <div class="grid gap-4 lg:grid-cols-2">
        {panel(false)}
        {panel(true)}
      </div>
    </div>
  );
}
