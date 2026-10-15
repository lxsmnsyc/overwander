import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stages, Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import { DamageFlags, Moves } from '../../data/ids/moves';
import { Species } from '../../data/ids/species';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType, type UnitAttackEvent } from '../events';
import { HEAL_BLOCK_DURATION } from '../status/heal-blocked';
import turns from '../turn';
import type Unit from '../unit';
import { isWeatherRainy, isWeatherSunny, onUnitActs } from '../utils';
import { clearSpikes } from './spikes';
import { clearStealthRock } from './stealth-rock';
import { clearSteelsurge } from './steelsurge';
import { clearStickyWeb } from './sticky-web';
import { clearToxicSpikes } from './toxic-spikes';

/**
 * The Paldea, Kitakami and Blueberry Academy moves with a rule of
 * their own. "This turn" and "next turn" are a 2-second window here,
 * as they are for the Galar moves, and "each turn" is each time the
 * one it was done to acts
 */

/** What Collision Course and Electro Drift make a super-effective blow */
export const COLLISION_SCALE = 4 / 3;

const COLLIDERS = new Set<Moves>([Moves.CollisionCourse, Moves.ElectroDrift]);

/** How often a Fickle Beam comes out at double, out of 1 */
export const FICKLE_CHANCE = 0.3;

/** What Hydro Steam is worth in sunlight, against the half the sun gives Water */
const STEAM_IN_SUN = 3;

/** What each fallen teammate or each hit taken adds to Last Respects or Rage Fist */
export const RESPECT_STEP = 50;

/** The most Rage Fist can be worth */
export const RAGE_FIST_CEILING = 350;

/** How long a Glaive Rush leaves its user open, and what it costs it */
export const GLAIVE_WINDOW = turns(1);
export const GLAIVE_FACTOR = 2;

/** What Salt Cure takes each time the salted acts, and what it takes from Water and Steel */
export const SALT_SHARE = 1 / 8;
export const BRINED_SHARE = 1 / 4;

/** How many times a coat of syrup slows the one it is on */
export const SYRUP_ACTS = 3;

/** What Fillet Away and Shed Tail cost, as a share of the user's HP */
export const FILLET_SHARE = 1 / 2;

const FILLETS = new Set<Moves>([Moves.FilletAway, Moves.ShedTail]);

/** The moves that cannot be thrown twice running */
const SPENT_SWINGS = new Set<Moves>([Moves.GigatonHammer, Moves.BloodMoon]);

/** How long a Psychic Noise keeps its target from healing */
export const NOISE_BLOCK = turns(2);

/** What Order Up raises, by the Tatsugiri giving the order */
const ORDERS = new Map<Species, Stages>([
  [Species.Tatsugiri, Stages.Attack],
  [Species.TatsugiriDroopy, Stages.Defense],
  [Species.TatsugiriStretchy, Stages.Speed],
]);

/** What a Paldean Tauros throws Raging Bull as */
const BREED_TYPES = new Map<Species, Types>([
  [Species.TaurosPaldeaCombat, Types.Fighting],
  [Species.TaurosPaldeaBlaze, Types.Fire],
  [Species.TaurosPaldeaAqua, Types.Water],
]);

/** What an Ogerpon throws Ivy Cudgel as, by the mask it wears */
const MASK_TYPES = new Map<Species, Types>([
  [Species.OgerponWellspring, Types.Water],
  [Species.OgerponHearthflame, Types.Fire],
  [Species.OgerponCornerstone, Types.Rock],
  [Species.OgerponWellspringTera, Types.Water],
  [Species.OgerponHearthflameTera, Types.Fire],
  [Species.OgerponCornerstoneTera, Types.Rock],
]);

export default function setupPaldeaMoves(battle: Battle): void {
  setupReadings(battle);
  setupCounts(battle);
  setupMarks(battle);
  setupCosts(battle);
  setupField(battle);
}

