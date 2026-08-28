import { type JSX, createSignal, onCleanup, onMount } from 'solid-js';
import type Battle from '../../../battle/core';
import type SpeciesSpriteAnimation from '../../../canvas/species-sprite-animation';

import type { FieldVisual } from '../../../canvas/battle/moves/__painted';
import attackMarkVisual from '../../../canvas/battle/attack';
import abilityCueFor, {
  itemCueFor,
  statusCueFor,
  statusTriggerFor,
} from '../../../canvas/battle/cues';
import paintWeather from '../../../canvas/battle/weather';
import {
  delayShapeFor,
  moveDelayVisual,
  moveEffectVisual,
  moveMissVisual,
} from '../../../canvas/battle/moves';
import type { FieldView } from '../../../canvas/battle/field';
import loadBiomeTileset from '../../../canvas/biome-tilesets';
import type BiomeTileset from '../../../canvas/biome-tileset';
import drawFloor, { type FloorRegion } from './floor';
import Biome from '../../../data/ids/biome';

import loadSpeciesSprite from '../../../canvas/species-sprites';
import { BattleEvents, MoveTargetType } from '../../../battle/events';
import type Abilities from '../../../data/ids/abilities';
import type Team from '../../../battle/team';
import type Unit from '../../../battle/unit';
import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { SWITCHING_SPAN } from '../../../battle/status/switching';
import { AI_REST_PERIOD } from '../../../battle/ai/idle';
import { isLoopingCast, pickCast } from '../../../data/constants/cast';

import { Stats } from '../../../data/constants/stats';
import { MoveFlags } from '../../../data/ids/moves';
import { Genders, type Species } from '../../../data/ids/species';

import type { Statuses } from '../../../data/ids/status';
import { getMoveData } from '../../../data/moves';
import { bodyOf, boxOf, drawSlot, scaleOf, withinSlot } from './draw';
import { type Slot, lobbyCamera, project, readField, ringStandings } from './field';
import { COLORS, FIELD_UNIT, HEIGHT, LOADING_LABEL, WIDTH } from './metrics';
import {
  CUE_GAP,
  type Casting,
  LUNGE_REACH,
  LUNGE_SPAN,
  type Lunge,
  type Striking,
  type Trade,
} from './motion';

/**
 * The battle as a picture.
 *
 * [`BattleField`](../BattleField.tsx) says everything there is to say
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

export interface BattleCanvasProps {
  battle: Battle;
  /**
   * The ground the fight is standing on. Left out, or set to a biome
   * nobody has packed a tileset for, and the field is the plain colour
   * it has always been
   */
  biome?: Biome;
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
   * Teammates mid-swap, walking to each other's spots
   */
  const trades: Trade[] = [];

  /**
   * The order each party is drawn in. The engine's own order never
   * changes — a switch swaps nothing in the team — so the canvas
   * keeps the order it draws, and a switch swaps it here
   */
  const arranged = new Map<Team, Unit[]>();

  const arrange = (team: Team, units: Unit[]): Unit[] => {
    const kept = arranged.get(team);

    if (kept == null || kept.length !== units.length || kept.some((one) => !team.units.has(one))) {
      const fresh = [...units];

      arranged.set(team, fresh);
      return fresh;
    }
    return kept;
  };

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

    /**
     * The biome's ground, once it lands. The fight is not held back
     * for it the way it is for the sheets: a floor that arrives late
     * appears under a fight already under way, which is better than a
     * fight that waited for scenery
     */
    let floor: BiomeTileset | null = null;
    const standing = props.biome ?? Biome.Beyond;

    if (standing !== Biome.Beyond) {
      loadBiomeTileset(standing)
        .then((loaded) => {
          if (live) {
            floor = loaded;
          }
        })
        .catch(() => {
          // The plain field, which is what it was before
        });
    }

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

    /**
     * How much of the drawing's own coordinates the element covers.
     * Larger than the picture, since the field is centred in a canvas
     * the size of the page and the margins are field as well
     */
    let region: FloorRegion = { left: 0, top: 0, right: WIDTH, bottom: HEIGHT };

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
      const offsetX = (width - WIDTH * scale) / 2;
      const offsetY = (height - HEIGHT * scale) / 2;

      context.transform(scale, 0, 0, scale, offsetX, offsetY);
      region = {
        left: -offsetX / scale,
        top: -offsetY / scale,
        right: (width - offsetX) / scale,
        bottom: (height - offsetY) / scale,
      };
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

      const field = readField(props.battle, props.player, arrange);

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
      // The ground the fight is standing on, under everything on it
      if (floor != null) {
        drawFloor(context, floor, view, region, clock);
      }

      const slots = project(ringStandings(field, spriteFor), view, striking);
      const at = new Map(slots.map((slot) => [slot.unit, slot]));

      // Whoever is throwing itself at somebody is drawn part of the
      // way there. It is done to the slot rather than to the standing
      // so everything measured off the slot comes with it: the bars,
      // the name, and the move's own picture, which should go off
      // where the body actually is
      // Mid-swap, each stands part of the way from the other's spot
      // to its own: eased at both ends, so the walk reads as a walk
      for (const trade of trades) {
        const one = at.get(trade.a);
        const other = at.get(trade.b);

        if (one == null || other == null) {
          continue;
        }

        const share = (1 - Math.cos(Math.PI * Math.min(1, trade.elapsed / trade.window))) / 2;
        const rest = 1 - share;

        one.offset = [(other.x - one.x) * rest, (other.y - one.y) * rest];
        other.offset = [(one.x - other.x) * rest, (one.y - other.y) * rest];
      }

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
        drawSlot(context, slot, striking, clock, gone.has(slot.unit));
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

    // A switch swaps two teammates' places. The engine's team keeps
    // its order, so the drawn order swaps here — and the pair walk to
    // each other's spots rather than appearing there
    const trading = props.battle.on(BattleEvents.UnitSwitch, EventPriority.Post, (event) => {
      if (event.source === event.target) {
        return;
      }

      const order = arrange(event.source.team, [...event.source.team.units]);
      const from = order.indexOf(event.source);
      const to = order.indexOf(event.target);

      if (from < 0 || to < 0) {
        return;
      }
      [order[from], order[to]] = [order[to], order[from]];

      // A pair switched again mid-walk starts the walk over
      const already = trades.findIndex(
        (trade) => trade.a === event.source || trade.b === event.source,
      );

      if (already >= 0) {
        trades.splice(already, 1);
      }
      trades.push({ a: event.source, b: event.target, elapsed: 0, window: SWITCHING_SPAN });
    });

    // The walk is the engine's: its progression events move the
    // picture, so a fast-forwarded switch fast-forwards the walk
    const walking = props.battle.on(BattleEvents.UnitUpdateSwitch, EventPriority.Post, (event) => {
      const trade = trades.find((entry) => entry.a === event.source);

      if (trade == null) {
        return;
      }
      trade.elapsed = event.data.progress ?? trade.elapsed;
      trade.window = event.data.duration ?? trade.window;
    });

    // Arrival snaps both onto their spots, however the walk got there
    const arriving = props.battle.on(BattleEvents.UnitFinishSwitch, EventPriority.Post, (event) => {
      const already = trades.findIndex((trade) => trade.a === event.source);

      if (already >= 0) {
        trades.splice(already, 1);
      }
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
      trading.stop();
      walking.stop();
      arriving.stop();
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
