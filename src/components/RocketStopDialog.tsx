import type { User } from 'firebase/auth';
import { For, type JSX, Show, createSignal } from 'solid-js';
import type { RocketRecord } from '../auth/rocket-record';
import { startRocketBattle } from '../auth/rockets';
import { getSpeciesData } from '../data/species';
import { ROCKET_PARTY_LEVEL } from '../overworld/rocket';
import TeamPickerDialog from './TeamPickerDialog';
import { Dialog, DialogActions, DialogButton, DialogTitle } from './styled';
import { useGame } from './game-context';

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
      <Dialog isOpen={props.challenge != null && !picking()} onClose={props.onClose}>
        <DialogTitle>Team Rocket</DialogTitle>
        <Show when={props.challenge?.[1]}>
          {(record) => (
            <>
              <p>
                A Team Rocket grunt blocks the way. “Three of mine against however many of yours.”
              </p>
              <ul>
                <For each={record().party}>
                  {(entry) => (
                    <li>
                      Shadow {getSpeciesData(entry.species).name} · Lv. {ROCKET_PARTY_LEVEL}
                    </li>
                  )}
                </For>
              </ul>
              {/* Losing costs the window nothing: the grunt stays put
                    until they are beaten or the window turns over */}
              <p>Lose and they will still be here. Win and they are gone for the window.</p>
            </>
          )}
        </Show>

        <DialogActions>
          <DialogButton
            tone="primary"
            onClick={() => {
              setPicking(true);
            }}
          >
            Battle
          </DialogButton>
          <DialogButton onClick={props.onClose}>Walk away</DialogButton>
        </DialogActions>
        <Show when={status()}>{(message) => <p role="status">{message()}</p>}</Show>
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
