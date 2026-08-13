import { For, type JSX, Show, createResource, createSignal, from } from 'solid-js';
import BattleKind, { BATTLE_KIND_NAMES, getBattleKind } from '../auth/battle-kind';
import { BattleOutcome, type BattleRecord, watchBattleHistory } from '../auth/battles';
import { listClaimedRaids } from '../auth/raids';
import { getSpeciesData } from '../data/species';
import {
  Badge,
  type BadgeTone,
  Button,
  Filter,
  type FilterOption,
  List,
  ListRow,
  Meta,
  Note,
  Row,
  RowButton,
} from './styled';
import { describeMoment } from '../core/dates';
import { GameDialog, useGame } from './game-context';

const OUTCOME_LABELS: Record<BattleOutcome, string> = {
  [BattleOutcome.Unfinished]: 'Unfinished',
  [BattleOutcome.Won]: 'Won',
  [BattleOutcome.Lost]: 'Lost',
};

const OUTCOME_TONES: Record<BattleOutcome, BadgeTone> = {
  [BattleOutcome.Unfinished]: 'neutral',
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
    ...[BattleKind.Raid, BattleKind.Rocket, BattleKind.Player]
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
 * The player's finished battles. Replaying one hands the whole page
 * over to the battle view, which rebuilds the fight from the same
 * seed and the same frozen teams — so it plays out as it did, and
 * awards nothing. A won raid whose legendary was never collected —
 * the player ran from it, or left before the end — is claimed from
 * here instead
 */
export default function BattleHistory(props: BattleHistoryProps): JSX.Element {
  const game = useGame();
  const battles = from<[string, BattleRecord][]>((set) =>
    watchBattleHistory(props.player, (records) => {
      set(records);
    }),
  );
  const [claimed, { refetch: refetchClaimed }] = createResource(
    () => props.player,
    listClaimedRaids,
  );

  /**
   * A raid this player won and has not collected from yet. The claim
   * itself is guarded server-side, so this only decides what to show
   */
  const owes = (record: BattleRecord): boolean =>
    props.viewOnly !== true &&
    record.outcome === BattleOutcome.Won &&
    record.raid.length > 0 &&
    claimed()?.has(record.raid) === false;

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
            <For each={shown()}>
              {([id, record]) => (
                <ListRow>
                  <RowButton
                    class="font-medium"
                    onClick={() => {
                      game.setBattle({ id, replay: true });
                    }}
                  >
                    {getSpeciesData(record.species).name}
                  </RowButton>
                  <Badge>{BATTLE_KIND_NAMES[getBattleKind(record)]}</Badge>
                  <Badge tone={OUTCOME_TONES[record.outcome]}>
                    {OUTCOME_LABELS[record.outcome]}
                  </Badge>
                  <Meta>{describeMoment(record.startedAt)}</Meta>
                  <Show when={owes(record)}>
                    <Button
                      tone="primary"
                      onClick={() => {
                        // The overworld meets it: the encounter derives
                        // from the raid's own chunk and window
                        game.setReward({ raid: record.raid });
                        game.setDialog(GameDialog.None);
                        Promise.resolve(refetchClaimed()).catch(() => undefined);
                      }}
                    >
                      Claim {getSpeciesData(record.species).name}
                    </Button>
                  </Show>
                </ListRow>
              )}
            </For>
          </List>
        </Show>
      </Show>
    </Show>
  );
}
