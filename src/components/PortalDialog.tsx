import { For, type JSX, Show, createMemo, createResource, createSignal } from 'solid-js';
import { getItemCount } from '../auth/inventory';
import usePortalOnServer from '../auth/portals';
import { BIOME_NAMES } from '../data/biome';
import type Biome from '../data/ids/biome';
import { Items } from '../data/ids/items';
import type ChunkSnapshot from '../overworld/chunk-snapshot';
import getWorld from '../overworld/current';
import { type PortalDestination, findPortals } from '../overworld/portal';
import { Dialog, DialogActions, DialogButton, DialogTitle } from './styled';

/**
 * A portal, and everywhere it goes.
 *
 * Where it comes out is derived rather than told: the same walk the
 * server makes runs here, so the list is the truth and the confirm is
 * only the key changing hands. A key is spent per crossing, so the
 * choice takes a second press
 */

export interface PortalDialogProps {
  player: string;
  /**
   * The chunk the portal stands in, and the cell it stands on — or
   * null when the player is not at one
   */
  snapshot: ChunkSnapshot | null;
  cell: number | null;
  onClose: () => void;
  /**
   * Where the player came out. Walking through is the client's to do:
   * the game stores no position, so the tab moves them
   */
  onTravel: (destination: PortalDestination) => void;
}

export default function PortalDialog(props: PortalDialogProps): JSX.Element {
  const [status, setStatus] = createSignal<string | null>(null);
  const [confirming, setConfirming] = createSignal<Biome | null>(null);
  const [busy, setBusy] = createSignal(false);

  /**
   * Whether there is a key to spend. The server checks it again, but a
   * player should be told what the portal wants before they pick a
   * biome rather than after
   */
  const [keys, { refetch: refetchKeys }] = createResource(
    () => (props.cell == null ? null : props.player),
    async (player) => getItemCount(player, Items.PortalKey),
  );

  /**
   * Everywhere this portal reaches, nearest first. It is one walk
   * outward for every biome at once, and it is the same walk the
   * server makes when the crossing is asked for
   */
  const destinations = createMemo(() => {
    const snapshot = props.snapshot;

    if (snapshot == null || props.cell == null) {
      return [];
    }
    return [...findPortals(getWorld(), snapshot.chunk.x, snapshot.chunk.y).values()].sort(
      (left, right) => left.distance - right.distance,
    );
  });

  const close = (): void => {
    setStatus(null);
    setConfirming(null);
    setBusy(false);
    props.onClose();
  };

  const cross = (destination: PortalDestination): void => {
    const snapshot = props.snapshot;
    const cell = props.cell;

    if (snapshot == null || cell == null) {
      return;
    }
    // A key is spent going through, so the biome is named once and
    // confirmed once
    if (confirming() !== destination.biome) {
      setStatus(null);
      setConfirming(destination.biome);
      return;
    }

    setBusy(true);
    usePortalOnServer(snapshot, cell, destination.biome)
      .then(async (arrived) => {
        setBusy(false);

        if (arrived == null) {
          setStatus('The portal stayed shut. A key opens one, and only one.');
          await refetchKeys();
          return;
        }
        props.onTravel(arrived);
        close();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  return (
    <Dialog isOpen={props.cell != null} onClose={close}>
      <DialogTitle>Portal</DialogTitle>
      <p>
        A ring of standing stones, and a way through. Name a biome and it opens onto the nearest
        portal in one — the key is spent going through.
      </p>
      <p>
        You carry {keys() ?? 0} Portal {(keys() ?? 0) === 1 ? 'Key' : 'Keys'}.
      </p>

      <Show when={(keys() ?? 0) > 0} fallback={<p>Without a key it is only stones.</p>}>
        <Show
          when={destinations().length}
          fallback={<p>Nothing within reach of this one answers.</p>}
        >
          <ul>
            <For each={destinations()}>
              {(destination) => (
                <li>
                  <button
                    type="button"
                    disabled={busy()}
                    onClick={() => {
                      cross(destination);
                    }}
                  >
                    {confirming() === destination.biome
                      ? `Step through to ${BIOME_NAMES[destination.biome]}?`
                      : BIOME_NAMES[destination.biome]}
                  </button>{' '}
                  {/* How far it is, so a player can tell a neighbour
                      from the other side of the world */}
                  <span>
                    {destination.distance} chunk{destination.distance === 1 ? '' : 's'} away ·{' '}
                    {destination.x}, {destination.y}
                  </span>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </Show>

      <Show when={status()}>{(message) => <p role="status">{message()}</p>}</Show>
      <DialogActions>
        <DialogButton onClick={close}>Close</DialogButton>
      </DialogActions>
    </Dialog>
  );
}
