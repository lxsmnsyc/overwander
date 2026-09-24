import { type JSX, Show, createEffect, createSignal, on, onCleanup } from 'solid-js';
import type { PlayerIdentity } from '../../../auth/user';
import { type CaughtPokemon, getCaught } from '../../../auth/caught';
import { dungeonFightSeed } from '../../../auth/dungeon-record';
import {
  type DungeonEntry,
  type DungeonRun,
  beginDungeonRun,
  climbDungeon,
  enterDungeon,
  leaveDungeonRun,
  meetDungeonLegendary,
  moveInDungeon,
  startDungeonFight,
} from '../../../auth/dungeons';
import { getMaxHealth, isFainted } from '../../../auth/health';
import { TEAM_SIZE } from '../../../auth/teams';
import { getItemData } from '../../../data/items';
import DungeonKind from '../../../data/overworld/dungeon';
import {
  FRONTIER_BRAIN_RULES,
  FRONTIER_TEAM_SIZE,
  FrontierRule,
  frontierTeamSize,
} from '../../../data/overworld/experts';
import Npc from '../../../data/overworld/npc';
import { getSpeciesData } from '../../../data/species';
import { Direction, type DungeonFloor, RoomKind } from '../../../overworld/dungeon/floor';
import type { DungeonLayout } from '../../../overworld/dungeon/layout';
import { type DungeonFoe, dungeonFoe, getDungeonLayout } from '../../../overworld/dungeon/stage';
import { atExit } from '../../../overworld/dungeon/walk';
import { levelInBand } from '../../../overworld/encounter';
import { FRONTIER_PARTY_LEVELS, rentalOffer } from '../../../overworld/stop';
import TeamPickerDialog from '../../battle/TeamPickerDialog';
import CatchBox, { type BoxEntry } from '../../catches/CatchBox';
import { type OpenDungeon, useGame } from '../../app/game-context';
import { Badge, Button, Dialog, DialogActions, Meta, Row, Status } from '../../styled';
import FloorMap from './FloorMap';
import { dungeonTitle, floorName, floorRules, partyIsLit, stairsWant } from './describe';

/**
 * A dungeon, walked room by room. The party is locked in at the
 * entrance, a lost fight sends the run back there, and the only mending
 * on the way is the player's own medicine
 */
