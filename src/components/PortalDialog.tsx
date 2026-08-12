import { For, type JSX, Show, createMemo, createResource, createSignal } from 'solid-js';
import { getItemCount } from '../auth/inventory';
import usePortalOnServer from '../auth/portals';
import { BIOME_NAMES } from '../data/biome';
import type Biome from '../data/ids/biome';
import { Items } from '../data/ids/items';
import type ChunkSnapshot from '../overworld/chunk-snapshot';
import getWorld from '../overworld/current';
import { type PortalDestination, findPortals } from '../overworld/portal';
import {
  Badge,
  Button,
  Dialog,
  DialogActions,
  List,
  ListRow,
  Meta,
  Note,
  RowButton,
  Status,
} from './styled';

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
  /**
   * The biome the player has their finger on. Choosing is not going:
   * the list is picked from and the crossing is confirmed underneath
   * it, so a wrong press costs nothing until the button at the bottom
   */
  const [picked, setPicked] = createSignal<Biome | null>(null);
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
    setPicked(null);
    setBusy(false);
    props.onClose();
  };

  const cross = (): void => {
    const snapshot = props.snapshot;
    const cell = props.cell;
    const destination = destinations().find((reach) => reach.biome === picked());

    if (snapshot == null || cell == null || destination == null) {
      return;
    }

    setStatus(null);
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
    <Dialog
      isOpen={props.cell != null}
      onClose={close}
      title="Portal"
      terse
      description="A ring of standing stones, and a way through. Name a biome and it opens onto the
        nearest portal in one — the key is spent going through."
    >
      {/* What it costs, said as a count rather than as a sentence. It
          is why the button at the bottom is dead, so it is the one
          thing above the list worth a line */}
      <div class="flex justify-center">
        <Badge tone={(keys.latest ?? 0) > 0 ? 'tide' : 'neutral'}>
          {keys.latest ?? 0} Portal {(keys.latest ?? 0) === 1 ? 'Key' : 'Keys'}
        </Badge>
      </div>

      <Show
        when={destinations().length}
        fallback={<Note class="text-center">Nothing within reach of this one answers.</Note>}
      >
        <List>
          <For each={destinations()}>
            {(destination) => (
              <ListRow selected={picked() === destination.biome}>
                <RowButton
                  class="font-medium"
                  pressed={picked() === destination.biome}
                  disabled={busy()}
                  onClick={() => {
                    setStatus(null);
                    setPicked(destination.biome);
                  }}
                >
                  {BIOME_NAMES[destination.biome]}
                </RowButton>
                {/* How far it is, so a player can tell a neighbour
                    from the other side of the world */}
                <Meta>
                  {destination.distance} chunk{destination.distance === 1 ? '' : 's'} away ·{' '}
                  {destination.x}, {destination.y}
                </Meta>
              </ListRow>
            )}
          </For>
        </List>
      </Show>

      <Status message={status()} />
      <DialogActions center>
        <Button
          tone="primary"
          disabled={busy() || picked() == null || (keys.latest ?? 0) === 0}
          onClick={cross}
        >
          Confirm
        </Button>
        <Button onClick={close}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
