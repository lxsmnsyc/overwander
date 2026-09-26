import { For, type JSX, type Resource, Show } from 'solid-js';
import type { CandyEarned } from '../../../auth/battles';
import type { Profile } from '../../../auth/profile';
import { AWARD_NAMES } from '../../../data/ids/awards';
import { SpriteAnim } from '../../../data/ids/sprite-anims';
import { getItemData } from '../../../data/items';
import { getFamilyName, getSpeciesData } from '../../../data/species';
import type { Spoils } from '../../app/game-context';
import ItemSprite from '../../items/ItemSprite';
import { AwardArt } from '../../profile/AwardsCard';
import PlayerPlate from '../../profile/PlayerPlate';
import AnimatedSprite from '../../sprites/AnimatedSprite';
import CandySprite from '../../sprites/CandySprite';
import { Badge, Button, Dialog, DialogActions, Meta } from '../../styled';
import TeamsPreview from '../TeamsPreview';
import type { SideSummary, SideUnit } from './summary';

/**
 * What a settled fight says about itself: the word for how it went,
 * what it paid, who dealt what, and the two ways out of the field.
 */
export interface VerdictDialogProps {
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
  /** Who the rows belong to. Read here, under the dialog's boundary */
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
  shares: Map<string, number>;
  replay: boolean;
  onLeave: () => void;
}

/** A side's frame, by how the fight went for it */
const FRAMES: Record<'won' | 'lost' | 'none', string> = {
  won: 'border-leaf bg-leaf-soft',
  lost: 'border-ember bg-ember-soft',
  none: 'border-line bg-paper',
};

/** One line of what the fight paid: a picture and what it is */
function Prize(props: { art: JSX.Element; children: JSX.Element }): JSX.Element {
  return (
    <span class="flex items-center gap-1.5 rounded-xl border-2 border-line bg-paper px-2 py-1 text-sm">
      <span class="flex size-6 shrink-0 items-center justify-center">{props.art}</span>
      {props.children}
    </span>
  );
}

/** A pokemon's picture, fitted to one square cell */
function UnitArt(props: {
  species: SideUnit['species'];
  shiny: boolean;
  fainted: boolean;
}): JSX.Element {
  return (
    <span class="relative size-8 shrink-0">
      <span
        class={`absolute inset-0.5 flex items-center justify-center ${
          props.fainted ? 'opacity-50 grayscale' : ''
        }`}
      >
        <AnimatedSprite
          species={props.species}
          shiny={props.shiny}
          animation={SpriteAnim.Idle}
          direction="DownLeft"
          label=""
          fill
        />
      </span>
    </span>
  );
}

