import { type JSX, onCleanup, onMount } from 'solid-js';
import type Battle from '../battle/core';
import { BattleEvents, MoveTargetType } from '../battle/events';
import type Unit from '../battle/unit';
import { EventPriority } from '../core/event-emitter';
import { Stats } from '../data/constants/stats';
import type { Moves } from '../data/ids/moves';
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
 * The boss is drawn large, since it is one thing against a party and
 * the size is what says so
 */
const BOSS_RADIUS = 52;

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
 * Which units are drawn, and on which side.
 *
 * A raid is watched from behind one's own party: the other players'
 * teams are left out entirely — a six-player raid would otherwise be
 * thirty-odd circles, most of them nobody's business — and the boss
 * stands alone at the top. A battle with no boss is drawn as two
 * sides, the viewer's below and everyone else's above
 */
function readSides(battle: Battle, player: string): { mine: Unit[]; theirs: Unit[] } {
  const boss: Unit[] = [];
  const owned: Unit[] = [];
  const others: Unit[] = [];
  let staged = false;

  for (const alliance of battle.alliances) {
    for (const team of alliance.teams) {
      for (const unit of team.units) {
        if (alliance.boss) {
          staged = true;
          boss.push(unit);
        } else if (team.player === player && player !== '') {
          owned.push(unit);
        } else {
          others.push(unit);
        }
      }
    }
  }

  if (staged) {
    // A raid: the viewer's own party, and the thing it is fighting.
    // Somebody watching a raid they are not in has no party of their
    // own, so they are shown the side that is fighting
    return { mine: owned.length > 0 ? owned : others, theirs: boss };
  }
  return owned.length > 0 ? { mine: owned, theirs: others } : { mine: others, theirs: [] };
}

/**
 * Spread a side evenly across its row
 */
function layout(units: Unit[], y: number, radius: number, color: string): Slot[] {
  const step = WIDTH / (units.length + 1);

  return units.map((unit, at) => ({ unit, x: step * (at + 1), y, radius, color }));
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
): void {
  context.fillStyle = COLORS.track;
  context.fillRect(x - BAR_WIDTH / 2, y, BAR_WIDTH, BAR_HEIGHT);
  context.fillStyle = color;
  context.fillRect(x - BAR_WIDTH / 2, y, BAR_WIDTH * Math.max(0, Math.min(1, share)), BAR_HEIGHT);
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
 * One unit: the circle, what it is, what it has left, and what it is
 * in the middle of doing
 */
function drawSlot(context: CanvasRenderingContext2D, slot: Slot): void {
  const { unit } = slot;
  const maxHealth = unit.checkStat(Stats.HP, 0);
  const share = maxHealth <= 0 ? 0 : unit.health / maxHealth;

  context.globalAlpha = unit.alive ? 1 : 0.35;
  context.beginPath();
  context.arc(slot.x, slot.y, slot.radius, 0, Math.PI * 2);
  context.fillStyle = unit.alive ? slot.color : COLORS.down;
  context.fill();

  context.font = '12px sans-serif';
  drawLabel(
    context,
    `${getSpeciesData(unit.species).name} · Lv. ${unit.level}`,
    slot.x,
    slot.y + slot.radius + 16,
    COLORS.text,
  );
  drawBar(context, slot.x, slot.y + slot.radius + 22, share, healthColor(share));

  // What it is in the middle of, named above its head: a cast the
  // other side can still interrupt, or a channel already landing
  const busy = unit.casting ?? unit.channeling;

  if (busy != null && unit.alive) {
    drawLabel(context, getMoveData(busy.move).name, slot.x, slot.y - slot.radius - 10, COLORS.text);
    drawBar(
      context,
      slot.x,
      slot.y - slot.radius - 6,
      busy.time.duration <= 0 ? 1 : busy.time.progress / busy.time.duration,
      unit.casting == null ? COLORS.channel : COLORS.cast,
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

    // Drawn in logical pixels and scaled once, so the circles are not
    // soft on a retina display
    const ratio = window.devicePixelRatio;

    element.width = WIDTH * ratio;
    element.height = HEIGHT * ratio;
    context.scale(ratio, ratio);

    const draw = (): void => {
      const { mine, theirs } = readSides(props.battle, props.player);
      const bossSide = [...props.battle.alliances].some((alliance) => alliance.boss);
      const slots = [
        ...layout(
          theirs,
          ROW_TOP,
          bossSide ? BOSS_RADIUS : RADIUS,
          bossSide ? COLORS.boss : COLORS.theirs,
        ),
        ...layout(mine, ROW_BOTTOM, RADIUS, COLORS.mine),
      ];
      const at = new Map(slots.map((slot) => [slot.unit, slot]));

      context.fillStyle = COLORS.field;
      context.fillRect(0, 0, WIDTH, HEIGHT);

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
          context.beginPath();
          context.arc(
            from.x + (to.x - from.x) * flight.share,
            from.y + (to.y - from.y) * flight.share,
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
    const ticking = props.battle.on(BattleEvents.Tick, EventPriority.Post, draw);

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
    <canvas
      ref={canvas}
      class="mx-auto block h-auto w-full rounded-lg border border-line"
      style={{ 'max-width': `${WIDTH}px` }}
    />
  );
}
