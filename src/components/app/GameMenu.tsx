import {
  type ComponentProps,
  For,
  type JSX,
  Show,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
} from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { Popover, PopoverButton, PopoverPanel, Transition } from 'terracotta';
import { useAuth } from '../../auth/context';
import { localNow, serverNow, syncServerClock } from '../../auth/clock';
import type { EggWalk } from '../../auth/eggs';
import { getLocalOffset, toLocalTime } from '../../model/local-time';
import { TIME_OF_DAY_NAMES } from '../../data/biome';
import { getTimeOfDay } from '../../data/ids/biome';
import { Moves } from '../../data/ids/moves';
import { WEATHER_DESCRIPTIONS, WEATHER_NAMES } from '../../data/overworld/weather';
import {
  LANDMARK_INTERVAL,
  NEST_INTERVAL,
  PHENOMENON_INTERVAL,
  RAID_INTERVAL,
  SNAPSHOT_INTERVAL,
  WEATHER_INTERVAL,
} from '../../overworld/chunk-snapshot';
import type { FieldMove } from '../../overworld/field-moves';
import { GameDialog, useGame } from './game-context';
import { watchProfile } from '../../auth/profile';
import { listMysteryGifts } from '../../auth/gifts';
import { NoticeKind } from '../../auth/notifications';
import { getDueQuests } from '../../auth/quests';
import {
  BagIcon,
  BellIcon,
  BoxIcon,
  FireIcon,
  GiftIcon,
  MapIcon,
  NewsIcon,
  SearchIcon,
  SettingsIcon,
  SwordsIcon,
  TrophyIcon,
  UserIcon,
} from '../icons';
import { PlayerFace } from '../profile/PlayerPlate';
import { WeatherFavors, getWeatherIcon } from '../overworld/WeatherIcon';
import { CloseButton } from '../styled';
import { GROW, MORPH } from '../styled/transition';
import FullscreenToggle from './FullscreenToggle';
import { ThemeToggle } from './theme';
import { actionOf, forTheGame } from './keys';
import settings, { type ClockFormat } from './settings';
import { formatNumber } from '../../i18n/format';
import { m } from '../../i18n/paraglide/messages.js';

/**
 * The furniture around the world, each piece in a corner of it so the
 * middle stays the board's:
 *
 * - bottom left, the trainer corner: the player's face is the menu
 *   button, ringed by the egg they carry, with their name, gold and the
 *   egg's steps beside it. The keypad grows out of it.
 * - bottom centre, the place capsule: where they stand and what the sky
 *   and clock are doing, which opens in place into a card of the
 *   windows the world turns over on.
 * - bottom right, the buddy's field moves as round buttons.
 * - top right, the fullscreen switch.
 *
 * A phone keeps the same corners. The keypad opens as a sheet across
 * the foot of the screen with its three groups as tabs, and the
 * capsule shows the sky and the clock alone until it is opened.
 */

/** A glass plate standing on the world: the capsule, the name plate and the fullscreen square */
const GLASS = 'border-2 border-line bg-paper/95 shadow-float backdrop-blur-sm';

/** The waiting count on the trainer button and on a keypad row */
const COUNT = `flex h-5 min-w-5 items-center justify-center rounded-full bg-ember px-1.5
  font-display text-[11px] leading-none font-semibold text-on-accent tabular-nums`;

/** A row of the keypad, and the footer's buttons drawn the same way */
const ROW = `flex h-11 w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-button border-0
  bg-transparent px-2.5 text-left text-sm font-extrabold text-ink shadow-none transition-colors
  duration-(--motion-quick) hover:bg-tide-soft hover:text-tide-dark active:translate-y-0
  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tide
  disabled:cursor-not-allowed disabled:text-muted disabled:opacity-55
  disabled:hover:bg-transparent sm:h-10 sm:text-[13px]`;

/** The theme switch in the keypad's footer, a square of the row's height */
const SQUARE = `flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-button
  border-0 bg-transparent text-ink shadow-none transition-colors duration-(--motion-quick)
  hover:bg-tide-soft hover:text-tide-dark active:translate-y-0 focus-visible:outline-2
  focus-visible:outline-offset-2 focus-visible:outline-tide sm:size-10`;

