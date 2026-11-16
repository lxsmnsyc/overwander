import {
  For,
  type JSX,
  type ParentProps,
  Show,
  createMemo,
  createSignal,
  onCleanup,
} from 'solid-js';
import { Popover, PopoverButton, PopoverPanel } from 'terracotta';
import { BIOME_COLORS, BIOME_NAMES } from '../../data/biome';
import type Biome from '../../data/ids/biome';
import type Weather from '../../data/overworld/weather';
import { WEATHER_COLORS, WEATHER_NAMES, favorsEverything } from '../../data/overworld/weather';
import getWorld from '../../overworld/current';
import { weatherWindowOf } from '../../overworld/chunk-snapshot';
import { localNow } from '../../auth/clock';
import { WORLD_MAX, WORLD_MIN, isInWorld } from '../../overworld/world';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CrosshairIcon,
} from '../icons';
import { Button, Dialog, DialogActions, HoverCard, Segmented } from '../styled';
import { DockNote } from '../forms/terms';
import WorldMapCanvas, { PAN_STRIDE, townsInView } from './WorldMapCanvas';
import { useGame } from '../app/game-context';
import { m } from '../../i18n/paraglide/messages.js';

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

/** A chip in the rail's row on a phone, or a row of the rail from `md` */
const CHIP = 'h-9 shrink-0 text-xs md:w-full md:justify-start';

/** One key of the pan pad */
const PAD = `flex size-[34px] cursor-pointer items-center justify-center rounded-[10px] border-2
  border-line bg-paper/95 p-0 text-sm text-ink shadow-rest transition-colors
  hover:border-tide active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2
  focus-visible:outline-tide`;

