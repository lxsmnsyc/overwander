import {
  type JSX,
  type Resource,
  Show,
  Suspense,
  createMemo,
  createResource,
  createSignal,
} from 'solid-js';
import { getItemCount } from '../../auth/inventory';
import usePortalOnServer from '../../auth/portals';
import { type TownRecord, listTowns } from '../../auth/towns';
import { BIOME_NAMES } from '../../data/biome';
import { Items } from '../../data/ids/items';
import type ChunkSnapshot from '../../overworld/chunk-snapshot';
import { chunkOfCell } from '../../overworld/grid';
import type { PortalDestination } from '../../overworld/portal';
import { Badge, Button, Combobox, Dialog, DialogActions, Meta, Note, Status } from '../styled';

/**
 * A portal, and the name of somewhere to come out.
 *
 * A crossing is named rather than picked off a map: towns are the one
 * part of the world with names of their own, and the box finishes a
 * name the player has started typing. Which names it knows is the
 * shared record of every town anybody has walked into, so somewhere a
 * friend found is somewhere this player can go.
 *
 * Everything about a named town is derived on both sides, its name
 * included, so the confirm is only the key changing hands and the
 * server's word that somebody has been there. A key is spent per
 * crossing, so the choice takes a second press
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

/**
 * What the portal has to say, which is where the keys and the towns
 * are read.
 *
 * A resource read in the body that declared it throws past every
 * `Suspense` written there and lands on the boundary around the page,
 * so the reading half is its own component under one of its own
 */
function PortalBody(
  props: PortalDialogProps & {
    keys: Resource<number>;
    towns: Resource<TownRecord[]>;
    onSpent: () => void;
    onDone: () => void;
  },
): JSX.Element {
  const [status, setStatus] = createSignal<string | null>(null);
  /**
   * The name the player has settled on. Naming is not going: the box
   * is typed into and the crossing is confirmed underneath it, so a
   * wrong name costs nothing until the button at the bottom
   */
  const [named, setNamed] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);

  const towns = createMemo(() => props.towns() ?? []);
  const chosen = createMemo(() => towns().find((town) => town.name === named()) ?? null);

  /**
   * How far the named town is, in chunks. A ring rather than as the
   * crow flies, which is the measure the rest of the world walks in
   */
  const away = createMemo(() => {
    const town = chosen();
    const snapshot = props.snapshot;

    if (town == null || snapshot == null) {
      return null;
    }
    return Math.max(
      Math.abs(chunkOfCell(town.x) - snapshot.chunk.x),
      Math.abs(chunkOfCell(town.y) - snapshot.chunk.y),
    );
  });

  const close = (): void => {
    setStatus(null);
    setNamed(null);
    setBusy(false);
    props.onDone();
  };

  const cross = (): void => {
    const snapshot = props.snapshot;
    const cell = props.cell;
    const town = chosen();

    if (snapshot == null || cell == null || town == null) {
      return;
    }

    setStatus(null);
    setBusy(true);
    usePortalOnServer(snapshot, cell, town.regionX, town.regionY)
      .then((arrived) => {
        setBusy(false);

        if (arrived == null) {
          setStatus('The portal stayed shut. A key opens one, and only one.');
          props.onSpent();
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
    <>
      {/* What it costs, said as a count rather than as a sentence. It
          is why the button at the bottom is dead, so it is the one
          thing above the box worth a line */}
      <div class="flex justify-center">
        <Badge tone={(props.keys() ?? 0) > 0 ? 'tide' : 'neutral'}>
          {props.keys() ?? 0} Portal {(props.keys() ?? 0) === 1 ? 'Key' : 'Keys'}
        </Badge>
      </div>

      <Show
        when={towns().length > 0}
        fallback={<Note class="text-center">Nobody has walked into a town yet.</Note>}
      >
        <Combobox
          label="Town"
          placeholder="Start typing a name"
          options={towns().map((town) => ({ value: town.name, label: town.name }))}
          value={named()}
          disabled={busy()}
          onChange={(name) => {
            setStatus(null);
            setNamed(name);
          }}
        />
      </Show>

      {/* Where the name turned out to be, once there is one. A player
          typing a name a friend gave them has no idea how far off it
          is until the box finishes it */}
      <Show when={chosen()}>
        {(town) => (
          <Meta class="text-center">
            {BIOME_NAMES[town().biome]} · {away()} chunk{away() === 1 ? '' : 's'} away ·{' '}
            {chunkOfCell(town().x)}, {chunkOfCell(town().y)}
          </Meta>
        )}
      </Show>

      <Status message={status()} />
      <DialogActions>
        <Button
          tone="primary"
          disabled={busy() || chosen() == null || (props.keys() ?? 0) === 0}
          onClick={cross}
        >
          Confirm
        </Button>
        <Button onClick={close}>Close</Button>
      </DialogActions>
    </>
  );
}

/**
 * A ring of standing stones and a way through it.
 *
 * The keys and the towns are read one component down, under this
 * boundary: a list still arriving replaces the inside of the panel
 * rather than the page the panel is standing on
 */
export default function PortalDialog(props: PortalDialogProps): JSX.Element {
  /**
   * Whether there is a key to spend. The server checks it again, but a
   * player should be told what the portal wants before they name a
   * town rather than after
   */
  const [keys, { refetch }] = createResource(
    () => (props.cell == null ? null : props.player),
    async (player) => getItemCount(player, Items.PortalKey),
  );
  /**
   * Everywhere anybody has been. Read while the portal is open rather
   * than held, since a town found while this player was walking is one
   * they should be able to name
   */
  const [towns] = createResource(
    () => props.cell != null,
    async () => listTowns(),
  );

  return (
    <Dialog
      isOpen={props.cell != null}
      onClose={props.onClose}
      title="Portal"
      terse
      description="A ring of standing stones, and a way through. Name a town and it opens onto
        the portal standing in its plaza. One key per crossing."
    >
      <Suspense fallback={<Note class="text-center">Reading the register…</Note>}>
        <PortalBody
          {...props}
          keys={keys}
          towns={towns}
          onSpent={() => {
            Promise.resolve(refetch()).catch(() => undefined);
          }}
          onDone={props.onClose}
        />
      </Suspense>
    </Dialog>
  );
}
