import { For, type JSX, Show, createResource, createSignal } from 'solid-js';
import { type CaughtPokemon, getCaughtBatched, isGuarded } from '../../auth/caught';
import { isEgg } from '../../auth/egg';
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
function heldBack(option: CatchOption): string | null {
  if (isEgg(option.caught)) {
    return 'not hatched';
  }
  if (isFainted(option.caught)) {
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
function SavedTeam(props: { preset: TeamPresetRecord; onUse: () => void }): JSX.Element {
  // A preset holds ids, and the batched read turns its six into one request
  const [party] = createResource(
    () => props.preset.catches.join(','),
    async (key): Promise<[string, CaughtPokemon][]> => {
      const held: [string, CaughtPokemon][] = [];

      for (const id of key.split(',')) {
        const caught = await getCaughtBatched(id);

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
      if (heldBack({ id, caught, fighting: false }) != null) {
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
      <Button tone="primary" onClick={props.onUse}>
        Use
      </Button>
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
  const [loaded, setLoaded] = createSignal<string[] | undefined>();

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

  return (
    <Dialog
      isOpen={props.isOpen}
      onClose={props.onClose}
      title="Form a team"
      description={`Choose up to ${props.max ?? TEAM_SIZE} of your pokemon, or load a team you saved.`}
      width="wide"
    >
      <TabGroup
        horizontal
        value={open()}
        onChange={(value: TeamTab) => {
          setOpen(value);
        }}
        class="flex flex-col gap-3"
      >
        <TabBar>
          <TabButton value={TeamTab.Box}>Your pokemon</TabButton>
          <TabButton value={TeamTab.Saved}>
            Teams
            <Show when={saved().length > 0}>
              <Badge class="ml-1.5">{saved().length}</Badge>
            </Show>
          </TabButton>
        </TabBar>

        <TabPane value={TeamTab.Box}>
          <CatchPicker
            inline
            multiple
            // A press on a square takes it into the party, and a press
            // on a taken one puts it back: forming a team is six of
            // those, and a card and a button in the way of each is five
            // steps too many
            player={props.player}
            value={[]}
            load={loaded()}
            max={props.max ?? TEAM_SIZE}
            // Strongest first. A team is picked for what it can win,
            // and a box arriving newest-first made the player hunt for
            // the six they would have chosen anyway
            sort="level"
            verb="Join with"
            empty="No catches to bring."
            reason={heldBack}
            onPick={(catches) => {
              props.onSubmit(catches);
              props.onClose();
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
                    // Loaded into the box rather than fielded outright:
                    // the player sees what came and what did not, and
                    // presses the same button anybody else does
                    onUse={() => {
                      setLoaded([...preset.catches]);
                      setOpen(TeamTab.Box);
                    }}
                  />
                )}
              </For>
            </List>
          </Show>
        </TabPane>
      </TabGroup>

      <DialogActions>
        <Button onClick={props.onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
