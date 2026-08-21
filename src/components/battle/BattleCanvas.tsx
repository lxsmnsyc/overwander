import { type JSX, createSignal, onCleanup, onMount } from 'solid-js';
import type Battle from '../../battle/core';
import type SpeciesSpriteAnimation from '../../canvas/species-sprite-animation';
import type { Point, SpriteDirection } from '../../canvas/sprite-sheet';
import type { FieldVisual } from '../../canvas/battle/moves/__painted';
import attackMarkVisual from '../../canvas/battle/attack';
import abilityCueFor, {
  itemCueFor,
  statusCueFor,
  statusTriggerFor,
} from '../../canvas/battle/cues';
import paintWeather from '../../canvas/battle/weather';
import {
  delayShapeFor,
  moveDelayVisual,
  moveEffectVisual,
  moveMissVisual,
} from '../../canvas/battle/moves';
import projectField, {
  type FieldPoint,
  type FieldView,
  ringOf,
  ringRadius,
} from '../../canvas/battle/field';
import facingToward from '../../canvas/facing';
import loadSpeciesSprite from '../../canvas/species-sprites';
import {
  BattleEvents,
  type MoveTarget,
  MoveTargetType,
  type ProgressData,
} from '../../battle/events';
import type Abilities from '../../data/ids/abilities';
import type Unit from '../../battle/unit';
import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { AI_REST_PERIOD } from '../../battle/ai/idle';
import { isLoopingCast, pickCast } from '../../data/constants/cast';
import { SpriteAnim } from '../../data/ids/sprite-anims';
import pickStatusCast from '../../data/constants/status-cast';
import { Stats } from '../../data/constants/stats';
import { MoveFlags, type Moves } from '../../data/ids/moves';
import { Genders, type Species } from '../../data/ids/species';
import type { Statuses } from '../../data/ids/status';
import { getMoveData } from '../../data/moves';

/**
 * The battle as a picture.
 *
 * [`BattleField`](./BattleField.tsx) says everything there is to say
 * about a unit and says it in words; this says the two things a player
 * watches for — who is still up, and what is about to land on them —
 * and says them where they can be taken in at a glance.
 *
 * The battle mutates its units in place, so this does not observe
 * them — it redraws on the engine's own `Tick`, which is the frame the
 * units moved in. Nothing here keeps a clock of its own: a picture
 * drawn from a second timer would drift from the fight it is a picture
 * of, and would keep animating after the battle had stopped.
 */

/**
 * The drawing is done in these coordinates whatever the element is
 * sized to, so nothing has to be recomputed when the page is
 */
const WIDTH = 640;
const HEIGHT = 360;

/**
 * How many pixels a field unit is worth at the middle of the field.
 *
 * It is a fixed number on purpose. Fitting the camera to the crowd
 * would make a duel and a twelve-player raid different games — the
 * same pokemon would be drawn at two sizes depending on who else
 * turned up
 */
const FIELD_UNIT = 6;

/**
 * How big a pokemon is drawn, in field units rather than pixels.
 *
 * Tied to the field's own scale so that pulling the camera back pulls
 * everything back with it: a size fixed in pixels would keep itself
 * while the ground shrank underneath it, and a party spread around a
 * circle would come out as one overlapping smudge
 */
const PARTY_SLOT = FIELD_UNIT * 2.6;

/**
 * The boss is drawn large, since it is one thing against a party and
 * the size is what says so
 */
const BOSS_RADIUS = FIELD_UNIT * 5.6;

/**
 * How small a slot is allowed to draw its pokemon. Below this a sprite
 * is a smudge, so a crowded far side lets them overlap rather than
 * shrinking to nothing
 */
const MIN_RADIUS = 8;

/** The size a slot has to reach before it prints its own name. */
const NAMED_RADIUS = PARTY_SLOT;

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
 * How far past its own radius a pokemon answers the pointer, for the
 * few slots with no sheet yet. Anything drawn answers for the box it
 * was actually drawn in
 */
const HIT_REACH = 1.4;

/**
 * What the field says while the fight's sheets are still coming
 */
const LOADING_LABEL = 'Loading…';

const COLORS = {
  field: '#101823',
  mine: '#4c9a6a',
  theirs: '#9a4c5a',
  boss: '#9a5a3c',
  down: '#3a4250',
  health: '#4cc46a',
  hurt: '#c4a24c',
  low: '#c4544c',
  cast: '#4c9ac4',
  channel: '#9a6ac4',
  track: '#26303e',
  text: '#e6ecf5',
} as const;

/**
 * One unit as it is drawn: where it sits, how big it is, and which
 * side of the field it is on
 */
interface Slot {
  unit: Unit;
  x: number;
  y: number;
  radius: number;
  color: string;
  /**
   * The pokemon itself, when its sheet has arrived. A unit whose
   * sheet is still coming — or has none at all — is drawn as the
   * circle this used to be, so the fight is watchable either way
   */
  sprite: SpeciesSpriteAnimation | null;
  /**
   * Which way it is facing: at whatever it is aiming at, worked out
   * after the camera has turned rather than fixed to a side of the
   * screen
   */
  facing: SpriteDirection;
  /**
   * How near the camera it is, as the perspective factor at its feet.
   * Larger is nearer, and it is what the field is painted in order of
   */
  depth: number;
  /**
   * How far the **body** is drawn from its slot, for a pokemon
   * throwing itself at another one. The slot is where it stands, and
   * where its bar and its name stay: furniture that jumps about with
   * the body is furniture nobody can read
   */
  offset: Point;
  /** Whether it is in front of the camera at all. */
  visible: boolean;
}

/**
 * How long one ability has to wait before it draws a cue again, in
 * battle milliseconds
 */
const CUE_GAP = 700;

/**
 * A pokemon throwing itself at another one.
 *
 * A contact move is the pokemon *being* the projectile — there is
 * nothing in the air to draw, because the thing crossing the gap is
 * the body. So the sprite goes: out toward whatever it is hitting and
 * back to where it stands, on the battle's own clock
 */
interface Lunge {
  source: Unit;
  target: Unit;
  elapsed: number;
  window: number;
}

/** How long the whole out-and-back takes, in battle milliseconds. */
const LUNGE_SPAN = 480;

/** How much of the gap it crosses. Not all of it: they do not overlap */
const LUNGE_REACH = 0.42;

