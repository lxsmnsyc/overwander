import { type JSX, Show, createSignal } from 'solid-js';
import { RaidAction, RaidKind, type RaidView, enterRaid } from '../auth/raids';
import { getLairTitle } from '../data/overworld/lair';
import { getSpeciesData } from '../data/species';
import type ChunkSnapshot from '../overworld/chunk-snapshot';
import { Button, Dialog, DialogActions, Status } from './styled';
import SpriteDisplay from './SpriteDisplay';
import { GameDialog, useGame } from './game-context';

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

  /**
   * Why the button says what it says. It is what the dialog is for,
   * so it is the dialog's description — and it has an answer even
   * before a lair has been walked up to, since a description is asked
   * for whether or not there is one to give
   */
  const summary = (): string => {
    const standing = view();

    return standing == null ? 'A lair, and whatever is standing in it.' : describeAction(standing);
  };

  const close = (): void => {
    setStatus(null);
    setBusy(false);
    props.onClose();
  };

  /**
   * Watching needs nothing staged: a battle already under way is
   * opened as it stands, and a lobby still gathering is watched in the
   * raids dialog the way its own players see it
   */
  const spectate = (standing: RaidView): void => {
    if (standing.battle == null) {
      game.setRaid(standing.lobby);
      game.setDialog(GameDialog.Raids);
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
        game.setDialog(GameDialog.Raids);
        close();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  return (
    <Dialog
      isOpen={props.lair != null}
      onClose={close}
      title={title()}
      terse
      description={summary()}
    >
      <Show when={view()}>
        {(standing) => (
          <>
            {/* What is waiting in there, pacing, with its name under
                it. The dialog's own title already says which lair and
                whether it is a shadow one, so the picture says the
                one thing the title cannot */}
            <div class="flex flex-col items-center gap-2 py-2 text-center">
              <SpriteDisplay
                species={standing().species}
                animation="Walk"
                direction="down-right"
                scale={4}
                label={`${getSpeciesData(standing().species).name}, waiting in the lair`}
              />
              <span class="font-medium">{getSpeciesData(standing().species).name}</span>
            </div>
            <DialogActions center>
              <Button tone="primary" disabled={busy()} onClick={act}>
                {ACTION_LABELS[standing().action]}
              </Button>
              <Button onClick={close}>Close</Button>
            </DialogActions>
          </>
        )}
      </Show>
      <Status message={status()} />
    </Dialog>
  );
}
