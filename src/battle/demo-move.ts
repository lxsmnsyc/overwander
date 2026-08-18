import type { CatchSnapshot } from '../auth/catch-snapshot';
import { getMaxHealth } from '../auth/health';
import type { TeamSnapshotRecord } from '../auth/teams';
import { defaultSlots } from '../data/constants/slots';
import { PERFECT_IVS, Stats } from '../data/constants/stats';
import { MoveTargetFlags, type Moves } from '../data/ids/moves';
import { Species } from '../data/ids/species';
import { getMoveData } from '../data/moves';
import { deriveGender, deriveNature, deriveSize } from '../overworld/encounter';
import { fieldTeams } from '../overworld/raid';
import { UNLIMITED_BATTLE_LIMITS } from '../data/constants/battle-limits';
import { BattleEvents, type MoveTarget, MoveTargetType } from './events';
import { BattleModes } from './core';
import { EventPriority } from '../core/event-emitter';
import type Battle from './core';
import createBattle from './setup';
import type Unit from './unit';

/**
 * Two dummies and one move, for looking at it.
 *
 * A move is the hardest thing in the game to see on purpose: it has
 * to be known by something that is standing in a fight, chosen over
 * everything else that pokemon could do, and land on somebody. This
 * stages the shortest arrangement that satisfies all three — one
 * caster that knows exactly the move being looked at, one thing to
 * aim it at, and nothing else on the field.
 *
 * It is a **demo** battle: no outcome mechanics, so a knocked-out
 * dummy does not end anything, and no AI, so nothing happens except
 * what somebody presses. Everything else is the engine as it ships —
 * the same casting, the same damage, the same animations.
 *
 * Which side the target stands on is read off the move itself: a move
 * that reaches an enemy needs one, and a move that mends an ally
 * needs the dummy standing beside the caster rather than across from
 * it. Getting that from the move's own flags is what stops the page
 * demonstrating a heal by throwing it at somebody who cannot receive
 * it.
 */

/**
 * What the dummies come at. High enough that the numbers on a hit are
 * the ones a real fight shows, low enough that nothing one-shots the
 * other before the animation has played
 */
export const DEMO_LEVEL = 50;

/**
 * Who stands there.
 *
 * Two ordinary pokemon, picked for their sheets rather than for
 * anything about them: a plain four-limbed caster whose sheet carries
 * most of the cast clips, and something round and hardy to aim at.
 * Neither is named on the page — what they are is a set of stats for
 * the move to resolve against
 */
export const DEMO_CASTER = Species.Golduck;
export const DEMO_TARGET = Species.Lickitung;

/**
 * What both dummies are drawn as.
 *
 * A pokemon on the field is a distraction here: its own colours, its
 * own silhouette and its own idle are all things to read that have
 * nothing to do with the move. The substitute doll is the game's own
 * word for a stand-in, and two identical dolls make the move the only
 * thing on the field that differs between one cast and the next.
 *
 * It is the **appearance** rather than the species: the doll has no
 * stats, no types and no sheet in the registry, so the units stay the
 * pokemon they were staged as and only the drawing changes
 */
export const DEMO_APPEARANCE = Species.Substitute;

/**
 * How many times the move can be cast before the page has to be
 * staged again.
 *
 * A demo is somebody pressing the same move over and over to watch it,
 * and the registered PP of a strong move is five — five presses and
 * the page is spent. It is set through the check event every other
 * PP effect already answers, so nothing about how PP works is special
 * here, only the number it comes out at
 */
export const DEMO_MOVE_PP = 180;

/** The two sides of the field, whether or not both are used */
export const CASTER_ALLIANCE = 0;
export const TARGET_ALLIANCE = 1;

/**
 * Whether the move wants somebody on the caster's own side.
 *
 * Read from the flags rather than from a list of move names: anything
 * that names an enemy is aimed across the field, and everything else
 * — an ally's, the caster's own, a whole team's — is aimed along it
 */
export function needsAlly(move: Moves): boolean {
  return (getMoveData(move).target & MoveTargetFlags.Enemy) === 0;
}

