import { For, type JSX, Show, createResource } from 'solid-js';
import { BattleOutcome, listBattleHistory } from '../auth/battles';
import { getSpeciesData } from '../data/species';
import { useGame } from './game-context';

const OUTCOME_LABELS: Record<BattleOutcome, string> = {
  [BattleOutcome.Unfinished]: 'Unfinished',
  [BattleOutcome.Won]: 'Won',
  [BattleOutcome.Lost]: 'Lost',
};

export interface BattleHistoryProps {
  player: string;
}

/**
 * The player's finished battles. Replaying one hands the whole page
 * over to the battle view, which rebuilds the fight from the same
 * seed and the same frozen teams — so it plays out as it did, and
 * awards nothing
 */
export default function BattleHistory(props: BattleHistoryProps): JSX.Element {
  const game = useGame();
  const [battles] = createResource(() => props.player, listBattleHistory);

  return (
    <Show when={!battles.loading} fallback={<p>Loading battles…</p>}>
      <Show when={battles()?.length} fallback={<p>No battles fought yet.</p>}>
        <ul>
          <For each={battles()}>
            {([id, record]) => (
              <li>
                <button
                  type="button"
                  onClick={() => {
                    game.setBattle({ id, replay: true });
                  }}
                >
                  {getSpeciesData(record.species).name} · {OUTCOME_LABELS[record.outcome]} ·{' '}
                  {new Date(record.startedAt).toISOString().slice(0, 10)}
                </button>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </Show>
  );
}
