import 'server-only';
import BattleOutcome from '../../auth/battle-outcome';
import BATTLE_TIMEOUT from '../../auth/battle-lock';
import { readBattle } from '../raid-io';
import { asNumber } from '../read';

/** How a raid battle's result is read, and when a silent one counts as lost */
/**
 * A stored outcome, restored as the enum the rest of the code
 * compares against
 */
// oxlint-disable-next-line typescript/no-unnecessary-type-assertion
export const asOutcome = (value: unknown): BattleOutcome => asNumber(value) as BattleOutcome;

/**
 * Raids, written with admin credentials. A raid decides who is owed a
 * legendary, so the three writes that settle one — starting it,
 * clearing it, and collecting from it — are checked here rather than
 * reported by whoever fought
 */

/**
 * How long an unsettled raid battle holds its landmark: the same
 * window that decides how long it holds its party
 * ([`src/server/locks.ts`](./locks.ts)). A fight is over in minutes;
 * one still unfinished after this was walked out on, and an abandoned
 * party is not a beaten boss
 */
export const RAID_BATTLE_TIMEOUT = BATTLE_TIMEOUT;

/**
 * Whether a stored battle ended without the boss going down — lost
 * outright, or abandoned long enough that nobody is coming back to
 * settle it. A raid that was won never reaches here: clearing it
 * shuts the landmark first
 */
export function isBattleLost(battle: Record<string, unknown> | null, now: number): boolean {
  if (battle == null) {
    return true;
  }
  if (asOutcome(battle.outcome) === BattleOutcome.Unfinished) {
    return now - asNumber(battle.startedAt) >= RAID_BATTLE_TIMEOUT;
  }
  return asOutcome(battle.outcome) !== BattleOutcome.Won;
}

/**
 * The same question, read inside the transaction that acts on the
 * answer
 */
export async function isRaidLost(battleId: string, now: number): Promise<boolean> {
  return isBattleLost(await readBattle(battleId), now);
}
