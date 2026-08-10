import { For, type JSX, Show, createResource, createSignal } from 'solid-js';
import { Dialog, DialogOverlay, DialogPanel, DialogTitle } from 'terracotta';
import { listCaught } from '../auth/caught';
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
  const [catches] = createResource(() => (props.isOpen ? props.player : null), listCaught);
  const [chosen, setChosen] = createSignal<string[]>([]);

  const toggle = (id: string): void => {
    const current = chosen();

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
                {([id, caught]) => (
                  <li>
                    <button
                      type="button"
                      aria-pressed={chosen().includes(id)}
                      onClick={() => {
                        toggle(id);
                      }}
                    >
                      {chosen().includes(id) ? '✓ ' : ''}
                      {getSpeciesData(caught.species).name} · Lv. {caught.level}
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
