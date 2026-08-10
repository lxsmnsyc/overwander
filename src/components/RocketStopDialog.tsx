import type { User } from 'firebase/auth';
import { For, type JSX, Show, createSignal } from 'solid-js';
import { Dialog, DialogOverlay, DialogPanel, DialogTitle } from 'terracotta';
import type { RocketRecord } from '../auth/rocket-record';
import { startRocketBattle } from '../auth/rockets';
import { getSpeciesData } from '../data/species';
import { ROCKET_PARTY_LEVEL } from '../overworld/rocket';
import TeamPickerDialog from './TeamPickerDialog';
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
 * grunt is still there to be fought again while the hour lasts
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
        <DialogOverlay
          style={{ position: 'fixed', inset: '0', background: 'rgba(0, 0, 0, 0.4)' }}
        />
        <DialogPanel
          style={{
            position: 'fixed',
            inset: '20% 50% auto auto',
            transform: 'translateX(50%)',
            background: '#fff',
            padding: '1rem 2rem',
            'border-radius': '0.5rem',
            'text-align': 'left',
          }}
        >
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
                {/* Losing costs the hour nothing: the grunt stays put
                    until they are beaten or the hour turns over */}
                <p>Lose and they will still be here. Win and they are gone for the hour.</p>
              </>
            )}
          </Show>

          <p>
            <button
              type="button"
              onClick={() => {
                setPicking(true);
              }}
            >
              Battle
            </button>
            <button type="button" onClick={props.onClose}>
              Walk away
            </button>
          </p>
          <Show when={status()}>{(message) => <p role="status">{message()}</p>}</Show>
        </DialogPanel>
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
