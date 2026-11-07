import { For, type JSX, type Resource, Show, Suspense } from 'solid-js';
import { Portal } from 'solid-js/web';
import {
  DialogDescription,
  DialogOverlay,
  DialogPanel,
  DialogTitle,
  Dialog as HeadlessDialog,
  Transition,
  TransitionChild,
} from 'terracotta';
import type { CandyEarned } from '../../../../auth/battles';
import type { Profile } from '../../../../auth/profile';
import { getSpeciesData } from '../../../../data/species';
import type { Spoils } from '../../../app/game-context';
import { Button, usePortalHost } from '../../../styled';
import { SHEER } from '../../../styled/transition';
import TeamsPreview from '../../TeamsPreview';
import { LABEL } from '../plates';
import type { SideSummary, SideUnit } from '../summary';
import { m } from '../../../../i18n/paraglide/messages.js';
import Podium from './Podium';
import Rewards, { hasRewards } from './Rewards';
import TeamCard from './TeamCard';

/**
 * What a settled fight says about itself, over the field it was fought
 * on: the word for how it went and its line, what it paid, both teams
 * with what they dealt, the best pokemon on a podium, and the two ways
 * out. Escape and a press on the veil stay and look, as the dock's way
 * out does.
 */
export interface ResultsScreenProps {
  /** The verdict, or null while the fight is still being fought */
  verdict: () => { title: string; said: string } | null;
  /** How it went for the reader's side */
  outcome: 'won' | 'lost' | 'draw' | null;
  /** What the fight paid, once it is claimed */
  spoils: Spoils | null;
  candy: CandyEarned[];
  dismissed: boolean;
  onDismiss: () => void;
  /** Whether whole teams are ranked rather than single pokemon */
  raiding: boolean;
  sides: SideSummary[];
  /** Who the rows belong to. Read here, under the screen's boundary */
  names: Resource<Map<string, Profile>>;
  /** The reader, who is called "You" rather than by their nickname */
  player: string;
  /**
   * Who was fought, where the other side belongs to nobody: a grunt,
   * a duelling trainer, a gym leader. Null for a fight between
   * players, and for a replay, which arrives with no overworld behind
   * it
   */
  opponent: { name: string; sprite: string } | null;
  /** The teams as they were frozen for a raid, for its own summary */
  teams: string[] | null;
  replay: boolean;
  onLeave: () => void;
}

/** When each part rises in after the screen opens, in milliseconds */
const FIRST_TEAM = 420;
const TEAM_STEP = 60;
const PODIUM_DELAY = 520;
const BUTTONS_DELAY = 600;

