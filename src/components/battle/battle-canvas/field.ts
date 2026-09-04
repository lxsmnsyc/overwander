import { BOSS_RADIUS, COLORS, MIN_RADIUS, PARTY_SLOT } from './metrics';
import type { Striking } from './motion';
import type Battle from '../../../battle/core';
import { type MoveTarget, MoveTargetType } from '../../../battle/events';
import type Team from '../../../battle/team';
import { Weathers } from '../../../data/ids/status';
import type Unit from '../../../battle/unit';
import projectField, {
  type FieldPoint,
  type FieldView,
  ringOf,
  ringRadius,
} from '../../../canvas/battle/field';
import facingToward from '../../../canvas/facing';
import type SpeciesSpriteAnimation from '../../../canvas/species-sprite-animation';
import type { Point, SpriteDirection } from '../../../canvas/sprite-sheet';

/**
 * Who is standing where: the fight read into a ring of teams about a
 * middle, and that ring projected into slots on the picture.
 */

/**
 * One unit as it is drawn: where it sits, how big it is, and which
 * side of the field it is on
 */
export interface Slot {
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
  /**
   * How far the body is turned on the spot, in radians. It is the
   * stand-in for a Rotate the sheet has not got, and nothing else
   * turns a pokemon
   */
  spin: number;
  /** Whether it is in front of the camera at all. */
  visible: boolean;
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

export function readField(
  battle: Battle,
  player: string,
  arrange: (team: Team, units: Unit[]) => Unit[],
): Field {
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
      teams.push({
        units: arrange(team, [...team.units]),
        friendly: own == null || alliance === own,
      });
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
export interface Standing {
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
export function lobbyCamera(teams: number): { radius: number; zoom: number } {
  const radius = ringRadius(teams, LOBBY_RADIUS, LOBBY_GAP);

  return { radius, zoom: LOBBY_RADIUS / radius };
}

/**
 * A side of a fight: a ring of pokemon around a point, each looking at
 * whatever it is up against by default — until it is aiming at
 * something, which `project` lets it turn to
 */
export function side(
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
export function ringStandings(
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
 * What this unit is aiming at, or nothing while it is standing about.
 * The move it is winding up, then the one it has in the air
 */
export function aimedAt(unit: Unit, thrown?: Striking): MoveTarget | null {
  return unit.casting?.target ?? unit.channeling?.target ?? thrown?.at ?? null;
}

/** Everybody a target names, which for a team is all of it. */
export function unitsOf(target: MoveTarget): Unit[] {
  if (target.type === MoveTargetType.Unit) {
    return [target.unit];
  }
  return target.type === MoveTargetType.Team ? [...target.team.units] : [];
}

/** Whichever of a team the caster looks at, preferring one still up. */
function oneOf(team: Team, besides: Unit): Unit | null {
  const others = [...team.units].filter((other) => other !== besides);

  return others.find((other) => other.alive) ?? others.at(0) ?? null;
}

/**
 * What a unit is turned toward: whatever it is aiming at.
 *
 * A pokemon that faces the middle of the field all fight is a pokemon
 * that never looks at anything: on a ring the thing it is hitting is
 * rarely straight ahead. A move aimed at a whole team looks at one of
 * them, which is where the cluster is, and its own side counts, since
 * a pokemon helping a teammate is looking at the teammate
 */
function watchedBy(unit: Unit, thrown: Striking | undefined): Unit | null {
  const aim = aimedAt(unit, thrown);

  if (aim == null) {
    return null;
  }
  if (aim.type === MoveTargetType.Unit) {
    return aim.unit === unit ? null : aim.unit;
  }
  if (aim.type === MoveTargetType.Team) {
    return oneOf(aim.team, unit);
  }
  return null;
}

/**
 * A patch of sky, and the part of the picture it is painted over.
 * Everything is in the picture's own coordinates, which is what both
 * the painted pass and the batch draw in
 */
export interface SkyPatch {
  weather: Weathers;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** How far past a team's own bodies its weather reaches, in radii. */
const SKY_MARGIN = 1.8;

/**
 * What sky to draw and where.
 *
 * Weather over the whole field covers the picture, which is every
 * fight but a raid: only a raid keeps a team's own weather to that
 * team, and only a boss puts weather over everybody. A team's own sky
 * is drawn as a shaft coming down over its cluster, so a side standing
 * in its own sunshine is visibly the side that called for it
 */
export function skiesOver(
  slots: Slot[],
  battle: Battle,
  picture: { width: number; height: number },
): SkyPatch[] {
  const overhead = battle.weather.disabled ? Weathers.None : battle.weather.current;

  if (overhead !== Weathers.None) {
    return [{ weather: overhead, x: 0, y: 0, width: picture.width, height: picture.height }];
  }

  const sides = new Map<Team, Slot[]>();

  for (const slot of slots) {
    const its = sides.get(slot.unit.team);

    if (its == null) {
      sides.set(slot.unit.team, [slot]);
    } else {
      its.push(slot);
    }
  }

  const patches: SkyPatch[] = [];

  for (const [team, its] of sides) {
    const weather = team.weather.disabled ? Weathers.None : team.weather.current;

    if (weather === Weathers.None) {
      continue;
    }

    const reach = Math.max(...its.map((slot) => slot.radius)) * SKY_MARGIN;
    const left = Math.max(0, Math.min(...its.map((slot) => slot.x)) - reach);
    const right = Math.min(picture.width, Math.max(...its.map((slot) => slot.x)) + reach);
    // From the top of the picture down past their feet: weather comes
    // out of the sky, so a patch floating in the middle of the field
    // reads as a cloud rather than as the weather over them
    const bottom = Math.min(picture.height, Math.max(...its.map((slot) => slot.y)) + reach);

    if (right > left && bottom > 0) {
      patches.push({ weather, x: left, y: 0, width: right - left, height: bottom });
    }
  }
  return patches;
}

/**
 * The camera applied: field units become pixels, and the field's own
 * depth becomes the order things are drawn in.
 *
 * **Far first.** On a plane with depth, a pokemon nearer the camera
 * stands in front of one further off, and the only thing that makes
 * that true on a canvas is the order the two were painted in
 */
export function project(
  standings: Standing[],
  view: FieldView,
  striking: Map<Unit, Striking>,
): Slot[] {
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
        spin: 0,
        visible: on.visible,
      };
    })
    .filter((slot) => slot.visible)
    .sort((one, two) => one.depth - two.depth);
}
