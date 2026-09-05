import { type JSX, createResource, createSignal } from 'solid-js';
import { isLockLive } from '../../../auth/battle-lock';
import { listCaught } from '../../../auth/caught';
import { syncServerClock } from '../../../auth/clock';
import { getInventory } from '../../../auth/inventory';
import { getProfile } from '../../../auth/profile';
import { hasVisited } from '../../../auth/npcs';
import Npc from '../../../data/overworld/npc';
import type ChunkSnapshot from '../../../overworld/chunk-snapshot';
import type { CatchOption } from '../../catches/catch-picker';
import NpcCounter from './counter';

/**
 * How every one of these sections is laid out.
 *
 * Down the middle, all of them. The dialog is one person making one
 * offer — a picture of them, a line of what they say, and the thing
 * they want picked — and a column of left-aligned lists under a
 * centred portrait read as two screens stuck together
 */

export interface NpcDialogProps {
  player: string;
  /**
   * The chunk the player is standing in, and the cell they walked
   * up to — the server re-derives who is standing there from both
   */
  snapshot: ChunkSnapshot | null;
  /**
   * Who is standing there, or null when the dialog is closed
   */
  standing: [cell: number, npc: Npc] | null;
  onClose: () => void;
  /**
   * Fired when something landed — an egg was made, an egg moved on —
   * so the list behind the dialog can catch up
   */
  onChange?: () => void;
}

/**
 * Somebody standing out in the world with an offer.
 *
 * The box, the purse and the bag are read one component down, under
 * this boundary: read here they would throw to the page and take the
 * world with them in the middle of a trade
 */
export default function NpcDialog(props: NpcDialogProps): JSX.Element {
  // Bumped after every trade, so the purse and the bag catch up with
  // what was just bought or sold; served counts the free visits, for
  // the reads that follow the window rather than the purse
  const [traded, setTraded] = createSignal(0);
  const [served, setServed] = createSignal(0);

  // Both lists are drawn from this one read: the pair the breeder
  // wants and the egg the daycare lady wants are the same records,
  // asked two different questions
  const [catches, { refetch }] = createResource(
    () => (props.standing == null ? null : props.player),
    async (player): Promise<CatchOption[]> => {
      const [owned, now] = await Promise.all([listCaught(player), syncServerClock()]);

      return owned.map(([id, caught]) => ({ id, caught, fighting: isLockLive(caught, now) }));
    },
  );

  const [gold] = createResource(
    () => (props.standing == null ? null : ([props.player, traded()] as const)),
    async ([player]) => (await getProfile(player))?.gold ?? 0,
  );

  const [bag] = createResource(
    () => (props.standing == null ? null : ([props.player, traded()] as const)),
    async ([player]) => getInventory(player),
  );

  // Whether the maniac has already sold to this player this window.
  // The server refuses a second sale either way; this is what lets
  // the dialog say so instead of offering a dead trade
  const [visited] = createResource(
    () =>
      props.snapshot == null || props.standing?.[1] !== Npc.FossilManiac
        ? null
        : ([props.snapshot, props.standing[0], traded()] as const),
    async ([snapshot, cell]) => hasVisited(snapshot, 'fossil', cell),
  );

  // Whether the daycare lady has already taken an egg this window.
  // One is her rule, and this is what greys the box afterwards rather
  // than leaving a press the server refuses
  const [warmed] = createResource(
    () =>
      props.snapshot == null || props.standing?.[1] !== Npc.DaycareLady
        ? null
        : ([props.snapshot, props.standing[0], served()] as const),
    async ([snapshot, cell]) => hasVisited(snapshot, 'daycare', cell),
  );

  return (
    <NpcCounter
      {...props}
      catches={catches}
      gold={gold}
      bag={bag}
      visited={visited}
      warmed={warmed}
      onServed={() => {
        setServed((count) => count + 1);
        Promise.resolve(refetch()).catch(() => undefined);
      }}
      onTraded={() => {
        setTraded((count) => count + 1);
      }}
    />
  );
}
