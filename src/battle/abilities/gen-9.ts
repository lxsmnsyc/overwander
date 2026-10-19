import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stages, Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import Abilities from '../../data/ids/abilities';
import type { Items } from '../../data/ids/items';
import { DamageFlags, MoveCategories, MoveFlags, Moves } from '../../data/ids/moves';
import { Species } from '../../data/ids/species';
import { NON_VOLATILE_STATUSES, Statuses, Terrains, Weathers } from '../../data/ids/status';
import { getMoveData } from '../../data/moves';
import { isPseudoMove } from '../../data/moves/pseudo';
import { findSpeciesData } from '../../data/species';
import type Battle from '../battle';
import { BattleEvents, type EffectCause, EffectType, MoveTargetType } from '../events';
import { MergedLifecycle } from '../lifecycle';
import { FORCED_SWITCH_MOVES } from '../moves/switch-out';
import { setToxicSpikes, toxicLayersUnder } from '../moves/toxic-spikes';
import type Team from '../team';
import type Unit from '../unit';
import { isPrimalWeather, isWeatherSunny } from '../weather';
import onUnitActs from '../acts';
import { isOwnBerry } from '../items/held';
import {
  createAbility,
  createAbsorbStageAbility,
  createDrizzleAbility,
  createElectromorphosisAbility,
  createKeenEyeAbility,
  createLimberAbility,
  createMummyAbility,
  createOrichalcumPulseAbility,
  createPierceWindows,
  createProtosynthesisAbility,
  createQueenlyMajestyAbility,
  createRuinAbility,
  createSteelworkerAbility,
  createSurgeAbility,
  createThickFatAbility,
  getAbilityHolders,
  movesFlagged,
  movesOfType,
} from './__create';

/** What Rocky Payload makes of its Rock moves */
export const ROCKY_PAYLOAD_SCALE = 1.5;

/** What Well-Baked Body takes from a Fire move it swallows */
export const WELL_BAKED_STAGES = 2;

/** What Supreme Overlord adds per fallen teammate, and how many it counts */
export const SUPREME_OVERLORD_STEP = 0.1;
export const SUPREME_OVERLORD_LIMIT = 5;

/** How often Toxic Chain badly poisons what it hits */
export const TOXIC_CHAIN_CHANCE = 0.3;

/** The share of its HP Hospitality pours into a teammate */
export const HOSPITALITY_FRACTION = 1 / 4;

/** What a Commander's mount gains on every stat, once */
export const COMMANDER_STAGES = 2;

/** What Tera Shell turns any blow into while its holder is at full HP */
export const TERA_SHELL_EFFECTIVENESS = 0.5;

/** Where Anger Shell snaps */
const ANGER_SHELL_THRESHOLD = 1 / 2;

/** The stats Commander lifts on its mount */
const COMMANDER_STAGE_LIST = [
  Stages.Attack,
  Stages.Defense,
  Stages.SpecialAttack,
  Stages.SpecialDefense,
  Stages.Speed,
];

/** The three shapes a Tatsugiri commands from */
const TATSUGIRI = new Set<Species>([
  Species.Tatsugiri,
  Species.TatsugiriStretchy,
  Species.TatsugiriDroopy,
]);

/** The stat each of Ogerpon's masks raises on arrival, Terastallized or not */
const ASPECTS = new Map<Species, Stages>([
  [Species.Ogerpon, Stages.Speed],
  [Species.OgerponTealTera, Stages.Speed],
  [Species.OgerponWellspring, Stages.SpecialDefense],
  [Species.OgerponWellspringTera, Stages.SpecialDefense],
  [Species.OgerponHearthflame, Stages.Attack],
  [Species.OgerponHearthflameTera, Stages.Attack],
  [Species.OgerponCornerstone, Stages.Defense],
  [Species.OgerponCornerstoneTera, Stages.Defense],
]);

const POISONS = new Set<Statuses>([Statuses.Poisoned, Statuses.BadlyPoisoned]);

function abilityCause(ability: Abilities, unit: Unit): EffectCause {
  return { type: EffectType.Ability, ability, unit };
}

/** Whether a blow came from somebody else's damaging move */
function isStruckBy(event: { cause: EffectCause; target: Unit; flags: number }): boolean {
  return (
    (event.flags & DamageFlags.Indirect) === 0 &&
    event.cause.type === EffectType.Move &&
    event.cause.unit !== event.target
  );
}

