import { type JSX, createSignal, onCleanup, onMount } from 'solid-js';
import { Badge, Note, Row, Select } from '../styled';
import type Biome from '../../data/ids/biome';
import BiomeId from '../../data/ids/biome';
import { BIOME_NAMES } from '../../data/biome';
import Decoration from '../../data/overworld/decoration';
import Weather, { WEATHER_NAMES } from '../../data/overworld/weather';
import ChunkCanvas from '../overworld/chunk-canvas';
import type { SpawnCoat } from '../overworld/chunk-canvas/scenery';
import { CHUNK_CELLS } from '../../overworld/chunk';
import { getRegisteredSpecies } from '../../data/species';
import { viewFor } from '../../canvas/board';

/**
 * The board on its own, at whatever shape of screen you like.
 *
 * The chunk is drawn two ways: laid back under the camera where there
 * is room across the screen, and flat from straight above where there
 * is not. Which one the game picks is decided by the shape of the
 * window, so seeing both in the real game means resizing it and
 * walking somewhere interesting in each. This stands the same board in
 * a frame of any shape instead.
 *
 * The other thing to look at here is what happens when the player
 * walks behind a tree: whatever covers them fades out of the way and
 * comes back as they step out. The trees are placed in a line for
 * that, with room to walk in front of and behind them.
 */

/** The frames the board can be stood in, and what each is meant to be */
const FRAMES = [
  { label: 'Phone, upright', width: 390, height: 720 },
  { label: 'Phone, on its side', width: 720, height: 390 },
  { label: 'Tablet, upright', width: 560, height: 760 },
  { label: 'Desktop', width: 960, height: 560 },
] as const;

/** Where the scenery stands: a row of trees to walk behind */
const DECORATIONS = new Map<number, Decoration>([
  [5 * CHUNK_CELLS + 5, Decoration.Tree],
  [5 * CHUNK_CELLS + 7, Decoration.Tree],
  [5 * CHUNK_CELLS + 9, Decoration.Pine],
  [8 * CHUNK_CELLS + 6, Decoration.Rock],
  [8 * CHUNK_CELLS + 10, Decoration.Shrub],
  [11 * CHUNK_CELLS + 8, Decoration.Tree],
]);

/** Nothing to draw, but the board asks for all of them */
const NOTHING_MAPPED = new Map<number, never>();
const NOTHING_SET = new Set<number>();

/** How far the player's lamp reaches, in cells */
const LAMP = 3;

/** Where they start: two rows behind the line of trees */
const START = 7 * CHUNK_CELLS + 7;

/**
 * A few pokemon standing about, taken off the front of the registry so
 * the page draws real sheets rather than dots
 */
function standing(): Map<number, SpawnCoat> {
  const species = getRegisteredSpecies().slice(0, 4);

  return new Map(
    species.map((id, at) => [
      (3 + at) * CHUNK_CELLS + 4 + at * 3,
      { species: id, shiny: false, featured: false },
    ]),
  );
}

const SPAWNS = standing();

/** Which way a key steps, in cells across and back */
const STEPS = new Map<string, [number, number]>([
  ['ArrowUp', [0, -1]],
  ['ArrowDown', [0, 1]],
  ['ArrowLeft', [-1, 0]],
  ['ArrowRight', [1, 0]],
  ['w', [0, -1]],
  ['s', [0, 1]],
  ['a', [-1, 0]],
  ['d', [1, 0]],
]);

