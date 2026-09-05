import type { PlayerIdentity } from '../../auth/user';
import { type JSX, Show, createEffect, createSignal } from 'solid-js';
import type { RocketRecord } from '../../auth/rocket-record';
import { startRocketBattle } from '../../auth/rockets';
import Npc, { NPC_NAMES, npcSheet } from '../../data/overworld/npc';
import { getSpeciesData } from '../../data/species';
import { type LevelBand, ROCKET_PARTY_LEVELS } from '../../overworld/rocket';
import { levelInBand } from '../../overworld/encounter';
import { NPC_QUOTES } from './npc-dialog/shared';
import TeamPickerDialog from '../battle/TeamPickerDialog';
import CatchBox, { type BoxEntry } from '../catches/CatchBox';
import NpcSprite from './NpcSprite';
import { Button, Dialog, DialogActions, Meta, Status } from '../styled';
import { useGame } from '../app/game-context';

/**
 * A named challenger above the rank and file: a duelling trainer's
 * class, a gym leader, one of the Elite Four, or the Champion. The
 * name titles the dialog, the band prices the lineup, and the stake
 * line says what a win earns
 */
export interface StopChallenge {
  name: string;
  levels: LevelBand;
  greeting: string;
  stakes: string;
}

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
  /**
   * Who is standing there, which the board works out. The fallbacks
   * below are for a stop opened with nobody named, and read as the
   * rank and file
   */
  challenger?: StopChallenge | null;
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
  /** The band the fielded party rolls its levels in: the
      challenger's own, or a grunt's where nobody was named */
  const levels = (): LevelBand => props.challenger?.levels ?? ROCKET_PARTY_LEVELS;

  const lineup = (record: RocketRecord): BoxEntry[] =>
    record.party.map((entry, at) => ({
      id: `${at}`,
      species: entry.species,
      shiny: false,
      egg: false,
      progress: 0,
      fainted: false,
      label: `${getSpeciesData(entry.species).name}, Lv. ${levelInBand(entry.traitValue, levels())}`,
    }));

  /**
   * Who the fight is against, in a name and a face. It travels with
   * the battle because this dialog is the last screen that knows: the
   * field is handed a stop id and a pair of frozen parties, and one of
   * those parties belongs to nobody
   */
  const opponent = (): { name: string; sprite: string } => ({
    name: props.challenger?.name ?? NPC_NAMES[Npc.RocketGrunt],
    // The style they were standing in, so the summary shows the same
    // person the player walked up to
    sprite: props.sheet ?? npcSheet(props.npc),
  });

  const greeting = (): string => {
    const challenger = props.challenger;

    if (challenger != null) {
      return challenger.greeting;
    }
    return `A Team Rocket grunt blocks the way. “${NPC_QUOTES[Npc.RocketGrunt]}”`;
  };

  const stakes = (): string => {
    const challenger = props.challenger;

    if (challenger != null) {
      return challenger.stakes;
    }
    return `Six of theirs against as many as you bring. Win and the grunt drops a purse and
      whatever they were carrying. Lose and you lose nothing but the fight. They will be
      here all window.`;
  };

  /** What a challenge that can no longer be taken says */
  const refusal = (): string => {
    if (props.challenger != null) {
      return `${props.challenger.name} waves you off. Nothing more today.`;
    }
    return 'The grunt wants nothing more to do with you.';
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
          setStatus(refusal());
          return;
        }
        props.onClose();
        game.setBattle({
          id: battle,
          replay: false,
          rocket: id,
          opponent: opponent(),
          npc: props.npc,
        });
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
        title={props.challenger?.name ?? 'Team Rocket'}
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
                {record().party.length} of theirs, levels {levels()[0]} to {levels()[1]}.
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
