import { type JSX, createSignal, onCleanup, onMount } from 'solid-js';
import type Battle from '../../battle/core';
import type SpeciesSpriteAnimation from '../../canvas/species-sprite-animation';
import type { Point, SpriteDirection } from '../../canvas/sprite-sheet';
import type MoveVisual from '../../canvas/battle/moves/__visual';
import moveVisualFor from '../../canvas/battle/moves';
import projectField, {
  type FieldPoint,
  type FieldView,
  ringOf,
  ringRadius,
} from '../../canvas/battle/field';
import facingToward from '../../canvas/facing';
import loadSpeciesSprite from '../../canvas/species-sprites';
import { BattleEvents, MoveTargetType } from '../../battle/events';
import type Unit from '../../battle/unit';
import { EventPriority } from '../../core/event-emitter';
import { isLoopingCast, pickCast } from '../../data/constants/cast';
import pickStatusCast from '../../data/constants/status-cast';
import { Stats } from '../../data/constants/stats';
import type { Moves } from '../../data/ids/moves';
import type { Species } from '../../data/ids/species';
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
  projectile: '#f0d264',
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
   * Whether the pokemon writes its name under itself.
   *
   * The player's own side does not: every one of them has a card
   * along the bottom of the screen carrying its name, its level and a
   * great deal more, and the same six names painted on the field as
   * well is the field saying what the cards already said
   */
  quiet?: boolean;
  /**
   * Which way it is facing: everybody looks at whatever they are up
   * against, which is worked out after the camera has turned rather
   * than fixed to a side of the screen
   */
  facing: SpriteDirection;
  /**
   * How near the camera it is, as the perspective factor at its feet.
   * Larger is nearer, and it is what the field is painted in order of
   */
  depth: number;
  /** Whether it is in front of the camera at all. */
  visible: boolean;
}

/**
 * A move on its way from whoever cast it to whatever it was aimed at.
 *
 * None of the flight is invented here. A move with a `delay` is one
 * the engine holds in the air before it lands, and it ticks that delay
 * down itself (`UnitTriggerMoveUpdate`); `share` is that progress and
 * nothing else, so the dot is wherever the battle says the move is. A
 * move with no delay — a touch, a status, anything that happens where
 * it stands — never starts a flight at all
 */
interface Flight {
  source: Unit;
  move: Moves;
  targets: Unit[];
  /**
   * How far along the engine says it is, from 0 to 1
   */
  share: number;
  /**
   * Ticks since the engine last said anything about it. A move that is
   * interrupted stops being ticked without ever landing, so a flight
   * nobody has mentioned for a few frames is dropped rather than left
   * hanging in the air
   */
  idle: number;
}

const STALE_TICKS = 8;

/**
 * A move going off, for the few moves that have a picture of their
 * own.
 *
 * It is not a flight and does not replace one: a flight is where the
 * engine says the move *is*, and this is what the move looks like
 * while it happens. A move with both draws both — the dot arrives, the
 * effect goes off around it
 */
interface Casting {
  source: Unit;
  targets: Unit[];
  visual: MoveVisual;
}

/**
 * The field as it is to be drawn.
 *
 * A raid is watched from behind one's own party: the other players'
 * teams are left out entirely — a ten-player raid would otherwise be
 * sixty pokemon, most of them nobody's business — and the boss stands
 * alone at the top. A battle with no boss is drawn as two sides, the
 * viewer's below and everyone else's above.
 *
 * A **spectator** of a raid has no party to stand behind, and no
 * reason to leave anybody out: they are shown the whole lobby, drawn
 * as what it is rather than as a line — see `ringLayout`
 */
interface Field {
  /**
   * Set only when the viewer is watching a raid they are not in: the
   * boss, and every party facing it, kept apart so each can be drawn
   * as a party rather than as thirty units in a row
   */
  lobby: { boss: Unit[]; teams: Unit[][] } | null;
  mine: Unit[];
  theirs: Unit[];
}

