import { type JSX, Show, Suspense, createResource, createSignal } from 'solid-js';
import { listAchievements } from '../../../auth/achievements';
import listAwards from '../../../auth/awards';
import type Awards from '../../../data/ids/awards';
import {
  HOENN_BADGES,
  JOHTO_BADGES,
  KALOS_BADGES,
  KANTO_BADGES,
  SINNOH_BADGES,
  UNOVA_BADGES,
} from '../../../data/ids/awards';
import { Note, Segmented } from '../../styled';
import { m } from '../../../i18n/paraglide/messages.js';
import { LineShelf, TrainerShelf, TypeShelf } from './achievements';
import BadgeShelf, { countWon, readWins } from './badges';
import { readRegions } from './regions';

export { AwardArt } from './slot';

/**
 * The trainer's shelf: what has been won in numbers, and under them a
 * shelf at a time. Every slot is drawn whether or not it is earned: an
 * empty slot is the point, it says what is still out there.
 */

/** Which shelf of the pane is open */
const enum AwardShelf {
  Badges = 0,
  Types = 1,
  Trainers = 2,
  Achievements = 3,
}

const ALL_BADGES = [
  ...KANTO_BADGES,
  ...JOHTO_BADGES,
  ...HOENN_BADGES,
  ...SINNOH_BADGES,
  ...UNOVA_BADGES,
  ...KALOS_BADGES,
];

export interface AwardsCardProps {
  player: string;
}

/** A tile of the summary row: a number over its label */
function Tile(props: { label: string; value: number; gold?: boolean }): JSX.Element {
  return (
    <div class="flex min-w-20 flex-col gap-0.5 rounded-[14px] border-2 border-line-soft px-3 py-2">
      <b
        class={`font-display text-[22px] leading-none font-semibold tabular-nums ${
          props.gold === true ? 'text-gold-dark' : ''
        }`}
      >
        {props.value}
      </b>
      <span class="text-[10px] font-extrabold tracking-[0.12em] text-muted uppercase">
        {props.label}
      </span>
    </div>
  );
}

export default function AwardsCard(props: AwardsCardProps): JSX.Element {
  const [held] = createResource(() => props.player, listAwards);
  const [sheet] = createResource(() => props.player, listAchievements);
  const [shelf, setShelf] = createSignal(AwardShelf.Badges);

  const wins = (): Map<Awards, number> => readWins(held());
  const elite = (): number => {
    let count = 0;

    for (const region of readRegions()) {
      count += countWon(wins(), region.honors);
    }
    return count;
  };
  const champions = (): number => {
    let count = 0;

    for (const region of readRegions()) {
      if (region.champion != null && wins().has(region.champion)) {
        count += 1;
      }
    }
    return count;
  };

  return (
    <div class="flex flex-col gap-2.5">
      {/* What has been won, and which shelf to look at */}
      <div class="flex flex-wrap items-center gap-2">
        <Tile gold label={m.award_tab_badges()} value={countWon(wins(), ALL_BADGES)} />
        <Tile label={m.award_tile_elite()} value={elite()} />
        <Tile label={m.award_tile_champion()} value={champions()} />
        <span class="grow" />
        <Segmented
          label={m.profile_section_awards()}
          value={shelf()}
          options={[
            { value: AwardShelf.Badges, label: m.award_tab_badges() },
            { value: AwardShelf.Types, label: m.award_tab_types() },
            { value: AwardShelf.Trainers, label: m.award_tab_trainers() },
            { value: AwardShelf.Achievements, label: m.award_tab_achievements() },
          ]}
          onChange={(value) => {
            setShelf(value);
          }}
        />
      </div>
      <Suspense fallback={<Note>{m.award_reading()}</Note>}>
        <Show when={shelf() === AwardShelf.Badges}>
          <BadgeShelf held={held} />
        </Show>
        <Show when={shelf() === AwardShelf.Achievements}>
          <LineShelf sheet={sheet} />
        </Show>
        <Show when={shelf() === AwardShelf.Types}>
          <TypeShelf sheet={sheet} />
        </Show>
        <Show when={shelf() === AwardShelf.Trainers}>
          <TrainerShelf sheet={sheet} />
        </Show>
      </Suspense>
    </div>
  );
}
