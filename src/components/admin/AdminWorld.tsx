import {
  For,
  type JSX,
  type Resource,
  Show,
  Suspense,
  createMemo,
  createResource,
  createSignal,
} from 'solid-js';
import { Badge, Button, Card, List, ListRow, Meta, Note, Row, TextField } from '../styled';
import { BIOME_NAMES } from '../../data/biome';
import type Biome from '../../data/ids/biome';
import { LANDMARK_NAMES } from '../../data/overworld/landmark';
import type { SnapshotRecord } from '../../auth/snapshot-record';
import { WORLD_MAX, WORLD_MIN, isInWorld } from '../../overworld/world';
import WorldMapCanvas from '../overworld/WorldMapCanvas';
import { getSpeciesData } from '../../data/species';
import getWorld from '../../overworld/current';
import { listChunkWindows } from '../../auth/snapshots';
import { useGame } from '../app/game-context';
import wallClock from './clock';

/**
 * The world, and whatever chunk is picked out of it.
 *
 * The map is the player's own, with a chunk chosen from it rather
 * than merely looked at. Everything the chunk *is* derives locally —
 * biome, seed, what stands where — because the world is noise and a
 * seed; the only thing read from the store is what its windows
 * actually rolled, which is the one part of a chunk that happened
 * rather than exists.
 */

/** How many chunks the view spans, matching the player's own map */
const SPAN = 64;

const HALF = Math.floor(SPAN / 2);

/**
 * The windows themselves, which is where the read happens. A read in
 * the body that declared it throws past every boundary written there
 */
function ChunkWindows(props: { windows: Resource<SnapshotRecord[]> }): JSX.Element {
  const rows = (): SnapshotRecord[] =>
    [...(props.windows() ?? [])].sort((left, right) => left.offset - right.offset);

  return (
    <Show
      when={rows().length > 0}
      fallback={<Note>No window has been rolled here — nobody has walked this chunk.</Note>}
    >
      <List>
        <For each={rows()}>
          {(window) => (
            <ListRow class="flex-col items-start gap-1">
              <Row>
                <Badge tone="tide">
                  UTC{window.offset >= 0 ? '+' : ''}
                  {window.offset / 60}
                </Badge>
                <span class="font-semibold">{wallClock(window.timestamp)}</span>
                <Meta>
                  {window.spawns.length} {window.spawns.length === 1 ? 'spawn' : 'spawns'}
                </Meta>
              </Row>
              <Meta>
                {window.spawns.map((spawn) => getSpeciesData(spawn.species).name).join(', ')}
              </Meta>
            </ListRow>
          )}
        </For>
      </List>
    </Show>
  );
}

