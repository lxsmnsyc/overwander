import {
  For,
  type JSX,
  Match,
  type Resource,
  Show,
  Suspense,
  Switch,
  createResource,
  createSignal,
  from,
} from 'solid-js';
import BattleKind, { BATTLE_KIND_NAMES, getBattleKind } from '../../auth/battle-kind';
import { BattleOutcome, type BattleRecord, watchBattleHistory } from '../../auth/battles';
import { listClaimedRaids } from '../../auth/raids';
import { getSpeciesData } from '../../data/species';
import {
  Badge,
  Button,
  Filter,
  type FilterOption,
  LIST_PAGE,
  List,
  ListRow,
  Meta,
  Note,
  Row,
  createPager,
} from '../styled';
import { GameDialog, useGame } from '../app/game-context';
import type { CaughtPokemon } from '../../auth/caught';
import { previewSnapshot } from '../../auth/catch-snapshot';
import { getProfiles } from '../../auth/profile';
import { type TeamSnapshotRecord, getTeamSnapshot } from '../../auth/teams';
import Npc, { NPC_NAMES } from '../../data/overworld/npc';
import { SpriteAnim } from '../../data/ids/sprite-anims';
import AnimatedSprite from '../sprites/AnimatedSprite';
import TeamStrip from '../catches/TeamStrip';
import PlayerPlate from '../profile/PlayerPlate';

const OUTCOME_LABELS: Record<BattleOutcome, string> = {
  [BattleOutcome.Unfinished]: 'Unfinished',
  [BattleOutcome.Won]: 'Won',
  [BattleOutcome.Lost]: 'Lost',
};

/**
 * How a row is coloured by how it ended. The colour is the outcome's
 * whole appearance on the row, so the label rides along for the
 * screen reader and the row's own title
 */
