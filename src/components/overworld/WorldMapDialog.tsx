import { type JSX, type ParentProps, Show, createMemo, createSignal, onCleanup } from 'solid-js';
import type Biome from '../../data/ids/biome';
import type Weather from '../../data/overworld/weather';
import { WEATHER_NAMES, favorsEverything } from '../../data/overworld/weather';
import getWorld from '../../overworld/current';
import { weatherWindowOf } from '../../overworld/chunk-snapshot';
import { localNow } from '../../auth/clock';
import { WORLD_MAX, WORLD_MIN, isInWorld } from '../../overworld/world';
import { Button, Dialog, DialogActions, Hint, Switch } from '../styled';
import WorldMapCanvas, { PAN_STRIDE, townsInView } from './WorldMapCanvas';
import { useGame } from '../app/game-context';

/**
 * How many chunks the view spans on each side. It is a window on the
 * world rather than the world: four thousand chunks across cannot be
 * looked at, and sixty-four is about as much ground as a player could
 * plausibly walk in a sitting — wide enough to plan a route across,
 * near enough that a chunk on it is still a place rather than a speck
 */
const SPAN = 64;

const HALF = Math.floor(SPAN / 2);

/**
 * How often the map looks at the clock, in milliseconds. The sky turns
 * over on the hour, and a minute late is close enough for a map
 */
const SKY_CHECK = 60 * 1000;

/**
 * One key and what it does, laid out the way the search guide lays out
 * one rule: the shape of it first, in the type the game writes keys
 * in, and the line about it under
 */
function Key(props: ParentProps<{ presses: string }>): JSX.Element {
  return (
    <li class="flex flex-col gap-0.5">
      <code class="w-fit rounded bg-line-soft px-1 py-0.5 text-xs text-ink">{props.presses}</code>
      <span class="text-xs text-muted">{props.children}</span>
    </li>
  );
}

export interface WorldMapDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * The world around the player, opened over the chunk they are
 * standing in.
 *
 * It is a dialog rather than a tab because that is what it is for:
 * looking at where you are and deciding which way to go, without
 * leaving the ground you are standing on. Biomes come from the climate
 * noise alone, so all of it derives locally — no snapshot, no store,
 * no clock — and the camera is free to look wherever it likes
 */