/** The body of the screen, under the boundary the names are read beneath */
function ResultsBody(
  props: ResultsScreenProps & { said: { title: string; said: string } },
): JSX.Element {
  /**
   * What a side's header calls its owner. The reader is "You"; a side
   * nobody owns is whoever staged it, and otherwise whatever led it
   * out
   */
  const sideName = (side: SideSummary): string => {
    if (side.player === '') {
      return props.opponent?.name ?? getSpeciesData(side.lead).name;
    }
    if (side.player === props.player) {
      return m.battle_you();
    }
    return props.names()?.get(side.player)?.nickname ?? m.duels_a_trainer();
  };

  /** The face beside that name. A side nobody owns wears the character they stood in */
  const sideSprite = (side: SideSummary): string | null =>
    side.player === ''
      ? (props.opponent?.sprite ?? null)
      : (props.names()?.get(side.player)?.sprite ?? null);

  const total = (): number => {
    let sum = 0;

    for (const side of props.sides) {
      sum += side.dealt;
    }
    return sum;
  };
  const share = (side: SideSummary): number => (total() <= 0 ? 0 : side.dealt / total());

  /** Whether the reader has a side of their own to mark the result on */
  const reading = (): boolean => {
    for (const side of props.sides) {
      if (side.player === props.player) {
        return true;
      }
    }
    return false;
  };

  /** Won or Lost for a side, from the reader's result; nothing for a draw or an onlooker */
  const mark = (side: SideSummary): 'won' | 'lost' | null => {
    if (!reading() || props.outcome == null || props.outcome === 'draw') {
      return null;
    }
    const mine = side.player === props.player;

    return (props.outcome === 'won') === mine ? 'won' : 'lost';
  };

  /** The reader's side first, so theirs stands on the left as it did on the field */
  const ordered = (): SideSummary[] => {
    const own: SideSummary[] = [];
    const rest: SideSummary[] = [];

    for (const side of props.sides) {
      (side.player !== '' && side.player === props.player ? own : rest).push(side);
    }
    return [...own, ...rest];
  };

  /** The top damage dealer across every side, and whose it was */
  const best = (): { unit: SideUnit; side: SideSummary } | null => {
    let found: { unit: SideUnit; side: SideSummary } | null = null;

    for (const side of props.sides) {
      for (const unit of side.units) {
        if (found == null || unit.dealt > found.unit.dealt) {
          found = { unit, side };
        }
      }
    }
    return found != null && found.unit.dealt > 0 ? found : null;
  };

  return (
    <>
      {/* Focusable, so the dialog's first focus lands on the word at the
          top: landing on the buttons scrolled a phone's column past it.
          Terracotta's first focus skips tabindex -1, so it stays 0 */}
      <DialogTitle
        tabIndex={0}
        class="motion-crossfade m-0 outline-none text-center font-display text-5xl font-bold tracking-[0.02em]
          text-white animate-[grow-in_var(--motion-scene)_var(--ease-spring)_backwards] sm:text-[64px]"
      >
        {props.said.title}
      </DialogTitle>
      <DialogDescription class="m-0 max-w-xl text-center text-[15px] text-white/85">
        {props.said.said}
      </DialogDescription>

      <Show when={hasRewards(props.spoils, props.candy)}>
        <Rewards spoils={props.spoils} candy={props.candy} />
      </Show>

      {/* Both teams with the podium between them; a phone stacks them,
          the podium after the teams */}
      <Show when={!props.raiding && props.sides.length > 0}>
        <div class="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:items-end sm:gap-4">
          <For each={ordered()}>
            {(side, at) => (
              <>
                <Show when={at() === 1}>
                  <Show when={best()}>
                    {(top) => (
                      <div class="order-last sm:order-none">
                        <Podium
                          unit={top().unit}
                          side={sideName(top().side)}
                          delay={PODIUM_DELAY}
                        />
                      </div>
                    )}
                  </Show>
                </Show>
                <TeamCard
                  side={side}
                  name={sideName(side)}
                  sprite={sideSprite(side)}
                  mark={mark(side)}
                  share={share(side)}
                  delay={FIRST_TEAM + at() * TEAM_STEP}
                />
              </>
            )}
          </For>
        </div>
      </Show>

      {/* A raid's teams as they were frozen, each as the fight left it */}
      <Show when={props.raiding ? props.teams : null}>
        {(stamped) => (
          <div class="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:items-end sm:gap-4">
            <section
              class="motion-crossfade flex w-full flex-col gap-1.5 rounded-[20px] border-2 border-line
                bg-paper p-3 text-ink animate-[rise-in_var(--motion-move)_var(--ease-spring)_backwards]
                sm:w-[min(36rem,60vw)]"
              style={{ 'animation-delay': `${FIRST_TEAM}ms` }}
            >
              <h2 class={LABEL}>{m.verdict_damage_dealt()}</h2>
              <div class="max-h-[40vh] overflow-y-auto">
                <TeamsPreview teams={stamped()} player={props.player} sides={props.sides} />
              </div>
            </section>
            <Show when={best()}>
              {(top) => (
                <Podium unit={top().unit} side={sideName(top().side)} delay={PODIUM_DELAY} />
              )}
            </Show>
          </div>
        )}
      </Show>

      {/* The way out on the left, the main action on the right */}
      <div
        class="motion-crossfade flex gap-2.5 animate-[rise-in_var(--motion-move)_var(--ease-settle)_backwards]"
        style={{ 'animation-delay': `${BUTTONS_DELAY}ms` }}
      >
        <Button
          class="h-10 px-3.5"
          onClick={() => {
            props.onDismiss();
          }}
        >
          {m.verdict_stay()}
        </Button>
        <Button tone="primary" class="h-10 px-3.5" onClick={props.onLeave}>
          {props.replay ? m.verdict_exit_replay() : m.verdict_leave_battle()}
        </Button>
      </div>
    </>
  );
}

export default function ResultsScreen(props: ResultsScreenProps): JSX.Element {
  const host = usePortalHost();

  return (
    <Show when={props.verdict()}>
      {(said) => (
        <Portal mount={host()}>
          {/* The wrapper only says when the screen is there; the veil
              and the body carry the fades */}
          <Transition appear unmount show={!props.dismissed}>
            <HeadlessDialog
              isOpen
              unmount={false}
              onClose={() => {
                props.onDismiss();
              }}
              data-open={props.dismissed ? undefined : ''}
              class={props.dismissed ? 'pointer-events-none' : undefined}
            >
              <TransitionChild {...SHEER} class="fixed inset-0 z-40">
                <DialogOverlay class="size-full bg-shade/75 backdrop-blur-[2px]" />
              </TransitionChild>
              <Suspense>
                <TransitionChild {...SHEER} class="fixed inset-0 z-40 overflow-y-auto">
                  <DialogPanel
                    class="flex min-h-full flex-col items-center justify-center-safe gap-3.5 px-4 py-6"
                    // The panel covers the veil, so a press on its own
                    // empty ground is the press outside that stays
                    onClick={(event: MouseEvent) => {
                      if (event.target === event.currentTarget) {
                        props.onDismiss();
                      }
                    }}
                  >
                    <ResultsBody {...props} said={said()} />
                  </DialogPanel>
                </TransitionChild>
              </Suspense>
            </HeadlessDialog>
          </Transition>
        </Portal>
      )}
    </Show>
  );
}
