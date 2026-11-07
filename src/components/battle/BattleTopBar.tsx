import {
  Index,
  type JSX,
  Show,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
} from 'solid-js';
import type Battle from '../../battle/battle';
import { EventPriority } from '../../core/event-emitter';
import { SpriteAnim } from '../../data/ids/sprite-anims';
import type { RaidKind } from '../../model/raid-record';
import AnimatedSprite from '../sprites/AnimatedSprite';
import { Button } from '../styled';
import { GLASS, HealthTrack, StandingCount } from './battle-view/plates';
import { BOSS_TICKS, describeKind, describeTick } from './battle-view/raid-kind';
import {
  type BossStanding,
  STANDING_EVENTS,
  type SideStanding,
  type Standing,
  readStanding,
} from './battle-view/standing';
import { m } from '../../i18n/paraglide/messages.js';

/**
 * The furniture over a fight, in the corners of the field: how each
 * side stands, what the fight is, and the way out.
 *
 * A fight between two sides puts yours on a plate at the top left and
 * the other mirrored at the top right, with the title on a nameplate
 * between them. A raid puts the boss on a banner at the top centre and
 * your side on a plate at the bottom left. Leave is at the bottom
 * right in both.
 *
 * Everything sits in a frame capped at 16:9 of the screen's height, so
 * on a wide screen the corners stay beside the fight rather than out
 * at the edges. Widths inside it are in `cqw` of that frame.
 */

/** The speeds a replay may be played at */
const SPEEDS = [1, 2, 3] as const;

/** How long a callout stays up once the boss passes a tick, in milliseconds */
const CALLOUT_TIME = 1800;

export interface BattleTopBarProps {
  battle: Battle;
  /** Whose view it is, which decides which side is "yours" */
  player: string;
  title: string;
  replay?: boolean;
  /** How fast a replay plays, offered only where `onSpeed` is given */
  speed?: number;
  onSpeed?: (speed: number) => void;
  /** The way out. Left out where there is nowhere to leave to, like a demo */
  onLeave?: () => void;
  /** What kind of raid it is, for the banner's badge and its callouts */
  kind?: RaidKind | null;
  /**
   * Whether Leave stands over the inspector's sheet. On a phone the
   * inspector covers the foot of the screen, so Leave rises to its edge
   */
  raised?: boolean;
}

/** The title, or Replay with its Awards nothing chip, as one run of text */
function TitleText(props: { title: string; replay: boolean; chip: string }): JSX.Element {
  return (
    <>
      <span class="truncate">{props.replay ? m.battle_replay() : props.title}</span>
      <Show when={props.replay}>
        <span
          class={`shrink-0 rounded-full px-2 py-0.5 font-sans text-[10px] font-extrabold ${props.chip}`}
        >
          {m.battle_awards_nothing()}
        </span>
      </Show>
    </>
  );
}

/** The three speeds side by side, the one in play pressed */
function SpeedGroup(props: { speed: number; onSpeed: (speed: number) => void }): JSX.Element {
  return (
    <div
      class={`pointer-events-auto flex gap-[3px] rounded-button p-[3px] ${GLASS}`}
      role="group"
      aria-label={m.battle_replay_speed()}
    >
      <Index each={SPEEDS}>
        {(speed) => (
          <button
            type="button"
            aria-pressed={props.speed === speed()}
            class={`h-[30px] rounded-[10px] border-2 px-2.5 text-[13px] font-extrabold tabular-nums
              shadow-rest active:translate-y-0 ${
                props.speed === speed()
                  ? 'border-tide-dark bg-tide text-on-accent hover:text-on-accent'
                  : 'border-line bg-paper text-ink hover:border-tide'
              }`}
            onClick={() => {
              props.onSpeed(speed());
            }}
          >
            {m.battle_speed({ speed: speed() })}
          </button>
        )}
      </Index>
    </div>
  );
}

