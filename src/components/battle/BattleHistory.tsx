import {
  type Accessor,
  For,
  Loading,
  Match,
  Show,
  Switch,
  createMemo,
  createSignal,
  from,
  refresh,
} from 'solid-js';
import type { JSX } from '@solidjs/web';
import BattleKind, { getBattleKind } from '../../model/battle-kind';
import { BattleOutcome, type BattleRecord, watchBattleHistory } from '../../auth/battles';
import { listClaimedRaids } from '../../auth/raids';
import { listWaitingEncounters } from '../../auth/safari';
import type { EncounterRecord } from '../../model/encounter-record';
import { EncounterType } from '../../overworld/encounter/kinds';
import { Genders } from '../../data/ids/species';
import { formatMoment } from '../../i18n/format';
import { getSpeciesData } from '../../data/species';
import {
  Badge,
  Button,
  LIST_PAGE,
  List,
  ListRow,
  Meta,
  Note,
  RowButton,
  Segmented,
  type SegmentedOption,
  createPager,
  useToast,
} from '../styled';
import { PlayIcon, ShareIcon } from '../icons';
import { GameDialog, useGame } from '../app/game-context';
import type { CaughtPokemon } from '../../auth/caught';
import { previewSnapshot } from '../../model/catch-snapshot';
import { getProfileBatched } from '../../auth/profile';
import { type TeamSnapshotRecord, getTeamSnapshotBatched } from '../../auth/teams';
import Npc from '../../data/overworld/npc';
import { npcName } from '../../overworld/npcs';
import { SpriteAnim } from '../../data/ids/sprite-anims';
import AnimatedSprite from '../sprites/AnimatedSprite';
import TeamStrip from '../catches/TeamStrip';
import { PlayerFace } from '../profile/PlayerPlate';
import { m } from '../../i18n/paraglide/messages.js';

/** How each outcome reads, called when shown so it follows the locale */
const OUTCOME_LABELS: Record<BattleOutcome, () => string> = {
  [BattleOutcome.Unfinished]: m.history_unfinished,
  [BattleOutcome.Won]: m.verdict_won,
  [BattleOutcome.Lost]: m.verdict_lost,
  [BattleOutcome.Drawn]: m.battle_draw,
};

/** What each kind of fight is called on the filter and the row's badge */
const KIND_NAMES: Record<BattleKind, () => string> = {
  [BattleKind.Raid]: m.history_kind_raids,
  [BattleKind.Npc]: m.history_kind_npc,
  [BattleKind.Player]: m.history_kind_pvp,
};

/**
 * The history unfiltered
 */
const EVERY_KIND = 'all';

type KindFilter = BattleKind | typeof EVERY_KIND;

/**
 * Which kinds there are to choose between: the ones this player has
 * actually fought, in the order they were listed as kinds. A history
 * of nothing but raids offers nothing to filter
 */
function listKinds(records: BattleRecord[]): SegmentedOption<KindFilter>[] {
  const fought = new Set<BattleKind>();

  for (const record of records) {
    fought.add(getBattleKind(record));
  }

  const options: SegmentedOption<KindFilter>[] = [{ value: EVERY_KIND, label: m.history_all() }];

  for (const kind of [BattleKind.Raid, BattleKind.Npc, BattleKind.Player]) {
    if (fought.has(kind)) {
      options.push({ value: kind, label: KIND_NAMES[kind]() });
    }
  }
  return options;
}

export interface BattleHistoryProps {
  player: string;
  /**
   * Whether these are somebody else's fights. Watching one back is
   * looking — a replay awards nothing and settles nothing — so it
   * stays; collecting what a raid still owes is the owner's, so it
   * goes
   */
  viewOnly?: boolean;
}

/**
 * What one row shows beside the record: the owner's own frozen team,
 * and — when the other side was a player — who they were
 */
interface FoughtLine {
  mine: [string, CaughtPokemon][];
  rival: { uid: string; name: string; sprite: string | null } | null;
}

async function loadFought(key: string): Promise<FoughtLine> {
  const [joined, owner] = key.split('|');
  const pending: Promise<TeamSnapshotRecord | null>[] = [];

  // Every row on the page asks in the same moment, so the page is one read
  for (const id of joined.split(',')) {
    if (id !== '') {
      pending.push(getTeamSnapshotBatched(id));
    }
  }

  const found = await Promise.all(pending);
  let mine: TeamSnapshotRecord | undefined;
  let other: TeamSnapshotRecord | undefined;

  for (const snapshot of found) {
    if (snapshot == null) {
      continue;
    }
    if (mine == null && snapshot.player === owner) {
      mine = snapshot;
    }
    if (other == null && snapshot.player !== '' && snapshot.player !== owner) {
      other = snapshot;
    }
  }

  const profile = other == null ? null : await getProfileBatched(other.player);
  const team: [string, CaughtPokemon][] = [];

  for (const [at, caught] of (mine?.catches ?? []).entries()) {
    team.push([caught.caught === '' ? `${at}` : caught.caught, previewSnapshot(caught)]);
  }

  return {
    mine: team,
    rival:
      other == null
        ? null
        : {
            uid: other.player,
            name: profile?.nickname ?? m.duels_a_trainer(),
            sprite: profile?.sprite ?? null,
          },
  };
}

