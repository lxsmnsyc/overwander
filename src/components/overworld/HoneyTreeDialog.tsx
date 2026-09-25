import { type JSX, type Resource, Show, Suspense, createResource, createSignal } from 'solid-js';
import type { EncounterRecord } from '../../auth/encounter-record';
import { getItemCount } from '../../auth/inventory';
import { latherHoneyTree } from '../../auth/snapshots';
import { Items } from '../../data/ids/items';
import { LATHER_COST } from '../../data/overworld/honey-tree';
import type ChunkSnapshot from '../../overworld/chunk-snapshot';
import ItemSprite from '../items/ItemSprite';
import AtlasSprite from '../sprites/AtlasSprite';
import { OW_SPRITE_ROOT } from '../../canvas/ow-char-sprites';
import Landmark from '../../data/overworld/landmark';
import landmarkPicture, { LANDMARK_SHEET } from '../../data/overworld/landmark-sprite';

import { Badge, Button, Dialog, DialogActions, Note, Status } from '../styled';
import { failed, readable } from '../app/resource-reads';

/** The tree at twice the size it stands on the board */
const TREE_SPRITE = 88;

/** The jar on the button, the size the safari draws its ball */
const LATHER_SPRITE = 28;

export interface HoneyTreeDialogProps {
  player: string;
  /** The chunk and cell of the tree, or null when the player is not at one */
  snapshot: ChunkSnapshot | null;
  cell: number | null;
  /** Whether this player has already lathered this tree this window */
  lathered: boolean;
  onClose: () => void;
  /** The tree took the honey: the cell to mark, and whatever came out of it */
  onLathered: (cell: number, encounter: EncounterRecord | null) => void;
}

/** The jar count is read here, under the dialog's own boundary */
function HoneyTreeBody(
  props: HoneyTreeDialogProps & { jars: Resource<number>; onSpent: () => void },
): JSX.Element {
  const [status, setStatus] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);

  const jars = (): number => readable(props.jars) ?? 0;

  const close = (): void => {
    setStatus(null);
    setBusy(false);
    props.onClose();
  };

  const lather = (): void => {
    const snapshot = props.snapshot;
    const cell = props.cell;

    if (snapshot == null || cell == null) {
      return;
    }
    setStatus(null);
    setBusy(true);
    latherHoneyTree(snapshot, cell)
      .then((result) => {
        setBusy(false);
        if (result == null) {
          setStatus('The tree will not take honey right now.');
          return;
        }
        if (result.kind === 'no-honey') {
          setStatus('You have no Honey to lather it with.');
          props.onSpent();
          return;
        }
        if (result.kind === 'lathered') {
          props.onLathered(cell, null);
          return;
        }
        props.onSpent();
        props.onLathered(cell, result.encounter);
        close();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  return (
    <>
      <div class="flex justify-center">
        <AtlasSprite
          sheet={`${OW_SPRITE_ROOT}/${LANDMARK_SHEET}`}
          name={landmarkPicture(Landmark.HoneyTree) ?? ''}
          size={TREE_SPRITE}
          label="The honey tree"
        />
      </div>
      <div class="flex justify-center">
        <Badge tone={jars() >= LATHER_COST ? 'gold' : 'neutral'}>
          <ItemSprite item={Items.Honey} size={16} label="" />
          {jars()} Honey
        </Badge>
      </div>
      <Show when={failed(props.jars)}>{(said) => <Note class="text-center">{said()}</Note>}</Show>
      <Note class="text-center">
        {props.lathered
          ? 'The bark is still sticky. Come back next window.'
          : 'Lather it with honey and see what comes down for it.'}
      </Note>
      <Status message={status()} />
      <DialogActions>
        {/* Drawn like the safari's Throw: the jar is the label, with what is left beside it */}
        <Button
          tone="primary"
          disabled={busy() || props.lathered || jars() < LATHER_COST}
          label={`Lather with Honey, ${jars()} left`}
          onClick={lather}
        >
          <ItemSprite item={Items.Honey} size={LATHER_SPRITE} label="" />
          Lather × {jars()}
        </Button>
        <Button onClick={close}>Close</Button>
      </DialogActions>
    </>
  );
}

/** A honey tree, and the jar it wants */
export default function HoneyTreeDialog(props: HoneyTreeDialogProps): JSX.Element {
  const [jars, { refetch }] = createResource(
    () => (props.cell == null ? null : props.player),
    async (player) => getItemCount(player, Items.Honey),
  );

  return (
    <Dialog
      isOpen={props.cell != null}
      onClose={props.onClose}
      title="Honey Tree"
      terse
      description="Something lives in this tree, and it cannot resist honey. One lather a window."
    >
      <Suspense fallback={<Note class="text-center">Counting jars…</Note>}>
        <HoneyTreeBody
          {...props}
          jars={jars}
          onSpent={() => {
            Promise.resolve(refetch()).catch(() => undefined);
          }}
        />
      </Suspense>
    </Dialog>
  );
}