/** One button that steps through the speeds, for a phone's single line */
function SpeedCycle(props: { speed: number; onSpeed: (speed: number) => void }): JSX.Element {
  return (
    <button
      type="button"
      aria-label={m.battle_speed_cycle({ speed: props.speed })}
      class={`pointer-events-auto h-8 shrink-0 rounded-button px-3 text-[13px] font-extrabold
        tabular-nums active:translate-y-0 ${GLASS}`}
      onClick={() => {
        // The next speed up, and back to the first after the last
        let next: number = SPEEDS[0];

        for (const speed of SPEEDS) {
          if (speed > props.speed) {
            next = speed;
            break;
          }
        }
        props.onSpeed(next);
      }}
    >
      {m.battle_speed({ speed: props.speed })}
    </button>
  );
}

/**
 * One side's plate: its name and pips over its health. A phone lays it
 * out as one row across the top; from `sm` it is a card in its corner,
 * the foe's mirrored so both drain towards the middle
 */
function SidePlate(props: { side: SideStanding; mirrored: boolean; class?: string }): JSX.Element {
  return (
    <div
      class={`flex items-center gap-2 rounded-card px-3 py-1.5 sm:flex-col sm:items-stretch
        sm:gap-1.5 sm:rounded-[20px] sm:px-3.5 sm:py-2.5 ${GLASS} ${props.class ?? ''}`}
    >
      <div
        class={`flex shrink-0 items-center gap-2 sm:justify-between ${
          props.mirrored ? 'sm:flex-row-reverse' : ''
        }`}
      >
        <span class="truncate font-display text-[15px] font-semibold sm:text-lg">
          {props.side.label}
        </span>
        <StandingCount
          balls={props.side.balls}
          standing={props.side.standing}
          total={props.side.total}
        />
      </div>
      <HealthTrack
        value={props.side.health}
        tone={props.side.friendly ? 'leaf' : 'ember'}
        mirrored={props.mirrored}
        class="h-3 min-w-0 grow sm:h-3.5"
        label={m.battle_health_left({ percent: Math.round(props.side.health * 100) })}
      />
    </div>
  );
}

/**
 * The raid's banner: the boss's face and name, what kind of raid it is,
 * its share left and the ticks it staggers or calls at
 */
function RaidBanner(props: {
  boss: BossStanding;
  title: string;
  replay: boolean;
  kind: RaidKind | null;
}): JSX.Element {
  const badge = (): ReturnType<typeof describeKind> | null =>
    props.kind == null ? null : describeKind(props.kind, props.boss.teraType);
  const percent = (): number => Math.round(props.boss.health * 100);

  return (
    <div
      class={`motion-crossfade flex items-center gap-2.5 rounded-[22px] py-2 pr-3 pl-2 sm:gap-3.5
        sm:pt-2.5 sm:pr-4 sm:pb-3 sm:pl-3 animate-[grow-in_var(--motion-scene)_var(--ease-spring)_backwards]
        ${GLASS}`}
    >
      <span
        class="relative box-border size-11 shrink-0 overflow-hidden rounded-[14px] border-[3px]
          border-ink bg-line-soft sm:size-16 sm:rounded-card"
      >
        <AnimatedSprite
          species={props.boss.appearance}
          shiny={props.boss.shiny}
          animation={SpriteAnim.Idle}
          direction="Down"
          label=""
          fill
        />
      </span>
      <div class="flex min-w-0 grow flex-col gap-1 sm:gap-[5px]">
        <div class="flex min-w-0 items-center gap-2">
          <span
            class="flex min-w-0 items-center gap-1.5 text-[11px] font-extrabold tracking-[0.1em]
              text-muted uppercase"
          >
            <TitleText title={props.title} replay={props.replay} chip="bg-line-soft text-muted" />
          </span>
          <Show when={badge()}>
            {(shown) => (
              <span
                class={`flex h-5 shrink-0 items-center rounded-full px-2 text-[10px] font-extrabold
                  uppercase ${shown().tone}`}
                style={shown().color == null ? undefined : { 'background-color': shown().color }}
              >
                {shown().label}
              </span>
            )}
          </Show>
        </div>
        <div class="flex items-baseline justify-between gap-2">
          <span class="truncate font-display text-lg font-semibold sm:text-[22px]">
            {props.boss.label}
          </span>
          <span class="shrink-0 font-display text-muted tabular-nums">
            {m.battle_boss_left({ percent: percent() })}
          </span>
        </div>
        <HealthTrack
          value={props.boss.health}
          tone="ember"
          class="h-3 border border-line sm:h-4"
          ticks={BOSS_TICKS}
          label={m.battle_health_left({ percent: percent() })}
        />
      </div>
    </div>
  );
}

