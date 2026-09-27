import { type JSX, type Resource, Show, Suspense, createResource, createSignal } from 'solid-js';
import type { EncounterRecord } from '../../auth/encounter-record';
import { getItemCount } from '../../auth/inventory';
import { latherHoneyTree } from '../../auth/snapshots';
import { Items } from '../../data/ids/items';
import { LATHER_COST } from '../../data/overworld/honey-tree';
import type ChunkSnapshot from '../../overworld/chunk-snapshot';
import AtlasSprite from '../sprites/AtlasSprite';
import { OW_SPRITE_ROOT } from '../../canvas/ow-char-sprites';
import Landmark from '../../data/overworld/landmark';
import landmarkPicture, { LANDMARK_SHEET } from '../../data/overworld/landmark-sprite';

import { Button, Dialog, DialogActions, Note, useToast } from '../styled';
import { CostBadge, CounterSpent, CounterTerms, HeadingPortrait } from './npc-dialog/terms';
import { failed, readable } from '../app/resource-reads';
import playEffect, { Effect } from '../app/sound';

/** The tree beside the heading */
const TREE_SPRITE = 28;

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
  const toast = useToast();
  const [busy, setBusy] = createSignal(false);

  const jars = (): number => readable(props.jars) ?? 0;

  const close = (): void => {
    setBusy(false);
    props.onClose();
  };

  const lather = (): void => {
    const snapshot = props.snapshot;
    const cell = props.cell;

    if (snapshot == null || cell == null) {
      return;
    }
    setBusy(true);
    latherHoneyTree(snapshot, cell)
      .then((result) => {
        setBusy(false);
        if (result == null) {
          toast.push({ message: 'The tree will not take honey right now.', tone: 'ember' });
          return;
        }
        if (result.kind === 'no-honey') {
          toast.push({ message: 'You have no Honey to lather it with.', tone: 'ember' });
          props.onSpent();
          return;
        }
        if (result.kind === 'lathered') {
          props.onLathered(cell, null);
          return;
        }
        playEffect(Effect.HoneyLather);
        props.onSpent();
        props.onLathered(cell, result.encounter);
        close();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        toast.push({
          message: caught instanceof Error ? caught.message : String(caught),
          tone: 'ember',
        });
      });
  };

  return (
    <>
      <CounterTerms
        cost={{ item: Items.Honey, amount: LATHER_COST }}
        have={{ amount: jars(), short: jars() < LATHER_COST, unit: 'Honey' }}
        often={props.lathered ? 'Used this while' : 'One lather a window'}
      />
      <Show when={failed(props.jars)}>{(said) => <Note>{said()}</Note>}</Show>
      <Show
        when={!props.lathered}
        fallback={
          <CounterSpent says="The bark is still sticky. Come back next window." quoted={false} />
        }
      >
        <Note>Lather it with honey and see what comes down for it.</Note>
      </Show>
      <DialogActions>
        <Show when={!props.lathered}>
          <Button
            tone="primary"
            disabled={busy() || jars() < LATHER_COST}
            label={`Lather, ${LATHER_COST} Honey`}
            onClick={lather}
          >
            Lather <CostBadge cost={{ item: Items.Honey, amount: LATHER_COST }} />
          </Button>
        </Show>
        <Button onClick={close}>Walk on</Button>
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
      lead={
        <HeadingPortrait>
          <AtlasSprite
            sheet={`${OW_SPRITE_ROOT}/${LANDMARK_SHEET}`}
            name={landmarkPicture(Landmark.HoneyTree) ?? ''}
            size={TREE_SPRITE}
            label=""
          />
        </HeadingPortrait>
      }
      description="Something lives in this tree, and it cannot resist honey."
    >
      <Suspense fallback={<Note>Counting jars…</Note>}>
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