/** The ones that read the blow, the sky or the shape of their user */
function setupReadings(battle: Battle): void {
  const effectiveness = new WeakMap<UnitAttackEvent, number>();

  battle.on(BattleEvents.UnitAttackResolveEffectiveness, EventPriority.Post, (event) => {
    if (COLLIDERS.has(event.parent.move)) {
      effectiveness.set(event.parent, (effectiveness.get(event.parent) ?? 1) * event.multiplier);
    }
  });

  // Fickle Beam's roll is made as it is thrown, so a damage estimate
  // never spends the battle's luck
  const fickle = new WeakSet<Unit>();

  battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Pre, (event) => {
    if (event.move !== Moves.FickleBeam) {
      return;
    }
    if (battle.random() < FICKLE_CHANCE) {
      fickle.add(event.source);
    } else {
      fickle.delete(event.source);
    }
  });

  battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
    const parent = event.parent;

    if (COLLIDERS.has(parent.move) && (effectiveness.get(parent) ?? 1) > 1) {
      event.value *= COLLISION_SCALE;
    }
    if (parent.move === Moves.FickleBeam && fickle.has(parent.source)) {
      event.value *= 2;
    }
    if (parent.move === Moves.HydroSteam && isWeatherSunny(parent.source)) {
      event.value *= STEAM_IN_SUN;
    }
  });

  battle.on(BattleEvents.CheckUnitMoveType, EventPriority.Post, (event) => {
    if (event.move === Moves.RagingBull) {
      event.type = BREED_TYPES.get(event.source.species) ?? event.type;
    }
    if (event.move === Moves.IvyCudgel) {
      event.type = MASK_TYPES.get(event.source.species) ?? event.type;
    }
  });

  // Electro Shot gathers its charge from the rain without waiting
  battle.on(BattleEvents.CheckUnitMoveSteps, EventPriority.Post, (event) => {
    if (event.move === Moves.ElectroShot && isWeatherRainy(event.source)) {
      event.steps = 0;
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move === Moves.ElectroShot && event.steps === 0 && isWeatherRainy(event.source)) {
      event.source.addStage(Stages.SpecialAttack, 1, {
        type: EffectType.Move,
        move: event.move,
        unit: event.source,
      });
    }
  });

  // Order Up is a Dondozo taking its orders from a Tatsugiri beside it
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Post, (event) => {
    if (event.move !== Moves.OrderUp) {
      return;
    }

    for (const mate of event.source.team.units) {
      const stage = mate === event.source || !mate.alive ? undefined : ORDERS.get(mate.species);

      if (stage != null) {
        event.source.addStage(stage, 1, {
          type: EffectType.Move,
          move: event.move,
          unit: event.source,
        });
        return;
      }
    }
  });
}

/** Last Respects and Rage Fist, which count what the fight has done */
function setupCounts(battle: Battle): void {
  const hitsTaken = new Map<Unit, number>();

  battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
    if (
      event.success &&
      !(event.flags & DamageFlags.Indirect) &&
      event.cause.type === EffectType.Move &&
      event.cause.unit !== event.target
    ) {
      hitsTaken.set(event.target, (hitsTaken.get(event.target) ?? 0) + 1);
    }
  });

  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
    if (event.power == null) {
      return;
    }
    if (event.move === Moves.LastRespects) {
      let fallen = 0;

      for (const mate of event.source.team.units) {
        if (mate !== event.source && !mate.alive) {
          fallen += 1;
        }
      }
      event.power += RESPECT_STEP * fallen;
    }
    if (event.move === Moves.RageFist) {
      event.power = Math.min(
        RAGE_FIST_CEILING,
        event.power + RESPECT_STEP * (hitsTaken.get(event.source) ?? 0),
      );
    }
  });
}