/** What the map shows under the player's eye */
const enum Show_ {
  Ground = 'ground',
  Sky = 'sky',
}

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
  const [mode, setMode] = createSignal<Show_>(Show_.Ground);
  const sky = (): boolean => mode() === Show_.Sky;

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

  /** Every biome the view is looking at, once each, for the key */
  const biomesInView = createMemo(() => {
    const seen = new Set<Biome>();

    for (const biome of biomes()) {
      if (biome != null) {
        seen.add(biome);
      }
    }
    return [...seen].sort((one, other) => BIOME_NAMES[one].localeCompare(BIOME_NAMES[other]));
  });

  /** Point the camera at one chunk */
  const lookAt = (x: number, y: number): void => {
    pan(x - centerX(), y - centerY());
  };

  /** One press on the pad: a chunk, or a stride with Shift held */
  const step = (dx: number, dy: number) => (event: MouseEvent) => {
    const distance = event.shiftKey ? PAN_STRIDE : 1;

    pan(dx * distance, dy * distance);
  };

  /** What the player is standing in: the place the game names, or the ground under them */
  const standingIn = (): string => {
    const named = game.place();
    const at = standing();

    if (named != null && named !== '') {
      return named;
    }
    return at == null
      ? m.world_map_finding()
      : BIOME_NAMES[getWorld().getChunkBiome(at.chunkX, at.chunkY)];
  };

  /** One thing the key names: the player, a town, or a biome's colour */
  const keyRows = (): JSX.Element => (
    <>
      <span class="flex items-center gap-2 text-[13px] font-bold">
        <span class="size-3.5 shrink-0 rounded-[2px] border-2 border-paper bg-ink/70" />
        {m.world_map_you()}
      </span>
      <span class="flex items-center gap-2 text-[13px] font-bold">
        <span class="size-3.5 shrink-0 rounded-[2px] border-2 border-ink" />
        {m.world_map_town()}
      </span>
      <For each={biomesInView()}>
        {(biome) => (
          <span class="flex items-center gap-2 text-[13px] font-bold">
            <span
              class="size-3.5 shrink-0 rounded-[4px]"
              style={{ background: BIOME_COLORS[biome] }}
            />
            {BIOME_NAMES[biome]}
          </span>
        )}
      </For>
    </>
  );

  return (
    <Dialog
      isOpen={props.isOpen}
      onClose={close}
      width="rail"
      layout="sheet"
      terse
      title={m.world_map_title()}
      lead={
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.4"
          aria-hidden="true"
        >
          <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" />
          <path d="M9 4v14M15 6v14" />
        </svg>
      }
      description={m.world_map_description({ span: SPAN, x: centerX(), y: centerY() })}
      // The keys, at the sheet's top right. A card rather than a
      // tooltip, for the reason the search box carries one: there are
      // four keys to say, and a line of running text is not the shape of
      // a list of them
      aside={
        <HoverCard
          title={m.world_map_steering()}
          kind={m.ui_help()}
          description={m.world_map_steering_hint()}
          placement="bottom"
          class="inline-flex size-7 items-center justify-center rounded-full border-2 border-line
            bg-paper text-[13px] font-extrabold text-tide transition-colors hover:border-tide
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tide"
          trigger={
            <span role="img" aria-label={m.world_map_steering()}>
              ?
            </span>
          }
        >
          <ul class="flex flex-col gap-2">
            <Key presses={m.world_map_key_drag()}>{m.world_map_drag()}</Key>
            <Key presses="↑ ↓ ← →">{m.world_map_arrows()}</Key>
            <Key presses="Shift + ↑ ↓ ← →">{m.world_map_stride({ stride: PAN_STRIDE })}</Key>
            <Key presses="Home">{m.world_map_home()}</Key>
          </ul>
          <p class="mt-2 text-xs text-muted">{m.world_map_rim()}</p>
        </HoverCard>
      }
    >
      <div class="flex min-h-0 flex-col gap-3 md:grow md:flex-row md:gap-0">
        {/* The rail: what the map shows, where the player is, and what is on it.
            On a phone it is a row of chips over the map */}
        <nav
          aria-label={m.world_map_show()}
          class="flex shrink-0 items-center gap-2 overflow-x-auto pb-1 md:w-[14.5rem]
            md:flex-col md:items-stretch md:gap-3.5 md:overflow-x-visible md:overflow-y-auto
            md:border-r-2 md:border-line-soft md:pr-4 md:pb-0"
        >
          <div class="flex shrink-0 flex-col gap-1.5" title={m.world_map_sky_hint()}>
            <span class="hidden text-xs font-extrabold tracking-[0.12em] text-muted uppercase md:block">
              {m.world_map_show()}
            </span>
            <Segmented
              class="md:w-full [&>*]:md:flex-1"
              label={m.world_map_show()}
              value={mode()}
              options={[
                { value: Show_.Ground, label: m.world_map_ground() },
                { value: Show_.Sky, label: m.world_map_sky() },
              ]}
              onChange={(next) => {
                setMode(next);
              }}
            />
          </div>

          <div class="flex shrink-0 flex-col gap-0.5 md:gap-1">
            <span class="text-xs font-extrabold tracking-[0.12em] text-muted uppercase">
              {m.world_map_you_are_in()}
            </span>
            <span class="font-display text-base font-semibold md:text-lg">{standingIn()}</span>
            <Show when={standing()}>
              {(at) => (
                <span class="text-xs text-muted tabular-nums">
                  {m.world_map_chunk_meta({
                    x: at().chunkX,
                    y: at().chunkY,
                    viewX: centerX(),
                    viewY: centerY(),
                  })}
                </span>
              )}
            </Show>
          </div>

          <Show when={sky()}>
            <div class="flex shrink-0 items-center gap-2 md:flex-col md:items-stretch md:gap-1.5">
              <span class="hidden text-xs font-extrabold tracking-[0.12em] text-muted uppercase md:block">
                {m.world_map_worth()}
              </span>
              {/* Pressing one looks at it */}
              <For
                each={showpieces()}
                fallback={<span class="text-xs text-muted">{m.world_map_quiet()}</span>}
              >
                {(one) => (
                  <Button
                    class={CHIP}
                    onClick={() => {
                      lookAt(one.x, one.y);
                    }}
                  >
                    <span
                      aria-hidden="true"
                      class="size-3.5 shrink-0 rounded-[4px]"
                      style={{ background: WEATHER_COLORS[one.weather] }}
                    />
                    {WEATHER_NAMES[one.weather]}
                    <span class="ml-auto pl-1 text-xs font-bold text-muted tabular-nums">
                      {one.x}, {one.y}
                    </span>
                  </Button>
                )}
              </For>
            </div>
          </Show>

          <Show when={!sky()}>
            {/* The key: a list in the rail, and behind a chip where there is no room for one */}
            <div class="hidden min-h-0 flex-col gap-2 md:flex">
              <span class="text-xs font-extrabold tracking-[0.12em] text-muted uppercase">
                {m.world_map_in_view()}
              </span>
              {keyRows()}
            </div>
            <Popover defaultOpen={false} class="relative shrink-0 md:hidden">
              <PopoverButton
                class="h-9 cursor-pointer rounded-button border-2 border-line bg-paper px-3 text-xs
                  font-extrabold text-ink shadow-none hover:border-tide active:translate-y-0"
              >
                {m.world_map_key()}
              </PopoverButton>
              <PopoverPanel
                class="fixed inset-x-4 z-30 mt-1 flex max-h-72 flex-col gap-1.5 overflow-y-auto
                  rounded-card border-2 border-line bg-paper p-3 shadow-float"
              >
                {keyRows()}
              </PopoverPanel>
            </Popover>
          </Show>
        </nav>

        <div class="flex min-h-0 min-w-0 grow flex-col gap-2.5 overflow-y-auto md:px-4.5">
          <span class="text-xs text-muted">
            {m.world_map_description({ span: SPAN, x: centerX(), y: centerY() })}
          </span>
          {/* The box the map fills: a size container from `md`, so the square
              is as large as the column's height and width allow */}
          <div class="flex min-h-0 grow flex-col md:[container-type:size]">
            <WorldMapCanvas
              fill
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
              overlay={
                <>
                  <span
                    class="pointer-events-none absolute bottom-2.5 left-2.5 z-10 inline-flex h-[26px]
                    items-center rounded-full bg-ink/80 px-2.5 text-[11px] font-extrabold
                    text-parchment tabular-nums"
                  >
                    <Show when={standing()} fallback={m.world_map_finding()}>
                      {(at) => m.world_map_you_at({ x: at().chunkX, y: at().chunkY })}
                    </Show>
                    {` · ${m.world_map_view_at({ x: centerX(), y: centerY() })}`}
                  </span>

                  {/* Buttons for whoever has no keyboard to steer with */}
                  <div class="absolute right-2.5 bottom-2.5 z-10 grid grid-cols-3 gap-[3px]">
                    <span />
                    <button
                      type="button"
                      class={PAD}
                      aria-label={m.world_map_pan_north()}
                      onClick={step(0, -1)}
                    >
                      <ChevronUpIcon class="size-4" aria-hidden="true" />
                    </button>
                    <span />
                    <button
                      type="button"
                      class={PAD}
                      aria-label={m.world_map_pan_west()}
                      onClick={step(-1, 0)}
                    >
                      <ChevronLeftIcon class="size-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      class={`${PAD} text-tide`}
                      aria-label={m.world_map_back_to_you()}
                      onClick={recenter}
                    >
                      <CrosshairIcon class="size-5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      class={PAD}
                      aria-label={m.world_map_pan_east()}
                      onClick={step(1, 0)}
                    >
                      <ChevronRightIcon class="size-4" aria-hidden="true" />
                    </button>
                    <span />
                    <button
                      type="button"
                      class={PAD}
                      aria-label={m.world_map_pan_south()}
                      onClick={step(0, 1)}
                    >
                      <ChevronDownIcon class="size-4" aria-hidden="true" />
                    </button>
                    <span />
                  </div>
                </>
              }
            />
          </div>
        </div>
      </div>

      <DialogActions stack note={<DockNote>{m.world_map_dock_note()}</DockNote>}>
        <Button onClick={close}>{m.world_map_close()}</Button>
      </DialogActions>
    </Dialog>
  );
}
