import { For, type JSX, Show, createResource, createSignal } from 'solid-js';
import type { CaughtPokemon } from '../../auth/caught';
import { getCaughtBatched, isGuarded } from '../../auth/caught';
import { isEgg } from '../../model/egg';
import {
  TEAM_PRESET_LIMIT,
  type TeamPresetRecord,
  deleteTeamPreset,
  listTeamPresets,
  saveTeamPreset,
} from '../../auth/team-presets';
import { NICKNAME_LIMIT, asNickname } from '../../model/nickname';
import { TEAM_SIZE } from '../../auth/teams';
import BattleData from '../app/BattleData';
import CatchPicker, { type CatchOption } from '../catches/catch-picker';
import TeamRow, { TeamRows } from '../catches/TeamRow';
import {
  Button,
  Card,
  Dialog,
  DialogActions,
  Field,
  Hint,
  HintList,
  Meta,
  Note,
  Row,
  Status,
} from '../styled';
import describeFailure from '../../i18n/refusals';
import { m } from '../../i18n/paraglide/messages.js';

/**
 * The parties a player saved for themselves.
 *
 * A preset is a name and up to six catch ids, and nothing here
 * promises those pokemon can fight: what a preset is for is the press
 * that fills the picker when a raid or a duel asks for a team.
 */

/**
 * Why a pokemon cannot be written into a team. Only the two that are
 * still true whenever the team is brought out: fainting and a raid
 * both pass, so neither is a reason to keep one out of a plan
 */
function unfitForATeam(option: CatchOption): string | null {
  if (isEgg(option.caught)) {
    return m.pick_team_not_hatched();
  }
  return isGuarded(option.caught) ? m.pick_team_locked() : null;
}

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

  /** What a preset lost since it was saved: released, traded, hatched into somebody else's box */
  const gone = (): number => props.preset.catches.length - (party.latest?.length ?? 0);

  return (
    <TeamRow name={props.preset.name} catches={party.latest ?? []}>
      <span class="truncate font-bold">{props.preset.name}</span>
      <Show when={gone() > 0}>
        <Meta>{m.profile_team_gone({ count: gone() })}</Meta>
      </Show>
      <span class="grow" />
      <Button onClick={props.onEdit}>{m.profile_edit()}</Button>
      <Button tone="caution" onClick={props.onDelete}>
        {m.profile_delete()}
      </Button>
    </TeamRow>
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
  const [status, setStatus] = createSignal<string | null>(null);

  const held = (): [string, TeamPresetRecord][] => presets.latest ?? [];
  const full = (): boolean => held().length >= TEAM_PRESET_LIMIT;

  const start = (id: string | null, preset?: TeamPresetRecord): void => {
    setStatus(null);
    setWriting({ id, name: preset?.name ?? m.profile_team_default({ number: held().length + 1 }) });
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
          setStatus(m.profile_team_save_failed());
          return;
        }
        close();
        Promise.resolve(refetch()).catch(() => undefined);
      })
      .catch((caught: unknown) => {
        setStatus(describeFailure(caught));
      });
  };

  const drop = (id: string): void => {
    deleteTeamPreset(id)
      .then(() => {
        Promise.resolve(refetch()).catch(() => undefined);
      })
      .catch((caught: unknown) => {
        setStatus(describeFailure(caught));
      });
  };

  return (
    <Card
      title={m.pick_team_saved_tab()}
      aside={
        <Row>
          <Hint title={m.profile_teams_about()}>
            <HintList>
              <li>{m.profile_teams_hint_size({ max: TEAM_SIZE })}</li>
              <li>{m.profile_teams_hint_load()}</li>
              <li>{m.profile_teams_hint_limit({ max: TEAM_PRESET_LIMIT })}</li>
            </HintList>
          </Hint>
          <Button
            tone="primary"
            disabled={full()}
            title={full() ? m.profile_teams_full({ max: TEAM_PRESET_LIMIT }) : undefined}
            onClick={() => {
              start(null);
            }}
          >
            {m.profile_new_team()}
          </Button>
        </Row>
      }
    >
      <Show when={held().length > 0} fallback={<Note>{m.profile_no_teams()}</Note>}>
        <BattleData>
          <TeamRows>
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
          </TeamRows>
        </BattleData>
      </Show>
      <Status message={status()} />

      {/* Naming it and filling it are one dialog: a team with no
          pokemon in it is not a team, so the save waits for both */}
      <Dialog
        isOpen={writing() != null}
        onClose={close}
        title={writing()?.id == null ? m.profile_new_team() : m.profile_edit_team()}
        description={m.profile_team_description()}
        width="wide"
      >
        <Show when={writing()}>
          {(written) => (
            <div class="flex flex-col gap-3">
              <Field label={m.profile_team_name()} stacked>
                <input
                  type="text"
                  value={written().name}
                  maxLength={NICKNAME_LIMIT}
                  onInput={(event) => {
                    setWriting({ id: written().id, name: event.currentTarget.value });
                  }}
                />
              </Field>
              <Show when={party().length > 0} fallback={<Note>{m.profile_team_nobody()}</Note>}>
                <Note>{m.profile_team_picked({ count: party().length, max: TEAM_SIZE })}</Note>
              </Show>
              {/* The box itself, rather than a button that opens one:
                  the team being written is the lit squares, so there is
                  nothing to preview separately */}
              <CatchPicker
                inline
                multiple
                live
                player={props.player}
                value={party()}
                max={TEAM_SIZE}
                sort="level"
                verb={m.profile_team_bring()}
                empty={m.profile_team_empty()}
                reason={unfitForATeam}
                onPick={(catches) => {
                  setParty(catches);
                }}
              />
            </div>
          )}
        </Show>
        <DialogActions>
          <Button
            tone="primary"
            disabled={party().length === 0 || asNickname(writing()?.name ?? '') === ''}
            onClick={save}
          >
            {m.profile_save()}
          </Button>
          <Button onClick={close}>{m.battle_cancel()}</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