export default function VerdictDialog(props: VerdictDialogProps): JSX.Element {
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
      return 'You';
    }
    return props.names()?.get(side.player)?.nickname ?? 'A trainer';
  };

  /**
   * The face beside that name. A side nobody owns wears the character
   * they were standing in out in the world
   */
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

  /** Whether the fight paid anything to lay out */
  const paid = (): boolean => {
    const spoils = props.spoils;

    return (
      props.candy.length > 0 ||
      (spoils != null &&
        (spoils.gold !== 0 ||
          spoils.award != null ||
          spoils.items.length > 0 ||
          spoils.waiting != null ||
          spoils.seat != null))
    );
  };

  return (
    <Show when={props.verdict()}>
      {(said) => (
        <Dialog
          isOpen={!props.dismissed}
          onClose={() => {
            props.onDismiss();
          }}
          title={said().title}
          description={said().said}
          terse
          width={props.raiding ? undefined : 'wide'}
        >
          {/* What the fight paid, laid out rather than said in passing */}
          <Show when={paid()}>
            <div class="flex flex-col gap-1.5">
              <span class="text-center text-xs font-semibold text-muted uppercase">Rewards</span>
              <div class="flex flex-wrap justify-center gap-1.5">
                <Show when={props.spoils?.seat}>
                  {(seat) => (
                    <Badge tone={seat() === 'freed' ? 'leaf' : 'ember'}>
                      {seat() === 'freed' ? 'The seat is open' : 'Their line-up held'}
                    </Badge>
                  )}
                </Show>
                <Show when={props.spoils != null && props.spoils.gold !== 0}>
                  <Badge tone={(props.spoils?.gold ?? 0) > 0 ? 'gold' : 'ember'}>
                    {(props.spoils?.gold ?? 0) > 0 ? '+' : '−'}
                    {Math.abs(props.spoils?.gold ?? 0).toLocaleString()} gold
                  </Badge>
                </Show>
                <Show when={props.spoils?.award}>
                  {(award) => (
                    <Prize art={<AwardArt award={award()} size={24} />}>
                      {AWARD_NAMES[award()]}
                    </Prize>
                  )}
                </Show>
                <For each={props.spoils?.items ?? []}>
                  {(stack) => (
                    <Prize art={<ItemSprite item={stack.item} size={24} label="" />}>
                      {getItemData(stack.item).name}
                      {stack.amount > 1 ? ` ×${stack.amount}` : ''}
                    </Prize>
                  )}
                </For>
                <For each={props.candy}>
                  {(pile) => (
                    <Prize art={<CandySprite family={pile.family} size={24} label="" />}>
                      {pile.count} {getFamilyName(pile.family)} candy
                    </Prize>
                  )}
                </For>
              </div>
              <Show when={props.spoils?.waiting}>
                {(species) => (
                  <div class="flex items-center justify-center gap-1.5">
                    <UnitArt species={species()} shiny={false} fainted={false} />
                    <Meta>{getSpeciesData(species()).name} is waiting in the overworld.</Meta>
                  </div>
                )}
              </Show>
            </div>
          </Show>

          {/* Who did what, the sides facing each other. A raid says all
              of this on the team list below instead */}
          <Show when={!props.raiding && props.sides.length > 0}>
            <div class="grid items-start gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
              <For each={props.sides}>
                {(side, at) => (
                  <>
                    <Show when={at() > 0}>
                      <span class="self-center text-center text-sm font-bold text-muted">VS</span>
                    </Show>
                    <section
                      class={`flex min-w-0 flex-col gap-2 rounded-panel border-2 p-3 ${FRAMES[mark(side) ?? 'none']}`}
                    >
                      <div class="flex items-center gap-2">
                        <span class="min-w-0 grow">
                          <PlayerPlate name={sideName(side)} sprite={sideSprite(side)} />
                        </span>
                        <Show when={mark(side)}>
                          {(result) => (
                            <Badge tone={result() === 'won' ? 'leaf' : 'ember'}>
                              {result() === 'won' ? 'Won' : 'Lost'}
                            </Badge>
                          )}
                        </Show>
                      </div>
                      <div class="flex flex-col gap-1">
                        <Meta class="text-left tabular-nums">
                          {Math.round(side.dealt).toLocaleString()} damage ·{' '}
                          {Math.round(share(side) * 100)}%
                        </Meta>
                        <div class="h-1.5 overflow-hidden rounded-full bg-line-soft">
                          <div
                            class="h-full rounded-full bg-tide"
                            style={{ width: `${share(side) * 100}%` }}
                          />
                        </div>
                      </div>
                      <ul class="flex list-none flex-col gap-1 p-0">
                        <For each={side.units}>
                          {(unit) => (
                            <li class="flex items-center gap-2">
                              <UnitArt
                                species={unit.species}
                                shiny={unit.shiny}
                                fainted={unit.health <= 0}
                              />
                              <div class="flex min-w-0 grow flex-col gap-0.5">
                                <span class="truncate text-sm">
                                  {getSpeciesData(unit.species).name}{' '}
                                  <span class="text-muted">Lv. {unit.level}</span>
                                </span>
                                <Show
                                  when={unit.health > 0}
                                  fallback={<Meta class="text-left">Fainted</Meta>}
                                >
                                  <div
                                    class="h-1 w-full max-w-24 overflow-hidden rounded-full bg-line-soft"
                                    role="img"
                                    aria-label={`${Math.round(unit.health * 100)}% health left`}
                                  >
                                    <div
                                      class="h-full bg-leaf"
                                      style={{ width: `${unit.health * 100}%` }}
                                    />
                                  </div>
                                </Show>
                              </div>
                              <span class="shrink-0 text-sm text-muted tabular-nums">
                                {Math.round(unit.dealt).toLocaleString()}
                              </span>
                            </li>
                          )}
                        </For>
                      </ul>
                    </section>
                  </>
                )}
              </For>
            </div>

            <Show when={best()}>
              {(top) => (
                <Meta class="text-center">
                  ★ Best: {getSpeciesData(top().unit.species).name} ({sideName(top().side)}) —{' '}
                  {Math.round(top().unit.dealt).toLocaleString()} damage
                </Meta>
              )}
            </Show>
          </Show>

          {/* The teams as they were frozen for a raid, with each player's share */}
          <Show when={props.raiding ? props.teams : null}>
            {(stamped) => (
              <TeamsPreview teams={stamped()} player={props.player} dealt={props.shares} />
            )}
          </Show>

          <DialogActions>
            <Button
              onClick={() => {
                props.onDismiss();
              }}
            >
              Stay and look
            </Button>
            <Button tone="primary" onClick={props.onLeave}>
              {props.replay ? 'Exit replay' : 'Leave battle'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Show>
  );
}
