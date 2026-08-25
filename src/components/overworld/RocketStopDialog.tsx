import type { PlayerIdentity } from '../../auth/user';
import { type JSX, Show, createEffect, createSignal } from 'solid-js';
import type { RocketRecord } from '../../auth/rocket-record';
import { startRocketBattle } from '../../auth/rockets';
import Npc from '../../data/overworld/npc';
import { getSpeciesData } from '../../data/species';
import { rocketPartyLevel } from '../../overworld/rocket';
import { NPC_QUOTES } from './NpcDialog';
import TeamPickerDialog from '../battle/TeamPickerDialog';
import CatchBox, { type BoxEntry } from '../catches/CatchBox';
import NpcSprite from './NpcSprite';
import { Button, Dialog, DialogActions, Meta, Status } from '../styled';
import { useGame } from '../app/game-context';

export interface RocketStopDialogProps {
  user: PlayerIdentity;
  /**
   * The stop's id and what is being fielded, or null when the player
   * is not standing in front of one
   */
  challenge: [string, RocketRecord] | null;
  /** Who put the challenge: the grunt's ambush or the trainer's duel */
  npc: Npc;
  /** The style they were wandering in, so the portrait matches */
  sheet?: string;
  onClose: () => void;
}

/**
 * The grunt's challenge, put to the player. Accepting picks a party
 * and drops straight into the fight; declining walks away, and the
 * grunt is still there to be fought again while the window lasts
 */
export default function RocketStopDialog(props: RocketStopDialogProps): JSX.Element {
  const game = useGame();
  const [picking, setPicking] = createSignal(false);
  const [status, setStatus] = createSignal<string | null>(null);

  const stop = (): string | null => props.challenge?.[0] ?? null;

  /**
   * The fielded party as squares. They are not catches and have no
   * records: what a square needs of one is its species and a name to
   * be read out by, and a stop's party is neither hurt nor hatching
   */
  const lineup = (record: RocketRecord): BoxEntry[] =>
    record.party.map((entry, at) => ({
      id: `${at}`,
      species: entry.species,
      shiny: false,
      egg: false,
      progress: 0,
      fainted: false,
      label: `${getSpeciesData(entry.species).name}, Lv. ${rocketPartyLevel(record.party.length)}`,
    }));

  /** The boss fields six; everybody else makes do with three. */
  const boss = (): boolean => (props.challenge?.[1].party.length ?? 0) > 3;

  const duel = (): boolean => props.npc === Npc.Trainer;

  const greeting = (): string => {
    if (duel()) {
      return `A trainer squares up. “${NPC_QUOTES[Npc.Trainer]}”`;
    }
    if (boss()) {
      return 'Giovanni himself bars the way. “So you are the one. Show me what you have.”';
    }
    return `A Team Rocket grunt blocks the way. “${NPC_QUOTES[Npc.RocketGrunt]}”`;
  };

  const stakes = (): string => {
    if (duel()) {
      return `Three of theirs against as many as you bring. Win and the purse is yours; the
        trainer keeps their pokemon. Lose and you lose nothing but the fight. They will be
        here all window.`;
    }
    if (boss()) {
      return `Six of his against as many as you bring. Beat him and he leaves one of the six
        behind, along with a purse worth the trouble. Lose and you lose nothing but the
        fight. He is not going anywhere this window.`;
    }
    return `Three of theirs against as many as you bring. Win and the grunt drops a purse and
      whatever they were carrying. Lose and you lose nothing but the fight. They will be
      here all window.`;
  };

  // A refusal belongs to the grunt that refused: reopened on another
  // stop, the dialog must not greet the player with the last one's
  createEffect(() => {
    if (props.challenge != null) {
      setStatus(null);
    }
  });

  const accept = (catches: string[]): void => {
    const id = stop();

    if (id == null) {
      return;
    }
    setPicking(false);
    setStatus(null);
    startRocketBattle(id, catches)
      .then((battle) => {
        if (battle == null) {
          setStatus(
            duel()
              ? 'The trainer waves you off. Nothing more today.'
              : 'The grunt wants nothing more to do with you.',
          );
          return;
        }
        props.onClose();
        game.setBattle({ id: battle, replay: false, rocket: id });
      })
      .catch((caught: unknown) => {
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  return (
    <>
      <Dialog
        isOpen={props.challenge != null && !picking()}
        onClose={props.onClose}
        title={duel() ? 'Trainer' : 'Team Rocket'}
        terse
        description={greeting()}
      >
        <Show when={props.challenge?.[1]}>
          {(record) => (
            <div class="flex flex-col items-center gap-3 py-2 text-center">
              {/* The challenger themselves, from the overworld's own
                  charset: the dialog already names them, so the
                  picture is not read out */}
              <NpcSprite npc={props.npc} sheet={props.sheet} label="" />

              {/* What they are fielding, in the same box of squares
                  the player reads their own pokemon in: a lineup laid
                  out the way a box is laid out is one they already
                  know how to read. Nothing here is theirs to press */}
              <CatchBox
                entries={lineup(record())}
                capacity={record().party.length}
                columns={3}
                cardOnly
              />
              <Meta>
                All {record().party.length === 6 ? 'six' : 'three'} at level{' '}
                {rocketPartyLevel(record().party.length)}.
              </Meta>

              {/* And what the fight is worth, which is the decision the
                  buttons below are asking about */}
              <Meta class="max-w-prose">{stakes()}</Meta>
            </div>
          )}
        </Show>

        <DialogActions>
          <Button
            tone="primary"
            onClick={() => {
              setPicking(true);
            }}
          >
            Battle
          </Button>
          <Button onClick={props.onClose}>Walk away</Button>
        </DialogActions>
        <Status message={status()} />
      </Dialog>

      <TeamPickerDialog
        player={props.user.uid}
        isOpen={picking()}
        onClose={() => {
          setPicking(false);
        }}
        onSubmit={accept}
      />
    </>
  );
}
