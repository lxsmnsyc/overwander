import { For, type JSX, Show, createMemo, createResource, createSignal } from 'solid-js';
import { type CaughtPokemon, getCaughtBatched, isGuarded } from '../../auth/caught';
import { getCatchName, isShiny } from '../../auth/caught-record';
import { isEgg } from '../../auth/egg';
import { Genders } from '../../data/ids/species';
import AnimatedSprite from '../sprites/AnimatedSprite';
import { isFainted } from '../../auth/health';
import { TEAM_SIZE } from '../../auth/teams';
import { type TeamPresetRecord, listTeamPresets } from '../../auth/team-presets';
import { useAuth } from '../../auth/context';
import CatchPicker, { type CatchOption } from '../catches/catch-picker';
import TeamStrip from '../catches/TeamStrip';
import {
  Badge,
  Button,
  Dialog,
  DialogActions,
  List,
  ListRow,
  Meta,
  Note,
  TabBar,
  TabButton,
  TabGroup,
  TabPane,
} from '../styled';

/**
 * Why a pokemon cannot be brought into a raid. All four are shown
 * rather than hidden: a player counting their six should find out
 * where the sixth went instead of finding it gone
 */
function heldBack(option: CatchOption, healed = false): string | null {
  if (isEgg(option.caught)) {
    return 'not hatched';
  }
  if (!healed && isFainted(option.caught)) {
    return 'fainted';
  }
  // Put away by its owner. Nothing is wrong with it — they said so
  if (isGuarded(option.caught)) {
    return 'locked';
  }
  // One pokemon, one battle. It comes back when the raid it is in ends
  return option.fighting ? 'in a raid' : null;
}

/** The two halves of forming a team: the box, and the teams already saved */
const enum TeamTab {
  Box = 0,
  Saved = 1,
}

/** One saved team, drawn as its name over the pokemon in it */
function SavedTeam(props: {
  preset: TeamPresetRecord;
  healed?: boolean;
  onUse: () => void;
}): JSX.Element {
  // A preset holds ids, and the batched read turns its six into one request
  const [party] = createResource(
    () => props.preset.catches.join(','),
    async (key): Promise<[string, CaughtPokemon][]> => {
      const pending: Promise<[string, CaughtPokemon | null]>[] = [];

      // Asked for together, since the batch only merges reads started in the same tick
      for (const id of key.split(',')) {
        if (id === '') {
          continue;
        }
        pending.push(
          getCaughtBatched(id).then((caught): [string, CaughtPokemon | null] => [id, caught]),
        );
      }

      const held: [string, CaughtPokemon][] = [];

      for (const [id, caught] of await Promise.all(pending)) {
        if (caught != null) {
          held.push([id, caught]);
        }
      }
      return held;
    },
  );

  /**
   * What it can no longer field: released or traded away, and whatever
   * is unfit for a fight. A raid it is already in is not counted here,
   * since that is read beside the box rather than off the record
   */
  const short = (): number => {
    let missing = props.preset.catches.length - (party.latest?.length ?? 0);

    for (const [id, caught] of party.latest ?? []) {
      if (heldBack({ id, caught, fighting: false }, props.healed) != null) {
        missing += 1;
      }
    }
    return missing;
  };

  return (
    <ListRow title={props.preset.name}>
      <span class="flex min-w-0 grow flex-col gap-1">
        <span class="flex items-center gap-2">
          <span class="truncate font-bold">{props.preset.name}</span>
          <Show when={short() > 0}>
            <Meta>{short()} cannot come</Meta>
          </Show>
        </span>
        <TeamStrip catches={party.latest ?? []} />
      </span>
      <Button onClick={props.onUse}>Load</Button>
    </ListRow>
  );
}

export interface TeamPickerDialogProps {
  player: string;
  isOpen: boolean;
  onClose: () => void;
  /**
   * The most that may be brought. A duel's host sets this; anything
   * else takes the game's own six
   */
  max?: number;
  /** Why the fight's own rules bar a pokemon, beside the reasons any fight does */
  refuse?: (option: CatchOption) => string | null;
  /**
   * Whether the fight fields everyone at full health, so a fainted
   * pokemon may come. A duel does; a raid takes what was left
   */
  healed?: boolean;
  /**
   * Fired with the chosen catch ids, at most `max` of them
   */
  onSubmit: (catches: string[]) => void;
}

/**
 * Pick the catches to bring into a fight: the whole box on one tab and
 * the teams the player saved on the other. A saved team is loaded into
 * the box rather than fielded outright, since what it names may have
 * fainted or be fighting somewhere else, and the party stays theirs to
 * change either way
 */
