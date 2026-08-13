import { type JSX, onCleanup, onMount } from 'solid-js';
import type Battle from '../battle/core';
import type SpeciesSpriteAnimation from '../canvas/species-sprite-animation';
import type { Point, SpriteDirection } from '../canvas/sprite-sheet';
import facingToward from '../canvas/facing';
import loadSpeciesSprite from '../canvas/species-sprites';
import { BattleEvents, MoveTargetType } from '../battle/events';
import type Unit from '../battle/unit';
import { EventPriority } from '../core/event-emitter';
import { pickCast } from '../data/constants/cast';
import { Stats } from '../data/constants/stats';
import type { Moves } from '../data/ids/moves';
import type { Species } from '../data/ids/species';
import { getMoveData } from '../data/moves';
import { getSpeciesData } from '../data/species';

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

const ROW_TOP = 96;
const ROW_BOTTOM = HEIGHT - 96;
const RADIUS = 24;
/**
 * How small a crowded row is allowed to draw its pokemon. Below this
 * a sprite is a smudge, so a row with more on it than will fit lets
 * them overlap rather than shrinking to nothing
 */
const MIN_RADIUS = 12;
/**
 * The boss is drawn large, since it is one thing against a party and
 * the size is what says so
 */
const BOSS_RADIUS = 52;

/**
 * What a slot's radius is worth in sprite scale. A frame is a few
 * dozen pixels tall, so a boss at fifty-odd pixels of radius comes
 * out about twice the size of a party member — which is what the
 * radius was saying when it was a circle
 */
const SPRITE_SCALE_DIVISOR = 16;

const BAR_WIDTH = 72;
const BAR_HEIGHT = 7;

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
   * Which way it is facing: the two sides look at each other
   */
  facing: SpriteDirection;
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
 * Spread a side evenly across its row.
 *
 * The asked-for radius is what a slot gets when the row has room for
 * it. A crowded row — a full raid lobby is thirty pokemon on one side
 * — shrinks its slots to the gap between them instead, so a big fight
 * reads as a crowd rather than as a pile
 */
function layout(
  units: Unit[],
  y: number,
  radius: number,
  color: string,
  facing: SpriteDirection,
  spriteFor: (unit: Unit) => SpeciesSpriteAnimation | null,
  quiet = false,
): Slot[] {
  const step = WIDTH / (units.length + 1);
  const fitted = Math.max(MIN_RADIUS, Math.min(radius, step / 2));

  return units.map((unit, at) => ({
    unit,
    x: step * (at + 1),
    y,
    radius: fitted,
    color,
    facing,
    sprite: spriteFor(unit),
    quiet,
  }));
}

const TAU = Math.PI * 2;

/**
 * The ellipse the parties stand on, measured from the middle of the
 * field. Wider than it is tall because the field is: a circle of teams
 * on a 16:9 board would leave the sides empty and run off the top
 */
const LOBBY_RX = 240;
const LOBBY_RY = 108;

/**
 * How far a party's own members stand from the middle of their party,
 * and how much that ring is flattened. The squash is the same reason
 * the lobby ellipse is one: height is what the field is short of
 */
const TEAM_RADIUS = 27;
const TEAM_SQUASH = 0.7;

/**
 * How big a pokemon is drawn in a lobby. Smaller than a row slot,
 * since there are eight parties of them and the point is that the
 * shape of the lobby reads at a glance
 */
const LOBBY_RADIUS = 14;

/**
 * A raid as it is: the boss in the middle, the parties around it, each
 * party a ring of its own, everybody looking inward.
 *
 * This is what a spectator is shown, and it says two things a pair of
 * rows cannot. **Who came with whom** — a party is a cluster rather
 * than a stretch of a line somebody has to count along — and **what
 * the fight is**, which is one thing in the middle with a lobby closed
 * around it. Facing carries the rest: every pokemon is turned toward
 * the boss, so the field points at what it is all about
 */