/** One dummy, in the shape a battle fields */
function dummy(species: Species): CatchSnapshot {
  const size = deriveSize(species, 0);
  const effortValues = {
    [Stats.HP]: 0,
    [Stats.Attack]: 0,
    [Stats.Defense]: 0,
    [Stats.SpecialAttack]: 0,
    [Stats.SpecialDefense]: 0,
    [Stats.Speed]: 0,
  };

  return {
    // It stands for no record, which is what keeps everything that
    // reports a battle from having anything to say about it
    caught: '',
    species,
    level: DEMO_LEVEL,
    // Perfect and untrained: a demo is a controlled comparison, and
    // rolled values would make the same move hit differently twice
    ivs: PERFECT_IVS,
    effortValues,
    nature: deriveNature(0),
    gender: deriveGender(species, 0),
    height: size.height,
    weight: size.weight,
    shiny: false,
    shadow: false,
    // Filled in by the caller: the caster knows the move being looked
    // at and nothing else, and the target knows nothing at all
    moves: [],
    movePoints: {},
    // None at all. A dummy's job is to be neutral, and an ability is
    // the loudest way it can fail to be: the target's own Cloud Nine
    // was quietly cancelling the weather a Rain Dance had just put up,
    // which reads as the move not working
    abilities: [],
    items: [],
    slots: defaultSlots(),
    health: getMaxHealth({ species, level: DEMO_LEVEL, ivs: PERFECT_IVS, effortValues }),
    statuses: 0,
  };
}

/**
 * Where the move is pointed, which is the move's own business.
 *
 * A move that names an enemy is aimed across the field, one that
 * names an ally at the dummy beside the caster, and one that names
 * only the caster at the caster — aiming a Recover at somebody else
 * would be demonstrating a move the engine never resolves that way.
 * A move that takes a whole team is handed the team rather than one
 * of its members
 */
export function aimFor(demo: MoveDemo, move: Moves): MoveTarget {
  const { target } = getMoveData(move);
  const across = (target & MoveTargetFlags.Enemy) !== 0;

  if ((target & MoveTargetFlags.Team) !== 0) {
    return { type: MoveTargetType.Team, team: across ? demo.target.team : demo.caster.team };
  }
  // Its own and nobody else's. A move that names nobody at all is one
  // of these too: the engine forwards whatever target it is handed to
  // moves outside the `Multiple` path, and what most of those do is
  // act on the caster — a Recover among them
  if ((target & (MoveTargetFlags.Ally | MoveTargetFlags.Own | MoveTargetFlags.Enemy)) === 0) {
    return { type: MoveTargetType.Unit, unit: demo.caster };
  }
  return { type: MoveTargetType.Unit, unit: demo.target };
}

export interface MoveDemo {
  battle: Battle;
  /** The one that knows the move */
  caster: Unit;
  /** The one it is aimed at */
  target: Unit;
  /** Whether the two are standing on the same side */
  allied: boolean;
}

/**
 * Stage the move.
 *
 * The teams go through `fieldTeams`, the same staging a raid lobby
 * uses, so the units on the field are built the way the game builds
 * them rather than the way a demo might find convenient
 */
export function createMoveDemo(move: Moves): MoveDemo {
  const allied = needsAlly(move);
  const battle = createBattle(`demo-move:${move}`, {
    mode: BattleModes.Demo,
    realtime: true,
    limits: UNLIMITED_BATTLE_LIMITS,
  });
  const caster = { ...dummy(DEMO_CASTER), moves: [move] };
  const target = dummy(DEMO_TARGET);
  const teams: TeamSnapshotRecord[] = allied
    ? // Side by side, in one alliance and one team: an ally's move
      // aimed across the field would have nothing to land on
      [{ player: 'caster', alliance: CASTER_ALLIANCE, catches: [caster, target] }]
    : [
        { player: 'caster', alliance: CASTER_ALLIANCE, catches: [caster] },
        { player: 'target', alliance: TARGET_ALLIANCE, catches: [target] },
      ];
  // Nobody's side is the boss': a demo has no favoured half, and the
  // outcome nobody is deciding would be the only thing that read it
  const fielded = fieldTeams(battle, teams, null);
  const casting = fielded.units.get(CASTER_ALLIANCE)?.[0];
  const receiving = allied
    ? fielded.units.get(CASTER_ALLIANCE)?.[1]
    : fielded.units.get(TARGET_ALLIANCE)?.[0];

  if (casting == null || receiving == null) {
    throw new Error('The demo could not be staged');
  }
  casting.setAppearance(DEMO_APPEARANCE);
  receiving.setAppearance(DEMO_APPEARANCE);
  // Enough of it to keep pressing. Answered after the ordinary rule
  // rather than instead of it, so a move that has already been cast
  // still spends what it spends
  battle.on(BattleEvents.CheckUnitMovePP, EventPriority.Post, (event) => {
    event.pp = DEMO_MOVE_PP;
  });
  // Nothing here can be hurt. A dummy that faints stops being a place
  // to aim the next cast, and the page is for watching a move go off
  // over and over — so damage is refused at the one question the
  // engine asks before it lands. Heals ride the same event as a
  // negative amount, and drains ride them, so only what would take
  // health off is refused
  battle.on(BattleEvents.CheckUnitCanDamage, EventPriority.Post, (event) => {
    if (event.value > 0) {
      event.success = false;
    }
  });
  return { battle, caster: casting, target: receiving, allied };
}