/** The ones that leave something on a unit: an opening, salt, syrup, a cheer */
function setupMarks(battle: Battle): void {
  const open = new Map<Unit, number>();
  const salted = new Map<Unit, Unit>();
  const syrup = new Map<Unit, { left: number; by: Unit }>();
  const cheered = new Map<Unit, number>();

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Post, (event) => {
    if (event.move === Moves.GlaiveRush) {
      open.set(event.source, GLAIVE_WINDOW);
    }
    if (event.move === Moves.DragonCheer) {
      for (const mate of event.source.team.units) {
        if (mate !== event.source && mate.alive) {
          cheered.set(mate, mate.types.has(Types.Dragon) ? 2 : 1);
        }
      }
    }
    if (event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const target = event.target.unit;

    if (event.move === Moves.SaltCure && target.alive) {
      salted.set(target, event.source);
    }
    if (event.move === Moves.SyrupBomb && target.alive) {
      syrup.set(target, { left: SYRUP_ACTS, by: event.source });
    }
    if (event.move === Moves.PsychicNoise && target.alive) {
      target.addStatus(Statuses.HealBlocked, {
        type: EffectType.Move,
        move: event.move,
        unit: event.source,
      });
      // Shorter than a Heal Block: the noise wears off in a turn
      target.updateStatusTimer(Statuses.HealBlocked, {
        progress: HEAL_BLOCK_DURATION - NOISE_BLOCK,
      });
    }
  });

  battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    for (const [unit, left] of open) {
      if (left <= event.duration) {
        open.delete(unit);
      } else {
        open.set(unit, left - event.duration);
      }
    }
  });

  // A Glaive Rush leaves its user with nowhere to go
  battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, (event) => {
    if (event.target.type === MoveTargetType.Unit && open.has(event.target.unit)) {
      event.accuracy = undefined;
    }
  });

  battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
    if (open.has(event.parent.target)) {
      event.value *= GLAIVE_FACTOR;
    }
  });

  battle.on(BattleEvents.UnitAttackCheckCriticalRatio, EventPriority.Post, (event) => {
    event.value += cheered.get(event.parent.source) ?? 0;
  });

  onUnitActs(battle, (unit) => {
    const salter = salted.get(unit);

    if (salter != null) {
      const brined = unit.types.has(Types.Water) || unit.types.has(Types.Steel);

      unit.damage(
        { type: EffectType.Move, move: Moves.SaltCure, unit: salter },
        unit,
        unit.checkStat(Stats.HP, 0) * (brined ? BRINED_SHARE : SALT_SHARE),
        DamageFlags.Indirect | DamageFlags.HealthScaled,
      );
    }

    const coat = syrup.get(unit);

    if (coat != null) {
      unit.addStage(Stages.Speed, -1, { type: EffectType.Move, move: Moves.SyrupBomb, unit: coat.by });
      if (coat.left <= 1) {
        syrup.delete(unit);
      } else {
        coat.left -= 1;
      }
    }
  });

  for (const gone of [BattleEvents.UnitFaints, BattleEvents.UnitLeavesField] as const) {
    battle.on(gone, EventPriority.Post, (event) => {
      open.delete(event.source);
      salted.delete(event.source);
      syrup.delete(event.source);
      cheered.delete(event.source);
    });
  }
}

/**
 * Fillet Away and Shed Tail, which the user pays half its HP for, and
 * Gigaton Hammer and Blood Moon, which cannot follow themselves
 */
function setupCosts(battle: Battle): void {
  const last = new Map<Unit, Moves>();

  const tooThin = (unit: Unit): boolean =>
    unit.health <= unit.checkStat(Stats.HP, 0) * FILLET_SHARE;

  const refused = (unit: Unit, move: Moves): boolean =>
    (FILLETS.has(move) && tooThin(unit)) || (SPENT_SWINGS.has(move) && last.get(unit) === move);

  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, (event) => {
    if (event.success && refused(event.source, event.move)) {
      event.success = false;
    }
  });

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && refused(event.source, event.move)) {
      event.usable = false;
    }
  });

  battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
    const unit = event.source;

    // A charged move is one throw however many steps it takes
    if (event.steps === 0 || !FILLETS.has(event.move)) {
      last.set(unit, event.move);
    }
    if (!FILLETS.has(event.move) || (event.move === Moves.ShedTail && event.steps === 0)) {
      return;
    }

    unit.damage(
      { type: EffectType.Move, move: event.move, unit },
      unit,
      Math.ceil(unit.checkStat(Stats.HP, 0) * FILLET_SHARE),
      DamageFlags.Indirect | DamageFlags.HealthScaled | DamageFlags.Cost,
    );
  });

  battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
    last.delete(event.source);
  });
}

/** Revival Blessing and Tidy Up, which act on the field rather than a foe */
function setupField(battle: Battle): void {
  const fallenMate = (unit: Unit): boolean => {
    for (const mate of unit.team.units) {
      if (mate !== unit && !mate.alive) {
        return true;
      }
    }
    return false;
  };

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.RevivalBlessing) {
      event.usable =
        event.target.type === MoveTargetType.Unit
          ? !event.target.unit.alive && event.target.unit.team === event.source.team
          : fallenMate(event.source);
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move === Moves.RevivalBlessing) {
      const target = event.target.type === MoveTargetType.Unit ? event.target.unit : undefined;

      if (target == null || target.alive || target.team !== event.source.team) {
        event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
        return;
      }
      target.revive(Math.floor(target.checkStat(Stats.HP, 0) / 2));
      return;
    }
    if (event.move !== Moves.TidyUp) {
      return;
    }

    for (const team of battle.teams()) {
      clearSpikes(team);
      clearToxicSpikes(team);
      clearStealthRock(team);
      clearSteelsurge(team);
      clearStickyWeb(team);
    }

    const cause = { type: EffectType.Move, move: event.move, unit: event.source } as const;

    for (const unit of battle.units()) {
      if (unit.status[Statuses.Substituted] != null) {
        unit.removeStatus(Statuses.Substituted, cause);
      }
    }
  });
}
