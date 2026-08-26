import { type JSX, type Resource, Show, createResource, createSignal } from 'solid-js';
import { challengeGymSeat, leaveGymSeat, takeGymSeat } from '../../auth/gym-seats';
import {
  type GymSeatStanding,
  SEAT_DAILY_TAKE,
  SEAT_STAKE_SHARE,
} from '../../auth/gym-seat-record';
import { getProfile } from '../../auth/profile';
import { getTeamSnapshot } from '../../auth/teams';
import type { TeamSnapshotRecord } from '../../auth/teams';
import type { PlayerIdentity } from '../../auth/user';
import { getSpeciesData } from '../../data/species';
import type ChunkSnapshot from '../../overworld/chunk-snapshot';
import { useGame } from '../app/game-context';
import TeamPickerDialog from '../battle/TeamPickerDialog';
import CatchBox, { type BoxEntry } from '../catches/CatchBox';
import { Badge, Button, Dialog, DialogActions, Meta, Note, Status } from '../styled';

/**
 * A gym seat, put to whoever walked up to it.
 *
 * The seat is the one thing in the world that belongs to another
 * player rather than to the window, so the dialog is written around
 * that: it names who is holding it, shows the party they left
 * standing, and offers the one thing that can be done about it.
 *
 * An empty seat is taken. Somebody else's is fought. A player's own
 * is restaged or given up — nobody fights their own stand.
 */

export interface GymSeatDialogProps {
  user: PlayerIdentity;
  /**
   * The chunk and the cell walked up to, or null when the dialog is
   * closed
   */
  snapshot: ChunkSnapshot | null;
  cell: number | null;
  /**
   * Where this player stands with it: who holds it, and what the
   * seat will and will not let them do yet
   */
  standing: GymSeatStanding | null;
  onClose: () => void;
  /** Fired when the seat changed hands or its party moved */
  onChange?: () => void;
}

/**
 * What the seat is holding, and who by. Read one component down so a
 * slow read suspends the panel rather than the world behind it
 */