/** How long the ring round the trainer button is, for drawing the egg's share of it */
const RING_RADIUS = 34;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/**
 * One key on the keypad. An entry without a `dialog` is a place kept
 * for something not built yet, disabled rather than hidden so the other
 * keys never move
 */
interface MenuEntry {
  label: () => string;
  dialog?: GameDialog;
  icon: (props: ComponentProps<'svg'>) => JSX.Element;
}

/** A labelled column of keys. A new key joins its own column, so no other key moves */
interface MenuGroup {
  label: () => string;
  entries: MenuEntry[];
}

/** The notices a player settles from their profile rather than elsewhere */
const PROFILE_NOTICES = new Set<NoticeKind>([
  NoticeKind.FriendRequest,
  NoticeKind.TradeOffer,
  NoticeKind.AuctionWon,
  NoticeKind.AuctionUnsold,
]);

// No Auctions key: the lots are read at an auction board out in the
// world, which is what makes trading somewhere a player goes
const GROUPS: MenuGroup[] = [
  {
    label: m.menu_group_you,
    entries: [
      { label: m.panel_boxes, dialog: GameDialog.Catches, icon: BoxIcon },
      { label: m.panel_bag, dialog: GameDialog.Inventory, icon: BagIcon },
      { label: m.panel_pokedex, dialog: GameDialog.Pokedex, icon: SearchIcon },
      { label: m.panel_profile, dialog: GameDialog.Profile, icon: UserIcon },
    ],
  },
  {
    label: m.menu_group_play,
    entries: [
      { label: m.menu_world, dialog: GameDialog.Map, icon: MapIcon },
      { label: m.panel_quests, dialog: GameDialog.Quests, icon: TrophyIcon },
      { label: m.panel_battle, dialog: GameDialog.Battles, icon: SwordsIcon },
      { label: m.panel_raids, dialog: GameDialog.Raids, icon: FireIcon },
    ],
  },
  {
    label: m.menu_group_inbox,
    entries: [
      { label: m.menu_notices, dialog: GameDialog.Notifications, icon: BellIcon },
      { label: m.panel_gifts, dialog: GameDialog.Gifts, icon: GiftIcon },
      { label: m.panel_news, dialog: GameDialog.News, icon: NewsIcon },
    ],
  },
];

/** The most rows that stagger in; the rest arrive with the sixth */
const STAGGERED_ROWS = 6;

/**
 * Each key's place in the order the keypad's rows rise in, down each
 * column and then across
 */
const ROW_ORDER = new Map<MenuEntry, number>();

for (const group of GROUPS) {
  for (const entry of group.entries) {
    ROW_ORDER.set(entry, Math.min(ROW_ORDER.size, STAGGERED_ROWS));
  }
}

/** The line drawn on each field move's button */
const MOVE_GLYPHS: Record<FieldMove, string> = {
  [Moves.Surf]:
    'M2 10c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2M2 16c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2',
  [Moves.Fly]: 'M20 4C13 4 7 9 5 16l-2 4 4-2c7-2 12-8 13-14zM5 16l8-8',
  [Moves.Dig]: 'M15 3l6 6M18 6l-8 8M7 13l4 4-3 3-4-4z',
  [Moves.Teleport]:
    'M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8',
};

/**
 * How often the hour on the capsule is re-read. The world turns over
 * in five-minute windows and the periods themselves are hours long, so
 * a minute is fine enough to never be seen to be wrong
 */
const CLOCK_TICK = 60_000;

/**
 * The hour the world is reading, as a clock. It is the player's own
 * wall clock, the same reading the chunk under them derives its
 * pokemon from
 */
function worldClock(at: number, format: ClockFormat): string {
  const minutes = Math.floor(at / 60_000) % (24 * 60);
  const hour = Math.floor(minutes / 60);
  const past = String(minutes % 60).padStart(2, '0');

  if (format === '24h') {
    return `${String(hour).padStart(2, '0')}:${past}`;
  }
  // Midnight and noon are both twelve, which is the one case a
  // remainder gets wrong
  const twelve = hour % 12 === 0 ? 12 : hour % 12;

  return hour < 12
    ? m.menu_clock_am({ hour: twelve, minutes: past })
    : m.menu_clock_pm({ hour: twelve, minutes: past });
}