/**
 * A move going off: its own picture, played where it happened.
 *
 * It covers the whole of the move, the time in the air included — a
 * move the engine holds before it lands is handed that window and
 * spends it, so nothing else has to draw where the move currently is
 */
interface Casting {
  source: Unit;
  targets: Unit[];
  visual: FieldVisual;
}

/**
 * The field as it is to be drawn: whatever is in the middle, and the
 * teams ringed around it.
 *
 * **Every** fight is laid out this way, not only a raid. Two trainers
 * used to be drawn as two rows facing each other across a line, which
 * is a picture of a menu rather than of a place — and it threw away
 * the depth the plane is drawn with, since both rows stood at the same
 * distance from the camera. Given a ring, the near team is nearer:
 * bigger, in front, and unmistakably the viewer's own.
 *
 * A raid boss is what stands at the origin. A fight without one has an
 * empty middle and its teams facing across it
 */
interface Field {
  /**
   * The pokemon at the origin: a raid boss, and nothing else. Empty
   * for an ordinary fight
   */
  middle: Unit[];
  /**
   * Every team facing it, each drawn as a cluster of its own so a
   * party reads as a party
   */
  teams: { units: Unit[]; friendly: boolean }[];
  /**
   * Which of those teams is the viewer's, so the ring can be turned to
   * put it nearest the camera. Null for a spectator, who has none
   */
  mine: number | null;
}

function readField(battle: Battle, player: string): Field {
  const middle: Unit[] = [];
  const teams: { units: Unit[]; friendly: boolean }[] = [];
  let mine: number | null = null;

  /**
   * Which alliance the viewer is fighting in, so everybody else can be
   * told friend from foe. A spectator is in none of them, and is shown
   * every party as one of the fight's own
   */
  const own = [...battle.alliances].find((alliance) =>
    [...alliance.teams].some((team) => team.player === player && player !== ''),
  );

  for (const alliance of battle.alliances) {
    for (const team of alliance.teams) {
      if (alliance.boss) {
        middle.push(...team.units);
        continue;
      }
      if (team.units.size === 0) {
        continue;
      }
      if (team.player === player && player !== '') {
        mine = teams.length;
      }
      teams.push({ units: [...team.units], friendly: own == null || alliance === own });
    }
  }
  return { middle, teams, mine };
}

/**
 * Where a pokemon stands, before the camera has had its say.
 *
 * The field is a plane rather than a picture, so a side is laid out in
 * **field units** and projected afterwards. Keeping the two apart is
 * what lets the camera turn: the layout is the same at every angle,
 * and the angle is the only thing that changes between one frame and
 * the next
 */
interface Standing {
  unit: Unit;
  place: FieldPoint;
  /**
   * What it turns to look at while it is aiming at nothing, in field
   * units
   */
  look: FieldPoint;
  /** Its size on screen at the middle of the field. */
  radius: number;
  color: string;
  sprite: SpeciesSpriteAnimation | null;
}

/**
 * The ring of parties around a boss: a **circle**, on the ground,
 * measured in field units like everything else.
 *
 * Not squashed to suit the canvas. A lobby is a ring of teams closed
 * around the thing they came for, and that is a fact about the field
 * rather than about the window it is being looked at through — an
 * ellipse would be the picture leaking into the world, and would
 * unsquash itself the moment the camera turned a quarter of the way
 * round. What makes a circle fit a wide frame is the camera standing
 * lower, which `field.ts` does
 */
const LOBBY_RADIUS = 24;
const TEAM_RADIUS = 4.5;

/**
 * How far apart two parties stand on the lobby ring.
 *
 * A party is a ring of its own, so two of them closer than this are
 * two rings sharing pokemon — which reads as one large confused party
 * rather than as two. Wide enough that the lobby keeps its size up to
 * eight parties and starts stepping outward at the ninth, which is the
 * point at which a fixed ring runs out of room
 */
const LOBBY_GAP = 17;

/**
 * The point on the ring closest to the camera. `z` counts away from
 * it, so the near side of the circle is the negative quarter
 */
const NEAREST = -Math.PI / 2;

/**
 * How far back the camera stands for a lobby, and how wide its ring
 * is.
 *
 * The ring grows as parties arrive, and past a dozen or so it grows
 * off the bottom of the frame. So the camera steps back by exactly the
 * factor the ring grew by: a raid of four and a raid of sixteen fill
 * the same picture, and what changes between them is how big the
 * pokemon in it are — which is the honest reading, since there really
 * are four times as many of them on the same ground.
 *
 * The factor rides on **both** the field's scale and the size of what
 * is standing on it. Pulling only the ground back would space them
 * further apart on screen while leaving them the same size, which is
 * the opposite of what a camera does
 */
function lobbyCamera(teams: number): { radius: number; zoom: number } {
  const radius = ringRadius(teams, LOBBY_RADIUS, LOBBY_GAP);

  return { radius, zoom: LOBBY_RADIUS / radius };
}

/**
 * A side of a fight: a ring of pokemon around a point, each looking at
 * whatever it is up against by default — until it is aiming at
 * something, which `project` lets it turn to
 */
function side(
  units: Unit[],
  centre: FieldPoint,
  radius: number,
  look: FieldPoint,
  slotRadius: number,
  color: string,
  spriteFor: (unit: Unit) => SpeciesSpriteAnimation | null,
): Standing[] {
  return ringOf(units.length, centre, radius).map((place, at) => ({
    unit: units[at],
    place,
    look,
    radius: slotRadius,
    color,
    sprite: spriteFor(units[at]),
  }));
}

/**
 * A raid as it is: the boss in the middle, the parties around it, each
 * party a ring of its own, everybody looking inward.
 *
 * This is what a spectator is shown, and it says two things a pair of
 * sides cannot. **Who came with whom** — a party is a cluster rather
 * than a stretch of a line somebody has to count along — and **what
 * the fight is**, which is one thing in the middle with a lobby closed
 * around it
 */
