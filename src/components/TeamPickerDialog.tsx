import { For, type JSX, Show, createResource, createSignal } from 'solid-js';
import { Dialog, DialogOverlay, DialogPanel, DialogTitle } from 'terracotta';
import { isLockLive } from '../auth/battle-lock';
import { listCaught } from '../auth/caught';
import { syncServerClock } from '../auth/clock';
import { TEAM_SIZE } from '../auth/teams';
import { getSpeciesData } from '../data/species';

export interface TeamPickerDialogProps {
  player: string;
  isOpen: boolean;
  onClose: () => void;
  /**
   * Fired with the chosen catch ids, at most TEAM_SIZE of them
   */
  onSubmit: (catches: string[]) => void;
}

/**
 * Pick up to six catches to bring into a raid
 */
export default function TeamPickerDialog(props: TeamPickerDialogProps): JSX.Element {
  /**
   * The player's catches, each marked with whether it is fighting
   * somewhere already. A raid that starts leaves it behind, so it is
   * shown but cannot be picked
   */
  const [catches] = createResource(
    () => (props.isOpen ? props.player : null),
    async (player) => {
      const [owned, now] = await Promise.all([listCaught(player), syncServerClock()]);

      return owned.map(([id, caught]) => ({ id, caught, fighting: isLockLive(caught, now) }));
    },
  );
  const [chosen, setChosen] = createSignal<string[]>([]);

  const toggle = (id: string, fighting: boolean): void => {
    const current = chosen();

    if (fighting) {
      return;
    }
    if (current.includes(id)) {
      setChosen(current.filter((entry) => entry !== id));
    } else if (current.length < TEAM_SIZE) {
      setChosen([...current, id]);
    }
  };

  return (
    <Dialog isOpen={props.isOpen} onClose={props.onClose}>
      <DialogOverlay style={{ position: 'fixed', inset: '0', background: 'rgba(0, 0, 0, 0.4)' }} />
      <DialogPanel
        style={{
          position: 'fixed',
          inset: '10% 50% auto auto',
          transform: 'translateX(50%)',
          'max-height': '80vh',
          'overflow-y': 'auto',
          background: '#fff',
          padding: '1rem 2rem',
          'border-radius': '0.5rem',
          'text-align': 'left',
        }}
      >
        <DialogTitle>
          Form a team ({chosen().length}/{TEAM_SIZE})
        </DialogTitle>
        <Show when={!catches.loading} fallback={<p>Loading catches…</p>}>
          <Show when={catches()?.length} fallback={<p>No catches to bring.</p>}>
            <ul>
              <For each={catches()}>
                {(entry) => (
                  <li>
                    <button
                      type="button"
                      aria-pressed={chosen().includes(entry.id)}
                      disabled={entry.fighting}
                      onClick={() => {
                        toggle(entry.id, entry.fighting);
                      }}
                    >
                      {chosen().includes(entry.id) ? '✓ ' : ''}
                      {getSpeciesData(entry.caught.species).name} · Lv. {entry.caught.level}
                      {/* One pokemon, one battle: it comes back when
                          the raid it is in ends */}
                      {entry.fighting ? ' · in a raid' : ''}
                    </button>
                  </li>
                )}
              </For>
            </ul>
          </Show>
        </Show>
        <button
          type="button"
          disabled={chosen().length === 0}
          onClick={() => {
            props.onSubmit(chosen());
            setChosen([]);
          }}
        >
          Join with this team
        </button>
        <button type="button" onClick={props.onClose}>
          Cancel
        </button>
      </DialogPanel>
    </Dialog>
  );
}
