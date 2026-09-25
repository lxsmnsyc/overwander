import 'server-only';
import type { Sql, Tx } from './db';
import isStaff from '../auth/staff';
import { Feature } from './switches';

/**
 * How fast a player may act.
 *
 * Each kind of action is a token bucket: it holds up to `burst` tokens,
 * refills `perSecond` of them every second, and an action spends what
 * it costs. A double press or a quick run of claims passes; a script
 * calling in a loop runs dry and is refused, the way a map server drops
 * a packet that arrives before the action it asks for could have.
 *
 * Every call spends from `Pace.Any`. The loops worth running fast by
 * hand spend from their own bucket too, which is tuned a little above
 * the fastest the game itself can go.
 */
export const enum Pace {
  /** Every call into the server */
  Any = 'any',
  /** A ball thrown at a meeting */
  Throw = 'throw',
  /** A treat fed to a meeting */
  Feed = 'feed',
  /** A cache dug, a berry or apricorn picked, a nest or phenomenon egg taken */
  Claim = 'claim',
  /** Steps a walk reports, spent one token a step */
  Steps = 'steps',
}

export interface PaceRule {
  burst: number;
  perSecond: number;
}

export const PACE_RULES: Record<Pace, PaceRule> = {
  // Well above a screen opening a dialog's worth of calls at once
  [Pace.Any]: { burst: 40, perSecond: 10 },
  // A ball rocks for longer than a second, so one a second is already faster than play
  [Pace.Throw]: { burst: 3, perSecond: 1 },
  [Pace.Feed]: { burst: 3, perSecond: 1 },
  // A landmark is walked to, so several a second is not a walk
  [Pace.Claim]: { burst: 5, perSecond: 0.5 },
  // A step takes 250ms, so four a second is walking without a pause.
  // The burst covers two full reports landing together
  [Pace.Steps]: { burst: 512, perSecond: 5 },
};

/** What a player acting too fast is told */
export const PACE_MESSAGE = 'Slow down a moment.';

/** One bucket to spend from, and how much */
export interface PaceCost {
  pace: Pace;
  cost: number;
}

/** What `admit` found out about a caller */
export interface Admission {
  banned: boolean;
  paced: boolean;
  /**
   * The switch that refuses this call, with what it says, or null when
   * nothing does. Maintenance wins over a part's own switch, and a
   * caller with a role is never refused by one
   */
  closed: { feature: Feature; message: string } | null;
}

/**
 * Spend from each bucket named, beside the ban check and the switches,
 * in one statement.
 *
 * A bucket that cannot cover its cost is left as it was, and the call
 * is refused if any of them could not. Buckets that could are spent
 * anyway: a refused call is still a call, and a flood pays for itself.
 * `now` is a parameter so the suite can drive the clock
 */
export async function admit(
  sql: Sql | Tx,
  uid: string,
  costs: readonly PaceCost[],
  now: number,
  feature?: Feature,
): Promise<Admission> {
  const rows: [string, number, number, number][] = [];

  for (const { pace, cost } of costs) {
    const rule = PACE_RULES[pace];

    rows.push([pace, rule.burst, rule.perSecond / 1000, cost]);
  }

  // `tokens` is inserted as burst minus cost, so the update reads the
  // cost back as `excluded.burst - excluded.tokens`
  const answer = await sql`
    with wanted (action, burst, per_ms, cost) as (values ${sql(rows)}),
    spent as (
      insert into action_paces as held (player, action, at, tokens, burst, per_ms)
      select ${uid}, action::text, ${now}, burst::float8 - cost::float8, burst::float8, per_ms::float8
      from wanted
      where cost::float8 <= burst::float8
      on conflict (player, action) do update set
        tokens = least(excluded.burst, held.tokens + greatest(0, excluded.at - held.at) * excluded.per_ms)
          - (excluded.burst - excluded.tokens),
        at = excluded.at,
        burst = excluded.burst,
        per_ms = excluded.per_ms
      where least(excluded.burst, held.tokens + greatest(0, excluded.at - held.at) * excluded.per_ms)
        >= excluded.burst - excluded.tokens
      returning action
    )
    select
      coalesce((select banned from profiles where id = ${uid}), false) as banned,
      coalesce((select role from profiles where id = ${uid}), '') as role,
      (select count(*)::int from spent) as spent,
      (
        select json_build_object('feature', feature, 'message', message)
        from switches
        where closed and feature in (${Feature.Everything}, ${feature ?? Feature.Everything})
        order by feature = ${Feature.Everything} desc
        limit 1
      ) as closed
  `;
  const row = answer.at(0);
  const closed: unknown = row?.closed;

  return {
    banned: row?.banned === true,
    paced: Number(row?.spent ?? 0) === rows.length,
    closed:
      closed != null && typeof closed === 'object' && !isStaff(String(row?.role ?? ''))
        ? {
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion
            feature: String((closed as { feature: unknown }).feature) as Feature,
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion
            message: String((closed as { message: unknown }).message),
          }
        : null,
  };
}