export default function BoardDemo(): JSX.Element {
  const [frame, setFrame] = createSignal(0);
  const [biome, setBiome] = createSignal<Biome>(BiomeId.TemperateForest);
  const [weather, setWeather] = createSignal<Weather>(Weather.Clear);
  const [yaw, setYaw] = createSignal(0);
  const [player, setPlayer] = createSignal(START);
  const [facing, setFacing] = createSignal<[number, number]>([0, 1]);

  const shape = (): (typeof FRAMES)[number] => FRAMES[frame()];
  const mode = (): string => viewFor(shape().width, shape().height).mode;

  /**
   * One step, if there is board that way. The demo has no world to ask
   * about what is walkable, so anything inside the chunk is
   */
  const walk = (step: [number, number]): void => {
    const across = (player() % CHUNK_CELLS) + step[0];
    const back = Math.floor(player() / CHUNK_CELLS) + step[1];

    setFacing(step);
    if (across < 0 || back < 0 || across >= CHUNK_CELLS || back >= CHUNK_CELLS) {
      return;
    }
    setPlayer(back * CHUNK_CELLS + across);
  };

  onMount(() => {
    const walked = (event: KeyboardEvent): void => {
      const step = STEPS.get(event.key);

      if (step == null) {
        return;
      }
      event.preventDefault();
      walk(step);
    };

    window.addEventListener('keydown', walked);
    onCleanup(() => {
      window.removeEventListener('keydown', walked);
    });
  });

  return (
    <div class="flex flex-col gap-3 p-4">
      <div class="flex flex-wrap gap-3">
        <Select
          label="Screen"
          class="w-56"
          value={frame()}
          options={FRAMES.map((entry, at) => ({ value: at, label: entry.label }))}
          onChange={(chosen) => {
            setFrame(chosen);
          }}
        />
        <Select
          label="Ground"
          class="w-56"
          value={biome()}
          options={Object.entries(BIOME_NAMES).map(([key, label]) => ({
            value: Number(key),
            label,
          }))}
          onChange={(chosen) => {
            setBiome(chosen);
          }}
        />
        <Select
          label="Sky"
          class="w-56"
          value={weather()}
          options={Object.entries(WEATHER_NAMES).map(([key, label]) => ({
            value: Number(key),
            label,
          }))}
          onChange={(chosen) => {
            setWeather(chosen);
          }}
        />
      </div>

      <Row>
        <Badge tone={mode() === '2d' ? 'tide' : 'leaf'}>{mode()}</Badge>
        <Badge tone="neutral">
          {shape().width} x {shape().height}
        </Badge>
      </Row>

      <Note>
        The arrows walk. A screen taller than it is wide is drawn flat from above, with the round
        shadow the board uses at night and the weather against the glass; anything wider is laid
        back under the camera. Walk behind a tree in either to see it give way.
      </Note>

      {/* The board takes the whole of whatever it is put in, so the
          frame is what decides its shape and therefore which of the two
          ways it is drawn */}
      <div
        class="relative overflow-hidden rounded-panel border-4 border-tide bg-shade shadow-pop"
        style={{ width: `${shape().width}px`, height: `${shape().height}px`, 'max-width': '100%' }}
      >
        <ChunkCanvas
          biome={biome()}
          weather={weather()}
          lamp={LAMP}
          yaw={yaw()}
          onTurn={(turned) => {
            setYaw(turned);
          }}
          latitude={0}
          caption="Demo chunk"
          player={player()}
          facing={facing()}
          crossing={null}
          landmarks={NOTHING_MAPPED}
          phenomena={NOTHING_MAPPED}
          spots={NOTHING_SET}
          shallows={NOTHING_SET}
          rocks={NOTHING_SET}
          wanderers={NOTHING_MAPPED}
          coats={NOTHING_MAPPED}
          berries={NOTHING_MAPPED}
          picked={NOTHING_SET}
          dug={NOTHING_SET}
          decorations={DECORATIONS}
          spawns={SPAWNS}
          label={(index) => `Cell ${index}`}
          onPress={(cell) => {
            // One step toward whatever was pressed, so a press walks
            // the way a key does rather than teleporting
            const across = cell.x - (player() % CHUNK_CELLS);
            const back = cell.y - Math.floor(player() / CHUNK_CELLS);

            walk(
              Math.abs(across) >= Math.abs(back) ? [Math.sign(across), 0] : [0, Math.sign(back)],
            );
          }}
        />
      </div>
    </div>
  );
}
