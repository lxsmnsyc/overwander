import { For, type JSX, Show, createResource, createSignal } from 'solid-js';
import type { CaughtPokemon } from '../../auth/caught';
import { getCaughtBatched } from '../../auth/caught';
import {
  TEAM_PRESET_LIMIT,
  type TeamPresetRecord,
  deleteTeamPreset,
  listTeamPresets,
  saveTeamPreset,
} from '../../auth/team-presets';
import { NICKNAME_LIMIT, asNickname } from '../../auth/nickname';
import { TEAM_SIZE } from '../../auth/teams';
import BattleData from '../app/battle-data';
import TeamPickerDialog from '../battle/TeamPickerDialog';
import TeamStrip from '../catches/TeamStrip';
import {
  Button,
  Card,
  Dialog,
  DialogActions,
  Field,
  Hint,
  HintList,
  List,
  ListRow,
  Meta,
  Note,
  Row,
  Status,
} from '../styled';

/**
 * The parties a player saved for themselves.
 *
 * A preset is a name and up to six catch ids, and nothing here
 * promises those pokemon can fight: what a preset is for is the press
 * that fills the picker when a raid or a duel asks for a team.
 */

/** One saved team, with the pokemon in it drawn as a row of squares */
function PresetRow(props: {
  id: string;
  preset: TeamPresetRecord;
  onEdit: () => void;
  onDelete: () => void;
}): JSX.Element {
  // Read here rather than with the list: a preset holds ids, and the
  // batched read turns the six of them into one request
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

  /** What a preset lost since it was saved: released, traded, hatched into somebody else's box */
  const gone = (): number => props.preset.catches.length - (party.latest?.length ?? 0);

  return (
    <ListRow title={props.preset.name}>
      <span class="min-w-0 grow">
        <span class="flex items-center gap-2">
          <span class="truncate font-bold">{props.preset.name}</span>
          <Show when={gone() > 0}>
            <Meta>{gone()} no longer yours</Meta>
          </Show>
        </span>
        <TeamStrip catches={party.latest ?? []} />
      </span>
      <Button onClick={props.onEdit}>Edit</Button>
      <Button tone="danger" onClick={props.onDelete}>
        Delete
      </Button>
    </ListRow>
  );
}

export interface TeamsCardProps {
  player: string;
}

export default function TeamsCard(props: TeamsCardProps): JSX.Element {
  const [presets, { refetch }] = createResource(
    () => props.player,
    async (player): Promise<[string, TeamPresetRecord][]> => listTeamPresets(player),
  );
  /** The preset being written, or null when nothing is being written */
  const [writing, setWriting] = createSignal<{ id: string | null; name: string } | null>(null);
  /** The party the dialog is holding, before it is saved */
  const [party, setParty] = createSignal<string[]>([]);
  const [picking, setPicking] = createSignal(false);
  const [status, setStatus] = createSignal<string | null>(null);

  const held = (): [string, TeamPresetRecord][] => presets.latest ?? [];
  const full = (): boolean => held().length >= TEAM_PRESET_LIMIT;

  const start = (id: string | null, preset?: TeamPresetRecord): void => {
    setStatus(null);
    setWriting({ id, name: preset?.name ?? `Team ${held().length + 1}` });
    setParty(preset?.catches ?? []);
  };

  const close = (): void => {
    setWriting(null);
    setParty([]);
  };

  const save = (): void => {
    const written = writing();

    if (written == null || party().length === 0) {
      return;
    }
    saveTeamPreset(written.id, asNickname(written.name), party())
      .then((id) => {
        if (id == null) {
          setStatus('That team could not be saved.');
          return;
        }
        close();
        Promise.resolve(refetch()).catch(() => undefined);
      })
      .catch((caught: unknown) => {
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  const drop = (id: string): void => {
    deleteTeamPreset(id)
      .then(() => {
        Promise.resolve(refetch()).catch(() => undefined);
      })
      .catch((caught: unknown) => {
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  return (
    <Card
      title="Teams"
      aside={
        <Row>
          <Hint title="About teams">
            <HintList>
              <li>A team is up to {TEAM_SIZE} of your pokemon, saved under a name.</li>
              <li>
                Loading one in a raid or a duel fills the party with whichever of them can fight.
              </li>
              <li>You may keep {TEAM_PRESET_LIMIT} teams.</li>
            </HintList>
          </Hint>
          <Button
            tone="primary"
            disabled={full()}
            title={full() ? `You already keep ${TEAM_PRESET_LIMIT} teams.` : undefined}
            onClick={() => {
              start(null);
            }}
          >
            New team
          </Button>
        </Row>
      }
    >
      <Show when={held().length > 0} fallback={<Note>You have saved no teams yet.</Note>}>
        <BattleData>
          <List>
            <For each={held()}>
              {([id, preset]) => (
                <PresetRow
                  id={id}
                  preset={preset}
                  onEdit={() => {
                    start(id, preset);
                  }}
                  onDelete={() => {
                    drop(id);
                  }}
                />
              )}
            </For>
          </List>
        </BattleData>
      </Show>
      <Status message={status()} />

      {/* Naming it and filling it are one dialog: a team with no
          pokemon in it is not a team, so the save waits for both */}
      <Dialog
        isOpen={writing() != null && !picking()}
        onClose={close}
        title={writing()?.id == null ? 'New team' : 'Edit team'}
        description="Name a party you can bring to a raid or a duel with one press."
        terse
      >
        <Show when={writing()}>
          {(written) => (
            <div class="flex flex-col gap-3">
              <Field label="Name" stacked>
                <input
                  type="text"
                  value={written().name}
                  maxLength={NICKNAME_LIMIT}
                  onInput={(event) => {
                    setWriting({ id: written().id, name: event.currentTarget.value });
                  }}
                />
              </Field>
              <BattleData>
                <Show when={party().length > 0} fallback={<Note>Nobody picked yet.</Note>}>
                  <Note>
                    {party().length} of {TEAM_SIZE} picked.
                  </Note>
                </Show>
              </BattleData>
              <Row class="justify-center">
                <Button
                  onClick={() => {
                    setPicking(true);
                  }}
                >
                  Pick pokemon
                </Button>
              </Row>
            </div>
          )}
        </Show>
        <DialogActions>
          <Button
            tone="primary"
            disabled={party().length === 0 || asNickname(writing()?.name ?? '') === ''}
            onClick={save}
          >
            Save
          </Button>
          <Button onClick={close}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* The ordinary team picker, which is what fields one: a team
          saved from a box that refuses fainted pokemon is a team a
          player can actually bring */}
      <TeamPickerDialog
        player={props.player}
        isOpen={picking()}
        onClose={() => {
          setPicking(false);
        }}
        onSubmit={(catches) => {
          setParty(catches);
          setPicking(false);
        }}
      />
    </Card>
  );
}