/**
 * What a chunk turns over, and how long each window runs. Read as a
 * countdown: when the next one lands is what somebody standing in a
 * chunk is deciding on
 */
const WINDOWS: [called: () => string, every: number][] = [
  [m.menu_window_pokemon, SNAPSHOT_INTERVAL],
  [m.menu_window_landmarks, LANDMARK_INTERVAL],
  [m.menu_window_weather, WEATHER_INTERVAL],
  [m.menu_window_phenomena, PHENOMENON_INTERVAL],
  [m.menu_window_raids, RAID_INTERVAL],
  [m.menu_window_nests, NEST_INTERVAL],
];

/**
 * How long until a window of this length turns over. Every one of them
 * is counted off the same local instant the chunk counts it off
 */
function until(local: number, every: number): number {
  return every - (local % every);
}

/**
 * A wait, in the largest units that still say something true. "In 2
 * hours" for a wait of two and a half is a clock a player would set
 * something by and be wrong, so the odd minutes stay on
 */
function saidWait(left: number): string {
  const minutes = Math.max(1, Math.ceil(left / 60_000));
  const hours = Math.floor(minutes / 60);
  const past = minutes % 60;

  if (hours === 0) {
    return m.menu_wait_minutes({ count: minutes });
  }
  if (past === 0) {
    return m.menu_wait_hours({ count: hours });
  }
  return m.menu_wait_mixed({ hours, minutes: past });
}

/** When each window next turns over, as a grid of six tiles */
function Windows(props: { now: number }): JSX.Element {
  return (
    <>
      <dl class="grid grid-cols-3 gap-1.5">
        <For each={WINDOWS}>
          {([called, every]) => (
            <div class="flex min-w-0 flex-col rounded-button bg-line-soft px-2 py-1.5">
              <dt class="text-[11px] leading-tight font-extrabold text-ink">{called()}</dt>
              <dd class="font-display text-[13px] font-semibold text-tide-dark tabular-nums">
                {saidWait(until(props.now, every))}
              </dd>
            </div>
          )}
        </For>
      </dl>
      <p class="text-xs text-muted">{m.menu_windows_note()}</p>
    </>
  );
}

/** How far along the carried egg is, as a share of the ring */
function readEggShare(egg: EggWalk | null): number {
  if (egg == null || egg.hatchSteps <= 0) {
    return 0;
  }
  return Math.min(1, egg.steps / egg.hatchSteps);
}

/** The trainer's sheet, or none for the default one while it is unread or unset */
function readSprite(trainer: { sprite: string } | null): string | null {
  return trainer == null || trainer.sprite === '' ? null : trainer.sprite;
}

/** The egg's steps in words, saying so once it is ready */
function sayEgg(egg: EggWalk): string {
  const words = egg.steps >= egg.hatchSteps ? m.board_egg_ready : m.board_egg_steps;

  return words({ steps: egg.steps, hatch: egg.hatchSteps });
}