function readField(battle: Battle, player: string): Field {
  const boss: Unit[] = [];
  const owned: Unit[] = [];
  const others: Unit[] = [];
  const teams: Unit[][] = [];
  let staged = false;

  for (const alliance of battle.alliances) {
    for (const team of alliance.teams) {
      const fielded: Unit[] = [];

      for (const unit of team.units) {
        if (alliance.boss) {
          staged = true;
          boss.push(unit);
        } else if (team.player === player && player !== '') {
          owned.push(unit);
        } else {
          others.push(unit);
          fielded.push(unit);
        }
      }
      if (fielded.length > 0) {
        teams.push(fielded);
      }
    }
  }

  if (staged) {
    // Somebody watching a raid they are not in owns nothing on the
    // field, which is exactly when the whole lobby is worth drawing
    if (owned.length === 0) {
      return { lobby: { boss, teams }, mine: others, theirs: boss };
    }
    return { lobby: null, mine: owned, theirs: boss };
  }
  return owned.length > 0
    ? { lobby: null, mine: owned, theirs: others }
    : { lobby: null, mine: others, theirs: [] };
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
  /** What it turns to look at, in field units. */
  look: FieldPoint;
  /** Its size on screen at the middle of the field. */
  radius: number;
  color: string;
  sprite: SpeciesSpriteAnimation | null;
  quiet?: boolean;
}

/**
 * How far from the middle of the field each side stands, and how wide
 * a ring its members make.
 *
 * A side is a **ring** rather than a row: a row of six is a row from
 * every angle, and the point of a field with depth is that a group
 * looks like a group. The two numbers together are what keep the sides
 * clear of one another with six on each
 */
const SIDE_X = 26;
const PARTY_RADIUS = 5.5;

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
 * A side of a fight: a ring of pokemon around a point, all looking at
 * whatever they are up against
 */
