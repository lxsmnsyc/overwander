import type { PlayerIdentity } from '../../auth/user';
import { type JSX, Show, createEffect, createSignal } from 'solid-js';
import type { StopRecord } from '../../model/stop-record';
import { startStopBattle } from '../../auth/stops';
import Npc from '../../data/overworld/npc';
import { getNpc, npcName, npcSheet } from '../../overworld/npcs';
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
import { openForm } from '../forms/stack';
import { PickTeamForm } from '../forms/pick-team';
import CatchBox, { type BoxEntry } from '../catches/CatchBox';
import NpcSprite from './NpcSprite';
import { Button, Dialog, DialogActions, Meta, useToast } from '../styled';
import { CounterStep, CounterTerms, HeadingPortrait } from '../forms/terms';
import { TEAM_SIZE } from '../../auth/teams';
import { useGame } from '../app/game-context';
import type { StopChallenge } from '../../game/overworld/challengers';
import describeFailure from '../../i18n/refusals';
import { m } from '../../i18n/paraglide/messages.js';

export type { StopChallenge };

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
  const toast = useToast();

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
  const crate = (): BoxEntry[] => {
    const squares: BoxEntry[] = [];

    for (const [at, [species, , traitValue]] of offer().entries()) {
      squares.push({
        id: `${at}`,
        species,
        shiny: false,
        female: false,
        egg: false,
        progress: 0,
        fainted: false,
        mark: taken().includes(at) ? ('picked' as const) : undefined,
        label: m.ow_lineup_square({
          species: getSpeciesData(species).name,
          level: levelInBand(traitValue, FRONTIER_PARTY_LEVELS),
        }),
      });
    }
    return squares;
  };

  const toggle = (id: string): void => {
    const at = Number(id);

    setTaken((held) => {
      if (held.includes(at)) {
        const kept: number[] = [];

        for (const one of held) {
          if (one !== at) {
            kept.push(one);
          }
        }
        return kept;
      }
      return held.length >= (props.challenger?.bring ?? FRONTIER_TEAM_SIZE) ? held : [...held, at];
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

  const lineup = (record: StopRecord): BoxEntry[] => {
    const squares: BoxEntry[] = [];

    for (const [at, entry] of record.party.entries()) {
      squares.push({
        id: `${at}`,
        species: entry.species,
        shiny: false,
        female: false,
        egg: false,
        progress: 0,
        fainted: false,
        label: m.ow_lineup_square({
          species: getSpeciesData(entry.species).name,
          level: levelInBand(entry.traitValue, levels()),
        }),
      });
    }
    return squares;
  };

  /**
   * Who the fight is against, in a name and a face. It travels with
   * the battle because this dialog is the last screen that knows: the
   * field is handed a stop id and a pair of frozen parties, and one of
   * those parties belongs to nobody
   */
  const opponent = (): { name: string; sprite: string } => ({
    name: props.challenger?.name ?? npcName(Npc.RocketGrunt),
    // The style they were standing in, so the summary shows the same
    // person the player walked up to
    sprite: props.sheet ?? npcSheet(props.npc),
  });

  const greeting = (): string => {
    const challenger = props.challenger;

    if (challenger != null) {
      return challenger.greeting;
    }
    return m.stop_rocket_greeting({ quote: getNpc(Npc.RocketGrunt).quote });
  };

  /** What a challenge that can no longer be taken says */
  const refusal = (): string => {
    if (props.challenger != null) {
      return m.stop_waves_off({ name: props.challenger.name });
    }
    return m.stop_grunt_refuses();
  };

  // A refusal belongs to the grunt that refused: reopened on another
  // stop, the dialog must not greet the player with the last one's
  createEffect(() => {
    if (props.challenge != null) {
      setTaken([]);
    }
  });

  const accept = (catches: string[]): void => {
    const id = stop();

    if (id == null) {
      return;
    }
    setPicking(false);
    startStopBattle(id, catches)
      .then((battle) => {
        if (battle == null) {
          toast.push({ message: refusal(), tone: 'ember' });
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
        toast.push({
          message: describeFailure(caught),
          tone: 'ember',
        });
      });
  };

  return (
    <>
      <Dialog
        isOpen={props.challenge != null && !picking()}
        onClose={props.onClose}
        title={props.challenger?.name ?? m.ow_team_rocket()}
        lead={
          <HeadingPortrait>
            <NpcSprite npc={props.npc} sheet={props.sheet} size={28} label="" />
          </HeadingPortrait>
        }
        description={<span class="italic">{greeting()}</span>}
      >
        <Show when={props.challenge?.[1]}>
          {(record) => (
            <div class="flex flex-col gap-3">
              {/* What the fight asks of a party before the line-up is read */}
              <CounterTerms
                rows={[
                  {
                    label: m.stop_levels(),
                    value: m.stop_levels_value({ lowest: levels()[0], highest: levels()[1] }),
                  },
                  {
                    label: m.stop_bring(),
                    value: m.stop_bring_value({ count: props.challenger?.bring ?? TEAM_SIZE }),
                  },
                  ...(props.challenger == null
                    ? []
                    : [{ label: m.ow_win(), value: props.challenger.wins }]),
                ]}
              />
              {/* A Frontier house rule changes the whole fight, so it is said in full */}
              <Show when={props.challenger?.rule}>{(rule) => <Meta>{rule()}</Meta>}</Show>
              <CounterStep>{m.ow_their_lineup()}</CounterStep>
              {/* What they are fielding, in the same box of squares
                  the player reads their own pokemon in: a lineup laid
                  out the way a box is laid out is one they already
                  know how to read. Nothing here is theirs to press */}
              {/* A house that answers what you bring has nothing to
                  lay out yet, so the space says so rather than
                  standing empty */}
              <Show when={!unseen()} fallback={<Meta>{m.stop_unseen()}</Meta>}>
                <CatchBox
                  entries={lineup(record())}
                  capacity={record().party.length}
                  columns={3}
                  cardOnly
                />
              </Show>
            </div>
          )}
        </Show>

        {/* What the house has on the table, where it lends the
            party: the six are laid out with the fight rather than
            behind a second dialog, and the button waits for three */}
        <Show when={rented()}>
          <div class="flex flex-col gap-2 pt-3">
            <CounterStep>
              {m.stop_rent({ size: FRONTIER_TEAM_SIZE, taken: taken().length })}
            </CounterStep>
            <CatchBox entries={crate()} capacity={crate().length} columns={3} onOpen={toggle} />
          </div>
        </Show>

        <DialogActions>
          <Button
            tone="primary"
            disabled={rented() && taken().length !== FRONTIER_TEAM_SIZE}
            onClick={() => {
              if (rented()) {
                const ids: string[] = [];

                for (const at of taken()) {
                  ids.push(String(at));
                }
                accept(ids);
                return;
              }
              // The challenge steps aside while the team is picked
              setPicking(true);
              openForm(PickTeamForm, { player: props.user.uid, max: props.challenger?.bring })
                .then((team) => {
                  if (team == null) {
                    setPicking(false);
                  } else {
                    accept(team);
                  }
                })
                .catch(() => {
                  setPicking(false);
                });
            }}
          >
            {m.stop_battle()}
          </Button>
          <Button onClick={props.onClose}>{m.ow_walk_on()}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
