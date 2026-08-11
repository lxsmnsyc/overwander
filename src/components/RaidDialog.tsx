import { type JSX, Show, createSignal } from 'solid-js';
import { RaidAction, RaidKind, type RaidView, enterRaid } from '../auth/raids';
import { getLairTitle } from '../data/overworld/lair';
import { getSpeciesData } from '../data/species';
import type ChunkSnapshot from '../overworld/chunk-snapshot';
import PickerDialog from './PickerDialog';
import { GameTab, useGame } from './game-context';

/**
 * What the one button says. A lair offers exactly one thing at a time
 * — there is no lobby to join before somebody hosts one, and nothing
 * to host while a raid is being fought — so the dialog shows that and
 * a way out, rather than three buttons of which two are refused
 */
const ACTION_LABELS: Record<RaidAction, string> = {
  [RaidAction.Host]: 'Host',
  [RaidAction.Join]: 'Join',
  [RaidAction.Spectate]: 'Spectate',
};

/**
 * Why it says what it says, so a player who wanted to fight knows why
 * they are being offered a seat instead
 */
function describeAction(view: RaidView): string {
  if (view.action === RaidAction.Host) {
    return view.teams > 0
      ? 'The party that went in did not come out. The lair is open again.'
      : 'Nothing is standing here yet. Opening a lobby leaves it for anyone to join.';
  }
  if (view.action === RaidAction.Join) {
    return `A lobby is gathering — ${view.teams} team${view.teams === 1 ? '' : 's'} so far.`;
  }
  return view.battle == null
    ? 'You have no pokemon of your own to bring, so there is nothing to do here but watch.'
    : 'The raid has already started. Watching pays nothing.';
}

export interface RaidDialogProps {
  /**
   * The chunk the lair stands in, for the call the button makes
   */
  snapshot: ChunkSnapshot | null;
  /**
   * The cell walked up to and what is standing there, or null when the
   * player is not in front of a lair
   */
  lair: [cell: number, view: RaidView] | null;
  onClose: () => void;
}

/**
 * A lair, put to the player before anything is staged.
 *
 * Looking is free: `peekRaid` wrote nothing, so closing this leaves
 * the lair exactly as it was found. The button is where the lobby is
 * actually opened or joined
 */
export default function RaidDialog(props: RaidDialogProps): JSX.Element {
  const game = useGame();
  const [status, setStatus] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);

  const view = (): RaidView | null => props.lair?.[1] ?? null;

  const title = (): string => {
    const standing = view();

    return standing == null
      ? 'Lair'
      : getLairTitle(standing.lair, standing.biome, standing.kind === RaidKind.Shadow);
  };

  const close = (): void => {
    setStatus(null);
    setBusy(false);
    props.onClose();
  };

  /**
   * Watching needs nothing staged: a battle already under way is
   * opened as it stands, and a lobby still gathering is watched from
   * the Raids tab the way its own players see it
   */
  const spectate = (standing: RaidView): void => {
    if (standing.battle == null) {
      game.setRaid(standing.lobby);
      game.setTab(GameTab.Raids);
    } else {
      game.setBattle({ id: standing.battle, replay: true });
    }
    close();
  };

  const act = (): void => {
    const standing = view();
    const snapshot = props.snapshot;
    const cell = props.lair?.[0];

    if (standing == null || snapshot == null || cell == null) {
      return;
    }
    if (standing.action === RaidAction.Spectate) {
      spectate(standing);
      return;
    }

    setStatus(null);
    setBusy(true);
    // Hosting and joining are the same call: the first arrival of the
    // window stages the lobby, and everyone after adopts what is
    // already standing
    enterRaid(snapshot, cell, standing.kind)
      .then((lobby) => {
        setBusy(false);

        if (lobby == null) {
          setStatus('The lair is quiet — somebody may have cleared it since you looked.');
          return;
        }
        const [id, record] = lobby;

        // It started while the dialog was open, which makes this a
        // seat rather than a place in the party
        if (record.battle != null) {
          game.setBattle({ id: record.battle, replay: true });
          close();
          return;
        }
        game.setRaid(id);
        game.setTab(GameTab.Raids);
        close();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  return (
    <PickerDialog isOpen={props.lair != null} title={title()} onClose={close}>
      <Show when={view()}>
        {(standing) => (
          <>
            <p>
              {getSpeciesData(standing().species).name}
              {standing().kind === RaidKind.Shadow ? ' · shadow' : ''}
            </p>
            <p>{describeAction(standing())}</p>
            <p>
              <button type="button" disabled={busy()} onClick={act}>
                {ACTION_LABELS[standing().action]}
              </button>{' '}
              <button type="button" onClick={close}>
                Close
              </button>
            </p>
          </>
        )}
      </Show>
      <Show when={status()}>{(message) => <p role="status">{message()}</p>}</Show>
    </PickerDialog>
  );
}
