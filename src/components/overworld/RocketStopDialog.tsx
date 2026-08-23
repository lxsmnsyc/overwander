import type { PlayerIdentity } from '../../auth/user';
import { type JSX, Show, createEffect, createSignal } from 'solid-js';
import type { RocketRecord } from '../../auth/rocket-record';
import { startRocketBattle } from '../../auth/rockets';
import Npc from '../../data/overworld/npc';
import { getSpeciesData } from '../../data/species';
import { ROCKET_PARTY_LEVEL } from '../../overworld/rocket';
import { NPC_QUOTES } from './NpcDialog';
import TeamPickerDialog from '../battle/TeamPickerDialog';
import CatchBox, { type BoxEntry } from '../catches/CatchBox';
import NpcSprite from './NpcSprite';
import { Button, Dialog, DialogActions, Meta, Status } from '../styled';
import { useGame } from '../app/game-context';

export interface RocketStopDialogProps {
  user: PlayerIdentity;
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

  /**
   * The grunt's three as squares. They are not catches and have no
   * records: what a square needs of one is its species and a name to
   * be read out by, and a grunt's party is neither hurt nor hatching
   */
  const lineup = (record: RocketRecord): BoxEntry[] =>
    record.party.map((entry, at) => ({
      id: `${at}`,
      species: entry.species,
      shiny: false,
      egg: false,
      progress: 0,
      fainted: false,
      label: `${getSpeciesData(entry.species).name}, Lv. ${ROCKET_PARTY_LEVEL}`,
    }));

  // A refusal belongs to the grunt that refused: reopened on another
  // stop, the dialog must not greet the player with the last one's
  createEffect(() => {
    if (props.challenge != null) {
      setStatus(null);
    }
  });

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
              {/* The grunt themselves, from the overworld's own
                  charset: the dialog already names them, so the
                  picture is not read out */}
              <NpcSprite npc={Npc.RocketGrunt} label="" />

              {/* What they are fielding, in the same box of squares
                  the player reads their own pokemon in: a lineup laid
                  out the way a box is laid out is one they already
                  know how to read. Nothing here is theirs to press */}
              <CatchBox
                entries={lineup(record())}
                capacity={record().party.length}
                columns={3}
                cardOnly
              />
              <Meta>All three at level {ROCKET_PARTY_LEVEL}.</Meta>

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

        <DialogActions>
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