/** The terrain laid where the unit stands, whether or not it touches the ground */
function terrainUnder(battle: Battle, unit: Unit): Terrains {
  return battle.terrain.current === Terrains.None
    ? unit.team.terrain.current
    : battle.terrain.current;
}

/** The skies and terrains Teraform Zero can wipe: a primal sky stays */
function clearable(battle: Battle): boolean {
  const skies: { weather: { current: Weathers }; terrain: { current: Terrains } }[] = [battle];

  for (const team of battle.teams()) {
    skies.push(team);
  }
  for (const sky of skies) {
    if (
      (sky.weather.current !== Weathers.None && !isPrimalWeather(sky.weather.current)) ||
      sky.terrain.current !== Terrains.None
    ) {
      return true;
    }
  }
  return false;
}

/** The teammate on the field a Tatsugiri can climb into, if one is free */
function mountFor(tatsugiri: Unit, taken: Map<Unit, Unit>): Unit | undefined {
  for (const mate of tatsugiri.team.units) {
    if (mate.alive && mate.species === Species.Dondozo && !isMounted(mate, taken)) {
      return mate;
    }
  }
  return undefined;
}

function isMounted(dondozo: Unit, taken: Map<Unit, Unit>): boolean {
  for (const mount of taken.values()) {
    if (mount === dondozo) {
      return true;
    }
  }
  return false;
}

/** The hurt teammate Hospitality serves, the one furthest down */
function mostHurtMate(unit: Unit): Unit | undefined {
  let found: Unit | undefined;
  let share = 1;

  for (const mate of unit.team.units) {
    if (mate === unit || !mate.alive) {
      continue;
    }

    const left = mate.health / mate.checkStat(Stats.HP, 0);

    if (left < share) {
      found = mate;
      share = left;
    }
  }
  return found;
}

/** The first teammate with a stage off zero, whose stages Costar copies */
function stagedMate(unit: Unit): Unit | undefined {
  for (const mate of unit.team.units) {
    if (mate === unit || !mate.alive) {
      continue;
    }
    for (const value of Object.values(mate.stages)) {
      if (value !== 0) {
        return mate;
      }
    }
  }
  return undefined;
}

function countFallen(team: Team, unit: Unit): number {
  let fallen = 0;

  for (const mate of team.units) {
    if (mate !== unit && !mate.alive) {
      fallen += 1;
    }
  }
  return Math.min(fallen, SUPREME_OVERLORD_LIMIT);
}

