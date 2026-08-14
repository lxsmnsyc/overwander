import { For, type JSX, Show, createSignal } from 'solid-js';
import { RaidAction, RaidKind, type RaidView, enterRaid } from '../../auth/raids';
import { getLairTitle } from '../../data/overworld/lair';
import { getSpeciesData } from '../../data/species';
import type ChunkSnapshot from '../../overworld/chunk-snapshot';
import { Button, Dialog, DialogActions, Meta, Note, Status } from '../styled';
import SpriteDisplay from '../sprites/SpriteDisplay';
import TypeBadge from '../sprites/TypeBadge';
import { GameDialog, useGame } from '../app/game-context';

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
 * What a raid of this kind is, in a sentence: what it takes to fight
 * and what walking away costs.
 *
 * The three are genuinely different bargains, and the difference is
 * the thing a player is deciding about. A legendary comes back next
 * window; a shadow is the same lair with something wrong in it and
 * pays a pokemon that costs double to raise; a mythical was called by
 * a relic that is already spent, so there is no second attempt
 */
function describeRaid(view: RaidView): string {
  if (view.kind === RaidKind.Mythical) {
    return 'The relic that called it is already spent — this raid happens once, won or lost.';
  }
  if (view.kind === RaidKind.Shadow) {
    return 'A shadow raid: what it leaves behind is stronger and costs twice the candy to raise.';
  }
  return 'A raid takes a party. Beaten, it waits in the overworld for whoever fought it.';
}

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
   * The cell walked up to and what is standing there. The view is null
   * for a lair with nothing in it this window — the dialog still
   * opens, and says so.
   *
   * That is deliberate. A player who walks up to a lair and presses it
   * has asked a question, and the answer used to be a line of text
   * under the map that they were not looking at. Whatever the lair has
   * to say, it says here
   */
  lair: [cell: number, view: RaidView | null] | null;
  /**
   * Why there is nothing to fight, when there is not: the lair is
   * quiet, or the player has nothing of their own to bring
   */
  reason?: string | null;
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

    if (standing != null) {
      return describeAction(standing);
    }
    return props.reason ?? 'A lair, and whatever is standing in it.';
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
      <Show
        when={view()}
        fallback={
          <>
            {/* A lair with nothing in it is still a lair, and a player
                who pressed it is owed an answer where they are looking
                rather than in a line under the map */}
            <Note class="py-4 text-center">{summary()}</Note>
            <DialogActions center>
              <Button onClick={close}>Close</Button>
            </DialogActions>
          </>
        }
      >
        {(standing) => (
          <>
            {/* What is waiting in there, asleep until somebody
                walks in on it, with its name under it and a word about
                what it is. The sprite stands on the floor of its box
                rather than in the middle of one, so a tall boss and a
                short one put their feet on the same line and the name
                below does not move */}
            <div class="flex flex-col items-center gap-2 py-2 text-center">
              {/* The canvas takes the whole width of the panel rather
                  than being cut to the picture. A sprite is drawn the
                  same size either way; what changes is that a wide one
                  — a legendary bird's wingspan is half again its
                  height — has room to be wide in instead of being
                  clipped down the middle of a wing */}
              <div class="-mb-2 flex min-h-28 w-full items-end justify-center pt-2">
                <SpriteDisplay
                  stretch
                  species={standing().species}
                  animation="Sleep"
                  direction="DownLeft"
                  scale={4}
                  label={`${getSpeciesData(standing().species).name}, waiting in the lair`}
                />
              </div>
              <span class="text-lg font-medium">{getSpeciesData(standing().species).name}</span>
              <div class="flex flex-wrap justify-center gap-1">
                <For each={getSpeciesData(standing().species).types}>
                  {(type) => <TypeBadge type={type} />}
                </For>
              </div>
              {/* What fighting it means, which is the decision the
                  button below asks for. The dex's word for its kind —
                  a Freeze Pokemon — went with the types above it: the
                  badges say what it fights as, which is the half of it
                  that changes how the raid goes */}
              <Meta class="max-w-prose">{describeRaid(standing())}</Meta>
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
