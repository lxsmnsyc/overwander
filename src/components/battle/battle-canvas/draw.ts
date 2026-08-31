import type SpeciesSpriteAnimation from '../../../canvas/species-sprite-animation';
import type { Slot } from './field';
import { COLORS, HIT_REACH, NAMED_RADIUS } from './metrics';
import { type Striking, animationFor } from './motion';
import type { ProgressData } from '../../../battle/events';
import type Unit from '../../../battle/unit';
import { paintAura, paintPurifiedAura, paintShadowAura } from '../../../canvas/auras';
import type Bakery from '../../../canvas/bakery';
import type QuadBatch from '../../../canvas/gl/quad-batch';
import type { QuadPoint } from '../../../canvas/gl/quad-batch';
import { cornersOf, shadowCorners } from '../../../canvas/placement';
import { SHADOW_STAMP, bakeShadowDisc, bakeWord } from '../../overworld/chunk-canvas/scenery';
import type { Point } from '../../../canvas/sprite-sheet';
import { Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { SpriteAnim } from '../../../data/ids/sprite-anims';
import { getMoveData } from '../../../data/moves';

/**
 * Painting one slot: the pokemon, the bars over it and the words under
 * it. Nothing here decides anything about the fight.
 */

/**
 * What a slot's radius is worth in sprite scale. A frame is a few
 * dozen pixels tall, so a boss at fifty-odd pixels of radius comes
 * out about twice the size of a party member — which is what the
 * radius was saying when it was a circle
 */
const SPRITE_SCALE_DIVISOR = 16;

const BAR_WIDTH = 72;

/**
 * How thick a bar is drawn.
 *
 * Thin on purpose. A bar is a reading rather than a thing on the
 * field, and a thick one competes with the pokemon it belongs to —
 * which matters more now the field has depth, since a bar does not
 * recede and a heavy one would sit on the sprite behind it
 */
const BAR_HEIGHT = 4;

/**
 * The lower half of the same bar, where a cast fills up. Thinner than
 * the health above it: what a pokemon has left is the reading being
 * watched, and what it is winding up is the one underneath it
 */
const CAST_HEIGHT = 3;

/**
 * Where a slot is written instead of painted: the batch, and the sheet
 * the drawn art is baked onto. The batch is already carrying the
 * transform that centres the field, so everything here is in the
 * drawing's own coordinates the way the painted pass is
 */
export interface SlotBatch {
  batch: QuadBatch;
  bakery: Bakery;
}

/** The four corners of a rectangle, for the batch */
function corners(x: number, y: number, across: number, down: number): QuadPoint[] {
  return [
    { x, y },
    { x: x + across, y },
    { x: x + across, y: y + down },
    { x, y: y + down },
  ];
}

/**
 * The round patch under a pokemon, stamped from the one baked disc.
 * Answers whether it went, so a caller with no batch draws it the way
 * it always did
 */
function shade(
  patch: ReturnType<SpeciesSpriteAnimation['shadowOf']>,
  onto: SlotBatch | undefined,
  alpha: number,
): boolean {
  const disc = onto == null || patch == null ? null : bakeShadowDisc(onto.bakery);

  if (onto == null || patch == null || disc == null) {
    return false;
  }
  onto.batch.quad(
    onto.bakery.sheet,
    disc,
    shadowCorners({
      ...patch,
      radiusX: patch.radiusX * SHADOW_STAMP,
      radiusY: patch.radiusY * SHADOW_STAMP,
    }),
    patch.alpha * alpha,
    patch.colour,
    'smooth',
  );
  return true;
}

function healthColor(share: number): string {
  if (share > 0.5) {
    return COLORS.health;
  }
  return share > 0.2 ? COLORS.hurt : COLORS.low;
}

function drawBar(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  share: number,
  color: string,
  width = BAR_WIDTH,
  height = BAR_HEIGHT,
  onto?: SlotBatch,
  alpha = 1,
): void {
  const filled = width * Math.max(0, Math.min(1, share));

  if (onto == null) {
    context.fillStyle = COLORS.track;
    context.fillRect(x - width / 2, y, width, height);
    context.fillStyle = color;
    context.fillRect(x - width / 2, y, filled, height);
    return;
  }
  onto.batch.solid(COLORS.track, corners(x - width / 2, y, width, height), alpha);
  onto.batch.solid(color, corners(x - width / 2, y, filled, height), alpha);
}

/**
 * How far along a timed thing is, as a fraction of itself. Nothing
 * timed at all is finished by definition
 */
function fractionOf(progress: ProgressData): number {
  return progress.duration <= 0
    ? 1
    : Math.min(1, Math.max(0, progress.progress / progress.duration));
}

/**
 * The font a move's name is written in. Fixed rather than fitted to
 * the slot, so a word is baked once and stamped from then on
 */
const LABEL_FONT = '12px sans-serif';

function drawLabel(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  onto?: SlotBatch,
  alpha = 1,
): void {
  const word = onto == null ? null : bakeWord(onto.bakery, text, LABEL_FONT, color);

  if (onto == null || word == null) {
    context.fillStyle = color;
    context.textAlign = 'center';
    context.fillText(text, x, y);
    return;
  }
  onto.batch.quad(
    onto.bakery.sheet,
    word,
    corners(x - word.width / 2, y - word.height / 2, word.width, word.height),
    alpha,
  );
}

/**
 * How much bigger than the sheet a pokemon in this slot is drawn
 */
export function scaleOf(slot: Slot): number {
  return slot.radius / SPRITE_SCALE_DIVISOR;
}

/**
 * Where the pokemon in a slot actually **is** — the middle of its
 * body, as the sheet marks it on the frame it is holding.
 *
 * It is what a move in the air flies at. The slot's own point is the
 * middle of a circle somebody laid out, and a pokemon drawn on it is
 * not centred in its own frame: aiming at the circle put a projectile
 * through the empty half of a tall frame while the pokemon it was
 * thrown at stood to one side of it. A slot with nothing drawn on it
 * yet is still a place, and answers with its own middle
 */
export function bodyOf(slot: Slot): Point {
  const sprite = slot.sprite;
  const [x, y] = [slot.x + slot.offset[0], slot.y + slot.offset[1]];
  const placed =
    sprite?.ready === true
      ? sprite.locate('center', x, y, { scale: scaleOf(slot), anchor: 'shadow' })
      : null;

  return placed ?? [x, y];
}

/**
 * The box a slot's pokemon was drawn in, or nothing while its sheet is
 * still coming
 */
export function boxOf(
  slot: Slot,
): { left: number; top: number; width: number; height: number } | null {
  const sprite = slot.sprite;

  return sprite?.ready === true
    ? sprite.bounds(slot.x, slot.y, { scale: scaleOf(slot), anchor: 'shadow' })
    : null;
}

/**
 * Whether a point is on the pokemon.
 *
 * The **sprite's own box**, which is the picture a player is pointing
 * at: a trimmed frame is tight to what was drawn, so a tall pokemon
 * answers for its head and a small one does not answer for the ground
 * beside it. A slot whose sheet has not landed is still a circle,
 * since a circle is what is drawn there
 */
export function withinSlot(slot: Slot, x: number, y: number): boolean {
  const box = boxOf(slot);

  if (box == null) {
    return Math.hypot(x - slot.x, y - slot.y) <= slot.radius * HIT_REACH;
  }
  return x >= box.left && x <= box.left + box.width && y >= box.top && y <= box.top + box.height;
}

/**
 * One unit: the circle, what it is, what it has left, and what it is
 * in the middle of doing
 */
export function drawSlot(
  context: CanvasRenderingContext2D,
  slot: Slot,
  striking: Map<Unit, Striking>,
  clock: number,
  hidden = false,
  onto?: SlotBatch,
): void {
  const { unit } = slot;
  const maxHealth = unit.checkStat(Stats.HP, 0);
  const share = maxHealth <= 0 ? 0 : unit.health / maxHealth;
  // What a downed pokemon is left drawn at. The painted pass sets it
  // on the context; the batch takes it a quad at a time
  const alpha = unit.alive ? 1 : 0.35;

  context.globalAlpha = alpha;

  const sprite = slot.sprite;

  // Nothing at all while it is gone: a pokemon underground or above
  // the field is one the gap has already drawn the hole for, and a
  // body standing in that hole makes a nonsense of both. Its bar and
  // its cast stay, which is what a watcher has to go on
  if (!hidden) {
    if (sprite?.ready === true) {
      const wanted = animationFor(unit, sprite, striking.get(unit));
      const playable = sprite.has(wanted.animation) ? wanted.animation : SpriteAnim.Idle;

      sprite.play(playable, {
        direction: slot.facing,
        loop: wanted.loop,
        // Stretching only means anything for the clip that was asked
        // for: a fallback to Idle is a loop at its own speed
        duration: playable === wanted.animation ? (wanted.duration ?? undefined) : undefined,
        // A one-shot that has run out while the unit is still working a
        // move has reached the end of *a* window, not the end of the
        // work: the next step of a multi-step move is another pass of
        // the same clip, so it is started again rather than held
        restart: sprite.finished && wanted.duration != null,
      });
      // Its body over the middle of the slot, which is the point
      // everything else on the field is measured from: the bars, the
      // name, and whatever a move draws on it.
      //
      // Placed by its **shadow**, which on a ground plane is the only
      // honest answer: the slot is a spot on the floor, and what sits on
      // a spot on the floor is the pokemon's feet. Centring the body
      // there instead buries half of a tall pokemon under the ground and
      // leaves a short one hovering
      const placement = { scale: scaleOf(slot), anchor: 'shadow' } as const;
      const [x, y] = [slot.x + slot.offset[0], slot.y + slot.offset[1]];

      // A shadow pokemon stands in its haze and a purified one in its
      // light, and the aura **is** its shadow — the plain ellipse is
      // for everything else. The painters are the ones the dialogs
      // run, on the battle's own clock so a replay paints the same
      // wisps
      const haze = unit.hasAbility(Abilities.Shadow);
      const lit = unit.hasAbility(Abilities.Purified);

      if (haze || lit) {
        const radius = sprite.shadowRadius(scaleOf(slot));
        const kind = haze ? 'shadow' : 'purified';
        const aura =
          onto == null ? null : paintAura(kind, radius.x, radius.y, clock, slot.x + slot.y);

        if (onto == null || aura == null) {
          const paint = haze ? paintShadowAura : paintPurifiedAura;

          paint(context, x, y, radius.x, radius.y, clock, slot.x + slot.y);
        } else {
          const picture = aura.canvas;

          onto.batch.invalidate(picture);
          onto.batch.quad(
            picture,
            { x: 0, y: 0, width: picture.width, height: picture.height },
            corners(x - aura.originX, y - aura.originY, picture.width, picture.height),
            alpha,
            undefined,
            'smooth',
          );
        }
      } else if (!shade(sprite.shadowOf(x, y, placement), onto, alpha)) {
        sprite.drawShadow(context, x, y, placement);
      }
      const quad = onto == null ? null : sprite.quadOf(x, y, placement);

      if (onto == null || quad == null) {
        sprite.draw(context, x, y, placement);
      } else {
        onto.batch.quad(quad.sheet, quad.source, cornersOf(quad), alpha);
      }
    } else {
      const middle = { x: slot.x + slot.offset[0], y: slot.y + slot.offset[1] };
      const colour = unit.alive ? slot.color : COLORS.down;
      const disc = onto == null ? null : bakeShadowDisc(onto.bakery);

      if (onto == null || disc == null) {
        context.beginPath();
        context.arc(middle.x, middle.y, slot.radius, 0, Math.PI * 2);
        context.fillStyle = colour;
        context.fill();
      } else {
        const reach = slot.radius * SHADOW_STAMP;

        onto.batch.quad(
          onto.bakery.sheet,
          disc,
          corners(middle.x - reach, middle.y - reach, reach * 2, reach * 2),
          alpha,
          colour,
          'smooth',
        );
      }
    }
  }

  // A bar no wider than the pokemon has room for. A crowded field —
  // a lobby, or a row with more on it than fits — is one where every
  // bar at full width would be read as somebody else's
  const bar = Math.min(BAR_WIDTH, slot.radius * 3);
  // Whether there is room to write anything at all on this slot. A
  // crowded far side is one where forty-eight overlapping words say
  // less than none
  const roomy = slot.radius >= NAMED_RADIUS;

  context.font = LABEL_FONT;

  // No name and no level. The field says who is still up and what is
  // landing on them; **which** pokemon each one is belongs to the card
  // that comes up over it, where there is room to say it once and say
  // it properly. Painted on the field it is forty-eight words
  // competing with the fight they are captioning — and the fight is
  // the thing worth watching
  //
  // Under the feet rather than under the box: the pokemon stands on
  // its slot, so what it is labelled with hangs off the ground it is
  // standing on
  //
  // One bar cut in two: what it has left on top, what it is winding up
  // underneath. The cast bar used to float above the head, which asked
  // a player watching a boss to read one pokemon in two places
  const busy = unit.casting ?? unit.channeling;
  const wound = busy == null || !unit.alive ? 0 : fractionOf(busy.time);

  drawBar(context, slot.x, slot.y + 10, share, healthColor(share), bar, BAR_HEIGHT, onto, alpha);
  drawBar(
    context,
    slot.x,
    slot.y + 10 + BAR_HEIGHT,
    wound,
    unit.casting == null ? COLORS.channel : COLORS.cast,
    bar,
    CAST_HEIGHT,
    onto,
    alpha,
  );

  // What it is in the middle of, named above its head: a cast the
  // other side can still interrupt, or a channel already landing
  if (busy != null && unit.alive && roomy) {
    drawLabel(
      context,
      getMoveData(busy.move).name,
      slot.x,
      slot.y - slot.radius * 2 - 8,
      COLORS.text,
      onto,
      alpha,
    );
  }
  context.globalAlpha = 1;
}
