import { type Accessor, For } from 'solid-js';
import type { JSX } from '@solidjs/web';
import type { AwardRecord } from '../../../auth/awards';
import type Awards from '../../../data/ids/awards';
import { CARD, CARD_TITLE, riseAfter } from '../../styled';
import { m } from '../../../i18n/paraglide/messages.js';
import { type AwardRegion, readElsewhere, readRegions } from './regions';
import Slot from './slot';

/**
 * The badges shelf: a card per region with its medals in rows of eight,
 * and the count of badges won at its head
 */

/** What the shelf holds: each award and how many times its fight was won */
export function readWins(held: AwardRecord[] | undefined): Map<Awards, number> {
  const wins = new Map<Awards, number>();

  for (const entry of held ?? []) {
    wins.set(entry.award, entry.wins);
  }
  return wins;
}

/** How many of these awards the shelf holds */
export function countWon(wins: Map<Awards, number>, awards: Iterable<Awards>): number {
  let count = 0;

  for (const award of awards) {
    if (wins.has(award)) {
      count += 1;
    }
  }
  return count;
}

/** One region's line: how many badges are won and, where it has an Elite Four, its members and Champion */
function readSummary(region: AwardRegion, wins: Map<Awards, number>): string {
  const badges = countWon(wins, region.badges);
  const honors = countWon(wins, region.honors);
  const champion = region.champion != null && wins.has(region.champion);

  if (region.honors.length === 0) {
    return m.award_summary_badges({
      region: region.name(),
      badges,
      badgeTotal: region.badges.length,
    });
  }
  const parts = {
    region: region.name(),
    badges,
    badgeTotal: region.badges.length,
    honors,
    honorTotal: region.honors.length,
  };

  return champion ? m.award_summary_champion(parts) : m.award_summary_elite(parts);
}

function MedalGrid(props: { awards: Awards[]; wins: Map<Awards, number> }): JSX.Element {
  return (
    <div class="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
      <For each={props.awards}>
        {(award) => <Slot award={award} wins={props.wins.get(award) ?? null} />}
      </For>
    </div>
  );
}

export default function BadgeShelf(props: { held: Accessor<AwardRecord[]> }): JSX.Element {
  const wins = (): Map<Awards, number> => readWins(props.held());

  return (
    <div class="flex flex-col gap-2.5">
      <For each={readRegions()}>
        {(region, at) => (
          <section class={`${CARD} gap-2.5`} style={riseAfter(at())}>
            <h3 class={`${CARD_TITLE} flex items-center gap-2`}>
              {region.name()}
              <span
                class="ml-auto inline-flex h-[22px] min-w-[26px] items-center justify-center
                  rounded-full bg-line-soft px-1.5 font-display text-xs font-semibold tracking-normal
                  text-muted tabular-nums"
                role="img"
                aria-label={readSummary(region, wins())}
              >
                {countWon(wins(), region.badges)} / {region.badges.length}
              </span>
            </h3>
            <MedalGrid awards={region.all} wins={wins()} />
          </section>
        )}
      </For>
      <section class={`${CARD} gap-2.5`} style={riseAfter(6)}>
        <h3 class={CARD_TITLE}>{m.award_group_elsewhere()}</h3>
        <MedalGrid awards={readElsewhere()} wins={wins()} />
      </section>
    </div>
  );
}
