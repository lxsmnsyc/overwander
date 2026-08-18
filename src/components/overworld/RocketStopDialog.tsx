import type { User } from 'firebase/auth';
import { For, type JSX, Show, createSignal } from 'solid-js';
import type { RocketRecord } from '../../auth/rocket-record';
import { startRocketBattle } from '../../auth/rockets';
import Npc from '../../data/overworld/npc';
import { getSpeciesData } from '../../data/species';
import { ROCKET_PARTY_LEVEL } from '../../overworld/rocket';
import { NPC_QUOTES } from './NpcDialog';
import TeamPickerDialog from '../battle/TeamPickerDialog';
import AnimatedSprite from '../sprites/AnimatedSprite';
import { Badge, Button, Dialog, DialogActions, Meta, Status } from '../styled';
import { useGame } from '../app/game-context';

export interface RocketStopDialogProps {
  user: User;
  /**
   * The stop's id and what the grunt is fielding, or null when the
   * player is not standing in front of one
   */
  challenge: [string, RocketRecord] | null;
  onClose: () => void;
}

/**
 * The grunt's challenge, put to the player. Accepting picks a party
 * and drops straight into the fight; declining walks away, and the
 * grunt is still there to be fought again while the window lasts
 */
export default function RocketStopDialog(props: RocketStopDialogProps): JSX.Element {
  const game = useGame();
  const [picking, setPicking] = createSignal(false);
  const [status, setStatus] = createSignal<string | null>(null);

  const stop = (): string | null => props.challenge?.[0] ?? null;

  const accept = (catches: string[]): void => {
    const id = stop();

    if (id == null) {
      return;
    }
    setPicking(false);
    setStatus(null);
    startRocketBattle(id, catches)
      .then((battle) => {
        if (battle == null) {
          setStatus('The grunt is done with you for now.');
          return;
        }
        props.onClose();
        game.setBattle({ id: battle, replay: false, rocket: id });
      })
      .catch((caught: unknown) => {
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  return (
    <>
      <Dialog
        isOpen={props.challenge != null && !picking()}
        onClose={props.onClose}
        title="Team Rocket"
        terse
        description={`A Team Rocket grunt blocks the way. “${NPC_QUOTES[Npc.RocketGrunt]}”`}
      >
        <Show when={props.challenge?.[1]}>
          {(record) => (
            <div class="flex flex-col items-center gap-3 py-2 text-center">
              {/* Where the grunt will stand once there is one drawn.
                  The room is held now rather than added later, so the
                  dialog does not change shape under a player who
                  already knows it — the same reason the gift dialog
                  kept room for item pictures before there were any */}
              <div
                class="flex h-24 w-24 items-end justify-center rounded-panel border border-dashed
                border-ember bg-ember-soft/40 text-xs text-muted"
              >
                <span class="pb-2">Grunt</span>
              </div>

              {/* What they are fielding, drawn rather than listed: a
                  row of names says how many, a row of pokemon says
                  what a player is walking into.

                  One column each, sized to whatever room the panel
                  has. Nothing scrolls sideways — a lineup a player has
                  to drag into view is a lineup they will not see the
                  end of */}
              <ul class="m-0 grid w-full list-none grid-cols-3 items-end gap-3 p-0">
                <For each={record().party}>
                  {(entry) => (
                    <li class="flex min-w-0 flex-col items-center gap-1">
                      {/* Square, and as wide as the column allows: a
                          filled sprite is drawn as a share of the box
                          it is given, so the box is what decides how
                          big the pokemon is */}
                      <span class="flex aspect-square w-full max-w-24 items-end justify-center">
                        <AnimatedSprite
                          species={entry.species}
                          animation="Idle"
                          direction="Down"
                          fill
                          shadow
                          label={`${getSpeciesData(entry.species).name}, Lv. ${ROCKET_PARTY_LEVEL}`}
                        />
                      </span>
                      {/* Wrapped rather than held to one line: three
                          pills that each refuse to break are three
                          columns the panel has to widen for */}
                      <Badge tone="ember" wrap class="max-w-full text-center">
                        Lv. {ROCKET_PARTY_LEVEL} {getSpeciesData(entry.species).name}
                      </Badge>
                    </li>
                  )}
                </For>
              </ul>

              {/* And what the fight is worth, which is the decision the
                  buttons below are asking about */}
              <Meta class="max-w-prose">
                Three of theirs against as many as you bring. Beaten, the grunt drops what they were
                carrying and leaves it in the overworld; losing costs the fight and nothing else —
                they will still be here while the window lasts.
              </Meta>
            </div>
          )}
        </Show>

        <DialogActions center>
          <Button
            tone="primary"
            onClick={() => {
              setPicking(true);
            }}
          >
            Battle
          </Button>
          <Button onClick={props.onClose}>Walk away</Button>
        </DialogActions>
        <Status message={status()} />
      </Dialog>

      <TeamPickerDialog
        player={props.user.uid}
        isOpen={picking()}
        onClose={() => {
          setPicking(false);
        }}
        onSubmit={accept}
      />
    </>
  );
}
