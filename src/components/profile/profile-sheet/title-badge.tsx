import { type JSX, type Resource, Show, Suspense, createResource } from 'solid-js';
import { type AchievementSheet, listAchievements } from '../../../auth/achievements';
import { AchievementTier, TIER_COLORS } from '../../../data/achievements';
import { titleLine, titleType } from '../../../data/ids/titles';

/** The worn title as a pill, in the metal of the tier its line stands at */

/**
 * The tier the wearer stands at on the worn title's line, read off
 * the sheet in its own component so the resource is read under the
 * Suspense below
 */
function readTier(sheet: AchievementSheet | undefined, title: number): AchievementTier {
  if (sheet == null) {
    return AchievementTier.None;
  }

  const line = titleLine(title);

  if (line != null) {
    for (const [held, standing] of sheet.lines) {
      if (held === line) {
        return standing.tier;
      }
    }
    return AchievementTier.None;
  }

  const type = titleType(title);

  if (type != null) {
    for (const [held, standing] of sheet.types) {
      if (held === type) {
        return standing.tier;
      }
    }
  }
  return AchievementTier.None;
}

/** The board's pill: white, with a 2px edge in the metal and the words in it */
const PILL =
  'inline-flex items-center whitespace-nowrap rounded-full border-2 bg-paper px-2 text-[11px]' +
  ' leading-[18px] font-extrabold';

function TierPill(props: {
  sheet: Resource<AchievementSheet>;
  title: number;
  name: string;
}): JSX.Element {
  const tier = (): AchievementTier => readTier(props.sheet(), props.title);

  return (
    <Show
      when={tier() !== AchievementTier.None}
      fallback={<span class={`${PILL} border-line text-muted`}>{props.name}</span>}
    >
      <span
        class={PILL}
        style={{ 'border-color': TIER_COLORS[tier()], color: TIER_COLORS[tier()] }}
      >
        {props.name}
      </span>
    </Show>
  );
}

/**
 * A line or type title is coloured by where the wearer stands on that
 * line today, so the same title brightens as they climb. A ladder
 * title has no tier and wears the gold tone
 */
export default function TitleBadge(props: {
  player: string;
  title: number;
  name: string;
}): JSX.Element {
  if (titleLine(props.title) == null && titleType(props.title) == null) {
    return <span class={`${PILL} border-gold-dark text-gold-dark`}>{props.name}</span>;
  }

  const [sheet] = createResource(() => props.player, listAchievements);

  return (
    <Suspense fallback={<span class={`${PILL} border-line text-muted`}>{props.name}</span>}>
      <TierPill sheet={sheet} title={props.title} name={props.name} />
    </Suspense>
  );
}
