import { type JSX, createMemo, createSignal } from 'solid-js';
import type Biome from '../../data/ids/biome';
import getWorld from '../../overworld/current';
import { WORLD_MAX, WORLD_MIN, isInWorld } from '../../overworld/world';
import { Button, Dialog, DialogActions } from '../styled';
import WorldMapCanvas from './WorldMapCanvas';
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

  return (
    <Dialog
      isOpen={props.isOpen}
      onClose={close}
      width="wide"
      quiet
      title="World Map"
      description={
        <>
          {SPAN} chunks across, centred on {centerX()}, {centerY()}. Click the map and pan with the
          arrow keys — hold shift to cross it faster, or press Home to come back to where you are
          standing.
        </>
      }
    >
      <WorldMapCanvas
        span={SPAN}
        originX={centerX() - HALF}
        originY={centerY() - HALF}
        biomes={biomes()}
        playerX={standing()?.chunkX ?? Number.NaN}
        playerY={standing()?.chunkY ?? Number.NaN}
        onPan={pan}
        onRecenter={recenter}
      />

      <DialogActions>
        <Button onClick={close}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