export default function BattleTopBar(props: BattleTopBarProps): JSX.Element {
  // The engine mutates units in place, so the plates are read again on
  // every event that moves a side's standing
  const [beat, setBeat] = createSignal(0);
  const bump = (): void => {
    setBeat((count) => count + 1);
  };

  for (const event of STANDING_EVENTS) {
    props.battle.on(event, EventPriority.Post, bump);
  }
  onCleanup(() => {
    for (const event of STANDING_EVENTS) {
      props.battle.off(event, EventPriority.Post, bump);
    }
  });

  const standing = createMemo((): Standing => {
    beat();
    return readStanding(props.battle, props.player);
  });

  const yours = (): SideStanding | undefined => standing().sides.at(0);
  const theirs = (): SideStanding | undefined => standing().sides.at(1);
  const bossHealth = createMemo((): number | null => standing().boss?.health ?? null);
  const replay = (): boolean => props.replay === true;

  // The ticks the boss has already gone under. The first reading only
  // marks them, so a replay or a late spectator is not shouted at for
  // ticks passed before they arrived
  const passed = new Set<number>();
  let first = true;
  const [callout, setCallout] = createSignal<{ text: string; at: number } | null>(null);
  let clearing: ReturnType<typeof setTimeout> | undefined;

  createEffect(
    on(bossHealth, (health) => {
      if (health == null) {
        return;
      }

      // Every tick the health is now under, newest last
      let crossed: number | null = null;

      for (const tick of BOSS_TICKS) {
        if (health <= tick && !passed.has(tick)) {
          passed.add(tick);
          crossed = tick;
        }
      }
      if (first) {
        first = false;
        return;
      }
      if (crossed == null) {
        return;
      }

      // One callout at a time; a new one replaces the last
      const text = describeTick(props.kind ?? null, crossed);

      clearTimeout(clearing);
      setCallout({ text, at: Date.now() });
      clearing = setTimeout(() => {
        setCallout(null);
      }, CALLOUT_TIME);
    }),
  );
  onCleanup(() => {
    clearTimeout(clearing);
  });

  return (
    <div
      class="pointer-events-none absolute inset-0 z-10 mx-auto max-w-[calc(100dvh*16/9)]
        @container"
    >
      <Show
        when={standing().boss}
        fallback={
          // Two sides: plates in the top corners, the nameplate between.
          // A phone stacks the three down the top edge instead
          <div class="absolute inset-x-2 top-2 flex flex-col gap-1.5 sm:contents">
            <Show when={yours()}>
              {(side) => (
                <SidePlate
                  side={side()}
                  mirrored={false}
                  class="sm:absolute sm:top-3.5 sm:left-3.5 sm:w-[min(360px,30cqw)]"
                />
              )}
            </Show>
            <Show when={theirs()}>
              {(side) => (
                <SidePlate
                  side={side()}
                  mirrored
                  class="sm:absolute sm:top-3.5 sm:right-3.5 sm:w-[min(360px,30cqw)]"
                />
              )}
            </Show>

            <div
              class="flex items-center justify-center gap-1.5 sm:absolute sm:top-3.5 sm:left-1/2
                sm:max-w-[36cqw] sm:-translate-x-1/2 sm:flex-col"
            >
              <span
                class="flex h-8 min-w-0 items-center gap-2 rounded-full bg-tide px-3.5 font-display
                  text-[15px] font-semibold text-on-accent shadow-[0_3px_0_0_var(--blue-shade)]
                  sm:h-10 sm:max-w-full sm:px-[18px] sm:text-[17px]"
              >
                <TitleText title={props.title} replay={replay()} chip="bg-white/20" />
              </span>
              <Show when={props.onSpeed}>
                {(choose) => (
                  <>
                    <span class="hidden sm:block">
                      <SpeedGroup speed={props.speed ?? 1} onSpeed={choose()} />
                    </span>
                    <span class="sm:hidden">
                      <SpeedCycle speed={props.speed ?? 1} onSpeed={choose()} />
                    </span>
                  </>
                )}
              </Show>
            </div>
          </div>
        }
      >
        {(boss) => (
          <>
            {/* The boss across the top, the speeds of a replay under it */}
            <div
              class="absolute inset-x-2 top-2 flex flex-col items-center gap-1.5 sm:inset-x-auto
                sm:top-3 sm:left-1/2 sm:w-[min(640px,56cqw)] sm:-translate-x-1/2"
            >
              <div class="w-full">
                <RaidBanner
                  boss={boss()}
                  title={props.title}
                  replay={replay()}
                  kind={props.kind ?? null}
                />
              </div>
              <Show when={props.onSpeed}>
                {(choose) => (
                  <>
                    <span class="hidden sm:block">
                      <SpeedGroup speed={props.speed ?? 1} onSpeed={choose()} />
                    </span>
                    <span class="sm:hidden">
                      <SpeedCycle speed={props.speed ?? 1} onSpeed={choose()} />
                    </span>
                  </>
                )}
              </Show>

              {/* Said once as the boss passes a tick, under the banner. The
                  region stays mounted so a screen reader hears each one */}
              <span class="sr-only" role="status">
                {callout()?.text ?? ''}
              </span>
              <Show when={callout()} keyed>
                {(said) => (
                  <span
                    class="motion-crossfade mt-6 animate-[grow-in_var(--motion-move)_var(--ease-spring)_backwards]
                      rounded-none border-0 bg-transparent p-0 text-center font-display text-2xl font-bold
                      text-white shadow-none [paint-order:stroke_fill]
                      [-webkit-text-stroke:4px_var(--color-shade)] sm:mt-14 sm:text-[28px]"
                    aria-hidden="true"
                    data-at={said.at}
                  >
                    {said.text}
                  </span>
                )}
              </Show>
            </div>

            {/* The party's side, in the bottom left */}
            <Show when={yours()}>
              {(side) => (
                <div
                  class={`absolute bottom-2 left-2 flex w-[min(300px,calc(100%-7rem))] flex-col
                    gap-1.5 rounded-card px-3.5 py-2.5 sm:bottom-3.5 sm:left-3.5
                    sm:w-[min(300px,34cqw)] ${GLASS} ${
                      props.raised === true ? 'max-sm:bottom-[calc(46dvh+0.5rem)]' : ''
                    }`}
                >
                  <div class="flex items-center justify-between gap-2">
                    <span class="truncate font-display text-[17px] font-semibold">
                      {side().label}
                    </span>
                    <span class="shrink-0 text-xs font-extrabold text-muted tabular-nums">
                      {m.battle_standing({ standing: side().standing, total: side().total })}
                    </span>
                  </div>
                  <HealthTrack
                    value={side().health}
                    tone="leaf"
                    class="h-3 border border-line"
                    label={m.battle_health_left({ percent: Math.round(side().health * 100) })}
                  />
                </div>
              )}
            </Show>
          </>
        )}
      </Show>

      <Show when={props.onLeave}>
        {(leave) => (
          <span
            class={`pointer-events-auto absolute right-2 bottom-2 sm:right-3.5 sm:bottom-3.5 ${
              props.raised === true ? 'max-sm:bottom-[calc(46dvh+0.5rem)]' : ''
            }`}
          >
            <Button
              class="h-10 px-3.5"
              onClick={() => {
                leave()();
              }}
            >
              {m.duels_leave()}
            </Button>
          </span>
        )}
      </Show>
    </div>
  );
}
