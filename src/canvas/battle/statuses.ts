import { type MoveVisualBuilder, cue } from './moves/__shapes';
import { Statuses } from '../../data/ids/status';

/**
 * What a status looks like on the field.
 *
 * A pokemon carrying one is already drawn differently — it stands in
 * the clip the status calls for, asleep or shivering or reeling — and
 * that says what state it is *in*. What it cannot say is **when**:
 * the moment the poison lands, and each moment it bites afterwards,
 * look exactly like the seconds either side of them. Those are the two
 * moments here.
 *
 * A status with nothing in the table is drawn by its clip alone, which
 * is the ordinary case: most of them are positions and postures rather
 * than things that happen to a pokemon
 */

/** One status, as a picture. */
interface StatusCue {
  /** Sheet folder under `public/sprites`. */
  sheet: string;
  /**
   * The box it is drawn in, before the field's scale. Left out for
   * the cue size every mark shares; set where one wants to be bigger
   * than the rest of them
   */
  size?: number;
  /** Whether it hangs over the head — a mark rather than a symptom. */
  lift?: boolean;
}

/** The size a status is drawn at when it lands, before the field's scale. */
const CUE_SIZE = 40;

/**
 * How much smaller and fainter it is each time it bites afterwards.
 * The landing is the news; a tick is a reminder, and one drawn as
 * loudly reads as a second poisoning
 */
const TICK_SIZE = 0.72;
const TICK_ALPHA = 0.75;

const CUES: Partial<Record<Statuses, StatusCue>> = {
  // Both poisons are the same picture at two doses, because that is
  // what they are: the bad one is the ordinary one, faster
  [Statuses.Poisoned]: { sheet: 'effects/22' },
  [Statuses.BadlyPoisoned]: { sheet: 'effects/22', size: 60 },
  [Statuses.Burned]: { sheet: 'effects/205' },
  [Statuses.Paralyzed]: { sheet: 'effects/198' },
  [Statuses.Frozen]: { sheet: 'effects/23' },
  // The spiral Hypnosis winds down is what falling asleep looks like,
  // whatever put the pokemon under
  [Statuses.Sleeping]: { sheet: 'effects/65' },
  // Marks rather than symptoms: they belong over the head, where a
  // thought goes, rather than on the body where a burn does
  [Statuses.Confused]: { sheet: 'effects/67', lift: true },
  [Statuses.Flinched]: { sheet: 'effects/66', lift: true },
  [Statuses.Raging]: { sheet: 'effects/68', lift: true },
  [Statuses.Infatuated]: { sheet: 'effects/217' },
  [Statuses.Seeding]: { sheet: 'effects/248' },
  [Statuses.Substituted]: { sheet: 'effects/193' },
  [Statuses.FocusEnergy]: { sheet: 'effects/202' },
};

/** The moment it lands. */
export function statusCueFor(status: Statuses): MoveVisualBuilder | null {
  const cued = CUES[status];

  return cued == null ? null : cue(cued.sheet, { size: cued.size ?? CUE_SIZE, lift: cued.lift });
}

/** Each moment it bites afterwards: the same picture, quieter. */
export function statusTickFor(status: Statuses): MoveVisualBuilder | null {
  const cued = CUES[status];

  return cued == null
    ? null
    : cue(cued.sheet, {
        size: (cued.size ?? CUE_SIZE) * TICK_SIZE,
        alpha: TICK_ALPHA,
        lift: cued.lift,
      });
}
