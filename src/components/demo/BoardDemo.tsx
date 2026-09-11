import { type JSX, createSignal, onCleanup, onMount } from 'solid-js';
import { Badge, Note, Row, Select } from '../styled';
import type Biome from '../../data/ids/biome';
import BiomeId from '../../data/ids/biome';
import { BIOME_NAMES } from '../../data/biome';
import Decoration from '../../data/overworld/decoration';
import Weather, { WEATHER_NAMES } from '../../data/overworld/weather';
import ChunkCanvas from '../overworld/chunk-canvas';
import type { SpawnCoat } from '../overworld/chunk-canvas/scenery';
import { BOARD_CENTER, boardIndexOf, viewFor } from '../../canvas/board';
import type { BoardGround } from '../../overworld/ground';
import { getRegisteredSpecies } from '../../data/species';

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

/**
 * Where the scenery stands, in world cells measured from where the
 * walk starts. The board is a window that follows the player, so a
 * fixed scene is kept in the world's own numbers and turned into
 * board cells as each frame is drawn
 */
const DECORATIONS: [at: [number, number], what: Decoration][] = [
  [[-2, -2], Decoration.Tree],
  [[0, -2], Decoration.Tree],
  [[2, -2], Decoration.Pine],
  [[-1, 1], Decoration.Rock],
  [[3, 1], Decoration.Shrub],
  [[1, 4], Decoration.Tree],
];

/**
 * The scene as the board sees it: whatever of it is inside the window
 * the player is standing in the middle of
 */
function windowed<T>(
  scene: [at: [number, number], what: T][],
  at: [number, number],
): Map<number, T> {
  const seen = new Map<number, T>();

  for (const [where, what] of scene) {
    const index = boardIndexOf({
      x: BOARD_CENTER + where[0] - at[0],
      y: BOARD_CENTER + where[1] - at[1],
    });

    if (index != null) {
      seen.set(index, what);
    }
  }

  return seen;
}

/** Nothing to draw, but the board asks for all of them */
const NOTHING_MAPPED = new Map<number, never>();
const NOTHING_SET = new Set<number>();

/**
 * Plain walkable country under the whole window. The demo has no world
 * behind it, so the ground answers the same thing everywhere and the
 * page is about the board rather than about what is on it
 */
const PLAIN_GROUND: BoardGround = {
  margin: 0,
  role: () => 'ground',
  biome: () => BiomeId.TemperateForest,
  shelf: () => false,
  road: () => false,
};

/** How far the player's lamp reaches, in cells */
const LAMP = 3;

/** Where they start, which the scene above is measured from */
const START: [number, number] = [0, 0];

/**
 * A few pokemon standing about, taken off the front of the registry so
 * the page draws real sheets rather than dots
 */
function standing(): [at: [number, number], coat: SpawnCoat][] {
  const species = getRegisteredSpecies().slice(0, 4);

  return species.map((id, at) => [
    [-3 + at * 3, -4 + at],
    // The window names what it publishes, and the name is what the
    // board keeps a sheet under while the ground slides past
    { id: `demo-${at}`, species: id, shiny: false, featured: false },
  ]);
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
  const [at, setAt] = createSignal<[number, number]>(START);
  const [facing, setFacing] = createSignal<[number, number]>([0, 1]);

  const shape = (): (typeof FRAMES)[number] => FRAMES[frame()];
  const mode = (): string => viewFor(shape().width, shape().height).mode;

  /**
   * One step, if there is board that way. The demo has no world to ask
   * about what is walkable, so anything inside the chunk is
   */
  const walk = (step: [number, number]): void => {
    setFacing(step);
    setAt(([x, y]) => [x + step[0], y + step[1]]);
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
          options={FRAMES.map((entry, index) => ({ value: index, label: entry.label }))}
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
          underground={false}
          yaw={yaw()}
          onTurn={(turned) => {
            setYaw(turned);
          }}
          latitude={0}
          caption="Demo chunk"
          at={at()}
          origin={[at()[0] - BOARD_CENTER, at()[1] - BOARD_CENTER]}
          facing={facing()}
          landmarks={NOTHING_MAPPED}
          phenomena={NOTHING_MAPPED}
          ground={PLAIN_GROUND}
          wanderers={NOTHING_MAPPED}
          coats={NOTHING_MAPPED}
          berries={NOTHING_MAPPED}
          picked={NOTHING_SET}
          dug={NOTHING_SET}
          decorations={windowed(DECORATIONS, at())}
          spawns={windowed(SPAWNS, at())}
          label={(index) => `Cell ${index}`}
          onPress={(cell) => {
            // One step toward whatever was pressed, so a press walks
            // the way a key does rather than teleporting
            const across = cell.x - BOARD_CENTER;
            const back = cell.y - BOARD_CENTER;

            walk(
              Math.abs(across) >= Math.abs(back) ? [Math.sign(across), 0] : [0, Math.sign(back)],
            );
          }}
        />
      </div>
    </div>
  );
}