/** The owner's own frozen party, square for square */
function OwnStrip(props: { fought: Accessor<FoughtLine> }): JSX.Element {
  return <TeamStrip catches={props.fought().mine} />;
}

/**
 * One battle as one row: what kind of fight, who it was against, and
 * what the owner of this history fielded — coloured by how it ended
 */
/**
 * How large the challenger's face is drawn in a row: the board's 32px
 * square, which a raid boss is fitted into as well
 */
const NPC_FACE = 32;

/** How each outcome's pill is toned on the row */
const VERDICT_TONES: Record<BattleOutcome, 'leaf' | 'ember' | 'neutral'> = {
  [BattleOutcome.Unfinished]: 'neutral',
  [BattleOutcome.Won]: 'leaf',
  [BattleOutcome.Lost]: 'ember',
  [BattleOutcome.Drawn]: 'neutral',
};

/** The other player's face, once the snapshots say who they were */
function RivalFace(props: { fought: Accessor<FoughtLine> }): JSX.Element {
  return <PlayerFace sprite={props.fought().rival?.sprite} size={NPC_FACE} />;
}

/** The face of whoever the fight was against, in the square the board gives it */
function OpponentFace(props: {
  kind: BattleKind;
  record: BattleRecord;
  fought: Accessor<FoughtLine>;
}): JSX.Element {
  return (
    <Switch>
      <Match when={props.kind === BattleKind.Raid}>
        {/* Fitted to a square of its own rather than drawn at a
            multiple of the sheet: a raid boss is whatever size its
            sheet is, and one tall one stretched every row in the
            list to its height */}
        <span class="flex size-8 shrink-0 items-center justify-center">
          <AnimatedSprite
            species={props.record.species}
            animation={SpriteAnim.Idle}
            direction="DownLeft"
            fill
            label={getSpeciesData(props.record.species).name}
          />
        </span>
      </Match>
      <Match when={props.kind === BattleKind.Npc}>
        <PlayerFace sprite={props.record.opponentSprite} size={NPC_FACE} />
      </Match>
      <Match when={props.kind === BattleKind.Player}>
        <Loading fallback={<PlayerFace size={NPC_FACE} />}>
          <RivalFace fought={props.fought} />
        </Loading>
      </Match>
    </Switch>
  );
}

/** Who it was against, by name: a pokemon, a trainer, or a player whose profile opens */
function OpponentName(props: {
  kind: BattleKind;
  record: BattleRecord;
  fought: Accessor<FoughtLine>;
  onVisit: (uid: string) => void;
}): JSX.Element {
  return (
    <Switch>
      <Match when={props.kind === BattleKind.Raid}>
        <span class="truncate text-sm font-extrabold">
          {getSpeciesData(props.record.species).name}
        </span>
      </Match>
      <Match when={props.kind === BattleKind.Npc}>
        {/* Whoever was standing there, kept on the record: a stop
            stages a grunt, a duelling trainer, a gym leader or the
            Champion, and calling every one of them a grunt was the
            history saying the same wrong thing about all of them.
            A fight stored before the name was kept has none, and
            falls back to what it used to say */}
        <span class="truncate text-sm font-extrabold">
          {props.record.opponent === '' ? npcName(Npc.RocketGrunt) : props.record.opponent}
        </span>
      </Match>
      <Match when={props.kind === BattleKind.Player}>
        <Loading fallback={<Meta>{m.duels_a_trainer()}</Meta>}>
          <Show when={props.fought().rival} fallback={<Meta>{m.duels_a_trainer()}</Meta>}>
            {(rival) => (
              <RowButton
                class="truncate text-left text-sm font-extrabold"
                onClick={() => {
                  props.onVisit(rival().uid);
                }}
              >
                {rival().name}
              </RowButton>
            )}
          </Show>
        </Loading>
      </Match>
    </Switch>
  );
}