function side(
  units: Unit[],
  centre: FieldPoint,
  radius: number,
  look: FieldPoint,
  slotRadius: number,
  color: string,
  spriteFor: (unit: Unit) => SpeciesSpriteAnimation | null,
  quiet = false,
): Standing[] {
  return ringOf(units.length, centre, radius).map((place, at) => ({
    unit: units[at],
    place,
    look,
    radius: slotRadius,
    color,
    sprite: spriteFor(units[at]),
    quiet,
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
function lobbyStandings(
  lobby: { boss: Unit[]; teams: Unit[][] },
  spriteFor: (unit: Unit) => SpeciesSpriteAnimation | null,
): Standing[] {
  const middle: FieldPoint = { x: 0, z: 0 };
  const standings: Standing[] = [];
  // A busy lobby stands further out rather than closer together, and
  // is drawn smaller for it: the camera has stepped back with the ring
  const { radius, zoom } = lobbyCamera(lobby.teams.length);

  // Normally one. Two would be a raid nothing stages yet, so they
  // stand side by side rather than on top of one another
  lobby.boss.forEach((unit, at) => {
    standings.push({
      unit,
      place: { x: (at - (lobby.boss.length - 1) / 2) * 4, z: 0 },
      // The one thing on the field with nothing to look at: it is
      // being looked at, so it faces the viewer
      look: { x: 0, z: -radius },
      radius: BOSS_RADIUS * zoom,
      color: COLORS.boss,
      sprite: spriteFor(unit),
    });
  });

  lobby.teams.forEach((units, at) => {
    const around = (at / lobby.teams.length) * Math.PI * 2 + Math.PI / 2;
    const centre: FieldPoint = {
      x: Math.cos(around) * radius,
      z: Math.sin(around) * radius,
    };

    standings.push(
      ...side(units, centre, TEAM_RADIUS, middle, PARTY_SLOT * zoom, COLORS.mine, spriteFor),
    );
  });
  return standings;
}

/**
 * The two sides of an ordinary fight, and of a raid seen by somebody
 * in it.
 *
 * The viewer's own team is on the **left** and whatever it is facing
 * is on the right, which is the one thing about the field a player in
 * it should never have to work out
 */
function sidesOf(
  field: Field,
  bossSide: boolean,
  spriteFor: (unit: Unit) => SpeciesSpriteAnimation | null,
): Standing[] {
  const mine: FieldPoint = { x: -SIDE_X, z: 0 };
  const theirs: FieldPoint = { x: SIDE_X, z: 0 };

  return [
    ...side(
      field.theirs,
      theirs,
      PARTY_RADIUS,
      mine,
      bossSide ? BOSS_RADIUS : PARTY_SLOT,
      bossSide ? COLORS.boss : COLORS.theirs,
      spriteFor,
    ),
    // The near side keeps its names to itself: they are on the cards
    // under the field
    ...side(field.mine, mine, PARTY_RADIUS, theirs, PARTY_SLOT, COLORS.mine, spriteFor, true),
  ];
}

/**
 * The camera applied: field units become pixels, and the field's own
 * depth becomes the order things are drawn in.
 *
 * **Far first.** On a plane with depth, a pokemon nearer the camera
 * stands in front of one further off, and the only thing that makes
 * that true on a canvas is the order the two were painted in
 */
function project(standings: Standing[], view: FieldView): Slot[] {
  return standings
    .map((standing) => {
      const on = projectField(standing.place, view);
      const at = projectField(standing.look, view);

      return {
        unit: standing.unit,
        x: on.x,
        y: on.y,
        radius: Math.max(MIN_RADIUS, standing.radius * on.scale),
        color: standing.color,
        sprite: standing.sprite,
        quiet: standing.quiet,
        facing: facingToward(on.x, on.y, at.x, at.y),
        depth: on.scale,
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
 * A pokemon knocked out is down and one standing about is idle. One
 * **working a move** — winding it up, or part-way through a
 * multi-step one — does what that move looks like: the move's own
 * `cast` list, walked until the sprite in hand has one of them, so a
 * Fire Punch throws a punch on a sheet that has one and swings on one
 * that does not.
 *
 * What makes that read rather than flicker is the second half: the
 * clip is **stretched over the window** instead of looping inside it.
 * A cast is `(104 − 16 × priority)` frames, and a drawn clip is
 * whatever length it was drawn at, so looping would run a short clip
 * two and a half times and leave it part-way through when the move
 * fires. Stretched, the wind-up begins as the cast begins and finishes
 * exactly as the move goes off — and a slower move is visibly a slower
 * wind-up, which is priority made legible without a number on screen.
 *
 * **Channelling is the same thing again.** It is the rest of a
 * multi-step move, and it carries the same shape a cast does — the
 * move, and how long this step has to run — so it is drawn the same
 * way: one pass of the move's own clip per step. A Fury Swipes is
 * five swipes rather than one swipe and four seconds of standing
 * there, and the two halves of a move look like one move
 *
 * The sprite is asked directly rather than a table being kept of which
 * species owns which clip: the sheet is the truth, and a second copy
 * of it would rot
 */
export interface Performance {
  animation: string;
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
  window: number;
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
    return { animation: 'Hurt', duration: null, loop: false };
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

    // A clip drawn as something repeated keeps its own speed and
    // repeats for the window instead: stretched, it plays once in slow
    // motion — see `isLoopingCast`
    if (isLoopingCast(animation)) {
      return { animation, duration: null, loop: true };
    }
    return { animation, duration: striking.window, loop: false };
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
    return { animation: 'Charge', duration: null, loop: true };
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
  return { animation: 'Idle', duration: null, loop: true };
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
): void {
  context.fillStyle = COLORS.track;
  context.fillRect(x - width / 2, y, width, BAR_HEIGHT);
  context.fillStyle = color;
  context.fillRect(x - width / 2, y, width * Math.max(0, Math.min(1, share)), BAR_HEIGHT);
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
  const placed =
    sprite?.ready === true
      ? sprite.locate('center', slot.x, slot.y, { scale: scaleOf(slot), anchor: 'shadow' })
      : null;

  return placed ?? [slot.x, slot.y];
}

/**
 * One unit: the circle, what it is, what it has left, and what it is
 * in the middle of doing
 */
function drawSlot(
  context: CanvasRenderingContext2D,
  slot: Slot,
  striking: Map<Unit, Striking>,
): void {
  const { unit } = slot;
  const maxHealth = unit.checkStat(Stats.HP, 0);
  const share = maxHealth <= 0 ? 0 : unit.health / maxHealth;

  context.globalAlpha = unit.alive ? 1 : 0.35;

  const sprite = slot.sprite;

  if (sprite?.ready === true) {
    const wanted = animationFor(unit, sprite, striking.get(unit));
    const playable = sprite.has(wanted.animation) ? wanted.animation : 'Idle';

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
    // name, and whatever is flying at it.
    //
    // Placed by its **shadow**, which on a ground plane is the only
    // honest answer: the slot is a spot on the floor, and what sits on
    // a spot on the floor is the pokemon's feet. Centring the body
    // there instead buries half of a tall pokemon under the ground and
    // leaves a short one hovering
    const placement = { scale: scaleOf(slot), anchor: 'shadow' } as const;

    sprite.drawShadow(context, slot.x, slot.y, placement);
    sprite.draw(context, slot.x, slot.y, placement);
  } else {
    context.beginPath();
    context.arc(slot.x, slot.y, slot.radius, 0, Math.PI * 2);
    context.fillStyle = unit.alive ? slot.color : COLORS.down;
    context.fill();
  }

  // A bar no wider than the pokemon has room for. A crowded field —
  // a lobby, or a row with more on it than fits — is one where every
  // bar at full width would be read as somebody else's
  const bar = Math.min(BAR_WIDTH, slot.radius * 3);
  // Whether there is room to write anything at all on this slot. A
  // crowded far side is one where forty-eight overlapping words say
  // less than none
  const roomy = slot.radius >= NAMED_RADIUS && slot.quiet !== true;

  context.font = '12px sans-serif';

  // No name and no level. The field says who is still up and what is
  // landing on them; **which** pokemon each one is belongs to the
  // readout underneath, where there is room to say it once and say it
  // properly. Painted on the field it is forty-eight words competing
  // with the fight they are captioning — and the fight is the thing
  // worth watching
  //
  // Under the feet rather than under the box: the pokemon stands on
  // its slot, so what it is labelled with hangs off the ground it is
  // standing on
  drawBar(context, slot.x, slot.y + 10, share, healthColor(share), bar);

  // What it is in the middle of, named above its head: a cast the
  // other side can still interrupt, or a channel already landing
  const busy = unit.casting ?? unit.channeling;

  if (busy != null && unit.alive) {
    if (roomy) {
      drawLabel(
        context,
        getMoveData(busy.move).name,
        slot.x,
        slot.y - slot.radius * 2 - 12,
        COLORS.text,
      );
    }
    drawBar(
      context,
      slot.x,
      slot.y - slot.radius * 2 - 8,
      busy.time.duration <= 0 ? 1 : busy.time.progress / busy.time.duration,
      unit.casting == null ? COLORS.channel : COLORS.cast,
      bar,
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
}

export default function BattleCanvas(props: BattleCanvasProps): JSX.Element {
  let canvas: HTMLCanvasElement | undefined;
  /**
   * Not a signal: nothing renders off it. The engine moves these along
   * and the next tick draws them where it left them
   */
  const flying: Flight[] = [];

  /**
   * The move effects playing right now. Also not a signal, and for the
   * same reason: the tick moves them along and the same tick draws
   * them
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
   * Which way round the field is being looked at.
   *
   * Not a signal, and not a thing anybody in the fight can change: a
   * player is shown their own side on the left and left there, because
   * a camera that could be spun is one more thing to manage while
   * something is trying to knock your pokemon over. A **spectator** has
   * nothing to manage and a lobby worth walking round, so they get the
   * handle
   */
  let yaw = 0;

  /** Whether the viewer is watching rather than fighting. */
  const spectating = (): boolean => readField(props.battle, props.player).lobby != null;

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
      loadSpeciesSprite(unit.appearance)
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

  /**
   * The flight a move update or a landing is talking about. A move is
   * held in the air by its caster and its name, and one unit is not
   * casting the same move twice at once, so the two of them name it
   */
  const flightOf = (source: Unit, move: Moves): Flight | undefined =>
    flying.find((flight) => flight.source === source && flight.move === move);

  const drop = (flight: Flight | undefined): void => {
    const at = flight == null ? -1 : flying.indexOf(flight);

    if (at >= 0) {
      flying.splice(at, 1);
    }
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
      const bossSide = [...props.battle.alliances].some((alliance) => alliance.boss);

      // The camera. A spectator may walk round the fight; anybody in
      // it is shown their own side on the left, which is the one thing
      // about the field a player should never have to work out
      const view: FieldView = {
        width: WIDTH,
        height: HEIGHT,
        // A lobby that has outgrown its ring is looked at from further
        // back, so a raid of sixteen fills the same picture a raid of
        // four does
        unit: FIELD_UNIT * (field.lobby == null ? 1 : lobbyCamera(field.lobby.teams.length).zoom),
        yaw: field.lobby == null ? 0 : yaw,
      };
      // Watching a raid from outside it: the whole lobby, drawn around
      // the thing it came for. Anything else is two sides facing off
      const slots = project(
        field.lobby == null
          ? sidesOf(field, bossSide, spriteFor)
          : lobbyStandings(field.lobby, spriteFor),
        view,
      );
      const at = new Map(slots.map((slot) => [slot.unit, slot]));

      for (const slot of slots) {
        drawSlot(context, slot, striking);
      }

      // Walked backwards so a flight nobody is ticking any more can be
      // dropped as it is passed. It is drawn before it is dropped, so
      // the one that just landed is seen arriving rather than
      // disappearing a frame short of the target
      for (let index = flying.length - 1; index >= 0; index--) {
        const flight = flying[index];
        const from = at.get(flight.source);

        flight.idle += 1;

        for (const target of flight.targets) {
          const to = at.get(target);

          if (from == null || to == null) {
            continue;
          }
          const [fromX, fromY] = bodyOf(from);
          const [toX, toY] = bodyOf(to);

          context.beginPath();
          context.arc(
            fromX + (toX - fromX) * flight.share,
            fromY + (toY - fromY) * flight.share,
            5,
            0,
            Math.PI * 2,
          );
          context.fillStyle = COLORS.projectile;
          context.fill();
        }

        if (from == null || flight.idle > STALE_TICKS) {
          flying.splice(index, 1);
        }
      }

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
            .filter((slot) => slot != null)
            .map(bodyOf),
          scale: scaleOf(from),
        });
      }
    };

    // A move announces itself when it fires. Whether it spends any time
    // in the air is the engine's to say — a delay of nothing resolves
    // in the same frame, and there is no flight to draw
    const firing = props.battle.on(BattleEvents.UnitTriggerMove, EventPriority.Post, (event) => {
      // A move aimed at a team is drawn as one dot per unit on it:
      // what a spread move looks like is several things arriving at
      // once. One aimed at the caster has nowhere to travel
      let targets: Unit[] = [];

      if (event.target.type === MoveTargetType.Unit) {
        targets = [event.target.unit];
      } else if (event.target.type === MoveTargetType.Team) {
        targets = [...event.target.team.units];
      }
      targets = targets.filter((target) => target !== event.source);

      // The window the engine is actually holding the move open for,
      // asked of it rather than read off the data — a listener may
      // have nudged it, and both the throw and its picture belong to
      // the move that is happening rather than to the one registered
      const window = event.source.checkMoveDelay(event.move, event.target);

      // What the thrower is doing until it lands: the move's own clip,
      // which is the gesture the move *is*
      striking.set(event.source, { move: event.move, window });

      const build = moveVisualFor(event.move);

      // A move with a picture of its own plays it whether or not it
      // spends any time in the air: what a status move looks like is
      // the whole of what there is to see of it
      if (build != null) {
        const source = event.source;

        build()
          .then((visual) => {
            // At the speed it was drawn at. An effect fitted to the
            // flight is an effect in slow motion, and the pace of a
            // spark or a shockwave is most of what it looks like
            casting.push({ source, targets, visual });
          })
          .catch(() => {
            // A sheet that would not load leaves the move looking the
            // way it looked before any of this: nothing to see
          });
      }

      // Whether it spends any time in the air is the engine's to say —
      // a delay of nothing resolves in the same frame, and there is no
      // flight to draw
      if ((getMoveData(event.move).delay ?? 0) <= 0) {
        return;
      }

      if (targets.length > 0) {
        drop(flightOf(event.source, event.move));
        flying.push({ source: event.source, move: event.move, targets, share: 0, idle: 0 });
      }
    });

    // The engine ticks the delay down itself, so where the dot is comes
    // from its progress rather than from a clock of this component's.
    // A battle that stalls, or is stepped through, drags its
    // projectiles along with it
    const moving = props.battle.on(
      BattleEvents.UnitTriggerMoveUpdate,
      EventPriority.Post,
      (event) => {
        const { parent, time } = event.data;

        if (parent == null || time == null) {
          return;
        }

        const flight = flightOf(parent.source, parent.move);

        if (flight != null) {
          flight.share = time.duration <= 0 ? 1 : Math.min(1, time.progress / time.duration);
          flight.idle = 0;
        }
      },
    );

    // It landed, and the hit it was carrying is resolving in this same
    // frame. The last update the engine sent was a tick short of the
    // target, so the dot is put the rest of the way home and retired
    // after the frame that shows it there
    const landing = props.battle.on(
      BattleEvents.UnitTriggerMoveEnd,
      EventPriority.Post,
      (event) => {
        // Thrown and landed: the gesture is over, whatever else the
        // unit goes on to do
        striking.delete(event.source);

        const flight = flightOf(event.source, event.move);

        if (flight != null) {
          flight.share = 1;
          flight.idle = STALE_TICKS;
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
    });

    const fainting = props.battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
      striking.delete(event.source);
    });

    const ticking = props.battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
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

    const grab = (event: PointerEvent): void => {
      // The left button and nothing else. A right-drag belongs to the
      // browser — on a Mac it is also what a ctrl-click is — and a
      // canvas that swallowed it would take the context menu with it
      if (!event.isPrimary || event.button !== 0 || !spectating()) {
        return;
      }
      event.preventDefault();
      turning = event.clientX;
      element.setPointerCapture(event.pointerId);
    };

    const turn = (event: PointerEvent): void => {
      if (turning == null) {
        return;
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

    element.addEventListener('contextmenu', menu);
    element.addEventListener('pointerdown', grab);
    element.addEventListener('pointermove', turn);
    element.addEventListener('pointerup', release);
    element.addEventListener('pointercancel', release);

    // Something to look at before the first tick lands
    draw();

    onCleanup(() => {
      element.removeEventListener('contextmenu', menu);
      element.removeEventListener('pointerdown', grab);
      element.removeEventListener('pointermove', turn);
      element.removeEventListener('pointerup', release);
      element.removeEventListener('pointercancel', release);
      firing.stop();
      moving.stop();
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
