import { EventPriority } from '../../core/event-emitter';
import type Alliance from '../alliance';
import type Battle from '../core';
import { BattleModes } from '../core';
import { BattleEvents } from '../events';
import { Stats } from '../../data/constants/stats';

/**
 * How long the field has to stay decided before the battle is called.
 *
 * A side going down is not the end of a real-time fight: the last hit
 * is still in the air, a berry may bring somebody back, and a move
 * already cast lands after the unit that cast it fell. Calling the
 * result on the frame the last pokemon fainted means a player watches
 * the verdict appear over a field that is still moving.
 *
 * So the fight is given three seconds to change its mind. Anything
 * that puts a second side back on its feet inside that window puts the
 * countdown back too, and the battle carries on
 */
const GRACE = 3000;

/**
 * Who the settled battle belongs to.
 *
 * One side left standing wins outright, however it got there. A field
 * with nobody left is the interesting case, and the two kinds of fight
 * answer it differently:
 *
 * A **raid** has no draws. The party went in to take something down,
 * and a boss that is on the floor when the dust settles is a boss they
 * took down — that the last of them went with it changes what it cost,
 * not what happened. So the party takes it.
 *
 * A **fight between players** is the other way round: neither of them
 * beat the other, and calling it for one of them because of how the
 * alliances happen to be ordered would be inventing a result. That is
 * the only case in the game that is a draw.
 */
function resolveWinner(battle: Battle, standing: Set<Alliance>): Alliance | null {
  if (standing.size === 1) {
    return [...standing][0];
  }
  if (battle.mode !== BattleModes.Raid) {
    return null;
  }

  const parties = [...battle.alliances].filter((alliance) => !alliance.boss);

  return parties.length === 1 ? parties[0] : null;
}

/**
 * Who a fight stopped on the clock belongs to.
 *
 * The Battle Arena judges rather than waits, and the closest a
 * real-time fight comes to the mainline's mind-skill-body score is
 * the plainest reading of it: whichever side has kept more of what it
 * brought. It is a share rather than a total, so bringing a Wailord
 * is worth nothing on its own, and an exact tie is a draw
 */
function resolveJudged(battle: Battle): Alliance | null {
  let best: Alliance | null = null;
  let highest = 0;
  let tied = false;

  for (const alliance of battle.alliances) {
    let held = 0;
    let pool = 0;

    for (const team of alliance.teams) {
      for (const unit of team.units) {
        held += Math.max(0, unit.health);
        pool += unit.checkStat(Stats.HP, 0);
      }
    }

    const share = pool === 0 ? 0 : held / pool;

    if (best == null || share > highest) {
      best = alliance;
      highest = share;
      tied = false;
    } else if (share === highest) {
      tied = true;
    }
  }
  return tied ? null : best;
}

/**
 * The battle's terminal state.
 *
 * It watches for one thing: whether more than one side still has
 * something alive. While two do, the fight is going on whatever either
 * of them is able to do about it — a side that cannot act is not a
 * side that has lost, and treating it as one used to end fights while
 * both parties were still on the field, waiting out a cooldown.
 *
 * Once only one side is left — or none — the countdown starts, and the
 * result is called when it runs out.
 */
export default function setupOutcomeMechanics(battle: Battle): void {
  /** How long the fight has run, for the houses that judge one */
  let elapsed = 0;

  if (battle.timeLimit > 0) {
    battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
      if (battle.settled) {
        return;
      }
      elapsed += event.duration;

      if (elapsed < battle.timeLimit) {
        return;
      }
      battle.settled = true;
      battle.winner = resolveJudged(battle);
      battle.end();
    });
  }

  /**
   * How long the field has been decided, or null while it is not. It
   * is reset rather than merely paused: a fight that goes back to two
   * sides gets the whole three seconds again the next time it does not
   */
  let deciding: number | null = null;

  battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    if (battle.settled) {
      return;
    }

    const standing = new Set<Alliance>();

    for (const alliance of battle.alliances) {
      for (const team of alliance.teams) {
        for (const unit of team.units) {
          if (unit.alive) {
            standing.add(alliance);
          }
        }
      }
    }

    // Still a fight: two sides with something left to lose
    if (standing.size > 1) {
      deciding = null;
      return;
    }

    deciding = (deciding ?? 0) + event.duration;

    if (deciding < GRACE) {
      return;
    }

    battle.settled = true;
    battle.winner = resolveWinner(battle, standing);
    battle.end();
  });
}