function HistoryRow(props: {
  id: string;
  record: BattleRecord;
  owner: string;
  owes: boolean;
  onClaimed: () => void;
}): JSX.Element {
  const game = useGame();
  const toast = useToast();
  // Keyed on the teams and the owner, so a list rebuilding its rows
  // does not read every team again
  const asked = createMemo(() => `${props.record.teams.join(',')}|${props.owner}`);
  const fought = createMemo(async () => loadFought(asked()));
  const kind = (): BattleKind => getBattleKind(props.record);

  return (
    // A row card: how it ended, who it was against and when, the
    // owner's frozen team, then what can be done with the fight
    <li
      class="flex min-h-13 flex-wrap items-center gap-x-2.5 gap-y-1.5 rounded-card border-2
        border-line-soft bg-paper px-3 py-2"
    >
      <Badge
        tone={VERDICT_TONES[props.record.outcome]}
        class="min-w-12 justify-center border-0 px-2 py-0 text-[11px]"
      >
        {OUTCOME_LABELS[props.record.outcome]()}
      </Badge>
      <OpponentFace kind={kind()} record={props.record} fought={fought} />
      <div class="flex min-w-0 grow basis-40 flex-col">
        <OpponentName
          kind={kind()}
          record={props.record}
          fought={fought}
          onVisit={(uid) => {
            game.setVisiting(uid);
          }}
        />
        <Meta>
          {KIND_NAMES[kind()]()} · {formatMoment(props.record.startedAt)}
        </Meta>
      </div>
      {/* The team stands on its own, so a narrow row never squeezes
          it out of sight */}
      <div class="w-full shrink-0 sm:w-72">
        <Loading fallback={<Note>{m.history_reading_team()}</Note>}>
          <OwnStrip fought={fought} />
        </Loading>
      </div>
      <Show when={props.owes}>
        <Button
          tone="primary"
          onClick={() => {
            // The overworld meets it: the encounter derives from the
            // raid's own chunk and window
            game.setReward({ raid: props.record.raid });
            game.setDialog(GameDialog.None);
            props.onClaimed();
          }}
        >
          {m.history_claim({ species: getSpeciesData(props.record.species).name })}
        </Button>
      </Show>
      {/* Watching it back: the same fight again, with nothing at stake */}
      <Button
        class="h-[34px]"
        onClick={() => {
          game.setBattle({ id: props.id, replay: true });
        }}
      >
        <PlayIcon class="size-4" aria-hidden="true" />
        {m.history_watch_replay()}
      </Button>
      <Button
        tone="quiet"
        class="h-[34px]"
        label={m.history_copy_link_label()}
        onClick={() => {
          navigator.clipboard
            .writeText(`${location.origin}/battle/${props.id}`)
            .then(() => {
              toast.push({ message: m.history_link_copied(), tone: 'leaf' });
            })
            .catch(() => {
              toast.push({ message: m.history_link_failed(), tone: 'ember' });
            });
        }}
      >
        <ShareIcon class="size-4" aria-hidden="true" />
        {m.history_copy_link()}
      </Button>
    </li>
  );
}

/** What each kind of owed meeting is called in the waiting list */
const WAITING_KINDS: Partial<Record<EncounterType, () => string>> = {
  [EncounterType.LegendaryRaid]: m.history_waiting_raid,
  [EncounterType.ShadowRaid]: m.history_waiting_shadow_raid,
  [EncounterType.MythicalRaid]: m.history_waiting_mythical_raid,
  [EncounterType.TotemRaid]: m.history_waiting_totem_raid,
  [EncounterType.MaxRaid]: m.history_waiting_max_raid,
  [EncounterType.AlphaRaid]: m.history_waiting_alpha_raid,
  [EncounterType.NobleRaid]: m.history_waiting_noble_raid,
  [EncounterType.TeraRaid]: m.history_waiting_tera_raid,
  [EncounterType.Rocket]: m.history_waiting_rocket,
  [EncounterType.Fateful]: m.history_waiting_gift,
  [EncounterType.Revived]: m.history_waiting_fossil,
};

/**
 * Meetings owed to the player that they closed without catching. Each
 * opens the same meeting again, with every throw it has had so far
 */
function WaitingList(props: { waiting: Accessor<EncounterRecord[]> }): JSX.Element {
  const game = useGame();
  const paged = createPager(() => props.waiting(), LIST_PAGE);

  return (
    <Show when={props.waiting().length > 0}>
      <div class="flex flex-col gap-2">
        <Meta>{m.history_waiting()}</Meta>
        <List>
          <For each={paged.shown()}>
            {(encounter) => (
              <ListRow>
                <span class="flex size-10 shrink-0 items-center justify-center">
                  <AnimatedSprite
                    species={encounter.species}
                    female={encounter.gender === Genders.Female}
                    animation={SpriteAnim.Idle}
                    direction="DownLeft"
                    shiny={encounter.shiny}
                    fill
                    label={getSpeciesData(encounter.species).name}
                  />
                </span>
                <span class="font-medium">{getSpeciesData(encounter.species).name}</span>
                <Badge>{WAITING_KINDS[encounter.type]?.() ?? m.history_waiting_owed()}</Badge>
                <span class="grow" />
                <Button
                  tone="primary"
                  onClick={() => {
                    game.setEncounter(encounter);
                    game.setDialog(GameDialog.None);
                  }}
                >
                  {m.history_meet()}
                </Button>
              </ListRow>
            )}
          </For>
        </List>
        {paged.controls()}
      </div>
    </Show>
  );
}