export default function WorldMapDialog(props: WorldMapDialogProps): JSX.Element {
  const game = useGame();

  /**
   * Whether the map shows what the sky is doing. It is off by default:
   * the map is read to decide which way to walk, and the weather is
   * the answer to a different question
   */
  const [sky, setSky] = createSignal(false);

  /**
   * The hour the skies are read for. It ticks on its own, so a map
   * left open does not go on showing an hour that has passed
   */
  const skyWindow = (): number => weatherWindowOf(localNow());
  const [hour, setHour] = createSignal(skyWindow());
  const clock = setInterval(() => {
    setHour(skyWindow());
  }, SKY_CHECK);

  onCleanup(() => {
    clearInterval(clock);
  });

  /**
   * Where the player is, once it has been found out. Until then there
   * is nothing to centre on and nothing to mark
   */
  const standing = (): { chunkX: number; chunkY: number } | null => game.position();

  /**
   * How far the camera has been panned from the player, in chunks.
   *
   * The camera is not a place, it is an offset from one: where it
   * looks *derives* from where the player is standing, so it follows
   * them without anything having to be told to move it, and coming
   * back to them is a matter of forgetting the offset rather than
   * copying a position across
   */
  const [offsetX, setOffsetX] = createSignal(0);
  const [offsetY, setOffsetY] = createSignal(0);

  const inWorld = (value: number): number => Math.min(WORLD_MAX, Math.max(WORLD_MIN, value));

  const centerX = createMemo(() => inWorld((standing()?.chunkX ?? 0) + offsetX()));
  const centerY = createMemo(() => inWorld((standing()?.chunkY ?? 0) + offsetY()));

  /**
   * Panning moves the offset rather than the camera, and it is held to
   * what keeps the view inside the world — so a camera walked into the
   * rim comes straight back rather than having to be walked out of the
   * emptiness it wandered into
   */
  const pan = (dx: number, dy: number): void => {
    const at = standing();

    setOffsetX((x) => inWorld((at?.chunkX ?? 0) + x + dx) - (at?.chunkX ?? 0));
    setOffsetY((y) => inWorld((at?.chunkY ?? 0) + y + dy) - (at?.chunkY ?? 0));
  };

  const recenter = (): void => {
    setOffsetX(0);
    setOffsetY(0);
  };

  const close = (): void => {
    // It opens where the player is every time: a camera left across
    // the world is the last look, not this one
    recenter();
    props.onClose();
  };

  /**
   * One biome per chunk of the view, flat and row-major. Sixteen
   * thousand chunks are not sixteen thousand objects: the map wants a
   * colour per chunk and nothing else, so that is all that is built
   */
  const biomes = createMemo(() => {
    const world = getWorld();
    const values: (Biome | null)[] = [];

    for (let row = 0; row < SPAN; row++) {
      const y = centerY() - HALF + row;

      for (let column = 0; column < SPAN; column++) {
        const x = centerX() - HALF + column;

        values.push(isInWorld(x, y) ? world.getChunkBiome(x, y) : null);
      }
    }
    return values;
  });

  /**
   * The sky over each chunk of the view, or nothing while the map is
   * showing the ground alone. Derived like the biomes are: the world
   * answers what the sky is doing without anything being stored
   */
  const skies = createMemo(() => {
    if (!sky()) {
      return undefined;
    }
    const world = getWorld();
    const window = hour();
    const values: (Weather | null)[] = [];

    for (let row = 0; row < SPAN; row++) {
      const y = centerY() - HALF + row;

      for (let column = 0; column < SPAN; column++) {
        const x = centerX() - HALF + column;

        values.push(isInWorld(x, y) ? world.getWeather(x, y, window) : null);
      }
    }
    return values;
  });

  /**
   * The four skies worth walking to, where the view is looking at
   * one. They are ringed on the map as well, but a player scanning
   * for one wants to be told rather than to find it
   */
  const showpieces = createMemo(() => {
    const values = skies();

    if (values == null) {
      return [];
    }
    const found: { weather: Weather; x: number; y: number }[] = [];

    for (let index = 0; index < values.length; index++) {
      const weather = values[index];

      if (weather != null && favorsEverything(weather)) {
        found.push({
          weather,
          x: centerX() - HALF + (index % SPAN),
          y: centerY() - HALF + Math.floor(index / SPAN),
        });
      }
    }
    return found;
  });

  const towns = createMemo(() => townsInView(centerX() - HALF, centerY() - HALF, SPAN));

  return (
    <Dialog
      isOpen={props.isOpen}
      onClose={close}
      width="wide"
      quiet
      title="World Map"
      description={
        <>
          {SPAN} chunks across, centred on {centerX()}, {centerY()}. Click the map to steer it.
        </>
      }
      // The keys, on the one visible row a quiet dialog has. The
      // heading is read out rather than drawn, so a sighted player has
      // nowhere else to find out the map answers the keyboard at all.
      // A card rather than a tooltip, for the reason the search box
      // carries one: there are four keys to say, and a line of running
      // text is not the shape of a list of them
      bar={
        <Hint
          title="Steering the map"
          description="Click it first: the keys go to whatever has the keyboard."
        >
          <ul class="flex flex-col gap-2">
            <Key presses="↑ ↓ ← →">Pan one chunk. WASD does the same.</Key>
            <Key presses="Shift + ↑ ↓ ← →">Crosses {PAN_STRIDE} chunks at a time.</Key>
            <Key presses="Home">Back to the chunk you are standing in. C does the same.</Key>
          </ul>
          <p class="mt-2 text-xs text-muted">
            The camera is held inside the world, so panning at the rim comes straight back.
          </p>
        </Hint>
      }
    >
      <WorldMapCanvas
        span={SPAN}
        originX={centerX() - HALF}
        originY={centerY() - HALF}
        biomes={biomes()}
        skies={skies()}
        towns={towns()}
        playerX={standing()?.chunkX ?? Number.NaN}
        playerY={standing()?.chunkY ?? Number.NaN}
        onPan={pan}
        onRecenter={recenter}
      />

      <Switch
        class="mt-3"
        label="Show the sky"
        description="Washes each chunk in the colour of its weather, and rings the four worth walking to."
        checked={sky()}
        onChange={(on) => {
          setSky(on);
        }}
      />

      <Show when={sky()}>
        <p class="mt-2 text-xs text-muted">
          {showpieces().length === 0
            ? 'Nothing out of the ordinary in view this hour.'
            : showpieces()
                .map((one) => `${WEATHER_NAMES[one.weather]} (${one.x}, ${one.y})`)
                .join(' · ')}
        </p>
      </Show>

      <DialogActions>
        <Button onClick={close}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