function ringLayout(
  lobby: { boss: Unit[]; teams: Unit[][] },
  spriteFor: (unit: Unit) => SpeciesSpriteAnimation | null,
): Slot[] {
  const centerX = WIDTH / 2;
  const centerY = HEIGHT / 2;
  const slots: Slot[] = [];

  // Normally one. Two would be a raid nothing stages yet, so they
  // stand side by side rather than on top of one another
  lobby.boss.forEach((unit, at) => {
    slots.push({
      unit,
      x: centerX + (at - (lobby.boss.length - 1) / 2) * BOSS_RADIUS * 2,
      y: centerY,
      radius: BOSS_RADIUS,
      color: COLORS.boss,
      // The one thing on the field with nothing to look at: it is
      // being looked at, so it faces the viewer
      facing: 'Down',
      sprite: spriteFor(unit),
    });
  });

  lobby.teams.forEach((units, at) => {
    // The first party at the top, the rest round to the right
    const around = (at / lobby.teams.length) * TAU - TAU / 4;
    const teamX = centerX + Math.cos(around) * LOBBY_RX;
    const teamY = centerY + Math.sin(around) * LOBBY_RY;
    // A party of one stands at its own middle rather than orbiting it
    const spread = units.length > 1 ? TEAM_RADIUS : 0;

    units.forEach((unit, member) => {
      const spin = (member / units.length) * TAU - TAU / 4;
      const x = teamX + Math.cos(spin) * spread;
      const y = teamY + Math.sin(spin) * spread * TEAM_SQUASH;

      slots.push({
        unit,
        x,
        y,
        radius: LOBBY_RADIUS,
        color: COLORS.mine,
        facing: facingToward(x, y, centerX, centerY),
        sprite: spriteFor(unit),
      });
    });
  });

  return slots;
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
interface Performance {
  animation: string;
  /**
   * How long one pass should take, or null to play at the speed the
   * sheet was drawn at
   */
  duration: number | null;
  loop: boolean;
}

function animationFor(unit: Unit, sprite: SpeciesSpriteAnimation): Performance {
  if (!unit.alive) {
    // A knocked-out pokemon holds the last frame of being hurt rather
    // than looping it, which is the difference between lying there
    // and writhing for ever
    return { animation: 'Hurt', duration: null, loop: false };
  }

  // Both halves of a move carry the same two things — which move, and
  // how long this window has to run — so neither needs its own case
  const working = unit.casting ?? unit.channeling;

  if (working != null) {
    return {
      animation: pickCast(getMoveData(working.move).cast, (name) => sprite.has(name)),
      // The **whole** window, not what is left of it. A rate worked
      // out afresh from the remainder every frame is a rate that
      // climbs as the remainder shrinks, and a clip driven that way
      // races to its end around two thirds of the way through. The
      // window is a fixed length; so is the rate that fills it
      duration: working.time.duration,
      loop: false,
    };
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
      ? sprite.locate('center', slot.x, slot.y, { scale: scaleOf(slot), anchor: 'center' })
      : null;

  return placed ?? [slot.x, slot.y];
}

/**
 * One unit: the circle, what it is, what it has left, and what it is
 * in the middle of doing
 */
function drawSlot(context: CanvasRenderingContext2D, slot: Slot): void {
  const { unit } = slot;
  const maxHealth = unit.checkStat(Stats.HP, 0);
  const share = maxHealth <= 0 ? 0 : unit.health / maxHealth;

  context.globalAlpha = unit.alive ? 1 : 0.35;

  const sprite = slot.sprite;

  if (sprite?.ready === true) {
    const wanted = animationFor(unit, sprite);
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
    // The sheet says where the body is on the frame it is holding, so
    // this is the pokemon being centred rather than its box — a
    // wingspan drawn into the top of a tall frame no longer drags the
    // pokemon off its own slot. Its shadow goes wherever that leaves
    // the ground, which on a field is the only thing saying the
    // pokemon is standing on something
    const placement = { scale: scaleOf(slot), anchor: 'center' } as const;

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
  // And a slot too small to hold its own name does not print one:
  // forty-eight overlapping names say less than none, and the field
  // readout underneath names every one of them anyway
  const named = slot.radius >= RADIUS && slot.quiet !== true;

  context.font = '12px sans-serif';

  if (named) {
    drawLabel(
      context,
      // The level first, the way a card says it and the way the games
      // have always said it: what a player checks a boss for is how
      // far above them it is, and that is the number they read first
      `Lv. ${unit.level} ${getSpeciesData(unit.species).name}`,
      slot.x,
      slot.y + slot.radius + 16,
      COLORS.text,
    );
  }
  drawBar(context, slot.x, slot.y + slot.radius + (named ? 22 : 8), share, healthColor(share), bar);

  // What it is in the middle of, named above its head: a cast the
  // other side can still interrupt, or a channel already landing
  const busy = unit.casting ?? unit.channeling;

  if (busy != null && unit.alive) {
    if (named) {
      drawLabel(
        context,
        getMoveData(busy.move).name,
        slot.x,
        slot.y - slot.radius - 10,
        COLORS.text,
      );
    }
    drawBar(
      context,
      slot.x,
      slot.y - slot.radius - 6,
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
}

export default function BattleCanvas(props: BattleCanvasProps): JSX.Element {
  let canvas: HTMLCanvasElement | undefined;
  /**
   * Not a signal: nothing renders off it. The engine moves these along
   * and the next tick draws them where it left them
   */
  const flying: Flight[] = [];

  /**
   * One animation per unit, keyed by what that unit currently looks
   * like. A unit that changes what it looks like — a Transform, a
   * substitute taking the hits — is drawn as the new thing from the
   * frame it changed, and the sheet it changed away from stays cached
   * for whoever else is wearing it
   */
  const sprites = new Map<Unit, { appearance: Species; sprite: SpeciesSpriteAnimation | null }>();

  const spriteFor = (unit: Unit): SpeciesSpriteAnimation | null => {
    const known = sprites.get(unit);

    if (known != null && known.appearance === unit.appearance) {
      return known.sprite;
    }

    // Held before the sheet arrives, so a unit is asked for once
    // rather than once per frame it is drawn in
    const pending = { appearance: unit.appearance, sprite: null as SpeciesSpriteAnimation | null };

    sprites.set(unit, pending);
    loadSpeciesSprite(unit.appearance)
      .then((loaded) => {
        // Only if it is still what the unit looks like: a sheet that
        // arrives after a Transform belongs to nobody
        if (sprites.get(unit) === pending) {
          pending.sprite = loaded;
        }
      })
      .catch(() => {
        // Drawn as a circle, which is what it was before there were
        // sprites at all
      });
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
      const field = readField(props.battle, props.player);
      const bossSide = [...props.battle.alliances].some((alliance) => alliance.boss);

      const rows = (): Slot[] => [
        // The far side looks down the field at the near one, and the
        // near one looks back up at it
        ...layout(
          field.theirs,
          ROW_TOP,
          bossSide ? BOSS_RADIUS : RADIUS,
          bossSide ? COLORS.boss : COLORS.theirs,
          'Down',
          spriteFor,
        ),
        // The near side keeps its names to itself: they are on the
        // cards under the field
        ...layout(field.mine, ROW_BOTTOM, RADIUS, COLORS.mine, 'Up', spriteFor, true),
      ];

      // Watching a raid from outside it: the whole lobby, drawn around
      // the thing it came for. Anything else is two sides facing off
      const slots = field.lobby == null ? rows() : ringLayout(field.lobby, spriteFor);
      const at = new Map(slots.map((slot) => [slot.unit, slot]));

      for (const slot of slots) {
        drawSlot(context, slot);
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
    };

    // A move announces itself when it fires. Whether it spends any time
    // in the air is the engine's to say — a delay of nothing resolves
    // in the same frame, and there is no flight to draw
    const firing = props.battle.on(BattleEvents.UnitTriggerMove, EventPriority.Post, (event) => {
      if ((getMoveData(event.move).delay ?? 0) <= 0) {
        return;
      }

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
    const ticking = props.battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
      for (const held of sprites.values()) {
        held.sprite?.update(event.duration);
      }
      draw();
    });

    // Something to look at before the first tick lands
    draw();

    onCleanup(() => {
      firing.stop();
      moving.stop();
      landing.stop();
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
    />
  );
}
