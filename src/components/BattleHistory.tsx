import { For, type JSX, Show, createResource, from } from 'solid-js';
import { BattleOutcome, type BattleRecord, watchBattleHistory } from '../auth/battles';
import { listClaimedRaids } from '../auth/raids';
import { getSpeciesData } from '../data/species';
import { Badge, type BadgeTone, Button, List, ListRow, Meta, Note, RowButton } from './styled';
import { GameTab, useGame } from './game-context';

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

export interface BattleHistoryProps {
  player: string;
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
    record.outcome === BattleOutcome.Won &&
    record.raid.length > 0 &&
    claimed()?.has(record.raid) === false;

  return (
    <Show when={battles()} fallback={<Note>Loading battles…</Note>}>
      <Show when={battles()?.length} fallback={<Note>No battles fought yet.</Note>}>
        <List>
          <For each={battles()}>
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
                <Badge tone={OUTCOME_TONES[record.outcome]}>{OUTCOME_LABELS[record.outcome]}</Badge>
                <Meta>{new Date(record.startedAt).toISOString().slice(0, 10)}</Meta>
                <Show when={owes(record)}>
                  <Button
                    tone="primary"
                    onClick={() => {
                      // The overworld meets it: the encounter derives
                      // from the raid's own chunk and window
                      game.setReward({ raid: record.raid });
                      game.setTab(GameTab.Overworld);
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
  );
}