function ringStandings(
  field: Field,
  spriteFor: (unit: Unit) => SpeciesSpriteAnimation | null,
): Standing[] {
  const origin: FieldPoint = { x: 0, z: 0 };
  const standings: Standing[] = [];
  // A busy field stands further out rather than closer together, and
  // is drawn smaller for it: the camera has stepped back with the ring
  const { radius, zoom } = lobbyCamera(field.teams.length);

  // Normally one. Two would be a raid nothing stages yet, so they
  // stand side by side rather than on top of one another
  field.middle.forEach((unit, at) => {
    standings.push({
      unit,
      place: { x: (at - (field.middle.length - 1) / 2) * 4, z: 0 },
      // Nothing of its own to look at until it aims at something, so
      // it faces the camera
      look: { x: 0, z: -radius },
      radius: BOSS_RADIUS * zoom,
      color: COLORS.boss,
      sprite: spriteFor(unit),
    });
  });

  // Where the ring starts. Whoever is looking at the fight is stood at
  // the front of it — their own team nearest the camera, biggest and
  // never behind anybody — and the rest fall in around from there. A
  // spectator has no team to favour, so the ring starts at the back
  const step = (Math.PI * 2) / field.teams.length;
  const start = field.mine == null ? Math.PI / 2 : NEAREST - field.mine * step;

  field.teams.forEach((team, at) => {
    const around = at * step + start;
    const centre: FieldPoint = {
      x: Math.cos(around) * radius,
      z: Math.sin(around) * radius,
    };

    standings.push(
      ...side(
        team.units,
        centre,
        TEAM_RADIUS,
        // Across the field by default: at the boss where there is one,
        // and otherwise at whatever is standing opposite
        origin,
        PARTY_SLOT * zoom,
        team.friendly ? COLORS.mine : COLORS.theirs,
        spriteFor,
      ),
    );
  });
  return standings;
}

/**
 * What a unit is turned toward: whatever it is aiming at.
 *
 * A pokemon that faces the middle of the field all fight is a pokemon
 * that never looks at anything — on a ring the thing it is hitting is
 * rarely straight ahead. This is the move it is winding up, the move
 * it has in the air, or nothing while it is standing about. A move
 * aimed at a whole team looks at the first of them, which is where the
 * cluster is
 */
function watchedBy(unit: Unit, thrown: Striking | undefined): Unit | null {
  const aim = unit.casting?.target ?? unit.channeling?.target ?? thrown?.at;

  if (aim == null) {
    return null;
  }
  if (aim.type === MoveTargetType.Unit) {
    return aim.unit === unit ? null : aim.unit;
  }
  if (aim.type === MoveTargetType.Team) {
    return [...aim.team.units].find((other) => other !== unit) ?? null;
  }
  return null;
}

/**
 * The camera applied: field units become pixels, and the field's own
 * depth becomes the order things are drawn in.
 *
 * **Far first.** On a plane with depth, a pokemon nearer the camera
 * stands in front of one further off, and the only thing that makes
 * that true on a canvas is the order the two were painted in
 */
function project(standings: Standing[], view: FieldView, striking: Map<Unit, Striking>): Slot[] {
  // Where everybody is, so a unit can be turned to look at whichever
  // of them it is aiming at
  const places = new Map(standings.map((standing) => [standing.unit, standing.place]));

  return standings
    .map((standing) => {
      const on = projectField(standing.place, view);
      const watched = watchedBy(standing.unit, striking.get(standing.unit));
      const at = projectField(
        (watched == null ? null : places.get(watched)) ?? standing.look,
        view,
      );

      return {
        unit: standing.unit,
        x: on.x,
        y: on.y,
        radius: Math.max(MIN_RADIUS, standing.radius * on.scale),
        color: standing.color,
        sprite: standing.sprite,
        facing: facingToward(on.x, on.y, at.x, at.y),
        depth: on.scale,
        offset: [0, 0] as Point,
        visible: on.visible,
      };
    })
    .filter((slot) => slot.visible)
    .sort((one, two) => one.depth - two.depth);
}

/**
 * What a unit should look like it is doing, and how long it has to do
 * it in.
 *
 * A unit working a move plays the move's own `cast` list, walked until
 * the sprite in hand has one of those clips, so a Fire Punch punches
 * on a sheet that has a punch and swings on one that does not.
 *
 * The clip is **stretched over the window** rather than looped inside
 * it: a cast runs `(104 - 16 x priority)` frames and a drawn clip is
 * whatever length it was drawn at, so a loop would leave the gesture
 * part-way through when the move fires. Stretched, the wind-up ends
 * exactly as the move goes off, which makes priority visible without a
 * number on screen. Channelling draws the same way, one pass per step
 */
export interface Performance {
  animation: SpriteAnim;
  /**
   * How long one pass should take, or null to play at the speed the
   * sheet was drawn at
   */
  duration: number | null;
  loop: boolean;
}

/**
 * A move this unit has thrown and is waiting to land: which move, and
 * how long the engine is holding it in the air. It is what the unit is
 * doing between firing and hitting
 */
export interface Striking {
  move: Moves;
  /**
   * How long the gesture is given: the flight the engine is holding
   * the move for, plus the rest the caster takes afterwards.
   *
   * It is not what the clip is *fitted* to — a throw plays at the
   * speed it was drawn at — it is how long the field goes on showing
   * it before the pokemon falls back to standing about. Fitting the
   * clip to the flight instead squeezed a second of drawn gesture into
   * a quarter of one, which is a blink rather than a throw
   */
  window: number;
  /** How much of that window has passed. */
  elapsed?: number;
  /**
   * What it was thrown at, so the thrower goes on facing it while the
   * move is in the air rather than turning away the moment it fires
   */
  at?: MoveTarget;
}

