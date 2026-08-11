import { For, type JSX, createEffect, createMemo, createSignal } from 'solid-js';
import { BIOME_COLORS, BIOME_NAMES } from '../data/biome';
import type Biome from '../data/ids/biome';
import getWorld from '../overworld/current';
import { WORLD_MAX, WORLD_MIN, isInWorld } from '../overworld/world';
import WorldMapCanvas from './WorldMapCanvas';
import { useGame } from './game-context';

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
 * The world around the player. Biomes come from the climate noise
 * alone, so the whole map derives locally — no snapshot, no store, no
 * clock — and the camera is free to look wherever it likes
 */
export default function WorldMapTab(): JSX.Element {
  const game = useGame();
  // The camera starts where the player is and goes back to them
  // whenever they move; panning is a look around from there
  const [centerX, setCenterX] = createSignal(game.chunk()[0]);
  const [centerY, setCenterY] = createSignal(game.chunk()[1]);

  createEffect(() => {
    const [x, y] = game.chunk();

    setCenterX(x);
    setCenterY(y);
  });

  const pan = (dx: number, dy: number): void => {
    setCenterX((x) => Math.min(WORLD_MAX, Math.max(WORLD_MIN, x + dx)));
    setCenterY((y) => Math.min(WORLD_MAX, Math.max(WORLD_MIN, y + dy)));
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
   * Which biomes the visible region holds, and how much of it each one
   * covers. Ground beyond the world's edge is not ground, and is left
   * out of the reckoning
   */
  const legend = createMemo(() => {
    const counts = new Map<Biome, number>();
    let ground = 0;

    for (const biome of biomes()) {
      if (biome == null) {
        continue;
      }
      ground += 1;
      counts.set(biome, (counts.get(biome) ?? 0) + 1);
    }
    return { ground, entries: [...counts].sort((left, right) => right[1] - left[1]) };
  });

  return (
    <section>
      <h2>World Map</h2>
      <p>
        {SPAN} chunks across, centred on {centerX()}, {centerY()}. Click the map and pan with the
        arrow keys — hold shift to cross it faster, or press Home to come back to where you are
        standing.
      </p>

      <WorldMapCanvas
        span={SPAN}
        originX={centerX() - HALF}
        originY={centerY() - HALF}
        biomes={biomes()}
        playerX={game.chunk()[0]}
        playerY={game.chunk()[1]}
        onPan={pan}
        onRecenter={() => {
          setCenterX(game.chunk()[0]);
          setCenterY(game.chunk()[1]);
        }}
      />

      <p>
        You are standing in chunk {game.chunk()[0]}, {game.chunk()[1]} — ringed on the map while it
        is in view.
      </p>

      <ul>
        <For each={legend().entries}>
          {([biome, count]) => (
            <li>
              <span
                style={{
                  display: 'inline-block',
                  width: '0.75rem',
                  height: '0.75rem',
                  background: BIOME_COLORS[biome],
                  'margin-right': '0.5rem',
                }}
              />
              {BIOME_NAMES[biome]} — {Math.round((count / Math.max(1, legend().ground)) * 100)}%
            </li>
          )}
        </For>
      </ul>
    </section>
  );
}
