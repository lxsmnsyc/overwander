import { For, type JSX, type Resource, Show } from 'solid-js';
import type { Profile } from '../../../auth/profile';
import { SpriteAnim } from '../../../data/ids/sprite-anims';
import Npc, { NPC_NAMES } from '../../../data/overworld/npc';
import { getSpeciesData } from '../../../data/species';
import PlayerPlate from '../../profile/PlayerPlate';
import AnimatedSprite from '../../sprites/AnimatedSprite';
import { Button, Dialog, DialogActions } from '../../styled';
import TeamsPreview from '../TeamsPreview';
import type { SideSummary } from './summary';

/**
 * What a settled fight says about itself: the word for how it went,
 * who dealt what, and the two ways out of the field.
 */
export interface VerdictDialogProps {
  /** The verdict, or null while the fight is still being fought */
  verdict: () => { title: string; said: string } | null;
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
   * Whether a grunt was fought, which is what an unowned side is
   * called when there was one
   */
  rocket: boolean;
  /** The teams as they were frozen for a raid, for its own summary */
  teams: string[] | null;
  shares: Map<string, number>;
  replay: boolean;
  onLeave: () => void;
}

export default function VerdictDialog(props: VerdictDialogProps): JSX.Element {
  /**
   * What a side's header calls its owner. The reader is "You"; a side
   * nobody owns is the grunt where a grunt was fought, and otherwise
   * whatever led it out
   */
  const sideName = (side: SideSummary): string => {
    if (side.player === '') {
      return props.rocket ? NPC_NAMES[Npc.RocketGrunt] : getSpeciesData(side.lead).name;
    }
    if (side.player === props.player) {
      return 'You';
    }
    return props.names()?.get(side.player)?.nickname ?? 'A trainer';
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
        >
          {/* What happened, in the panel rather than on the bar. The
            bar carries the word — Victory, Defeat — and a sentence
            set under it in the header's own smaller type reads as
            a caption to the title rather than as the news */}
          <p class="text-center">{said().said}</p>

          {/* Who did what, side by side. Each team stands under its
            owner — the face, the name and the team's whole take —
            with each pokemon's own share listed beneath. A raid
            says all of this on the team list below instead */}
          <Show when={!props.raiding && props.sides.length > 0}>
            <div class="flex flex-col gap-3">
              <For each={props.sides}>
                {(side) => (
                  <section class="flex flex-col gap-1">
                    <div class="flex items-center justify-between gap-4">
                      <PlayerPlate
                        name={sideName(side)}
                        avatar={props.names()?.get(side.player)?.avatar ?? null}
                      />
                      <span class="text-sm text-muted">
                        {Math.round(side.dealt).toLocaleString()} damage
                      </span>
                    </div>
                    <ul class="flex list-none flex-col gap-0.5 pl-3">
                      <For each={side.units}>
                        {(unit) => (
                          <li class="flex items-center justify-between gap-4">
                            <span class="flex items-center gap-1.5">
                              {/* Fitted to one square cell, the way a
                                box square fits its sprite, so every
                                row's picture is the same size */}
                              <span class="relative size-8 shrink-0">
                                <span class="absolute inset-0.5 flex items-center justify-center">
                                  <AnimatedSprite
                                    species={unit.species}
                                    animation={SpriteAnim.Idle}
                                    direction="DownLeft"
                                    label={getSpeciesData(unit.species).name}
                                    fill
                                  />
                                </span>
                              </span>
                              {getSpeciesData(unit.species).name}
                            </span>
                            <span class="text-sm text-muted">
                              {Math.round(unit.dealt).toLocaleString()} damage
                            </span>
                          </li>
                        )}
                      </For>
                    </ul>
                  </section>
                )}
              </For>
            </div>
          </Show>

          {/* The teams as they were frozen for this fight, each
            player's face and name beside what they fielded and
            the share of the damage that was theirs. Raids only:
            a trainer fight already said all of this side by side
            above, and a demo battle stands on no record */}
          <Show when={props.raiding ? props.teams : null}>
            {(stamped) => (
              <TeamsPreview teams={stamped()} player={props.player} dealt={props.shares} />
            )}
          </Show>

          {/* Centred, like everything else in the panel. The
            verdict is one line about what happened and two things
            to do about it, and buttons pushed to the right of a
            centred sentence read as belonging to something else */}
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