export function animationFor(
  unit: Unit,
  sprite: SpeciesSpriteAnimation,
  striking?: Striking,
): Performance {
  if (!unit.alive) {
    // A knocked-out pokemon holds the last frame of being hurt rather
    // than looping it, which is the difference between lying there
    // and writhing for ever
    return { animation: SpriteAnim.Hurt, duration: null, loop: false };
  }

  /**
   * The move going off is when the move is **seen**: the swing, the
   * jab, the leaf thrown. It is the clip the move asks for, fitted to
   * the window the engine holds it open for, so the gesture finishes
   * exactly as the hit lands.
   *
   * It is asked before the wind-up below because a unit that has just
   * fired a multi-step move is both throwing this step and winding up
   * the next, and what it is doing right now is throwing
   */
  if (striking != null) {
    const animation = pickCast(getMoveData(striking.move).cast, (name) => sprite.has(name));

    // At the speed it was drawn at, either way. A clip drawn as
    // something repeated goes round for as long as the gesture lasts;
    // one drawn as a single movement plays once and holds. Neither is
    // fitted to the flight: the engine's delay says when the hit
    // lands, not how fast a pokemon moves
    return { animation, duration: null, loop: isLoopingCast(animation) };
  }

  /**
   * Winding up is a pokemon gathering itself, whatever it is about to
   * throw: one clip for every move rather than the move's own.
   *
   * The move's clip is the *throw*, and playing it through the wind-up
   * spent the gesture before the move went off — a Double Slap slapped
   * for a second and three quarters and then hit, and a slow move
   * played its one swing in slow motion. Charge is drawn as a loop, so
   * it fills a window of any length by repeating rather than by
   * dragging
   */
  const working = unit.casting ?? unit.channeling;

  if (working != null) {
    return { animation: SpriteAnim.Charge, duration: null, loop: true };
  }

  // Standing about is where what is being done **to** it shows: asleep,
  // frozen, flinching out of the turn it had. It looks at the sheet in
  // hand rather than at a table of which species owns which clip, the
  // same way a cast does
  const suffering = pickStatusCast(
    (status) => unit.getStatus(status) != null,
    (name) => sprite.has(name),
  );

  if (suffering != null) {
    return { animation: suffering, duration: null, loop: true };
  }
  return { animation: SpriteAnim.Idle, duration: null, loop: true };
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
): void {
  context.fillStyle = COLORS.track;
  context.fillRect(x - width / 2, y, width, height);
  context.fillStyle = color;
  context.fillRect(x - width / 2, y, width * Math.max(0, Math.min(1, share)), height);
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

function drawLabel(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
): void {
  context.fillStyle = color;
  context.textAlign = 'center';
  context.fillText(text, x, y);
}

/**
 * How much bigger than the sheet a pokemon in this slot is drawn
 */
function scaleOf(slot: Slot): number {
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
function bodyOf(slot: Slot): Point {
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
function boxOf(slot: Slot): { left: number; top: number; width: number; height: number } | null {
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
function withinSlot(slot: Slot, x: number, y: number): boolean {
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
function drawSlot(
  context: CanvasRenderingContext2D,
  slot: Slot,
  striking: Map<Unit, Striking>,
  hidden = false,
): void {
  const { unit } = slot;
  const maxHealth = unit.checkStat(Stats.HP, 0);
  const share = maxHealth <= 0 ? 0 : unit.health / maxHealth;

  context.globalAlpha = unit.alive ? 1 : 0.35;

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

      sprite.drawShadow(context, x, y, placement);
      sprite.draw(context, x, y, placement);
    } else {
      context.beginPath();
      context.arc(slot.x + slot.offset[0], slot.y + slot.offset[1], slot.radius, 0, Math.PI * 2);
      context.fillStyle = unit.alive ? slot.color : COLORS.down;
      context.fill();
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

  context.font = '12px sans-serif';

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

  drawBar(context, slot.x, slot.y + 10, share, healthColor(share), bar);
  drawBar(
    context,
    slot.x,
    slot.y + 10 + BAR_HEIGHT,
    wound,
    unit.casting == null ? COLORS.channel : COLORS.cast,
    bar,
    CAST_HEIGHT,
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
    );
  }
  context.globalAlpha = 1;
}

export interface BattleCanvasProps {
  battle: Battle;
  /**
   * Whose side of the field is drawn at the bottom. A spectator has no
   * party of their own, and is shown the fighting side instead
   */
  player: string;
  /**
   * Fired once every sheet the fight needs has landed.
   *
   * The caller is what starts the battle, and it should not start one
   * nobody can see: the first seconds are when a raid boss winds up
   * and a party opens on its buffs, and a fight that begins while the
   * sheets are still coming spends them on an empty field
   */
  onReady?: () => void;
  /**
   * Which pokemon the pointer is over, and where on the screen it is
   * standing, so the caller can put a card over it. Null when the
   * pointer is over the field itself
   */
  onHover?: (unit: Unit | null, at: UnitSpot | null) => void;
  /**
   * A pokemon that was pressed. The field itself does nothing with a
   * press — a real-time battle is fought by the engine — so what
   * opening one means is the caller's
   */
  onPick?: (unit: Unit) => void;
}

/**
 * Where a pokemon is on the **screen**, in client coordinates: the
 * middle of it, and the top and bottom of the room it takes up. It is
 * what a card floating over the field is placed against, so it is
 * measured in the page's own units rather than the field's
 */
export interface UnitSpot {
  x: number;
  top: number;
  bottom: number;
}

export default function BattleCanvas(props: BattleCanvasProps): JSX.Element {
  let canvas: HTMLCanvasElement | undefined;
  /**
   * Who is mid-throw at whom. Not a signal, like everything else the
   * tick moves along
   */
  const lunging: Lunge[] = [];

  /**
   * How long this battle has been running, by its own clock rather
   * than the wall's — what spaces out a cue that keeps firing
   */
  let clock = 0;

  /**
   * The move effects playing right now. Not a signal: nothing renders
   * off it — the tick moves them along and the same tick draws them
   */
  const casting: Casting[] = [];

  /**
   * What each unit has thrown and is waiting to land.
   *
   * The engine holds the wait rather than the unit — a move in the air
   * is a timer inside the move mechanics — so the canvas keeps its own
   * note of it, filled when a move fires and emptied when it lands.
   * Not a signal, like everything else here: the tick that moves it on
   * is the tick that draws it
   */
  const striking = new Map<Unit, Striking>();

  /**
   * Who is not on the field to be seen: a pokemon underground or out
   * of sight above it.
   *
   * A move that goes somewhere the field cannot show says so with its
   * gap — the hole it went through, drawn where it stood — and leaving
   * the body standing in the hole made a nonsense of both that picture
   * and of the move being untouchable. It comes back when the striking
   * step fires, which is the moment it arrives
   */
  const gone = new Set<Unit>();

  /**
   * What the last frame drew, for the pointer to hit-test against. Not
   * a signal, like the rest of the frame's state: it is written by the
   * draw and read by whatever the pointer does next
   */
  let placed: Slot[] = [];

  /**
   * Which way round the field is being looked at. It starts behind the
   * viewer's own team and can be dragged from there — a ring always
   * has a far side, and the fight is worth walking round. Not a
   * signal: the frame that changes it is the frame that redraws
   */
  let yaw = 0;

  /**
   * One animation per unit, keyed by what that unit currently looks
   * like. A unit that changes what it looks like — a Transform, a
   * substitute taking the hits — is drawn as the new thing from the
   * frame it changed, and the sheet it changed away from stays cached
   * for whoever else is wearing it
   */
  const sprites = new Map<Unit, { appearance: Species; sprite: SpeciesSpriteAnimation | null }>();

  /**
   * The load behind each unit's current sheet, so the opening wait can
   * be told when the field is drawable
   */
  const loads = new Map<Unit, Promise<void>>();

  /**
   * Whether the sheets for everybody on the field are still coming.
   *
   * The field is drawn either way — the ground, the slots, the health
   * bars — but nothing is fought over it until the pokemon are on it,
   * and the caller holds the battle back while this is true
   */
  const [loading, setLoading] = createSignal(true);

  const spriteFor = (unit: Unit): SpeciesSpriteAnimation | null => {
    const known = sprites.get(unit);

    if (known != null && known.appearance === unit.appearance) {
      return known.sprite;
    }

    // Held before the sheet arrives, so a unit is asked for once
    // rather than once per frame it is drawn in
    const waiting = { appearance: unit.appearance, sprite: null as SpeciesSpriteAnimation | null };

    sprites.set(unit, waiting);
    loads.set(
      unit,
      // A female pokemon is drawn from its own sheet where the species
      // has one. Its **appearance** is what is asked for and its own
      // gender is what asks: a Transform copies the look, not the sex
      loadSpeciesSprite(unit.appearance, { female: unit.gender === Genders.Female })
        .then((loaded) => {
          // Only if it is still what the unit looks like: a sheet that
          // arrives after a Transform belongs to nobody
          if (sprites.get(unit) === waiting) {
            waiting.sprite = loaded;
          }
        })
        .catch(() => {
          // Drawn as a circle, which is what it was before there were
          // sprites at all
        }),
    );
    return null;
  };

  onMount(() => {
    const element = canvas;
    const context = element?.getContext('2d');

    if (element == null || context == null) {
      return;
    }

    /**
     * Every sheet the fight opens with, asked for at once.
     *
     * `spriteFor` is what caches them, so this is the ordinary path
     * walked early rather than a second way of loading a pokemon.
     * Anything that turns up later — a Transform, a substitute — is
     * loaded the way it always was: mid-fight is no place to stop.
     *
     * `allSettled` rather than `all`: a sheet that will not load
     * leaves that unit drawn as the circle it was before there were
     * sprites, and holding the whole battle back for it would mean a
     * fight nobody can start
     */
    let live = true;

    Promise.allSettled(
      [...props.battle.units()].map(async (unit) => {
        spriteFor(unit);
        return loads.get(unit);
      }),
    )
      .then(() => {
        if (live) {
          setLoading(false);
          props.onReady?.();
        }
      })
      .catch(() => {
        if (live) {
          setLoading(false);
          props.onReady?.();
        }
      });

    onCleanup(() => {
      live = false;
    });

    /**
     * Fit the backing store to the room the element has been given,
     * and lay the ground.
     *
     * The field is drawn in its own coordinates whatever the screen
     * is, and used to be blown up to fit — which meant the picture was
     * letterboxed and the page showed through above and below it. Now
     * the canvas is the size of the page, the drawing is centred
     * inside it at the largest scale that fits, and the ground colour
     * is painted over the whole of it. The fight is the same size it
     * always was; what changed is that there is field around it
     * instead of nothing.
     *
     * The backing store is only reallocated when the element actually
     * changes size: assigning `width` clears the canvas and hands back
     * a fresh buffer, which is not a thing to do sixty times a second
     */
    let sized = { width: 0, height: 0, ratio: 0 };

    const ground = (): void => {
      const ratio = window.devicePixelRatio;
      const width = Math.max(1, element.clientWidth);
      const height = Math.max(1, element.clientHeight);

      if (sized.width !== width || sized.height !== height || sized.ratio !== ratio) {
        element.width = Math.round(width * ratio);
        element.height = Math.round(height * ratio);
        sized = { width, height, ratio };
      }

      const scale = Math.min(width / WIDTH, height / HEIGHT);

      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      // Painted edge to edge before the transform that centres the
      // field, so the margins are field rather than page
      context.fillStyle = COLORS.field;
      context.fillRect(0, 0, width, height);
      context.transform(
        scale,
        0,
        0,
        scale,
        (width - WIDTH * scale) / 2,
        (height - HEIGHT * scale) / 2,
      );
    };

    const draw = (): void => {
      ground();

      // Nothing but the field while the sheets are still coming. The
      // caller holds the battle back until they land, so there is
      // nothing happening to draw — and a row of circles standing in
      // for pokemon reads as a fight that has already gone wrong
      if (loading()) {
        context.fillStyle = COLORS.text;
        context.font = 'bold 18px monospace';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(LOADING_LABEL, WIDTH / 2, HEIGHT / 2);
        return;
      }

      const field = readField(props.battle, props.player);

      // The camera. It starts behind whoever is looking at the fight,
      // which is the one thing about the field a player should never
      // have to work out, and it can be walked round from there
      const view: FieldView = {
        width: WIDTH,
        height: HEIGHT,
        // A ring that has outgrown its room is looked at from further
        // back, so a raid of sixteen fills the same picture a raid of
        // four does
        unit: FIELD_UNIT * lobbyCamera(field.teams.length).zoom,
        yaw,
      };
      const slots = project(ringStandings(field, spriteFor), view, striking);
      const at = new Map(slots.map((slot) => [slot.unit, slot]));

      // Whoever is throwing itself at somebody is drawn part of the
      // way there. It is done to the slot rather than to the standing
      // so everything measured off the slot comes with it: the bars,
      // the name, and the move's own picture, which should go off
      // where the body actually is
      for (const lunge of lunging) {
        const from = at.get(lunge.source);
        const to = at.get(lunge.target);

        if (from == null || to == null) {
          continue;
        }
        // Out and back on a half sine: it leaves fastest at the start
        // and is still for an instant at the far end, which is where
        // the hit lands
        const share = Math.sin(Math.PI * Math.min(1, lunge.elapsed / lunge.window)) * LUNGE_REACH;

        from.offset = [(to.x - from.x) * share, (to.y - from.y) * share];
      }

      // Kept for the pointer: what was drawn where, as of the last
      // frame. Hit-testing a canvas means asking the drawing, and the
      // drawing is this list
      placed = slots;

      for (const slot of slots) {
        drawSlot(context, slot, striking, gone.has(slot.unit));
      }

      // The sky, over the pokemon and under whatever is going off:
      // weather is the field's own state rather than anybody's move,
      // and it belongs behind the thing being watched.
      //
      // Asked of a pokemon rather than of the battle, because outside
      // a fight between players the weather is the **team's**: a raid
      // has one side standing in rain and the other in the dry, and
      // what the viewer should see is the sky over their own side
      const watcher = slots.find((slot) => slot.unit.alive);
      const sky = watcher == null ? props.battle.weather.current : watcher.unit.checkWeather();

      paintWeather(context, sky, { width: WIDTH, height: HEIGHT }, clock);

      // Move effects go on top of everything: they are the loudest
      // thing on the field for as long as they last, and a ring drawn
      // under a pokemon is a ring nobody sees. A caster that has since
      // left the field takes its effect with it
      for (const cast of casting) {
        const from = at.get(cast.source);

        if (from == null) {
          continue;
        }
        cast.visual.draw(context, {
          source: bodyOf(from),
          targets: cast.targets
            .map((target) => at.get(target))
            // Spelled out rather than left to be inferred: the
            // narrowing a bare `!= null` gets is not something to
            // hang a build on
            .filter((slot): slot is Slot => slot != null)
            .map(bodyOf),
          scale: scaleOf(from),
        });
      }
    };

    /** Put a picture on the field. */
    const paint = (visual: FieldVisual, source: Unit, targets: Unit[]): void => {
      casting.push({ source, targets, visual });
    };

    // A move announces itself when it fires, and its picture is built
    // and started here — the one moment the canvas hears about a move
    // as a whole rather than about what it did
    const firing = props.battle.on(BattleEvents.UnitTriggerMove, EventPriority.Post, (event) => {
      // What the caster aimed at, and nothing more.
      //
      // A move that goes out to everybody could be asked who it is
      // about to reach, and drawing one thing crossing to each of them
      // was worse rather than better: a spread move in a raid is forty
      // gaps at once, and forty things in the air is a screen nobody
      // can read. One flight, at what it was pointed at
      let crossing: Unit[] = [];

      if (event.target.type === MoveTargetType.Unit) {
        crossing = [event.target.unit];
      } else if (event.target.type === MoveTargetType.Team) {
        crossing = [...event.target.team.units];
      }
      crossing = crossing.filter((target) => target !== event.source);

      // The window the engine is actually holding the move open for,
      // asked of it rather than read off the data — a listener may
      // have nudged it, and both the throw and its picture belong to
      // the move that is happening rather than to the one registered
      const window = event.source.checkMoveDelay(event.move, event.target);

      // What the thrower is doing: the move's own clip, played at its
      // own speed for the flight and the rest that follows it. The
      // rest is the AI's, and it is what gives a gesture room — a
      // 250ms flight is not long enough to see a throw in.
      //
      // Never shorter than the clip itself, whatever the engine's
      // timings add up to. A gesture cut off partway is a pokemon
      // snapping back to standing mid-swing: the last frame of a
      // Strike is 83ms, and the window it was being held for ran out
      // 42ms before it
      const sprite = spriteFor(event.source);
      const gesture =
        sprite == null
          ? 0
          : sprite.lengthOf(pickCast(getMoveData(event.move).cast, (name) => sprite.has(name)));

      striking.set(event.source, {
        move: event.move,
        window: Math.max(window + AI_REST_PERIOD, gesture),
        elapsed: 0,
        at: event.target,
      });

      // A contact move has nothing in the air to draw, because the
      // thing crossing the gap is the pokemon itself
      if ((getMoveData(event.move).flags & MoveFlags.Contact) !== 0 && crossing.length > 0) {
        const already = lunging.findIndex((lunge) => lunge.source === event.source);

        if (already >= 0) {
          lunging.splice(already, 1);
        }
        lunging.push({
          source: event.source,
          target: crossing[0],
          elapsed: 0,
          // A move held in the air is one the pokemon is still
          // crossing, so the throw lasts as long as the crossing does
          window: Math.max(LUNGE_SPAN, window),
        });
      }

      // What fills the gap, for exactly as long as the engine holds
      // it. A contact move fills it with the pokemon and draws nothing
      const shape = delayShapeFor(event.move, event.steps);

      // A step that takes the caster off the field takes its sprite
      // with it, and any other step puts it back: the strike of a Dig
      // is the pokemon coming up through the floor
      if (shape === 'Vanish') {
        gone.add(event.source);
      } else {
        gone.delete(event.source);
      }

      const gap = moveDelayVisual(event.move, event.steps, window);

      if (gap != null) {
        paint(gap, event.source, crossing);
      }
    });

    // The move resolving, which the engine says once per pokemon it
    // actually landed on. A miss never arrives here, and a spread move
    // arrives once for each one it caught — so the landing is drawn
    // where it happened rather than where it was aimed
    const landed = props.battle.on(
      BattleEvents.UnitTriggerMoveEffect,
      EventPriority.Post,
      (event) => {
        const struck: Unit[] = [];

        if (event.target.type === MoveTargetType.Unit) {
          struck.push(event.target.unit);
        } else if (event.target.type === MoveTargetType.Team) {
          struck.push(...event.target.team.units);
        }

        // Nothing on a step that was only the wind-up: what happened
        // is that the caster went underground, which the gap drew
        const landing = moveEffectVisual(event.move, event.steps);

        if (landing != null) {
          paint(landing, event.source, struck);
        }
      },
    );

    // It went past. Drawn, because a move that misses and shows
    // nothing reads as a move that never happened — and the one-hit
    // knockouts miss far more often than they land
    const missing = props.battle.on(
      BattleEvents.UnitTriggerMoveMissed,
      EventPriority.Post,
      (event) => {
        const { parent } = event;
        const struck: Unit[] = [];

        if (parent.target.type === MoveTargetType.Unit) {
          struck.push(parent.target.unit);
        } else if (parent.target.type === MoveTargetType.Team) {
          struck.push(...parent.target.team.units);
        }
        paint(moveMissVisual(parent.move), parent.source, struck);
      },
    );

    // A status landing, and each time it bites afterwards. Both are
    // about one pokemon and nobody else, so the cue is drawn on it —
    // the stage's source with nothing aimed at
    const ailing = props.battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
      const cue = statusCueFor(event.status);

      if (cue != null) {
        paint(cue, event.source, []);
      }
    });

    /**
     * When each status last drew its own cue, on the battle's clock.
     *
     * A status that refuses a cast is asked every time the pokemon
     * tries — which for a sleeping unit under an AI is many times a
     * second — so the refusal is held back to one every `CUE_GAP`,
     * like an ability's. The residuals bite far slower than that and
     * are never touched by it
     */
    const bitten = new WeakMap<Unit, Map<Statuses, number>>();

    const biting = props.battle.on(BattleEvents.UnitTriggerStatus, EventPriority.Post, (event) => {
      const cue = statusTriggerFor(event.status);

      if (cue == null) {
        return;
      }
      let held = bitten.get(event.source);

      if (held == null) {
        held = new Map();
        bitten.set(event.source, held);
      }
      if (clock - (held.get(event.status) ?? -CUE_GAP) < CUE_GAP) {
        return;
      }
      held.set(event.status, clock);
      paint(cue, event.source, []);
    });

    /**
     * When each ability last drew a cue, on the battle's own clock.
     *
     * Some of them fire constantly — a raid boss refuses something
     * dozens of times a minute — and a cue per refusal is a strobe
     * rather than an answer. Held back to one every `CUE_GAP`, per
     * pokemon and per ability, so the first of a run still shows
     */
    const cued = new WeakMap<Unit, Map<Abilities, number>>();

    /**
     * What each blow is resolving as, while it resolves.
     *
     * The engine works a blow out in pieces — the type multipliers one
     * defending type at a time, then whether it crits — and each piece
     * is its own event carrying the attack it belongs to. They are
     * collected here against that attack and read when it lands, which
     * is the only moment all of it is known
     */
    const resolving = new WeakMap<object, { effectiveness: number; critical: boolean }>();

    const resolved = (parent: object): { effectiveness: number; critical: boolean } => {
      let found = resolving.get(parent);

      if (found == null) {
        found = { effectiveness: 1, critical: false };
        resolving.set(parent, found);
      }
      return found;
    };

    const typing = props.battle.on(
      BattleEvents.UnitAttackResolveEffectiveness,
      EventPriority.Post,
      (event) => {
        resolved(event.parent).effectiveness *= event.multiplier;
      },
    );

    const critting = props.battle.on(
      BattleEvents.UnitAttackResolveCriticalHit,
      EventPriority.Post,
      (event) => {
        resolved(event.parent).critical = event.critical;
      },
    );

    // One blow landing. A move's own picture says what the move is;
    // this says what it did to this pokemon, which is a different
    // answer every time it lands — five times over for a barrage,
    // dull for a resistance, loud for a critical
    const blowing = props.battle.on(BattleEvents.UnitAttack, AttackPriority.Cleanup, (event) => {
      const known = resolved(event);
      const maxHealth = event.target.checkStat(Stats.HP, 0);

      paint(
        attackMarkVisual({
          move: event.move,
          type: event.type,
          share: maxHealth <= 0 ? 0 : event.value / maxHealth,
          effectiveness: known.effectiveness,
          critical: known.critical,
          struck: event.success,
        }),
        event.source,
        [event.target],
      );
    });

    // A held item going off: a berry eaten, a band that took the blow,
    // a claw that got there first. Not throttled the way an ability
    // is — most of them are spent as they fire, so a second one is a
    // second item rather than the same one shouting
    const spending = props.battle.on(BattleEvents.UnitTriggerItem, EventPriority.Post, (event) => {
      paint(itemCueFor(event.item), event.source, []);
    });

    // An ability going off. It is the quietest thing in a fight —
    // no cast, no flight, just a number that came out different — so
    // every trigger draws something, however small
    const triggering = props.battle.on(
      BattleEvents.UnitTriggerAbility,
      EventPriority.Post,
      (event) => {
        let held = cued.get(event.source);

        if (held == null) {
          held = new Map();
          cued.set(event.source, held);
        }
        if (clock - (held.get(event.ability) ?? -CUE_GAP) < CUE_GAP) {
          return;
        }
        held.set(event.ability, clock);
        paint(abilityCueFor(event.ability), event.source, []);
      },
    );

    // Landed. The gesture is **not** over: the hit lands when the
    // engine says, and the throw goes on being drawn for the rest of
    // its window — which is what stops a quarter-second flight cutting
    // a second of animation off at the knees
    const landing = props.battle.on(
      BattleEvents.UnitTriggerMoveEnd,
      EventPriority.Post,
      (event) => {
        const thrown = striking.get(event.source);

        if (thrown != null && event.source.casting == null) {
          // Nothing else to show it: the unit is between moves, so the
          // window is left to run down on the tick
          thrown.at = undefined;
        }
      },
    );

    // The picture is redrawn on the battle's own frame, so it can only
    // ever show a state the battle was actually in
    /**
     * The sprites run on the battle's clock, like everything else
     * here: the tick says how much time passed, and every animation
     * on the field is moved on by exactly that much. A fight that is
     * paused is a field of pokemon holding still
     */
    // A move that never lands leaves nothing hanging: an interrupted
    // thrower stops throwing, and one that faints has finished with
    // whatever it was doing
    const stopping = props.battle.on(BattleEvents.UnitInterrupt, EventPriority.Post, (event) => {
      striking.delete(event.source);
      // Whatever took it off the field was interrupted, so it is back
      gone.delete(event.source);
    });

    const fainting = props.battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
      striking.delete(event.source);
      gone.delete(event.source);
    });

    const ticking = props.battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
      clock += event.duration;
      // A gesture runs out on its own clock rather than when the hit
      // lands, so a pokemon is seen finishing what it threw
      for (const [unit, thrown] of striking) {
        thrown.elapsed = (thrown.elapsed ?? 0) + event.duration;
        if (thrown.elapsed < thrown.window) {
          continue;
        }
        // The window says when the engine is done with the move; the
        // drawing says when the pokemon is. A one-shot still running
        // is a swing part-way through, and dropping it there is what
        // made the last frame of a Strike flash by
        const sprite = spriteFor(unit);
        const playing = sprite?.playing;

        if (sprite != null && playing != null && !isLoopingCast(playing) && !sprite.finished) {
          continue;
        }
        striking.delete(unit);
      }
      // Back on the field once there is nothing left to be away for.
      // The striking step normally brings it up, but a move that
      // vanishes on its **last** step — a Teleport — has no such step,
      // and a caster with no cast and nothing in the air is a caster
      // standing there
      for (const unit of gone) {
        if (unit.casting == null && unit.channeling == null && !striking.has(unit)) {
          gone.delete(unit);
        }
      }
      for (let index = lunging.length - 1; index >= 0; index--) {
        lunging[index].elapsed += event.duration;
        if (lunging[index].elapsed >= lunging[index].window) {
          lunging.splice(index, 1);
        }
      }
      for (const held of sprites.values()) {
        held.sprite?.update(event.duration);
      }
      // Move effects run on the same clock as everything else, and one
      // that has run its course is dropped after the frame that shows
      // its last moment
      for (let index = casting.length - 1; index >= 0; index--) {
        casting[index].visual.advance(event.duration);
      }
      draw();
      for (let index = casting.length - 1; index >= 0; index--) {
        if (casting[index].visual.finished) {
          casting.splice(index, 1);
        }
      }
    });

    // Dragging the field round, for whoever is only watching it. A
    // pointer that started on the canvas keeps turning it wherever it
    // goes, so a drag that runs off the edge does not stick
    let turning: number | null = null;

    /**
     * Which pokemon the pointer is over, from where they were last
     * drawn. The last match wins: `placed` is painted back to front,
     * so on a crowded field that is the one in front — the one it
     * looks like the pointer is over
     */
    const under = (event: PointerEvent | MouseEvent): Slot | null => {
      const bounds = element.getBoundingClientRect();

      if (bounds.width <= 0 || bounds.height <= 0) {
        return null;
      }

      const x = ((event.clientX - bounds.left) / bounds.width) * WIDTH;
      const y = ((event.clientY - bounds.top) / bounds.height) * HEIGHT;
      let found: Slot | null = null;

      for (const slot of placed) {
        if (slot.visible && withinSlot(slot, x, y)) {
          found = slot;
        }
      }
      return found;
    };

    /**
     * The same slot in the page's own coordinates, for a card placed
     * over it. The box is the drawn sprite's where there is one, so a
     * card clears the top of a tall pokemon rather than cutting across
     * it
     */
    const spotOf = (slot: Slot): UnitSpot => {
      const bounds = element.getBoundingClientRect();
      const scaleX = bounds.width / WIDTH;
      const scaleY = bounds.height / HEIGHT;
      const box = boxOf(slot);

      return {
        x: bounds.left + (box == null ? slot.x : box.left + box.width / 2) * scaleX,
        top: bounds.top + (box == null ? slot.y - slot.radius * 2 : box.top) * scaleY,
        // Under the feet, where the bars are: a card dropped below a
        // pokemon should clear what it is standing on
        bottom: bounds.top + (slot.y + 16) * scaleY,
      };
    };

    let hovered: Unit | null = null;

    const report = (slot: Slot | null): void => {
      const unit = slot?.unit ?? null;

      // Reported on every move rather than only on a change: the
      // pokemon walks about under a still pointer, and a card left at
      // the coordinates it opened at drifts off its own sprite
      hovered = unit;
      element.style.cursor = unit == null ? 'default' : 'pointer';
      props.onHover?.(unit, slot == null ? null : spotOf(slot));
    };

    const grab = (event: PointerEvent): void => {
      // The left button and nothing else. A right-drag belongs to the
      // browser — on a Mac it is also what a ctrl-click is — and a
      // canvas that swallowed it would take the context menu with it
      if (!event.isPrimary || event.button !== 0) {
        return;
      }
      event.preventDefault();
      turning = event.clientX;
      element.setPointerCapture(event.pointerId);
    };

    const turn = (event: PointerEvent): void => {
      if (turning == null) {
        report(under(event));
        return;
      }
      // Nothing is hovered while the field is being turned: the pointer
      // is dragging the camera rather than pointing at anything on it
      if (hovered != null) {
        report(null);
      }
      // A drag across the whole width is one turn all the way round,
      // which is slow enough to aim and quick enough to get behind
      // something without letting go
      yaw += ((event.clientX - turning) / Math.max(1, element.clientWidth)) * Math.PI * 2;
      turning = event.clientX;
      draw();
    };

    const release = (event: PointerEvent): void => {
      turning = null;
      if (element.hasPointerCapture(event.pointerId)) {
        element.releasePointerCapture(event.pointerId);
      }
    };

    // The canvas has nothing a context menu is any use for, and on a
    // Mac the menu is what a ctrl-click raises — so it comes up in the
    // middle of a drag, over the field, whether or not the drag was
    // ever going to turn anything. Refusing it here is the only way to
    // keep it off: ignoring the button in `grab` stops the field
    // turning, it does not stop the browser
    const menu = (event: MouseEvent): void => {
      event.preventDefault();
    };

    const leave = (): void => {
      report(null);
    };

    const press = (event: MouseEvent): void => {
      const slot = under(event);

      if (slot != null) {
        props.onPick?.(slot.unit);
      }
    };

    element.addEventListener('contextmenu', menu);
    element.addEventListener('pointerleave', leave);
    element.addEventListener('click', press);
    element.addEventListener('pointerdown', grab);
    element.addEventListener('pointermove', turn);
    element.addEventListener('pointerup', release);
    element.addEventListener('pointercancel', release);

    // Something to look at before the first tick lands
    draw();

    onCleanup(() => {
      element.removeEventListener('contextmenu', menu);
      element.removeEventListener('pointerleave', leave);
      element.removeEventListener('click', press);
      element.removeEventListener('pointerdown', grab);
      element.removeEventListener('pointermove', turn);
      element.removeEventListener('pointerup', release);
      element.removeEventListener('pointercancel', release);
      firing.stop();
      landed.stop();
      missing.stop();
      ailing.stop();
      biting.stop();
      triggering.stop();
      spending.stop();
      typing.stop();
      critting.stop();
      blowing.stop();
      landing.stop();
      stopping.stop();
      fainting.stop();
      ticking.stop();
    });
  });

  return (
    // Sized to the room it is given rather than to its own drawing
    // coordinates. The field is the screen the way the chunk is: a
    // battle is the only thing happening while it is happening, and a
    // picture of it letterboxed in the middle of a page of nothing
    // wastes most of the screen it is the point of
    <canvas
      ref={canvas}
      // The field is the page: it takes every pixel it is given, and
      // the fight is drawn in the middle of it
      class="block h-full w-full"
      // A drag turns the field rather than scrolling the page behind
      // it, which a touch would otherwise do before the handler ever
      // saw it
      style={{ 'touch-action': 'none' }}
    />
  );
}