const OUTCOME_ROW_TONES: Record<BattleOutcome, 'leaf' | 'ember' | undefined> = {
  [BattleOutcome.Unfinished]: undefined,
  [BattleOutcome.Won]: 'leaf',
  [BattleOutcome.Lost]: 'ember',
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
function listKinds(records: BattleRecord[]): FilterOption<KindFilter>[] {
  const fought = new Set(records.map(getBattleKind));

  return [
    { value: EVERY_KIND, label: 'All' },
    ...[BattleKind.Raid, BattleKind.Npc, BattleKind.Player]
      .filter((kind) => fought.has(kind))
      .map((kind) => ({ value: kind, label: BATTLE_KIND_NAMES[kind] })),
  ];
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
  rival: { uid: string; name: string; avatar: string | null } | null;
}

async function loadFought(key: string): Promise<FoughtLine> {
  const [joined, owner] = key.split('|');
  const found = await Promise.all(
    joined
      .split(',')
      .filter(Boolean)
      .map(async (id) => getTeamSnapshot(id)),
  );
  const snapshots = found.filter((snapshot): snapshot is TeamSnapshotRecord => snapshot != null);
  const mine = snapshots.find((snapshot) => snapshot.player === owner);
  const other = snapshots.find((snapshot) => snapshot.player !== '' && snapshot.player !== owner);
  const profiles = other == null ? null : await getProfiles([other.player]);
  const profile = profiles?.get(other?.player ?? '');

  return {
    mine: (mine?.catches ?? []).map((caught, at): [string, CaughtPokemon] => [
      caught.caught === '' ? `${at}` : caught.caught,
      previewSnapshot(caught),
    ]),
    rival:
      other == null
        ? null
        : {
            uid: other.player,
            name: profile?.nickname ?? 'A trainer',
            avatar: profile?.avatar ?? null,
          },
  };
}

/** The other player, once the snapshots say who they were */
function RivalPlate(props: {
  fought: Resource<FoughtLine>;
  onVisit: (uid: string) => void;
}): JSX.Element {
  return (
    <Show when={props.fought()?.rival} fallback={<Meta>A trainer</Meta>}>
      {(rival) => (
        <PlayerPlate
          name={rival().name}
          avatar={rival().avatar}
          onOpen={() => {
            props.onVisit(rival().uid);
          }}
        />
      )}
    </Show>
  );
}

/** The owner's own frozen party, square for square */
function OwnStrip(props: { fought: Resource<FoughtLine> }): JSX.Element {
  return <TeamStrip catches={props.fought()?.mine ?? []} />;
}

/**
 * One battle as one row: what kind of fight, who it was against, and
 * what the owner of this history fielded — coloured by how it ended
 */
function HistoryRow(props: {
  id: string;
  record: BattleRecord;
  owner: string;
  owes: boolean;
  onClaimed: () => void;
}): JSX.Element {
  const game = useGame();
  const [fought] = createResource(
    () => `${props.record.teams.join(',')}|${props.owner}`,
    loadFought,
  );
  const kind = (): BattleKind => getBattleKind(props.record);

  return (
    <ListRow
      tone={OUTCOME_ROW_TONES[props.record.outcome]}
      title={OUTCOME_LABELS[props.record.outcome]}
    >
      <Badge>{BATTLE_KIND_NAMES[kind()]}</Badge>
      <Meta>vs</Meta>
      <Switch>
        <Match when={kind() === BattleKind.Raid}>
          <span class="flex items-center gap-1.5 font-medium">
            <AnimatedSprite
              species={props.record.species}
              animation={SpriteAnim.Idle}
              direction="DownLeft"
              scale={2}
              label={getSpeciesData(props.record.species).name}
            />
            {getSpeciesData(props.record.species).name}
          </span>
        </Match>
        <Match when={kind() === BattleKind.Npc}>
          <span class="font-medium">{NPC_NAMES[Npc.RocketGrunt]}</span>
        </Match>
        <Match when={kind() === BattleKind.Player}>
          <Suspense fallback={<Meta>A trainer</Meta>}>
            <RivalPlate
              fought={fought}
              onVisit={(uid) => {
                game.setVisiting(uid);
              }}
            />
          </Suspense>
        </Match>
      </Switch>
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
          Claim {getSpeciesData(props.record.species).name}
        </Button>
      </Show>
      <span class="grow" />
      <Suspense fallback={<Note>Reading the team…</Note>}>
        <OwnStrip fought={fought} />
      </Suspense>
      {/* Watching it back, from the row's end. It is called View
          because that is all a replay is: the same fight again, with
          nothing at stake */}
      <Button
        onClick={() => {
          game.setBattle({ id: props.id, replay: true });
        }}
      >
        View
      </Button>
    </ListRow>
  );
}

/**
 * The list itself, which is where the claims are read.
 *
 * It is a component of its own so that the read has a boundary above
 * it: a resource read in the body that declared it throws past every
 * `Suspense` written there, and the next one up is the whole page
 */
function BattleList(
  props: BattleHistoryProps & { claimed: Resource<Set<string>>; onClaimed: () => void },
): JSX.Element {
  const battles = from<[string, BattleRecord][]>((set) =>
    watchBattleHistory(props.player, (records) => {
      set(records);
    }),
  );

  /**
   * A raid this player won and has not collected from yet. The claim
   * itself is guarded server-side, so this only decides what to show
   */
  const owes = (record: BattleRecord): boolean =>
    props.viewOnly !== true &&
    record.outcome === BattleOutcome.Won &&
    record.raid.length > 0 &&
    props.claimed()?.has(record.raid) === false;

  /**
   * Which kind of fight is being looked at. A raid and a grunt read
   * much the same in a list — a species name and a result — so which
   * one it was is worth being able to ask for
   */
  const [kind, setKind] = createSignal<KindFilter>(EVERY_KIND);

  const kinds = (): FilterOption<KindFilter>[] =>
    listKinds((battles() ?? []).map(([, record]) => record));

  /**
   * The kind being looked at, if it is still one this history has. The
   * listing is followed rather than read once, so a kind can go out
   * from under the filter — a filter pointing at nothing would read as
   * a player who has fought nothing
   */
  const only = (): KindFilter =>
    kinds().some((option) => option.value === kind()) ? kind() : EVERY_KIND;

  const shown = (): [string, BattleRecord][] =>
    (battles() ?? []).filter(
      ([, record]) => only() === EVERY_KIND || getBattleKind(record) === only(),
    );

  // Paged under the filter, so narrowing the kind snaps back to a page
  // that exists
  const paged = createPager(shown, LIST_PAGE);

  return (
    <Show when={battles()} fallback={<Note>Loading battles…</Note>}>
      <Show when={battles()?.length} fallback={<Note>No battles fought yet.</Note>}>
        {/* Nothing to narrow while every fight was the same kind */}
        <Show when={kinds().length > 2}>
          <Row class="mb-3">
            <Filter
              label="Kind"
              value={only()}
              options={kinds()}
              onChange={(picked) => {
                setKind(picked);
              }}
            />
          </Row>
        </Show>

        <Show when={shown().length} fallback={<Note>None of those yet.</Note>}>
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
    </Show>
  );
}

/**
 * The player's finished battles. Replaying one hands the whole page
 * over to the battle view, which rebuilds the fight from the same
 * seed and the same frozen teams — so it plays out as it did, and
 * awards nothing. A won raid whose legendary was never collected —
 * the player ran from it, or left before the end — is claimed from
 * here instead
 */
export default function BattleHistory(props: BattleHistoryProps): JSX.Element {
  const [claimed, { refetch }] = createResource(() => props.player, listClaimedRaids);

  return (
    <Suspense fallback={<Note>Loading battles…</Note>}>
      <BattleList
        player={props.player}
        viewOnly={props.viewOnly}
        claimed={claimed}
        onClaimed={() => {
          Promise.resolve(refetch()).catch(() => undefined);
        }}
      />
    </Suspense>
  );
}