function SeatCounter(
  props: GymSeatDialogProps & {
    party: Resource<TeamSnapshotRecord | null>;
    holder: Resource<string>;
  },
): JSX.Element {
  const game = useGame();
  const [picking, setPicking] = createSignal<'take' | 'challenge' | null>(null);
  const [status, setStatus] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);

  const held = (): GymSeatStanding['seat'] => props.standing?.seat ?? null;
  const mine = (): boolean => held()?.holder === props.user.uid;

  /**
   * Whether this player may fight for it right now, and what stands
   * in the way if not. A seat is barred for a while after it beat
   * them, and stripped bare for the day once they have had their fill
   */
  const cooling = (): boolean => Date.now() < (props.standing?.cooldownUntil ?? 0);
  const barred = (): boolean => Date.now() < (props.standing?.barredUntil ?? 0);
  const spent = (): boolean => (props.standing?.taken ?? 0) >= SEAT_DAILY_TAKE;

  /**
   * How long until the thing in the way lifts, in whole minutes: a
   * countdown to the second would be a clock nothing is redrawing
   */
  const minutes = (until: number): number => Math.max(1, Math.ceil((until - Date.now()) / 60_000));

  /**
   * The standing party as squares. They are copies rather than
   * catches: what a square needs is the species and a name to be read
   * out by, and a seated party is never hurt or hatching
   */
  const lineup = (): BoxEntry[] =>
    (props.party.latest?.catches ?? []).map((entry, at) => ({
      id: `${at}`,
      species: entry.species,
      shiny: entry.shiny,
      egg: false,
      progress: 0,
      fainted: false,
      label: `${getSpeciesData(entry.species).name}, Lv. ${entry.level}`,
    }));

  const act = (run: () => Promise<unknown>, said: string, failed: string): void => {
    setStatus(null);
    setBusy(true);
    run()
      .then((done) => {
        setBusy(false);

        if (done == null || done === false) {
          setStatus(failed);
          return;
        }
        setStatus(said);
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  /**
   * Sit down on it, or put a different party on the one already held
   */
  const seat = (catches: string[]): void => {
    const chunk = props.snapshot;
    const cell = props.cell;

    if (chunk == null || cell == null) {
      return;
    }
    setPicking(null);
    act(
      async () => takeGymSeat(chunk, cell, catches),
      mine() ? 'Your new line-up is standing.' : 'The seat is yours. Come back and defend it.',
      'They would not stand. Somebody else took the seat, you were just beaten off it, or nothing you picked can fight.',
    );
  };

  /**
   * Take it off whoever is holding it. The fight is the whole of the
   * decision, so this drops straight into it
   */
  const challenge = (catches: string[]): void => {
    const chunk = props.snapshot;
    const cell = props.cell;
    const seated = held();

    if (chunk == null || cell == null || seated == null) {
      return;
    }
    setPicking(null);
    setStatus(null);
    setBusy(true);
    challengeGymSeat(chunk, cell, catches)
      .then((battle) => {
        setBusy(false);

        if (battle == null) {
          setStatus('The seat has moved on. Somebody else may be holding it now.');
          return;
        }
        props.onClose();
        game.setBattle({ id: battle, replay: false, seat: seated.seat });
      })
      .catch((caught: unknown) => {
        setBusy(false);
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  const vacate = (): void => {
    const chunk = props.snapshot;
    const cell = props.cell;

    if (chunk == null || cell == null) {
      return;
    }
    act(
      async () => leaveGymSeat(chunk, cell),
      'You stood down. The seat is open again.',
      'It is not yours to give up.',
    );
  };

  return (
    <>
      <Dialog
        isOpen={props.cell != null && picking() == null}
        onClose={props.onClose}
        title="Gym Seat"
        terse
        description="A seat one player leaves a team standing on for the next to fight. Beating
        the line-up empties the seat and takes a share of the holder's purse; losing hands
        yours to them instead."
      >
        <div class="flex flex-col items-center gap-3 py-2 text-center">
          <Show
            when={held()}
            fallback={
              <Note>
                {barred()
                  ? `You were beaten off this seat. It is open to everybody else for another
                     ${minutes(props.standing?.barredUntil ?? 0)} minutes.`
                  : `Nobody is holding this seat. Leave a team standing and it is yours until
                     somebody beats it off you.`}
              </Note>
            }
          >
            {(seated) => (
              <>
                <Badge tone={mine() ? 'leaf' : 'tide'}>
                  {mine() ? 'Your seat' : `Held by ${props.holder.latest ?? 'a trainer'}`}
                </Badge>

                {/* What they left standing, in the box of squares a
                    player already reads their own pokemon in */}
                <CatchBox
                  entries={lineup()}
                  capacity={Math.max(1, lineup().length)}
                  columns={3}
                  cardOnly
                />
                <Meta>
                  {lineup().length} standing, {seated().defenses} turned away.
                </Meta>
                <Meta class="max-w-prose">
                  {mine()
                    ? `They fight for you while you are away, at full health every time, and
                       nothing that happens to them is written back to your pokemon. What a
                       beaten challenger pays lands in your purse.`
                    : `Win and the seat empties, ${Math.round(SEAT_STAKE_SHARE * 100)}% of their
                       purse is yours, and you may sit down on it. Lose and they take the same
                       share of yours. Your party carries the fight out with it either way —
                       theirs does not.`}
                </Meta>
                <Show when={!mine() && (cooling() || spent())}>
                  <Note>
                    {spent()
                      ? 'You have taken all this seat will give you today.'
                      : `They have seen you off. Come back in
                         ${minutes(props.standing?.cooldownUntil ?? 0)} minutes.`}
                  </Note>
                </Show>
              </>
            )}
          </Show>

          <Status message={status()} />
        </div>

        <DialogActions>
          <Show
            when={held() != null && !mine()}
            fallback={
              <>
                <Button
                  tone="primary"
                  disabled={busy() || barred()}
                  onClick={() => {
                    setPicking('take');
                  }}
                >
                  {held() == null ? 'Take the seat' : 'Change the line-up'}
                </Button>
                <Show when={mine()}>
                  <Button disabled={busy()} onClick={vacate}>
                    Stand down
                  </Button>
                </Show>
              </>
            }
          >
            <Button
              tone="primary"
              disabled={busy() || cooling() || spent()}
              onClick={() => {
                setPicking('challenge');
              }}
            >
              Challenge
            </Button>
          </Show>
          <Button onClick={props.onClose}>Walk on</Button>
        </DialogActions>
      </Dialog>

      <TeamPickerDialog
        player={props.user.uid}
        isOpen={picking() != null}
        onClose={() => {
          setPicking(null);
        }}
        onSubmit={picking() === 'challenge' ? challenge : seat}
      />
    </>
  );
}

/**
 * The seat's own reads live here, above the panel that draws them:
 * read in the body that shows them, a slow one would take the world
 * down behind the dialog
 */
export default function GymSeatDialog(props: GymSeatDialogProps): JSX.Element {
  const [party] = createResource(
    () => props.standing?.seat?.snapshot ?? null,
    async (id) => getTeamSnapshot(id),
  );

  const [holder] = createResource(
    () => props.standing?.seat?.holder ?? null,
    async (uid) => (await getProfile(uid))?.nickname ?? 'a trainer',
  );

  return <SeatCounter {...props} party={party} holder={holder} />;
}