/** Paldea's abilities, and the Kitakami and Blueberry ones after it */
const setupAbilities = [
  // Lechonk's line: Mummy under another name
  // https://bulbapedia.bulbagarden.net/wiki/Lingering_Aroma_(Ability)
  createMummyAbility(Abilities.LingeringAroma),

  // Smoliv's line: a blow that lands sows Grassy Terrain, by casting it
  // https://bulbapedia.bulbagarden.net/wiki/Seed_Sower_(Ability)
  createAbility(
    Abilities.SeedSower,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
          const { source, target } = event;

          if (
            event.success &&
            event.category !== MoveCategories.Status &&
            source !== target &&
            target.hasAbility(Abilities.SeedSower) &&
            terrainUnder(battle, target) !== Terrains.Grassy
          ) {
            target.triggerAbility(Abilities.SeedSower);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.SeedSower) {
            event.source.triggerMove(Moves.GrassyTerrain, { type: MoveTargetType.None }, 0);
          }
        }),
      ]),
  ),

  /**
   * Frigibax's line: a Fire move landing on it raises its Attack, and
   * it cannot be burned. The burn guard cues the ability too, so the
   * rise is paid where the Fire move is seen rather than on the cue
   * https://bulbapedia.bulbagarden.net/wiki/Thermal_Exchange_(Ability)
   */
  createLimberAbility(Abilities.ThermalExchange, [Statuses.Burned]),
  createAbility(Abilities.ThermalExchange, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      const { source, target } = event;

      if (
        !event.success ||
        event.type !== Types.Fire ||
        event.category === MoveCategories.Status ||
        source === target ||
        !target.alive ||
        !target.hasAbility(Abilities.ThermalExchange)
      ) {
        return;
      }
      target.triggerAbility(Abilities.ThermalExchange);
      target.addStage(Stages.Attack, 1, abilityCause(Abilities.ThermalExchange, target));
    }),
  ),

  /**
   * Klawf: a blow that takes it to 1/2 HP or under cracks the shell,
   * trading its defences for offence. Only the crossing pays, as with
   * Berserk
   * https://bulbapedia.bulbagarden.net/wiki/Anger_Shell_(Ability)
   */
  createAbility(
    Abilities.AngerShell,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
          const target = event.target;

          if (
            !event.success ||
            !isStruckBy(event) ||
            !target.alive ||
            !target.hasAbility(Abilities.AngerShell)
          ) {
            return;
          }

          const line = target.checkStat(Stats.HP, 0) * ANGER_SHELL_THRESHOLD;

          if (target.health <= line && target.health + event.value > line) {
            target.triggerAbility(Abilities.AngerShell);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== Abilities.AngerShell) {
            return;
          }

          const unit = event.source;
          const cause = abilityCause(Abilities.AngerShell, unit);

          for (const stage of [Stages.Attack, Stages.SpecialAttack, Stages.Speed]) {
            unit.addStage(stage, 1, cause);
          }
          for (const stage of [Stages.Defense, Stages.SpecialDefense]) {
            unit.addStage(stage, -1, cause);
          }
        }),
      ]),
  ),

  // Nacli's line: no status settles on it, and Ghost moves hit it at 0.5x
  // https://bulbapedia.bulbagarden.net/wiki/Purifying_Salt_(Ability)
  createLimberAbility(Abilities.PurifyingSalt, [...NON_VOLATILE_STATUSES, Statuses.Drowsy]),
  createThickFatAbility(Abilities.PurifyingSalt, new Set([Types.Ghost])),

  // Fidough's line: Flash Fire's swallow, paid in Defense
  // https://bulbapedia.bulbagarden.net/wiki/Well-Baked_Body_(Ability)
  createAbsorbStageAbility(
    Abilities.WellBakedBody,
    Stages.Defense,
    movesOfType(Types.Fire),
    WELL_BAKED_STAGES,
  ),

  /**
   * Maschiff's line: an Intimidate raises its Attack rather than
   * lowering it, and nothing blows or roars it off the field
   * https://bulbapedia.bulbagarden.net/wiki/Guard_Dog_(Ability)
   */
  createAbility(Abilities.GuardDog, (battle) => {
    const rewriting = new Set<Unit>();

    return new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitCanAddStage, EventPriority.Post, (event) => {
        const unit = event.source;

        if (
          !event.success ||
          event.value >= 0 ||
          rewriting.has(unit) ||
          event.cause.type !== EffectType.Ability ||
          event.cause.ability !== Abilities.Intimidate ||
          !unit.hasAbility(Abilities.GuardDog)
        ) {
          return;
        }
        if (event.simulated) {
          event.value = -event.value;
          return;
        }
        event.success = false;
        unit.triggerAbility(Abilities.GuardDog);
        rewriting.add(unit);
        unit.addStage(event.stage, -event.value, abilityCause(Abilities.GuardDog, unit));
        rewriting.delete(unit);
      }),
      // Read as an immunity, as Suction Cups is: a forced switch
      // ignores whether its target can escape
      battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
        if (
          !event.immune &&
          FORCED_SWITCH_MOVES.has(event.move) &&
          event.target.type === MoveTargetType.Unit &&
          event.target.unit.hasAbility(Abilities.GuardDog)
        ) {
          event.immune = true;
        }
      }),
      battle.on(BattleEvents.UnitTriggerMoveFailed, EventPriority.Post, (event) => {
        const parent = event.parent;

        if (
          FORCED_SWITCH_MOVES.has(parent.move) &&
          parent.target.type === MoveTargetType.Unit &&
          parent.target.unit.hasAbility(Abilities.GuardDog)
        ) {
          parent.target.unit.triggerAbility(Abilities.GuardDog);
        }
      }),
    ]);
  }),

  // Bombirdier: what it drops is heavier
  // https://bulbapedia.bulbagarden.net/wiki/Rocky_Payload_(Ability)
  createSteelworkerAbility(Abilities.RockyPayload, Types.Rock, ROCKY_PAYLOAD_SCALE),

  // Wattrel's line and Tadbulb's: a gust, or any blow, charges them up
  // https://bulbapedia.bulbagarden.net/wiki/Wind_Power_(Ability)
  createElectromorphosisAbility(Abilities.WindPower, movesFlagged(MoveFlags.Wind)),
  createElectromorphosisAbility(Abilities.Electromorphosis, () => true),

  /**
   * Palafin: once it has left the field it comes back as the hero, and
   * stays the hero. Only a Palafin has the shape, and nothing happens
   * while the hero's data is missing
   * https://bulbapedia.bulbagarden.net/wiki/Zero_to_Hero_(Ability)
   */
  createAbility(Abilities.ZeroToHero, (battle) => {
    const left = new WeakSet<Unit>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        if (
          event.source.species === Species.Palafin &&
          event.source.hasAbility(Abilities.ZeroToHero)
        ) {
          left.add(event.source);
        }
      }),
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        const unit = event.source;

        if (
          left.has(unit) &&
          unit.alive &&
          unit.species === Species.Palafin &&
          unit.hasAbility(Abilities.ZeroToHero) &&
          findSpeciesData(Species.PalafinHero) != null
        ) {
          unit.triggerAbility(Abilities.ZeroToHero);
        }
      }),
      battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
        if (event.ability === Abilities.ZeroToHero && event.source.species === Species.Palafin) {
          left.delete(event.source);
          // Both shapes share an HP stat, so its health stands
          event.source.setSpecies(Species.PalafinHero);
        }
      }),
    ]);
  }),

  /**
   * Tatsugiri: beside a Dondozo it climbs into its mouth. It stops
   * acting and nothing can reach it, and the Dondozo gains 2 stages of
   * every stat, once. It climbs out when its mount falls or leaves
   * https://bulbapedia.bulbagarden.net/wiki/Commander_(Ability)
   */
  createAbility(Abilities.Commander, (battle) => {
    /** Each commanding Tatsugiri, and the Dondozo it is riding */
    const riding = new Map<Unit, Unit>();

    function board(unit: Unit): void {
      if (
        unit.alive &&
        TATSUGIRI.has(unit.species) &&
        !riding.has(unit) &&
        unit.hasAbility(Abilities.Commander) &&
        mountFor(unit, riding) != null
      ) {
        unit.triggerAbility(Abilities.Commander);
      }
    }

    function release(unit: Unit): void {
      riding.delete(unit);

      for (const [rider, mount] of riding) {
        if (mount === unit) {
          riding.delete(rider);
        }
      }
    }

    function hidden(unit: Unit): boolean {
      return riding.has(unit);
    }

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        if (TATSUGIRI.has(event.source.species)) {
          board(event.source);
          return;
        }
        if (event.source.species === Species.Dondozo) {
          for (const mate of event.source.team.units) {
            board(mate);
          }
        }
      }),
      battle.on(BattleEvents.UnitAddAbility, EventPriority.Post, (event) => {
        if (event.ability === Abilities.Commander) {
          board(event.source);
        }
      }),
      battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
        const rider = event.source;

        if (event.ability !== Abilities.Commander || riding.has(rider)) {
          return;
        }

        const mount = mountFor(rider, riding);

        if (mount == null) {
          return;
        }
        riding.set(rider, mount);
        rider.interrupt();

        const cause = abilityCause(Abilities.Commander, rider);

        for (const stage of COMMANDER_STAGE_LIST) {
          mount.addStage(stage, COMMANDER_STAGES, cause);
        }
      }),
      battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, (event) => {
        if (event.success && hidden(event.source)) {
          event.success = false;
        }
      }),
      battle.on(BattleEvents.CheckUnitCanChannel, EventPriority.Post, (event) => {
        if (event.success && hidden(event.source)) {
          event.success = false;
        }
      }),
      battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
        if (
          !event.immune &&
          event.target.type === MoveTargetType.Unit &&
          event.target.unit !== event.source &&
          hidden(event.target.unit)
        ) {
          event.immune = true;
        }
      }),
      battle.on(BattleEvents.CheckUnitCanDamage, EventPriority.Post, (event) => {
        if (event.success && hidden(event.target) && isStruckBy(event)) {
          event.success = false;
        }
      }),
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        release(event.source);
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        release(event.source);
      }),
    ]);
  }),

  // Great Tusk and Iron Treads' kin: sun, or Electric Terrain, or a
  // Booster Energy lifts the highest stat
  // https://bulbapedia.bulbagarden.net/wiki/Quark_Drive_(Ability)
  createProtosynthesisAbility(Abilities.Protosynthesis, isWeatherSunny),
  createProtosynthesisAbility(
    Abilities.QuarkDrive,
    (unit) => terrainUnder(unit.battle, unit) === Terrains.Electric,
  ),

  // Gimmighoul's line: no status move from anybody else lands on it
  // https://bulbapedia.bulbagarden.net/wiki/Good_as_Gold_(Ability)
  createAbility(Abilities.GoodAsGold, (battle) => {
    function shields(source: Unit, move: Moves, target: Unit): boolean {
      return (
        target !== source &&
        getMoveData(move).category === MoveCategories.Status &&
        target.hasAbility(Abilities.GoodAsGold)
      );
    }

    return new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
        if (
          !event.immune &&
          event.target.type === MoveTargetType.Unit &&
          shields(event.source, event.move, event.target.unit)
        ) {
          event.immune = true;
        }
      }),
      battle.on(BattleEvents.UnitTriggerMoveFailed, EventPriority.Post, (event) => {
        const parent = event.parent;

        if (
          parent.target.type === MoveTargetType.Unit &&
          shields(parent.source, parent.move, parent.target.unit)
        ) {
          parent.target.unit.triggerAbility(Abilities.GoodAsGold);
        }
      }),
    ]);
  }),

  // The four treasures: each cuts one stat of everybody else on the field
  // https://bulbapedia.bulbagarden.net/wiki/Tablets_of_Ruin_(Ability)
  createRuinAbility(Abilities.TabletsOfRuin, Stats.Attack),
  createRuinAbility(Abilities.SwordOfRuin, Stats.Defense),
  createRuinAbility(Abilities.VesselOfRuin, Stats.SpecialAttack),
  createRuinAbility(Abilities.BeadsOfRuin, Stats.SpecialDefense),

  // Koraidon and Miraidon: each lays its own ground on arrival, and
  // fights harder on it
  // https://bulbapedia.bulbagarden.net/wiki/Hadron_Engine_(Ability)
  createDrizzleAbility(Abilities.OrichalcumPulse, Weathers.Sunny),
  createOrichalcumPulseAbility(Abilities.OrichalcumPulse, Stats.Attack, isWeatherSunny),
  createSurgeAbility(Abilities.HadronEngine, Moves.ElectricTerrain),
  createOrichalcumPulseAbility(
    Abilities.HadronEngine,
    Stats.SpecialAttack,
    (unit) => terrainUnder(unit.battle, unit) === Terrains.Electric,
  ),

  /**
   * Flittle's line: whatever stat a foe raises, it raises too. Its own
   * copies are not copied back, so two of them do not feed each other
   * https://bulbapedia.bulbagarden.net/wiki/Opportunist_(Ability)
   */
  createAbility(Abilities.Opportunist, (battle) =>
    battle.on(BattleEvents.UnitAddStage, EventPriority.Post, (event) => {
      const cause = event.cause;

      if (
        event.value <= 0 ||
        (cause.type === EffectType.Ability && cause.ability === Abilities.Opportunist)
      ) {
        return;
      }
      for (const holder of getAbilityHolders(battle, Abilities.Opportunist)) {
        if (
          holder.alive &&
          holder.team.alliance !== event.source.team.alliance &&
          holder.hasAbility(Abilities.Opportunist)
        ) {
          holder.triggerAbility(Abilities.Opportunist);
          holder.addStage(event.stage, event.value, abilityCause(Abilities.Opportunist, holder));
        }
      }
    }),
  ),

  /**
   * Tauros of Paldea, Farigiraf's line: a berry it ate is chewed again
   * the next time it acts, which is this engine's end of the next turn.
   * The second bite costs the catch record nothing more
   * https://bulbapedia.bulbagarden.net/wiki/Cud_Chew_(Ability)
   */
  createAbility(Abilities.CudChew, (battle) => {
    const eaten = new Map<Unit, Items>();
    /**
     * Armed as an act opens, before anything paid on it, so a berry
     * eaten to a residual of this very act waits for the next one
     */
    const ready = new Set<Unit>();

    function forget(unit: Unit): void {
      eaten.delete(unit);
      ready.delete(unit);
    }

    function arm(unit: Unit): void {
      if (eaten.has(unit)) {
        ready.add(unit);
      }
    }

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitRemoveItem, EventPriority.Post, (event) => {
        if (isOwnBerry(event.cause, event.source) && event.source.hasAbility(Abilities.CudChew)) {
          eaten.set(event.source, event.item);
          ready.delete(event.source);
        }
      }),
      battle.on(BattleEvents.UnitCast, EventPriority.Pre, (event) => {
        arm(event.source);
      }),
      battle.on(BattleEvents.UnitChannel, EventPriority.Pre, (event) => {
        arm(event.source);
      }),
      ...onUnitActs(battle, (unit) => {
        if (ready.has(unit) && unit.hasAbility(Abilities.CudChew)) {
          unit.triggerAbility(Abilities.CudChew);
        }
      }),
      battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
        const unit = event.source;
        const berry = eaten.get(unit);

        if (event.ability !== Abilities.CudChew || berry == null) {
          return;
        }
        forget(unit);
        unit.addItem(berry);

        // The hand may be full, which leaves nothing to chew
        if (unit.items[berry] !== true) {
          return;
        }
        unit.disableItem(berry);
        unit.triggerItem(berry);
        unit.removeItem(berry, abilityCause(Abilities.CudChew, unit));
      }),
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        forget(event.source);
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        forget(event.source);
      }),
    ]);
  }),

  // Kingambit: each fallen teammate lifts its moves, up to five
  // https://bulbapedia.bulbagarden.net/wiki/Supreme_Overlord_(Ability)
  createAbility(Abilities.SupremeOverlord, (battle) =>
    battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      if (event.power == null || !event.source.hasAbility(Abilities.SupremeOverlord)) {
        return;
      }

      const fallen = countFallen(event.source.team, event.source);

      if (fallen > 0) {
        event.power *= 1 + SUPREME_OVERLORD_STEP * fallen;
      }
    }),
  ),

  // Flamigo: on arrival it copies a teammate's stat stages
  // https://bulbapedia.bulbagarden.net/wiki/Costar_(Ability)
  createAbility(
    Abilities.Costar,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (
            !event.reactivation &&
            event.source.alive &&
            event.source.hasAbility(Abilities.Costar) &&
            stagedMate(event.source) != null
          ) {
            event.source.triggerAbility(Abilities.Costar);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== Abilities.Costar) {
            return;
          }

          const unit = event.source;
          const star = stagedMate(unit);

          if (star == null) {
            return;
          }

          const cause = abilityCause(Abilities.Costar, unit);

          for (const [key, value] of Object.entries(star.stages)) {
            const stage: Stages = Number(key);
            const change = value - unit.stages[stage];

            if (change !== 0) {
              unit.addStage(stage, change, cause);
            }
          }
        }),
      ]),
  ),

  /**
   * Glimmet's line: a physical blow knocks shards loose, laying a
   * layer of Toxic Spikes under the attacker's side
   * https://bulbapedia.bulbagarden.net/wiki/Toxic_Debris_(Ability)
   */
  createAbility(Abilities.ToxicDebris, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      const { source, target } = event;

      if (
        !event.success ||
        event.category !== MoveCategories.Physical ||
        source === target ||
        !target.hasAbility(Abilities.ToxicDebris)
      ) {
        return;
      }

      const team = source.team;
      const laid = toxicLayersUnder(team);

      // Two layers is as deep as they go
      if (laid >= 2) {
        return;
      }
      target.triggerAbility(Abilities.ToxicDebris);
      setToxicSpikes(team, laid + 1, abilityCause(Abilities.ToxicDebris, target));
    }),
  ),

  // Farigiraf: Queenly Majesty under another name
  // https://bulbapedia.bulbagarden.net/wiki/Armor_Tail_(Ability)
  createQueenlyMajestyAbility(Abilities.ArmorTail),

  /**
   * Toedscool's line: its status moves wind up slower, as Stall's do,
   * and go through whatever ability the target has
   * https://bulbapedia.bulbagarden.net/wiki/Mycelium_Might_(Ability)
   */
  createAbility(Abilities.MyceliumMight, (battle) => {
    function spreads(source: Unit, move: Moves): boolean {
      return (
        !isPseudoMove(move) &&
        getMoveData(move).category === MoveCategories.Status &&
        source.hasAbility(Abilities.MyceliumMight)
      );
    }

    return new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitMovePriority, EventPriority.Post, (event) => {
        if (spreads(event.source, event.move)) {
          event.priority -= 1;
        }
      }),
      ...createPierceWindows(battle, spreads),
    ]);
  }),

  // Ursaluna of the Bloodmoon: Keen Eye, and its Normal and Fighting
  // moves reach a Ghost
  // https://bulbapedia.bulbagarden.net/wiki/Mind%27s_Eye_(Ability)
  createKeenEyeAbility(Abilities.MindsEye),
  createAbility(Abilities.MindsEye, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
      if (
        event.immune &&
        (event.type === Types.Normal || event.type === Types.Fighting) &&
        event.target.type === MoveTargetType.Unit &&
        event.target.unit.types.has(Types.Ghost) &&
        event.source.hasAbility(Abilities.MindsEye)
      ) {
        event.immune = false;
      }
    }),
  ),

  // Dipplin's line: the first time it arrives in a fight, its foes lose
  // 1 stage of evasion
  // https://bulbapedia.bulbagarden.net/wiki/Supersweet_Syrup_(Ability)
  createAbility(Abilities.SupersweetSyrup, (battle) => {
    const spent = new WeakSet<Unit>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        const unit = event.source;

        if (!spent.has(unit) && unit.alive && unit.hasAbility(Abilities.SupersweetSyrup)) {
          unit.triggerAbility(Abilities.SupersweetSyrup);
        }
      }),
      battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
        if (event.ability !== Abilities.SupersweetSyrup) {
          return;
        }
        spent.add(event.source);

        const cause = abilityCause(Abilities.SupersweetSyrup, event.source);

        for (const foe of battle.units(event.source.team.alliance)) {
          if (foe.alive) {
            foe.addStage(Stages.Evasion, -1, cause);
          }
        }
      }),
    ]);
  }),

  // Poltchageist's line: on arrival it pours its most hurt teammate a
  // cup worth 1/4 of that teammate's HP
  // https://bulbapedia.bulbagarden.net/wiki/Hospitality_(Ability)
  createAbility(
    Abilities.Hospitality,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (
            !event.reactivation &&
            event.source.alive &&
            event.source.hasAbility(Abilities.Hospitality) &&
            mostHurtMate(event.source) != null
          ) {
            event.source.triggerAbility(Abilities.Hospitality);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== Abilities.Hospitality) {
            return;
          }

          const guest = mostHurtMate(event.source);

          guest?.heal(
            abilityCause(Abilities.Hospitality, event.source),
            guest,
            guest.checkStat(Stats.HP, 0) * HOSPITALITY_FRACTION,
            0,
          );
        }),
      ]),
  ),

  // Okidogi: any blow it lands may badly poison
  // https://bulbapedia.bulbagarden.net/wiki/Toxic_Chain_(Ability)
  createAbility(Abilities.ToxicChain, (battle) =>
    battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
      const cause = event.cause;

      if (
        !event.success ||
        !isStruckBy(event) ||
        cause.type !== EffectType.Move ||
        !event.target.alive ||
        !cause.unit.hasAbility(Abilities.ToxicChain) ||
        battle.random() >= TOXIC_CHAIN_CHANCE
      ) {
        return;
      }
      cause.unit.triggerAbility(Abilities.ToxicChain);
      event.target.addStatus(
        Statuses.BadlyPoisoned,
        abilityCause(Abilities.ToxicChain, cause.unit),
      );
    }),
  ),

  /**
   * Ogerpon: the first time it arrives in a fight, its mask raises one
   * stat: Speed for the Teal, Special Defense for the Wellspring,
   * Attack for the Hearthflame and Defense for the Cornerstone
   * https://bulbapedia.bulbagarden.net/wiki/Embody_Aspect_(Ability)
   */
  createAbility(Abilities.EmbodyAspect, (battle) => {
    const spent = new WeakSet<Unit>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        const unit = event.source;

        if (
          !spent.has(unit) &&
          unit.alive &&
          ASPECTS.has(unit.species) &&
          unit.hasAbility(Abilities.EmbodyAspect)
        ) {
          unit.triggerAbility(Abilities.EmbodyAspect);
        }
      }),
      battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
        const stage = ASPECTS.get(event.source.species);

        if (event.ability !== Abilities.EmbodyAspect || stage == null) {
          return;
        }
        spent.add(event.source);
        event.source.addStage(stage, 1, abilityCause(Abilities.EmbodyAspect, event.source));
      }),
    ]);
  }),

  // Terapagos: it takes its Terastal shape as it arrives, once that
  // shape's data is there to take
  // https://bulbapedia.bulbagarden.net/wiki/Tera_Shift_(Ability)
  createAbility(Abilities.TeraShift, (battle) => {
    function shift(unit: Unit): void {
      if (
        unit.alive &&
        unit.species === Species.Terapagos &&
        unit.hasAbility(Abilities.TeraShift) &&
        findSpeciesData(Species.TerapagosTerastal) != null
      ) {
        unit.triggerAbility(Abilities.TeraShift);
      }
    }

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        shift(event.source);
      }),
      battle.on(BattleEvents.UnitAddAbility, EventPriority.Post, (event) => {
        if (event.ability === Abilities.TeraShift) {
          shift(event.source);
        }
      }),
      battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
        if (event.ability === Abilities.TeraShift && event.source.species === Species.Terapagos) {
          event.source.setSpecies(Species.TerapagosTerastal);
        }
      }),
    ]);
  }),

  /**
   * Terapagos: at full HP every damaging blow lands not very effective,
   * whatever its type would have made of it. The effectiveness arrives
   * a type at a time, so it is gathered and rewritten on the damage
   * https://bulbapedia.bulbagarden.net/wiki/Tera_Shell_(Ability)
   */
  createAbility(Abilities.TeraShell, (battle) => {
    const totals = new WeakMap<object, number>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitAttackResolveEffectiveness, EventPriority.Post, (event) => {
        if (event.parent.target.hasAbility(Abilities.TeraShell)) {
          totals.set(event.parent, (totals.get(event.parent) ?? 1) * event.multiplier);
        }
      }),
      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        const target = event.parent.target;
        const total = totals.get(event.parent);

        if (
          total != null &&
          total > 0 &&
          target.health >= target.checkStat(Stats.HP, 0) &&
          target.hasAbility(Abilities.TeraShell)
        ) {
          event.value *= TERA_SHELL_EFFECTIVENESS / total;
          target.triggerAbility(Abilities.TeraShell);
        }
      }),
    ]);
  }),

  // Terapagos in its Stellar shape: arriving wipes every weather and
  // terrain off the field. A primal sky is beyond it
  // https://bulbapedia.bulbagarden.net/wiki/Teraform_Zero_(Ability)
  createAbility(
    Abilities.TeraformZero,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (event.source.hasAbility(Abilities.TeraformZero) && clearable(battle)) {
            event.source.triggerAbility(Abilities.TeraformZero);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== Abilities.TeraformZero) {
            return;
          }
          if (battle.terrain.current !== Terrains.None) {
            battle.setTerrain(Terrains.None);
          }
          if (
            battle.weather.current !== Weathers.None &&
            !isPrimalWeather(battle.weather.current)
          ) {
            battle.setWeather(Weathers.None);
          }
          for (const team of battle.teams()) {
            if (team.terrain.current !== Terrains.None) {
              team.setTerrain(Terrains.None);
            }
            if (team.weather.current !== Weathers.None && !isPrimalWeather(team.weather.current)) {
              team.setWeather(Weathers.None);
            }
          }
        }),
      ]),
  ),

  // Pecharunt: whatever it poisons is confused as well
  // https://bulbapedia.bulbagarden.net/wiki/Poison_Puppeteer_(Ability)
  createAbility(Abilities.PoisonPuppeteer, (battle) =>
    battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
      const cause = event.cause;

      if (
        !POISONS.has(event.status) ||
        cause.type === EffectType.None ||
        cause.unit === event.source ||
        !event.source.alive ||
        event.source.status[Statuses.Confused] != null ||
        !cause.unit.hasAbility(Abilities.PoisonPuppeteer)
      ) {
        return;
      }
      cause.unit.triggerAbility(Abilities.PoisonPuppeteer);
      event.source.addStatus(
        Statuses.Confused,
        abilityCause(Abilities.PoisonPuppeteer, cause.unit),
      );
    }),
  ),
];

export default function setupGen9Abilities(battle: Battle): void {
  for (const setup of setupAbilities) {
    setup(battle);
  }
}
