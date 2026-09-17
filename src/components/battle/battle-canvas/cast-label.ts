import type Unit from '../../../battle/unit';
import type Bakery from '../../../canvas/bakery';
import type { QuadPoint } from '../../../canvas/gl/quad-batch';
import type { Moves } from '../../../data/ids/moves';
import { TYPE_COLORS } from '../../../data/constants/types';
import { getMoveData } from '../../../data/moves';
import type { SlotBatch } from './draw';

/**
 * The plate a move's name is shown on while a unit winds it up. It is
 * filled with the move's type colour so the type reads before the
 * name, edged dark so it stands off any backdrop, and it animates on
 * the battle's own clock, so a paused fight holds it still.
 */

const FONT = 'bold 12px sans-serif';
const PLATE_HEIGHT = 18;
const PADDING = 7;
const EDGE = 'rgba(0, 0, 0, 0.55)';
const INTERRUPTED = '#80201a';
const LIGHT_TEXT = '#ffffff';
const DARK_TEXT = '#1b1b1b';

/** Whether white text reads on this colour, by perceived brightness */
function isDark(color: string): boolean {
  const red = Number.parseInt(color.slice(1, 3), 16) / 255;
  const green = Number.parseInt(color.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(color.slice(5, 7), 16) / 255;

  return 0.299 * red + 0.587 * green + 0.114 * blue < 0.6;
}

/**
 * The most a plate is baked above the drawing's own size. The field is
 * scaled up to the screen, so a plate baked at 1x is stretched and
 * blurs; baking at the screen's density keeps the text sharp
 */
const MAX_DENSITY = 3;

/** How long each part of the animation runs, in milliseconds */
const ENTER = 160;
const LAND = 220;
const BREAK = 260;
const PULSE = 900;

/** One unit's plate: what it names, and when it came and went */
export interface CastLabel {
  move: Moves;
  channel: boolean;
  shownAt: number;
  endedAt: number | null;
  interrupted: boolean;
}

export type CastLabels = Map<Unit, CastLabel>;

/**
 * Keep a unit's plate in step with what it is doing. A cast ends by
 * the unit simply no longer casting, so the plate is kept a moment
 * longer to play its way out
 */
export function trackCast(labels: CastLabels, unit: Unit, clock: number): void {
  const busy = unit.alive ? (unit.casting ?? unit.channeling) : undefined;
  const held = labels.get(unit);

  if (busy != null) {
    if (held == null || held.move !== busy.move || held.endedAt != null) {
      labels.set(unit, {
        move: busy.move,
        channel: unit.casting == null,
        shownAt: clock,
        endedAt: null,
        interrupted: false,
      });
    } else {
      held.channel = unit.casting == null;
    }
    return;
  }
  if (held == null) {
    return;
  }
  if (held.endedAt == null) {
    held.endedAt = clock;
  } else if (clock - held.endedAt > (held.interrupted ? BREAK : LAND)) {
    labels.delete(unit);
  }
}

/** Mark a plate still showing as cut short, so it breaks rather than lands */
export function interruptCast(labels: CastLabels, unit: Unit, clock: number): void {
  const held = labels.get(unit);

  if (held != null && held.endedAt == null) {
    held.endedAt = clock;
    held.interrupted = true;
  }
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Eases past the end and settles back, for a pop */
function overshoot(share: number): number {
  const back = 1.7;
  const rest = share - 1;

  return 1 + (back + 1) * rest ** 3 + back * rest ** 2;
}

function measure(context: CanvasRenderingContext2D, name: string): number {
  context.font = FONT;
  return Math.ceil(context.measureText(name).width) + PADDING * 2;
}

/** The plate drawn around the origin: a dark pill with the name on it */
function paintPlate(
  context: CanvasRenderingContext2D,
  name: string,
  width: number,
  fill: string,
): void {
  context.beginPath();
  context.roundRect(-width / 2, -PLATE_HEIGHT / 2, width, PLATE_HEIGHT, PLATE_HEIGHT / 2);
  context.fillStyle = fill;
  context.fill();
  context.lineWidth = 1.5;
  context.strokeStyle = EDGE;
  context.stroke();

  context.font = FONT;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = isDark(fill) ? LIGHT_TEXT : DARK_TEXT;
  context.fillText(name, 0, 1);
}

/** Baked `density` times over, so the screen samples it down rather than up */
function bakePlate(
  bakery: Bakery,
  measuring: CanvasRenderingContext2D,
  name: string,
  fill: string,
  density: number,
): ReturnType<Bakery['take']> {
  const width = measure(measuring, name);

  return bakery.take(
    `cast-plate:${name}:${fill}:${density}`,
    (PLATE_HEIGHT + 2) * density,
    (context) => {
      context.scale(density, density);
      paintPlate(context, name, width, fill);
    },
    (width + 2) * density,
  );
}

/** Where the plate is and how it looks this frame */
interface Pose {
  dx: number;
  dy: number;
  scale: number;
  alpha: number;
  /** How much a brightening copy is laid over it */
  glow: number;
}

function poseOf(label: CastLabel, clock: number): Pose {
  if (label.endedAt == null) {
    const t = clamp((clock - label.shownAt) / ENTER);
    // A channel breathes while it lands
    const glow = label.channel ? 0.12 + 0.12 * Math.sin((clock / PULSE) * Math.PI * 2) : 0;

    return { dx: 0, dy: 6 * (1 - t), scale: 0.7 + 0.3 * overshoot(t), alpha: t, glow };
  }
  if (label.interrupted) {
    const t = clamp((clock - label.endedAt) / BREAK);
    const shake = t < 0.5 ? Math.sin(t * 40) * 4 * (1 - t * 2) : 0;

    return { dx: shake, dy: 6 * t * t, scale: 1, alpha: 1 - clamp((t - 0.4) / 0.6), glow: 0 };
  }
  const t = clamp((clock - label.endedAt) / LAND);
  const eased = 1 - (1 - t) ** 2;

  return {
    dx: 0,
    dy: -10 * eased,
    scale: 1 + 0.06 * eased,
    alpha: t < 0.3 ? 1 : 1 - (t - 0.3) / 0.7,
    glow: t < 0.3 ? 0.6 * (1 - t / 0.3) : 0,
  };
}

function cornersAround(x: number, y: number, width: number, height: number): QuadPoint[] {
  const left = x - width / 2;
  const top = y - height / 2;

  return [
    { x: left, y: top },
    { x: left + width, y: top },
    { x: left + width, y: top + height },
    { x: left, y: top + height },
  ];
}

/** Draw a unit's plate, if it has one, centred on the point given */
export function drawCastLabel(
  context: CanvasRenderingContext2D,
  label: CastLabel,
  x: number,
  y: number,
  clock: number,
  onto: SlotBatch | undefined,
  alpha: number,
): void {
  const { name, type } = getMoveData(label.move);
  const fill = label.interrupted ? INTERRUPTED : TYPE_COLORS[type];
  const density = Math.min(MAX_DENSITY, Math.max(1, Math.ceil(onto?.density ?? 1)));

  const pose = poseOf(label, clock);
  const shown = pose.alpha * alpha;

  if (shown <= 0) {
    return;
  }

  const plate = onto == null ? null : bakePlate(onto.bakery, context, name, fill, density);

  if (onto == null || plate == null) {
    context.save();
    context.globalAlpha = shown;
    context.translate(x + pose.dx, y + pose.dy);
    context.scale(pose.scale, pose.scale);
    paintPlate(context, name, measure(context, name), fill);
    context.restore();
    return;
  }

  const spot = cornersAround(
    x + pose.dx,
    y + pose.dy,
    (plate.width / density) * pose.scale,
    (plate.height / density) * pose.scale,
  );

  onto.batch.quad(onto.bakery.sheet, plate, spot, shown, undefined, 'smooth');
  if (pose.glow > 0) {
    onto.batch.quad(
      onto.bakery.sheet,
      plate,
      spot,
      shown * pose.glow,
      undefined,
      'smooth',
      'screen',
    );
  }
}