export default function AdminWorld(): JSX.Element {
  const game = useGame();

  const standing = (): { chunkX: number; chunkY: number } | null => game.position();

  const [offsetX, setOffsetX] = createSignal(0);
  const [offsetY, setOffsetY] = createSignal(0);
  /** The chunk picked out of the map, or null until one is */
  const [picked, setPicked] = createSignal<{ x: number; y: number } | null>(null);

  const inWorld = (value: number): number => Math.min(WORLD_MAX, Math.max(WORLD_MIN, value));

  const centerX = createMemo(() => inWorld((standing()?.chunkX ?? 0) + offsetX()));
  const centerY = createMemo(() => inWorld((standing()?.chunkY ?? 0) + offsetY()));

  const pan = (dx: number, dy: number): void => {
    const at = standing();

    setOffsetX((x) => inWorld((at?.chunkX ?? 0) + x + dx) - (at?.chunkX ?? 0));
    setOffsetY((y) => inWorld((at?.chunkY ?? 0) + y + dy) - (at?.chunkY ?? 0));
  };

  /**
   * The chunk being typed for. The map is panned by arrow keys and
   * read by clicking, which is fine for looking around and hopeless
   * for reaching somewhere known: the world is millions of chunks
   * across, and a coordinate out of a bug report is a coordinate
   */
  const [wantedX, setWantedX] = createSignal('');
  const [wantedY, setWantedY] = createSignal('');

  const typed = (value: string): number | null => {
    const at = Math.trunc(Number(value.trim()));

    return value.trim() === '' || !Number.isFinite(at) || !isInWorld(at, 0) ? null : at;
  };

  /** Where the fields point, or null while either of them is not a chunk */
  const wanted = (): { x: number; y: number } | null => {
    const x = typed(wantedX());
    const y = typed(wantedY());

    return x == null || y == null ? null : { x, y };
  };

  // The map goes there and the chunk is picked in one press: somebody
  // typing a coordinate wants to read that chunk, not to look at it
  // and click it again
  const goThere = (): void => {
    const at = wanted();

    if (at == null) {
      return;
    }
    setOffsetX(at.x - (standing()?.chunkX ?? 0));
    setOffsetY(at.y - (standing()?.chunkY ?? 0));
    setPicked({ x: at.x, y: at.y });
  };

  /** One biome per chunk of the view, flat and row-major */
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

  /** The chunk itself, derived from the world rather than read */
  const chunk = createMemo(() => {
    const at = picked();

    return at == null ? null : getWorld().getChunk(at.x, at.y);
  });

  const [windows] = createResource(
    () => chunk()?.seed,
    async (seed) => listChunkWindows(seed),
  );

  return (
    <div class="flex flex-col gap-4">
      <Card>
        <WorldMapCanvas
          span={SPAN}
          originX={centerX() - HALF}
          originY={centerY() - HALF}
          biomes={biomes()}
          playerX={standing()?.chunkX ?? Number.NaN}
          playerY={standing()?.chunkY ?? Number.NaN}
          pickedX={picked()?.x}
          pickedY={picked()?.y}
          onPick={(x, y) => {
            setPicked({ x, y });
          }}
          onPan={pan}
          onRecenter={() => {
            setOffsetX(0);
            setOffsetY(0);
          }}
        />
        <Note class="text-center">
          {SPAN} chunks across, centred on {centerX()}, {centerY()}. Click a chunk to read it; pan
          with the arrow keys, or press Home to come back to where you are standing.
        </Note>

        {/* Straight to a coordinate. Enter goes there from either
            field, since a pair of numbers is typed rather than
            pressed */}
        <Row class="items-end justify-center">
          <TextField
            label="X"
            kind="number"
            value={wantedX()}
            placeholder={String(centerX())}
            onChange={(value) => {
              setWantedX(value);
            }}
            onEnter={goThere}
          />
          <TextField
            label="Y"
            kind="number"
            value={wantedY()}
            placeholder={String(centerY())}
            onChange={(value) => {
              setWantedY(value);
            }}
            onEnter={goThere}
          />
          <Button tone="primary" disabled={wanted() == null} onClick={goThere}>
            Go
          </Button>
        </Row>
      </Card>

      <Show
        when={chunk()}
        fallback={
          <Card title="Chunk">
            <Note>Nothing is picked. Click the map.</Note>
          </Card>
        }
      >
        {(here) => (
          <>
            <Card title={`Chunk ${here().x}, ${here().y}`}>
              <Row>
                <Badge tone="leaf">{BIOME_NAMES[here().biome]}</Badge>
                <Meta class="font-mono">{here().seed}</Meta>
              </Row>
              <h4>Landmarks</h4>
              <Show
                when={here().getLandmarkCells().size > 0}
                fallback={<Note>Nothing stands in this chunk.</Note>}
              >
                <List>
                  <For each={[...here().getLandmarkCells()]}>
                    {([cell, landmark]) => (
                      <ListRow class="justify-between">
                        <span class="font-semibold">{LANDMARK_NAMES[landmark]}</span>
                        <Meta>cell {cell}</Meta>
                      </ListRow>
                    )}
                  </For>
                </List>
              </Show>
              <Meta>{here().getDecorationCells().size} pieces of scenery</Meta>
            </Card>

            <Card title="Windows">
              {/* What the chunk actually rolled, once per zone anybody
                  has walked it from. It is the only part of a chunk
                  that is stored rather than derived */}
              <Suspense fallback={<Note>Reading the windows…</Note>}>
                <ChunkWindows windows={windows} />
              </Suspense>
            </Card>
          </>
        )}
      </Show>
    </div>
  );
}
