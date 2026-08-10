import { For, type JSX, createMemo, createSignal } from 'solid-js';
import { BIOME_COLORS, BIOME_NAMES } from '../data/biome';
import type Biome from '../data/ids/biome';
import getWorld from '../overworld/current';

/**
 * How many chunks the map spans on each side; an odd span keeps the
 * center chunk on the middle tile
 */
const SPAN = 25;

const HALF = Math.floor(SPAN / 2);

interface Tile {
  x: number;
  y: number;
  biome: Biome;
}

/**
 * The world's biomes as they fall around a center chunk. Biomes come
 * from the climate noise alone, so the whole map derives locally —
 * no snapshot, no store, no clock
 */
export default function WorldMapTab(): JSX.Element {
  const [centerX, setCenterX] = createSignal(0);
  const [centerY, setCenterY] = createSignal(0);

  const tiles = createMemo(() => {
    const world = getWorld();
    const rows: Tile[][] = [];

    for (let row = 0; row < SPAN; row++) {
      const y = centerY() - HALF + row;
      const tileRow: Tile[] = [];

      for (let column = 0; column < SPAN; column++) {
        const x = centerX() - HALF + column;

        tileRow.push({ x, y, biome: world.getChunk(x, y).biome });
      }
      rows.push(tileRow);
    }
    return rows;
  });

  /**
   * Which biomes the visible region holds, and how much of it each
   * one covers
   */
  const legend = createMemo(() => {
    const counts = new Map<Biome, number>();

    for (const row of tiles()) {
      for (const tile of row) {
        counts.set(tile.biome, (counts.get(tile.biome) ?? 0) + 1);
      }
    }
    return [...counts].sort((left, right) => right[1] - left[1]);
  });

  const total = SPAN * SPAN;

  return (
    <section>
      <h2>World Map</h2>
      <p>
        <label>
          Center X
          <input
            type="number"
            value={centerX()}
            onChange={(event) => {
              setCenterX(Math.trunc(Number(event.currentTarget.value) || 0));
            }}
          />
        </label>
        <label>
          Center Y
          <input
            type="number"
            value={centerY()}
            onChange={(event) => {
              setCenterY(Math.trunc(Number(event.currentTarget.value) || 0));
            }}
          />
        </label>
      </p>

      <div
        style={{
          display: 'grid',
          'grid-template-columns': `repeat(${SPAN}, 1fr)`,
          width: 'min(100%, 30rem)',
          margin: '0 auto',
        }}
      >
        <For each={tiles()}>
          {(row) => (
            <For each={row}>
              {(tile) => (
                <div
                  title={`${BIOME_NAMES[tile.biome]} · ${tile.x}, ${tile.y}`}
                  style={{
                    'aspect-ratio': '1',
                    background: BIOME_COLORS[tile.biome],
                  }}
                />
              )}
            </For>
          )}
        </For>
      </div>

      <ul>
        <For each={legend()}>
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
              {BIOME_NAMES[biome]} — {Math.round((count / total) * 100)}%
            </li>
          )}
        </For>
      </ul>
    </section>
  );
}