/**
 * The list itself, which is where the claims are read.
 *
 * It is a component of its own so that the read has a boundary above
 * it: a resource read in the body that declared it throws past every
 * `Loading` written there, and the next one up is the whole page
 */
function BattleList(
  props: BattleHistoryProps & { claimed: Accessor<Set<string>>; onClaimed: () => void },
): JSX.Element {
  // Followed live; the first listing holds the boundary above
  const battles = createMemo(() =>
    from<[string, BattleRecord][]>((next) =>
      watchBattleHistory(props.player, (records) => {
        next(records);
      }),
    ),
  );

  /**
   * A raid this player won and has not collected from yet. The claim
   * itself is guarded server-side, so this only decides what to show
   */
  const owes = (record: BattleRecord): boolean =>
    props.viewOnly !== true &&
    record.outcome === BattleOutcome.Won &&
    record.raid.length > 0 &&
    !props.claimed().has(record.raid);

  /**
   * Which kind of fight is being looked at. A raid and a grunt read
   * much the same in a list — a species name and a result — so which
   * one it was is worth being able to ask for
   */
  const [kind, setKind] = createSignal<KindFilter>(EVERY_KIND);

  const kinds = (): SegmentedOption<KindFilter>[] => {
    const records: BattleRecord[] = [];

    for (const [, record] of battles()) {
      records.push(record);
    }
    return listKinds(records);
  };

  /**
   * The kind being looked at, if it is still one this history has. The
   * listing is followed rather than read once, so a kind can go out
   * from under the filter — a filter pointing at nothing would read as
   * a player who has fought nothing
   */
  const only = (): KindFilter => {
    for (const option of kinds()) {
      if (option.value === kind()) {
        return kind();
      }
    }
    return EVERY_KIND;
  };

  const shown = (): [string, BattleRecord][] => {
    const rows: [string, BattleRecord][] = [];

    for (const row of battles()) {
      if (only() === EVERY_KIND || getBattleKind(row[1]) === only()) {
        rows.push(row);
      }
    }
    return rows;
  };

  // Paged under the filter, so narrowing the kind snaps back to a page
  // that exists
  const paged = createPager(shown, LIST_PAGE);

  return (
    <Show when={battles().length} fallback={<Note>{m.history_none()}</Note>}>
      {/* Nothing to narrow while every fight was the same kind; the count
            of what was fought stands at the row's end either way */}
      <div class="flex flex-wrap items-center gap-2.5">
        <Show when={kinds().length > 2}>
          <Segmented
            label={m.history_kind()}
            value={only()}
            options={kinds()}
            onChange={(picked) => {
              setKind(picked);
            }}
          />
        </Show>
        <span class="grow" />
        <Meta>{m.history_fought({ count: battles().length })}</Meta>
      </div>

      <Show when={shown().length} fallback={<Note>{m.history_none_of_kind()}</Note>}>
        <List>
          <For each={paged.shown()}>
            {([id, record]) => (
              <HistoryRow
                id={id}
                record={record}
                owner={props.player}
                owes={owes(record)}
                onClaimed={props.onClaimed}
              />
            )}
          </For>
        </List>
        {paged.controls()}
      </Show>
    </Show>
  );
}

/**
 * The player's finished battles. Replaying one hands the whole page
 * over to the battle view, which rebuilds the fight from the same
 * seed and the same frozen teams — so it plays out as it did, and
 * awards nothing. A won raid whose legendary was never collected is
 * claimed from here instead, and anything owed that was met and left
 * uncaught waits above the list
 */
export default function BattleHistory(props: BattleHistoryProps): JSX.Element {
  const claimed = createMemo(async () => listClaimedRaids(props.player));
  // The player's own only: another trainer's history has nothing owed to the reader
  const waiting = createMemo<EncounterRecord[]>(
    (): EncounterRecord[] | Promise<EncounterRecord[]> =>
      props.viewOnly === true ? [] : listWaitingEncounters(),
  );

  return (
    <div class="flex flex-col gap-3">
      <Loading>
        <WaitingList waiting={waiting} />
      </Loading>
      <Loading fallback={<Note>{m.history_loading()}</Note>}>
        <BattleList
          player={props.player}
          viewOnly={props.viewOnly}
          claimed={claimed}
          onClaimed={() => {
            refresh(claimed).catch(() => undefined);
          }}
        />
      </Loading>
    </div>
  );
}
