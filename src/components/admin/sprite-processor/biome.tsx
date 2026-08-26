import { FilePicker, Written, clearedOnSuccess, refusalOf, useToken } from './shared';
import { packBiome } from '../../../auth/sprites';
import { BIOME_NAMES } from '../../../data/biome';
import { DEFAULT_SPEEDS, DEFAULT_TERRAINS, DRAWN_ROLES } from '../../../data/constants/tileset-rip';
import Biome from '../../../data/ids/biome';
import { AUTOTILE_COUNT } from '../../../data/overworld/autotile';
import { Button, Combobox, FormActions, FormGrid, FormSection, Note, Status, TextArea, TextField } from '../../styled';
import { useSubmission } from '@solidjs/router';
import { For, type JSX, Show, createSignal } from 'solid-js';

/** How a dungeon rip is laid out when nobody says otherwise. */
const RIP = { terrains: DEFAULT_TERRAINS, speeds: DEFAULT_SPEEDS };

/** Nowhere on the map, so nothing is ever drawn standing in it. */
const NO_TILESET: number = Biome.Beyond;

/** Every biome a tileset can be filed under, by name. */
export function biomeOptions(): { value: number; label: string }[] {
  return Object.entries(BIOME_NAMES)
    .map(([id, name]) => ({ value: Number(id), label: `${name} · ${id}` }))
    .filter((entry) => entry.value !== NO_TILESET)
    .sort((one, other) => one.label.localeCompare(other.label));
}

/**
 * A dungeon tileset rip into `public/sprites/biome`.
 *
 * The sheet is uploaded whole, notes and palettes and all: where the
 * table sits and which neighbourhood each row is for are read off it.
 * What it cannot say is which column is which terrain, since that is
 * written across the top in English, so that one list is typed in
 */
export function BiomeForm(): JSX.Element {
  const token = useToken();
  const [picked, setPicked] = createSignal(false);
  const [biome, setBiome] = createSignal<number | null>(null);
  const [terrains, setTerrains] = createSignal(RIP.terrains);
  const [speeds, setSpeeds] = createSignal(RIP.speeds);
  const [draws, setDraws] = createSignal<Record<string, string>>({});
  const packing = useSubmission(packBiome);
  const [form, setForm] = createSignal<HTMLFormElement>();

  const ready = (): boolean => picked() && biome() != null && !packing.pending;

  clearedOnSuccess(
    form,
    () => packing.result,
    () => {
      setPicked(false);
      setBiome(null);
    },
  );

  return (
    <form
      ref={(element) => {
        setForm(element);
      }}
      action={packBiome}
      method="post"
      enctype="multipart/form-data"
    >
      <input type="hidden" name="token" value={token()} />
      <input type="hidden" name="biome" value={biome() ?? ''} />
      <input type="hidden" name="speeds" value={speeds()} />
      <For each={DRAWN_ROLES}>
        {(role) => <input type="hidden" name={`draws-${role}`} value={draws()[role] ?? ''} />}
      </For>
      <FormSection
        title="Biome tilesets"
        lede="A dungeon rip as it was ripped. The table is found as the largest block on the sheet,
          the tile size from the pitch its own rules repeat at, and which tile goes where from the
          3x3 squares in the legend column."
      >
        <FilePicker
          label="Rip"
          name="sheet"
          accept="image/png,image/webp"
          hint="The whole sheet, notes and palettes included."
          onPick={(files) => {
            setPicked(files.length > 0);
          }}
        />
        <FormGrid>
          <Combobox
            label="Biome"
            required
            value={biome()}
            options={biomeOptions()}
            onChange={(value) => {
              setBiome(value);
            }}
            hint="The folder is the biome's own number."
          />
          <TextField
            label="Palette speeds"
            value={speeds()}
            onChange={(value) => {
              setSpeeds(value);
            }}
            hint="Game frames a palette holds one frame for, one number per palette. The sheet
              prints them in a box of their own."
          />
        </FormGrid>
        <TextArea
          label="Terrains"
          name="terrains"
          value={terrains()}
          onChange={(value) => {
            setTerrains(value);
          }}
          hint="Columns left to right, each with the palette it cycles after a slash. A name
            starting wall, ground or water says what it is for."
          rows={3}
        />
        {/* A rip carries more grounds than a board draws with, so this
            is where two biomes packed from one sheet part company */}
        <FormGrid>
          <For each={DRAWN_ROLES}>
            {(role) => (
              <TextField
                label={`Draw ${role} with`}
                value={draws()[role] ?? ''}
                placeholder="first of that role"
                onChange={(value) => {
                  setDraws({ ...draws(), [role]: value });
                }}
                hint={`Which column is this biome's ${role}. Leave blank for the first one.`}
              />
            )}
          </For>
        </FormGrid>
        <FormActions note="Writes the atlas and the description beside it.">
          <Button type="submit" tone="primary" disabled={!ready()}>
            {packing.pending ? 'Packing…' : 'Pack'}
          </Button>
        </FormActions>
        <Status message={refusalOf(packing.error)} tone="alert" />
        <Show when={packing.result}>
          {(done) => (
            <Written
              paths={done().written}
              drawings={[done().drawing]}
              note={`${done().read.rows} rows of ${done().read.columns} tile columns at ${
                done().read.tile
              }px, ${done().read.bands} per terrain, ${done().read.cases}/${AUTOTILE_COUNT} cases,
                ${done().read.palettes} palettes${
                  done().read.stuck > 0 ? `, ${done().read.stuck} colours held still` : ''
                }.`}
            />
          )}
        </Show>
        <Show when={packing.result}>
          {(done) => (
            <Note>
              {`Drawn with ${DRAWN_ROLES.map(
                (role) => `${role}: ${done().read.draws[role] ?? 'nothing'}`,
              ).join(' · ')}`}
            </Note>
          )}
        </Show>
        <Show when={packing.result}>
          {(done) => (
            <Note>
              {done()
                .sheet.terrains.map(
                  (terrain) =>
                    `${terrain.name} (${terrain.role}): ${
                      AUTOTILE_COUNT - terrain.missing.length
                    }/${AUTOTILE_COUNT} cases`,
                )
                .join(' · ')}
            </Note>
          )}
        </Show>
      </FormSection>
    </form>
  );
}