export default function TeamPickerDialog(props: TeamPickerDialogProps): JSX.Element {
  const auth = useAuth();
  const [open, setOpen] = createSignal<TeamTab>(TeamTab.Box);
  /** The party so far, which the box lights and the row above it draws */
  const [picks, setPicks] = createSignal<string[]>([]);
  /** What the box is offering, so the party row can draw each pick */
  const [offered, setOffered] = createSignal<CatchOption[]>([]);

  const max = (): number => props.max ?? TEAM_SIZE;

  const owner = (): string | null => {
    if (!props.isOpen) {
      return null;
    }
    return props.player === '' ? (auth.user()?.uid ?? null) : props.player;
  };

  // Read when the dialog opens rather than held: a team saved in the
  // profile a moment ago should be here without a reload
  const [presets] = createResource(owner, async (player): Promise<[string, TeamPresetRecord][]> =>
    listTeamPresets(player),
  );

  const saved = (): [string, TeamPresetRecord][] => presets.latest ?? [];

  const byId = createMemo(() => {
    const options = new Map<string, CatchOption>();

    for (const option of offered()) {
      options.set(option.id, option);
    }
    return options;
  });

  /**
   * A saved team, loaded into the party: everything it names that is on
   * offer and fit to come, in the order it was saved
   */
  const load = (catches: readonly string[]): void => {
    const taken: string[] = [];

    for (const id of catches) {
      const option = byId().get(id);

      if (
        option != null &&
        heldBack(option, props.healed) == null &&
        props.refuse?.(option) == null &&
        taken.length < max()
      ) {
        taken.push(id);
      }
    }
    setPicks(taken);
    setOpen(TeamTab.Box);
  };

  const drop = (id: string): void => {
    const rest: string[] = [];

    for (const one of picks()) {
      if (one !== id) {
        rest.push(one);
      }
    }
    setPicks(rest);
  };

  const close = (): void => {
    setPicks([]);
    setOpen(TeamTab.Box);
    props.onClose();
  };

  return (
    <Dialog
      isOpen={props.isOpen}
      onClose={close}
      title="Form a team"
      description={`Tap to bring one, tap again to leave it. Up to ${max()}.`}
      width="wide"
      aside={
        <span class="rounded-full bg-tide-soft px-2.5 py-1 text-xs font-extrabold text-tide-dark">
          {picks().length} / {max()}
        </span>
      }
    >
      {/* The party before the box, so the team is in view however far
          down the box has been scrolled */}
      <ol
        class="m-0 grid list-none gap-1.5 rounded-2xl border-2 border-tide/35 bg-tide-soft p-2"
        style={{ 'grid-template-columns': `repeat(${max()}, minmax(0, 1fr))` }}
      >
        <For each={Array.from({ length: max() }, (_, at) => at)}>
          {(at) => (
            <li class="aspect-square">
              <Show
                when={byId().get(picks()[at] ?? '')}
                fallback={
                  <span
                    class="grid size-full place-items-center rounded-xl border-2 border-dashed
                      border-line text-xs font-extrabold text-muted"
                  >
                    {at + 1}
                  </span>
                }
              >
                {(option) => (
                  <button
                    type="button"
                    aria-label={`Take ${getCatchName(option().caught)} out of the team`}
                    class="relative flex size-full cursor-pointer flex-col items-center
                      justify-end rounded-xl border-2 border-line bg-paper p-1 shadow-pop-sm
                      hover:border-ember"
                    onClick={() => {
                      drop(option().id);
                    }}
                  >
                    <span class="min-h-0 w-full grow">
                      <AnimatedSprite
                        species={option().caught.species}
                        shiny={isShiny(option().caught)}
                        female={option().caught.gender === Genders.Female}
                        direction="Down"
                        still
                        fill
                        label=""
                      />
                    </span>
                    <span class="text-[10px] font-extrabold text-muted">
                      Lv {option().caught.level}
                    </span>
                    <span
                      aria-hidden="true"
                      class="absolute -top-1.5 -right-1.5 grid size-4 place-items-center
                        rounded-full border-2 border-line bg-paper text-[9px] font-extrabold
                        text-muted"
                    >
                      ✕
                    </span>
                  </button>
                )}
              </Show>
            </li>
          )}
        </For>
      </ol>

      <TabGroup
        horizontal
        value={open()}
        onChange={(value: TeamTab) => {
          setOpen(value);
        }}
        class="flex flex-col gap-3"
      >
        <TabBar class="self-start">
          <TabButton value={TeamTab.Box}>Your pokemon</TabButton>
          <TabButton value={TeamTab.Saved}>
            Teams
            <Show when={saved().length > 0}>
              <Badge class="ml-1.5">{saved().length}</Badge>
            </Show>
          </TabButton>
        </TabBar>

        <TabPane value={TeamTab.Box}>
          {/* Live: the party is held here, and Join in the dock is the one press */}
          <CatchPicker
            inline
            multiple
            live
            player={props.player}
            value={picks()}
            max={max()}
            // Strongest first. A team is picked for what it can win
            sort="level"
            verb="Join with"
            empty="No catches to bring."
            reason={(option) => heldBack(option, props.healed) ?? props.refuse?.(option) ?? null}
            onOptions={(options) => {
              setOffered(options);
            }}
            onPick={(catches) => {
              setPicks(catches);
            }}
          />
        </TabPane>

        <TabPane value={TeamTab.Saved}>
          <Show
            when={saved().length > 0}
            fallback={<Note>You have saved no teams. The profile is where they are made.</Note>}
          >
            <List>
              <For each={saved()}>
                {([, preset]) => (
                  <SavedTeam
                    preset={preset}
                    healed={props.healed}
                    onUse={() => {
                      load(preset.catches);
                    }}
                  />
                )}
              </For>
            </List>
          </Show>
        </TabPane>
      </TabGroup>

      <DialogActions>
        <Button
          tone="primary"
          disabled={picks().length === 0}
          onClick={() => {
            props.onSubmit(picks());
            close();
          }}
        >
          Join with {picks().length}
        </Button>
        <Button onClick={close}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
