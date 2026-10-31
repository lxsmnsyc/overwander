import { type JSX, type Resource, Show, Suspense, createResource, createSignal } from 'solid-js';
import type { EncounterRecord } from '../../model/encounter-record';
import { getItemCount } from '../../auth/inventory';
import { latherHoneyTree } from '../../auth/snapshots';
import { Items } from '../../data/ids/items';
import { LATHER_COST } from '../../data/overworld/honey-tree';
import type ChunkSnapshot from '../../overworld/chunk-snapshot';
import AtlasSprite from '../sprites/AtlasSprite';
import { OW_SPRITE_ROOT } from '../../canvas/overworld/char-sprites';
import Landmark from '../../data/overworld/landmark';
import landmarkPicture, { LANDMARK_SHEET } from '../../data/overworld/landmark-sprite';

import { Button, Dialog, DialogActions, Note, useToast } from '../styled';
import { CostBadge, CounterSpent, CounterTerms, HeadingPortrait } from '../forms/terms';
import { failed, readable } from '../app/resource-reads';
import playEffect, { Effect } from '../app/sound';
import describeFailure from '../../i18n/refusals';
import { m } from '../../i18n/paraglide/messages.js';
import { describeItem } from '../details';

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
          toast.push({ message: m.honey_tree_refused(), tone: 'ember' });
          return;
        }
        if (result.kind === 'no-honey') {
          toast.push({
            message: m.honey_tree_no_honey({ item: describeItem(Items.Honey) }),
            tone: 'ember',
          });
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
          message: describeFailure(caught),
          tone: 'ember',
        });
      });
  };

  return (
    <>
      <CounterTerms
        cost={{ item: Items.Honey, amount: LATHER_COST }}
        have={{ amount: jars(), short: jars() < LATHER_COST, unit: describeItem(Items.Honey) }}
        often={props.lathered ? m.ow_used_this_while() : m.honey_tree_often()}
      />
      <Show when={failed(props.jars)}>{(said) => <Note>{said()}</Note>}</Show>
      <Show
        when={!props.lathered}
        fallback={<CounterSpent says={m.honey_tree_sticky()} quoted={false} />}
      >
        <Note>{m.honey_tree_invite()}</Note>
      </Show>
      <DialogActions>
        <Show when={!props.lathered}>
          <Button
            tone="primary"
            disabled={busy() || jars() < LATHER_COST}
            label={m.honey_tree_lather_label({
              cost: LATHER_COST,
              item: describeItem(Items.Honey),
            })}
            onClick={lather}
          >
            {m.honey_tree_lather()} <CostBadge cost={{ item: Items.Honey, amount: LATHER_COST }} />
          </Button>
        </Show>
        <Button onClick={close}>{m.ow_walk_on()}</Button>
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
      title={m.honey_tree_title()}
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
      description={m.honey_tree_description()}
    >
      <Suspense fallback={<Note>{m.honey_tree_counting()}</Note>}>
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