export default function GameMenu(): JSX.Element {
  const auth = useAuth();
  const game = useGame();
  const [open, setOpen] = createSignal(false);
  /** Where the player stands and the world's clock, opened from the capsule */
  const [details, setDetails] = createSignal(false);
  /** Which group of keys a phone's keypad is showing */
  const [tab, setTab] = createSignal(0);
  const [now, setNow] = createSignal(localNow());
  const [gold, setGold] = createSignal<number | null>(null);
  const [trainer, setTrainer] = createSignal<{ name: string; sprite: string } | null>(null);

  /** The way in, kept so the bound key can hand it the keyboard */
  let button: HTMLButtonElement | undefined;

  /** How many things are waiting on the player, for the trainer button's own count */
  const waiting = (): number => game.notices().length;

  /** Gifts waiting on the shelf and quests ready to claim, read when the keypad opens */
  const [shelf, setShelf] = createSignal({ gifts: 0, quests: 0 });

  const readShelf = (): void => {
    Promise.all([listMysteryGifts(), getDueQuests()])
      .then(([gifts, quests]) => {
        setShelf({ gifts: gifts.length, quests: quests.length });
      })
      .catch(() => {
        // A count that could not be read shows no badge rather than a wrong one
      });
  };

  /** How many things each entry has waiting behind it */
  const countFor = (dialog: GameDialog | undefined): number => {
    if (dialog === GameDialog.Notifications) {
      return waiting();
    }
    if (dialog === GameDialog.Gifts) {
      return shelf().gifts;
    }
    if (dialog === GameDialog.Quests) {
      return shelf().quests;
    }
    if (dialog !== GameDialog.Profile) {
      return 0;
    }
    // What the profile's own tabs resolve: requests, trades and lots
    let count = 0;

    for (const notice of game.notices()) {
      if (PROFILE_NOTICES.has(notice.kind)) {
        count += 1;
      }
    }
    return count;
  };

  /** Opens one panel and closes the other, since both stand over the foot of the screen */
  const only = (panel: 'menu' | 'details'): void => {
    setOpen(panel === 'menu');
    setDetails(panel === 'details');
    if (panel === 'menu') {
      readShelf();
    }
  };

  const openDialog = (dialog: GameDialog): void => {
    setOpen(false);
    game.setDialog(dialog);
  };

  const period = (): string => TIME_OF_DAY_NAMES[getTimeOfDay(now())];
  const clock = (): string => worldClock(now(), settings().clock);
  const place = (): string => game.place() ?? m.menu_somewhere();
  const purse = (): string => m.ui_gold({ amount: formatNumber(gold() ?? 0) });
  const share = (): number => readEggShare(game.egg());

  /**
   * The server's clock for when, put into the player's own zone for
   * which hour, since the chunk under them derives its pokemon from
   * exactly this
   */
  const local = (at: number): number => toLocalTime(at, getLocalOffset());

  /** Read the hour again, measuring the clock only for a tab somebody is looking at */
  const tick = (): void => {
    if (document.visibilityState !== 'visible') {
      setNow(local(serverNow()));
      return;
    }
    syncServerClock()
      .then((at) => {
        setNow(local(at));
      })
      .catch(() => {
        setNow(local(serverNow()));
      });
  };
  onMount(() => {
    const beat = setInterval(tick, CLOCK_TICK);

    document.addEventListener('visibilitychange', tick);

    onCleanup(() => {
      clearInterval(beat);
      document.removeEventListener('visibilitychange', tick);
    });
  });

  syncServerClock()
    .then((at) => {
      setNow(local(at));
    })
    .catch(() => {
      // The device's own clock stands in until a reading lands
    });

  // Watched rather than read once: gold moves at a vendor, on the
  // board and at the end of a raid, and the name and the face change
  // in the profile
  createEffect(() => {
    const user = auth.user();

    if (user == null) {
      setGold(null);
      setTrainer(null);
      return;
    }

    const stop = watchProfile(user.uid, (profile) => {
      setGold(profile?.gold ?? 0);
      setTrainer(profile == null ? null : { name: profile.nickname, sprite: profile.sprite });
    });

    onCleanup(stop);
  });

  /**
   * The bound key puts the keyboard on the trainer button rather than
   * opening the keypad, so a player who pressed it to see where they
   * were can walk on without a panel over the world
   */
  onMount(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (!forTheGame(event) || actionOf(event, settings().keys) !== 'menu') {
        return;
      }
      event.preventDefault();
      button?.focus();
    };

    window.addEventListener('keydown', onKey);
    onCleanup(() => {
      window.removeEventListener('keydown', onKey);
    });
  });

  return (
    <nav
      aria-label={m.menu_game()}
      // Over the whole window and letting presses through to the map,
      // above the map and below anything opened over it. Each piece
      // takes the presses on itself
      class="pointer-events-none fixed inset-0 z-10"
    >
      {/* The trainer corner. Laid out before the capsule so the keypad,
          which grows out of it, can stand over everything else */}
      <Popover
        isOpen={open()}
        onChange={(state: boolean) => {
          if (state) {
            only('menu');
          } else {
            setOpen(false);
          }
        }}
        class="pointer-events-auto absolute bottom-4 left-4 flex flex-col-reverse items-start gap-2
          sm:bottom-5 sm:left-5 sm:flex-row sm:items-center sm:gap-2.5"
      >
        <PopoverButton
          ref={button}
          aria-label={waiting() > 0 ? m.menu_waiting({ count: waiting() }) : m.menu_label()}
          class="relative size-19 shrink-0 cursor-pointer rounded-full border-0 bg-transparent p-0
            shadow-none transition-[translate,scale] duration-(--motion-quick) ease-spring
            hover:-translate-y-0.75 active:translate-y-0 active:scale-92 focus-visible:outline-2
            focus-visible:outline-offset-2 focus-visible:outline-tide"
        >
          {/* The egg's walk so far, round the face. A bare track without one */}
          <svg viewBox="0 0 76 76" class="absolute inset-0 size-full" aria-hidden="true">
            <circle
              cx="38"
              cy="38"
              r={RING_RADIUS}
              stroke-width="5"
              class="fill-paper/95 stroke-line-soft"
            />
            <Show when={game.egg() != null}>
              <circle
                cx="38"
                cy="38"
                r={RING_RADIUS}
                stroke-width="5"
                stroke-linecap="round"
                stroke-dasharray={String(RING_LENGTH)}
                stroke-dashoffset={String(RING_LENGTH * (1 - share()))}
                transform="rotate(-90 38 38)"
                class="fill-none stroke-leaf transition-[stroke-dashoffset] duration-(--motion-move)
                  ease-settle"
              />
            </Show>
          </svg>
          <span
            class="absolute inset-3.5 flex items-center justify-center rounded-full
              bg-tide-soft shadow-[0_3px_0_0_var(--blue-shade)]"
          >
            <PlayerFace sprite={readSprite(trainer())} size={48} />
          </span>
          {/* Keyed, so a new count is a new element and hops as it lands */}
          <Show when={waiting() > 0 ? waiting() : null} keyed>
            {(count) => (
              <span
                aria-hidden="true"
                class={`${COUNT} absolute -top-1 -right-1 h-5.5 min-w-5.5 animate-hop border-2
                  border-paper`}
              >
                {count}
              </span>
            )}
          </Show>
        </PopoverButton>

        <div class={`${GLASS} flex flex-col rounded-[14px] px-3 py-1.5 leading-[17px]`}>
          <Show when={trainer()?.name}>
            {(name) => <span class="text-[13px] font-extrabold text-ink">{name()}</span>}
          </Show>
          <span class="font-display text-[13px] font-semibold text-gold-dark tabular-nums">
            {purse()}
          </span>
          <Show when={game.egg()}>
            {(egg) => (
              <span class="text-[11px] font-extrabold text-leaf-dark tabular-nums">
                {sayEgg(egg())}
              </span>
            )}
          </Show>
        </div>

        {/* Grown out of the trainer button and shrunk back into it. On a
            phone it is a sheet across the foot of the screen, grown out
            of the same corner */}
        <Transition
          show={open()}
          {...GROW}
          class="fixed inset-x-0 bottom-0 z-30 origin-[52px_100%] sm:absolute sm:inset-x-auto
            sm:bottom-full sm:left-0 sm:mb-3 sm:w-130 sm:max-w-[calc(100vw-2.5rem)]
            sm:origin-[38px_calc(100%+50px)]"
        >
          <PopoverPanel
            class="flex flex-col overflow-hidden rounded-t-sheet border-2 border-b-0 border-line
              bg-paper shadow-sheet sm:rounded-sheet sm:border-b-2"
          >
            {/* A phone has room for one column, so the three are tabs */}
            <div class="mx-2.5 mt-2.5 flex gap-1 rounded-full bg-line-soft p-1 sm:hidden">
              <For each={GROUPS}>
                {(group, index) => (
                  <button
                    type="button"
                    aria-pressed={tab() === index()}
                    class="h-9 flex-1 cursor-pointer rounded-full border-0 bg-transparent text-sm
                      font-extrabold text-muted shadow-none transition-colors
                      duration-(--motion-quick) active:translate-y-0 aria-pressed:bg-paper
                      aria-pressed:text-tide-dark aria-pressed:shadow-rest"
                    onClick={() => {
                      setTab(index());
                    }}
                  >
                    {group.label()}
                  </button>
                )}
              </For>
            </div>

            <div class="grid gap-1 p-2.5 sm:grid-cols-3">
              <For each={GROUPS}>
                {(group, index) => (
                  <div
                    role="group"
                    aria-label={group.label()}
                    class={`${tab() === index() ? 'flex' : 'hidden sm:flex'} min-w-0 flex-col`}
                  >
                    <span
                      aria-hidden="true"
                      class="hidden px-2.5 py-1 text-[10px] font-extrabold tracking-[0.12em]
                        text-tide uppercase sm:block"
                    >
                      {group.label()}
                    </span>
                    <For each={group.entries}>
                      {(entry) => (
                        <button
                          type="button"
                          class={`${ROW} animate-rise`}
                          style={{
                            'animation-delay': `calc(var(--motion-stagger) * ${ROW_ORDER.get(entry) ?? 0})`,
                          }}
                          disabled={entry.dialog == null}
                          // The word alone reads as something the game can do and will not
                          title={
                            entry.dialog == null
                              ? m.menu_not_yet({ label: entry.label() })
                              : entry.label()
                          }
                          onClick={() => {
                            if (entry.dialog != null) {
                              openDialog(entry.dialog);
                            }
                          }}
                        >
                          <Dynamic
                            component={entry.icon}
                            class="size-5 shrink-0 text-tide"
                            aria-hidden="true"
                          />
                          <span class="min-w-0 truncate">{entry.label()}</span>
                          <Show when={countFor(entry.dialog) > 0}>
                            <span class={`${COUNT} ml-auto`}>{countFor(entry.dialog)}</span>
                          </Show>
                        </button>
                      )}
                    </For>
                  </div>
                )}
              </For>
            </div>

            {/* Settings and the day or night switch change how the game
                behaves rather than where the player goes, so they sit
                under the keys rather than among them. A phone's sheet
                covers the trainer button, so it carries its own way out */}
            <div
              class="flex items-center gap-1.5 border-t-2 border-line-soft bg-parchment/60 px-2.5
                pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:pb-2"
            >
              <button
                type="button"
                class={`${ROW} w-auto sm:hidden`}
                onClick={() => {
                  setOpen(false);
                }}
              >
                {m.ui_close()}
              </button>
              <button
                type="button"
                class={`${ROW} w-auto`}
                onClick={() => {
                  openDialog(GameDialog.Settings);
                }}
              >
                <SettingsIcon class="size-5 shrink-0 text-tide" aria-hidden="true" />
                {m.panel_settings()}
              </button>
              <span class="grow" />
              <ThemeToggle class={SQUARE} />
            </div>
          </PopoverPanel>
        </Transition>
      </Popover>

      {/* The place capsule, which opens into its card in the same spot */}
      <Popover
        isOpen={details()}
        onChange={(state: boolean) => {
          if (state) {
            only('details');
          } else {
            setDetails(false);
          }
        }}
        class="pointer-events-auto absolute bottom-4 left-1/2 flex -translate-x-1/2 sm:bottom-5"
      >
        {/* Read straight rather than through a callback `Show`, which
            untracks the call and would hold the first place stood in */}
        <PopoverButton
          class={`${GLASS} flex max-w-[calc(100vw-14rem)] sm:max-w-[min(34rem,calc(100vw-22rem))] min-w-0 cursor-pointer
            items-center gap-3 rounded-[22px] py-2 pr-4.5 pl-2 text-left transition-[translate,opacity]
            duration-(--motion-quick) ease-spring hover:-translate-y-0.5 active:translate-y-0
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tide
            ${details() ? 'pointer-events-none opacity-0' : ''}`}
        >
          {(() => {
            const sky = game.weather();

            return sky == null ? (
              ''
            ) : (
              <span
                class="flex size-10 shrink-0 items-center justify-center rounded-button
                  bg-gold-soft text-gold-dark"
              >
                <Dynamic component={getWeatherIcon(sky)} class="size-5.5" aria-hidden="true" />
              </span>
            );
          })()}
          {/* A phone has room for the clock alone */}
          <span class="font-display text-[15px] font-semibold whitespace-nowrap text-ink sm:hidden">
            {clock()}
          </span>
          <span class="hidden min-w-0 flex-col sm:flex">
            <span class="truncate font-display text-lg leading-6 font-semibold text-ink">
              {place()}
            </span>
            <span class="truncate text-xs font-bold text-muted">
              {(() => {
                const sky = game.weather();

                return sky == null ? '' : `${WEATHER_NAMES[sky]} · `;
              })()}
              {period()} {clock()}
            </span>
          </span>
        </PopoverButton>
        <Transition
          show={details()}
          {...MORPH}
          class="absolute bottom-0 left-1/2 z-30 -ml-[min(180px,calc(50vw-1rem))]
            w-[min(360px,calc(100vw-2rem))] origin-bottom"
        >
          <PopoverPanel
            class="flex flex-col gap-2.5 rounded-sheet border-2 border-line bg-paper p-3.5 text-sm
              shadow-sheet"
          >
            <div class="flex items-center justify-between gap-3">
              <span class="min-w-0 font-display text-lg leading-6 font-semibold text-ink">
                {place()}
              </span>
              <CloseButton
                onPress={() => {
                  setDetails(false);
                }}
              />
            </div>
            {/* Said outright rather than behind a hover, which a phone
                has no way to open */}
            <div class="flex items-start gap-2.5 rounded-card bg-gold-soft p-2.5">
              {(() => {
                const sky = game.weather();

                return sky == null ? (
                  ''
                ) : (
                  <Dynamic
                    component={getWeatherIcon(sky)}
                    class="size-7.5 shrink-0 text-gold-dark"
                    aria-hidden="true"
                  />
                );
              })()}
              <div class="flex min-w-0 flex-col gap-1">
                <span class="font-extrabold text-ink">
                  {(() => {
                    const sky = game.weather();

                    return sky == null ? '' : `${WEATHER_NAMES[sky]} · `;
                  })()}
                  {period()}, {clock()}
                </span>
                {(() => {
                  const sky = game.weather();

                  return sky == null ? (
                    ''
                  ) : (
                    <>
                      <p class="text-xs text-muted">{WEATHER_DESCRIPTIONS[sky]}</p>
                      <WeatherFavors weather={sky} />
                    </>
                  );
                })()}
              </div>
            </div>
            <Windows now={now()} />
          </PopoverPanel>
        </Transition>
      </Popover>

      {/* The buddy's field moves, only while there is one to use here.
          Stacked up the right edge on a phone, where the thumb is */}
      <Show when={game.fieldMoves().length > 0}>
        <div
          class="pointer-events-auto absolute right-4 bottom-4 flex flex-col-reverse gap-3
            sm:right-5 sm:bottom-5 sm:flex-row sm:gap-3.5"
        >
          <For each={game.fieldMoves()}>
            {(offer) => (
              <button
                type="button"
                aria-pressed={offer.active}
                disabled={offer.busy}
                class="group flex cursor-pointer flex-col items-center gap-1 border-0 bg-transparent
                  p-0 text-[11px] font-extrabold text-white shadow-none
                  [text-shadow:0_1px_0_rgb(0_0_0/0.45)] active:translate-y-0
                  disabled:cursor-not-allowed disabled:opacity-55"
                onClick={() => {
                  offer.use();
                }}
              >
                <span
                  class="flex size-square items-center justify-center rounded-full border-3
                    border-tide bg-paper text-tide shadow-[0_3px_0_0_rgb(16_46_99/0.35)]
                    transition-[translate,scale,background-color,color] duration-(--motion-quick)
                    ease-spring group-hover:-translate-y-0.75 group-active:translate-y-0
                    group-active:scale-90 group-focus-visible:outline-2
                    group-focus-visible:outline-offset-2 group-focus-visible:outline-tide
                    group-aria-pressed:bg-tide group-aria-pressed:text-on-accent
                    group-aria-pressed:shadow-[0_3px_0_0_var(--blue-shade),0_0_0_4px_rgb(35_96_200/0.25)]"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.25"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="size-6"
                    aria-hidden="true"
                  >
                    <path d={MOVE_GLYPHS[offer.move]} />
                  </svg>
                </span>
                {offer.name}
              </button>
            )}
          </For>
        </div>
      </Show>

      {/* Top right, where a window keeps its own */}
      <div class="pointer-events-auto absolute top-4 right-4">
        <FullscreenToggle
          class={`${GLASS} flex size-target cursor-pointer items-center justify-center
            rounded-[14px] text-ink transition-colors duration-(--motion-quick) hover:border-tide
            hover:text-tide-dark active:translate-y-0 focus-visible:outline-2
            focus-visible:outline-offset-2 focus-visible:outline-tide`}
        />
      </div>
    </nav>
  );
}
