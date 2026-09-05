import type { PlayerIdentity } from '../../auth/user';
import { type JSX, Show, createEffect, createSignal } from 'solid-js';
import type { StopRecord } from '../../auth/stop-record';
import { startStopBattle } from '../../auth/stops';
import Npc, { NPC_NAMES, npcSheet } from '../../data/overworld/npc';
import { getSpeciesData } from '../../data/species';
import {
  FRONTIER_PARTY_LEVELS,
  type LevelBand,
  ROCKET_PARTY_LEVELS,
  rentalOffer,
} from '../../overworld/stop';
import { FRONTIER_TEAM_SIZE } from '../../data/overworld/experts';
import type { Spawn } from '../../overworld/chunk-snapshot';
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
  /**
   * The most this fight takes, where the house sets it: a Frontier
   * facility is three a side. Absent everywhere else, which is the
   * game's own six
   */
  bring?: number;
  /**
   * Whether the house lends the party rather than taking the
   * player's. The six on offer are drawn off the stop, so the dialog
   * lays them out itself and the picks are places in that list
   */
  rented?: boolean;
  /**
   * Whether the house has named nobody yet. The Dome draws its three
   * against the party that walks in, so there is no lineup to lay out
   * until the challenge is taken
   */
  unseen?: boolean;
}

export interface StopDialogProps {
  user: PlayerIdentity;
  /**
   * The stop's id and what is being fielded, or null when the player
   * is not standing in front of one
   */
  challenge: [string, StopRecord] | null;
  /** Who put the challenge: a grunt's ambush, a duel, a league seat */
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
 * The stop's challenge, put to the player. Accepting picks a party and
 * drops straight into the fight; declining walks away, and whoever is
 * standing there is still there to be fought again while the window
 * lasts
 */
export default function StopDialog(props: StopDialogProps): JSX.Element {
  const game = useGame();
  const [picking, setPicking] = createSignal(false);
  const [status, setStatus] = createSignal<string | null>(null);

  const stop = (): string | null => props.challenge?.[0] ?? null;

  /**
   * The six the Factory has on the table, and the places the player
   * has taken off it. Both are read off the stop rather than stored,
   * so walking away and back deals the same hand
   */
  const [taken, setTaken] = createSignal<number[]>([]);
  const rented = (): boolean => props.challenger?.rented === true;
  const unseen = (): boolean => props.challenger?.unseen === true;
  const offer = (): Spawn[] => {
    const id = stop();

    return id == null || !rented() ? [] : rentalOffer(id);
  };
  const crate = (): BoxEntry[] =>
    offer().map(([species, , traitValue], at) => ({
      id: `${at}`,
      species,
      shiny: false,
      egg: false,
      progress: 0,
      fainted: false,
      mark: taken().includes(at) ? ('picked' as const) : undefined,
      label: `${getSpeciesData(species).name}, Lv. ${levelInBand(traitValue, FRONTIER_PARTY_LEVELS)}`,
    }));

  const toggle = (id: string): void => {
    const at = Number(id);

    setTaken((held) => {
      if (held.includes(at)) {
        return held.filter((one) => one !== at);
      }
      return held.length >= FRONTIER_TEAM_SIZE ? held : [...held, at];
    });
  };

  /**
   * The fielded party as squares. They are not catches and have no
   * records: what a square needs of one is its species and a name to
   * be read out by, and a stop's party is neither hurt nor hatching
   */
  /** The band the fielded party rolls its levels in: the
      challenger's own, or a grunt's where nobody was named */
  const levels = (): LevelBand => props.challenger?.levels ?? ROCKET_PARTY_LEVELS;

  const lineup = (record: StopRecord): BoxEntry[] =>
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
      setTaken([]);
    }
  });

  const accept = (catches: string[]): void => {
    const id = stop();

    if (id == null) {
      return;
    }
    setPicking(false);
    setStatus(null);
    startStopBattle(id, catches)
      .then((battle) => {
        if (battle == null) {
          setStatus(refusal());
          return;
        }
        props.onClose();
        game.setBattle({
          id: battle,
          replay: false,
          stop: id,
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
              {/* A house that answers what you bring has nothing to
                  lay out yet, so the space says so rather than
                  standing empty */}
              <Show
                when={!unseen()}
                fallback={
                  <Meta>
                    Nobody named yet. Three of theirs at levels {levels()[0]} to {levels()[1]},
                    drawn once yours are.
                  </Meta>
                }
              >
                <CatchBox
                  entries={lineup(record())}
                  capacity={record().party.length}
                  columns={3}
                  cardOnly
                />
                <Meta>
                  {record().party.length} of theirs, levels {levels()[0]} to {levels()[1]}.
                </Meta>
              </Show>

              {/* And what the fight is worth, which is the decision the
                  buttons below are asking about */}
              <Meta class="max-w-prose">{stakes()}</Meta>
            </div>
          )}
        </Show>

        {/* What the house has on the table, where it lends the
            party: the six are laid out with the fight rather than
            behind a second dialog, and the button waits for three */}
        <Show when={rented()}>
          <div class="flex flex-col items-center gap-2 py-2 text-center">
            <CatchBox entries={crate()} capacity={crate().length} columns={3} onOpen={toggle} />
            <Meta>
              Pick {FRONTIER_TEAM_SIZE} of {crate().length} to rent. {taken().length} taken.
            </Meta>
          </div>
        </Show>

        <DialogActions>
          <Button
            tone="primary"
            disabled={rented() && taken().length !== FRONTIER_TEAM_SIZE}
            onClick={() => {
              if (rented()) {
                accept(taken().map(String));
                return;
              }
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
        max={props.challenger?.bring}
        isOpen={picking()}
        onClose={() => {
          setPicking(false);
        }}
        onSubmit={accept}
      />
    </>
  );
}