export default function DungeonDialog(props: {
  user: PlayerIdentity;
  open: OpenDungeon | null;
  onClose: () => void;
}): JSX.Element {
  const game = useGame();
  const [entry, setEntry] = createSignal<DungeonEntry | undefined>(undefined);
  const [status, setStatus] = createSignal<string | null>(null);
  const [party, setParty] = createSignal<CaughtPokemon[]>([]);
  const [picking, setPicking] = createSignal(false);
  const [taken, setTaken] = createSignal<number[]>([]);
  const [busy, setBusy] = createSignal(false);

  const layout = (): DungeonLayout | null => {
    const open = props.open;

    return open == null ? null : getDungeonLayout(open.snapshot, open.cell);
  };
  const run = (): DungeonRun | null => {
    const held = entry();

    return held == null || typeof held === 'string' ? null : held;
  };
  const rules = (): FrontierRule => {
    const open = props.open;
    const brain =
      open != null && layout()?.kind === DungeonKind.Frontier
        ? open.snapshot.getFrontierBrain(open.cell)
        : null;

    return brain == null ? FrontierRule.None : FRONTIER_BRAIN_RULES[brain];
  };

  const fail = (caught: unknown): void => {
    setStatus(caught instanceof Error ? caught.message : String(caught));
  };

  // Read afresh whenever it is opened, and again once a fight has settled
  createEffect(
    on(
      () => props.open,
      (open) => {
        setEntry(undefined);
        setTaken([]);
        setStatus(open?.note ?? null);
        if (open == null) {
          return;
        }
        enterDungeon(open.snapshot, open.cell).then(setEntry).catch(fail);
      },
    ),
  );

  // The locked party, for its health and for whether it carries a light
  createEffect(
    on(
      () => run()?.party.join(','),
      () => {
        const ids = run()?.party ?? [];

        const reads: Promise<CaughtPokemon | null>[] = [];

        for (const id of ids) {
          reads.push(getCaught(id));
        }
        Promise.all(reads)
          .then((found) => {
            const kept: CaughtPokemon[] = [];

            for (const one of found) {
              if (one != null) {
                kept.push(one);
              }
            }
            setParty(kept);
          })
          .catch(fail);
      },
    ),
  );

  const act = (work: () => Promise<void>): void => {
    if (busy()) {
      return;
    }
    setBusy(true);
    setStatus(null);
    work()
      .catch(fail)
      .finally(() => {
        setBusy(false);
      });
  };

  const floor = (): DungeonFloor | null => {
    const at = run();
    const held = layout();

    return at == null || held == null ? null : (held.floors[at.floor] ?? null);
  };

  const foe = (): DungeonFoe | null => {
    const open = props.open;
    const at = run();

    if (open == null || at?.state == null || at.beaten.includes(at.state.at)) {
      return null;
    }
    return dungeonFoe(open.snapshot, open.cell, at.floor, at.state.at);
  };

  const fightSeed = (): string | null => {
    const at = run();

    return at?.state == null ? null : dungeonFightSeed(at.id, at.floor, at.state.at);
  };

  const rented = (): boolean => foe()?.rules === FrontierRule.Rented;

  const crate = (): BoxEntry[] => {
    const seed = fightSeed();
    const squares: BoxEntry[] = [];

    if (seed == null || !rented()) {
      return squares;
    }
    for (const [at, [species, , traitValue]] of rentalOffer(seed).entries()) {
      squares.push({
        id: `${at}`,
        species,
        shiny: false,
        egg: false,
        progress: 0,
        fainted: false,
        mark: taken().includes(at) ? 'picked' : undefined,
        label: `${getSpeciesData(species).name}, Lv. ${levelInBand(traitValue, FRONTIER_PARTY_LEVELS)}`,
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
      return held.length >= FRONTIER_TEAM_SIZE ? held : [...held, at];
    });
  };

  const lineup = (fighting: DungeonFoe): BoxEntry[] => {
    const squares: BoxEntry[] = [];

    for (const [at, [species, , traitValue]] of fighting.party.entries()) {
      squares.push({
        id: `${at}`,
        species,
        shiny: false,
        egg: false,
        progress: 0,
        fainted: false,
        label: `${getSpeciesData(species).name}, Lv. ${levelInBand(traitValue, fighting.levels)}`,
      });
    }
    return squares;
  };

  const partyBox = (): BoxEntry[] => {
    const squares: BoxEntry[] = [];

    for (const [at, one] of party().entries()) {
      squares.push({
        id: `${at}`,
        species: one.species,
        shiny: one.shiny,
        egg: false,
        progress: 0,
        fainted: isFainted(one),
        label: `${getSpeciesData(one.species).name}, ${one.health} of ${getMaxHealth(one)} HP`,
      });
    }
    return squares;
  };

  const begin = (catches: string[]): void => {
    const at = run();

    setPicking(false);
    if (at == null) {
      return;
    }
    act(async () => {
      const started = await beginDungeonRun(at.id, catches);

      if (started == null) {
        setStatus('The way in is shut to that party.');
        return;
      }
      setEntry(started);
    });
  };

  const move = (direction: Direction): void => {
    const at = run();

    if (at?.state == null || foe() != null) {
      return;
    }
    act(async () => {
      const stepped = await moveInDungeon(at.id, direction);

      if (stepped == null) {
        return;
      }
      setEntry(stepped.run);

      const found: string[] = [];

      for (const { item, amount } of stepped.items) {
        found.push(amount > 1 ? `${getItemData(item).name} ×${amount}` : getItemData(item).name);
      }
      if (found.length > 0) {
        setStatus(`Found ${found.join(', ')}.`);
      }
    });
  };

  const fight = (): void => {
    const at = run();
    const fighting = foe();

    if (at == null || fighting == null) {
      return;
    }

    const picks: string[] = [];

    for (const one of taken()) {
      picks.push(String(one));
    }
    act(async () => {
      const battle = await startDungeonFight(at.id, picks);

      if (battle == null) {
        setStatus('Nobody in the party can fight. Heal them with medicine, or walk out.');
        return;
      }
      game.setBattle({
        id: battle,
        replay: false,
        dungeon: at.id,
        opponent: {
          name: fighting.name === '' ? 'Wild pokemon' : fighting.name,
          sprite: fighting.sprite,
        },
        npc: layout()?.kind === DungeonKind.Hideout ? Npc.RocketGrunt : Npc.Trainer,
      });
    });
  };

  const climb = (): void => {
    const at = run();

    if (at == null) {
      return;
    }
    act(async () => {
      const climbed = await climbDungeon(at.id);

      if (climbed != null) {
        setEntry(climbed);
      }
    });
  };

  const meet = (): void => {
    const at = run();

    if (at == null) {
      return;
    }
    act(async () => {
      const met = await meetDungeonLegendary(at.id);

      if (met?.encounter != null) {
        props.onClose();
        game.setEncounter(met.encounter);
      }
    });
  };

  const leave = (): void => {
    const at = run();

    if (at == null) {
      return;
    }
    act(async () => {
      const left = await leaveDungeonRun(at.id);

      if (left != null) {
        setEntry(left);
      }
    });
  };

  // The arrow keys walk, while a floor is being walked
  createEffect(() => {
    if (props.open == null || picking()) {
      return;
    }

    const keys: Partial<Record<string, Direction>> = {
      ArrowUp: Direction.North,
      ArrowRight: Direction.East,
      ArrowDown: Direction.South,
      ArrowLeft: Direction.West,
    };
    const onKey = (event: KeyboardEvent): void => {
      const direction = keys[event.key];

      if (direction != null && run()?.state != null) {
        event.preventDefault();
        move(direction);
      }
    };

    window.addEventListener('keydown', onKey);
    onCleanup(() => {
      window.removeEventListener('keydown', onKey);
    });
  });

  const title = (): string => {
    const open = props.open;
    const held = layout();

    return open == null || held == null ? 'Dungeon' : dungeonTitle(held, open.snapshot, open.cell);
  };

  const most = (): number =>
    rules() === FrontierRule.None ? TEAM_SIZE : frontierTeamSize(rules());

  const onStairs = (): boolean => {
    const at = run();
    const here = floor();

    return at?.state != null && here != null && atExit(here, at.state);
  };

  const last = (): boolean => {
    const at = run();
    const held = layout();

    return at != null && held != null && at.floor === held.floors.length - 1;
  };

  return (
    <>
      <Dialog
        isOpen={props.open != null && !picking()}
        onClose={props.onClose}
        title={title()}
        description="Walk it room by room with the party you bring in."
      >
        <Show when={entry() !== undefined} fallback={<Meta>Looking inside…</Meta>}>
          <Show when={entry() === 'locked'}>
            <Meta>The house takes nobody without the crown of its region.</Meta>
          </Show>
          <Show when={entry() === 'cleared'}>
            <Meta>You have cleared it this window.</Meta>
          </Show>
          <Show when={entry() === null}>
            <Meta>Nothing stirs inside. Come back next window.</Meta>
          </Show>
        </Show>

        <Show when={run()}>
          {(at) => (
            <Show
              when={at().state != null}
              fallback={
                <div class="flex flex-col gap-2 py-2">
                  <Meta>
                    {layout()?.floors.length} floors. The party you bring is the party you finish
                    with: nothing mends it on the way but your own medicine, and losing a fight
                    sends you back to the entrance.
                  </Meta>
                  <DialogActions>
                    <Button
                      tone="primary"
                      disabled={busy()}
                      onClick={() => {
                        if (rules() === FrontierRule.Rented) {
                          begin([]);
                          return;
                        }
                        setPicking(true);
                      }}
                    >
                      Go in
                    </Button>
                    <Button onClick={props.onClose}>Walk away</Button>
                  </DialogActions>
                </div>
              }
            >
              <div class="flex flex-col gap-3 py-2">
                <Row class="justify-center">
                  <Badge tone="tide">{floorName(at().kind, at().floor)}</Badge>
                  <Show when={floor()}>{(here) => <Meta>{floorRules(here())}</Meta>}</Show>
                </Row>

                <Show when={floor()?.gimmick != null && layout()}>
                  {(held) => (
                    <Show when={floor()}>
                      {(here) => (
                        <FloorMap
                          layout={held()}
                          run={at()}
                          floor={here()}
                          lit={partyIsLit(party())}
                        />
                      )}
                    </Show>
                  )}
                </Show>

                <Show when={foe()}>
                  {(fighting) => (
                    <div class="flex flex-col items-center gap-2 text-center">
                      <Meta>
                        {fighting().name === ''
                          ? 'A wild horde bars the room.'
                          : `${fighting().name} bars the way.`}{' '}
                        Lv. {fighting().levels[0]}–{fighting().levels[1]}
                      </Meta>
                      <Show when={fighting().party.length > 0}>
                        <CatchBox
                          entries={lineup(fighting())}
                          capacity={fighting().party.length}
                          columns={3}
                          cardOnly
                        />
                      </Show>
                      <Show when={rented()}>
                        <CatchBox
                          entries={crate()}
                          capacity={crate().length}
                          columns={3}
                          onOpen={toggle}
                        />
                        <Meta>
                          Pick {FRONTIER_TEAM_SIZE} to rent. {taken().length} taken.
                        </Meta>
                      </Show>
                    </div>
                  )}
                </Show>

                <Show when={onStairs() && !last() && foe() == null && floor()}>
                  {(here) => <Meta>{stairsWant(at(), here()) ?? 'The stairs are open.'}</Meta>}
                </Show>

                <Show when={party().length > 0}>
                  <CatchBox entries={partyBox()} capacity={party().length} columns={6} cardOnly />
                </Show>

                <Show when={floor()?.gimmick != null && foe() == null}>
                  <div class="mx-auto grid grid-cols-3 gap-1">
                    <span />
                    <Button
                      label="North"
                      disabled={busy()}
                      onClick={() => {
                        move(Direction.North);
                      }}
                    >
                      ↑
                    </Button>
                    <span />
                    <Button
                      label="West"
                      disabled={busy()}
                      onClick={() => {
                        move(Direction.West);
                      }}
                    >
                      ←
                    </Button>
                    <span />
                    <Button
                      label="East"
                      disabled={busy()}
                      onClick={() => {
                        move(Direction.East);
                      }}
                    >
                      →
                    </Button>
                    <span />
                    <Button
                      label="South"
                      disabled={busy()}
                      onClick={() => {
                        move(Direction.South);
                      }}
                    >
                      ↓
                    </Button>
                    <span />
                  </div>
                </Show>

                <DialogActions>
                  <Show when={foe() != null}>
                    <Button
                      tone="primary"
                      disabled={busy() || (rented() && taken().length !== FRONTIER_TEAM_SIZE)}
                      onClick={fight}
                    >
                      Battle
                    </Button>
                  </Show>
                  <Show
                    when={
                      onStairs() &&
                      !last() &&
                      foe() == null &&
                      floor() != null &&
                      stairsWant(at(), floor()!) == null
                    }
                  >
                    <Button tone="primary" disabled={busy()} onClick={climb}>
                      Take the stairs
                    </Button>
                  </Show>
                  <Show
                    when={
                      onStairs() &&
                      last() &&
                      at().kind === DungeonKind.Dungeon &&
                      floor()?.rooms[at().state?.at ?? 0].kind === RoomKind.Boss
                    }
                  >
                    <Button tone="primary" disabled={busy()} onClick={meet}>
                      Face the legendary
                    </Button>
                  </Show>
                  <Button disabled={busy()} onClick={leave}>
                    Give up the run
                  </Button>
                  <Button onClick={props.onClose}>Step outside</Button>
                </DialogActions>
              </div>
            </Show>
          )}
        </Show>
        <Status message={status()} />
      </Dialog>

      <TeamPickerDialog
        player={props.user.uid}
        max={most()}
        isOpen={picking()}
        onClose={() => {
          setPicking(false);
        }}
        onSubmit={begin}
      />
    </>
  );
}
