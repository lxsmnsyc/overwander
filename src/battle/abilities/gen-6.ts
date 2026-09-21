import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stages, Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import Abilities from '../../data/ids/abilities';
import { DamageFlags, MoveAttackFlags, MoveCategories, Moves } from '../../data/ids/moves';
import { Species, getBaseFormSpecies } from '../../data/ids/species';
import { Statuses, Terrains } from '../../data/ids/status';
import { MergedLifecycle } from '../lifecycle';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import type Unit from '../unit';
import { hasFreeItemSlot, stealableItem, unitTarget } from '../utils';
import { HEALING_MOVES } from '../moves/recover';
import { fieldHolder } from './signature/__create';
import {
  createAbility,
  createContactHazard,
  createTypeShiftAbility,
  createWaterAbsorbAbility,
} from './__create';

/** What a pelt of grass is worth while there is grass to stand on */
const GRASS_PELT_SCALE = 1.5;

/** The teammate holding the veil over this one, if one is standing */
function veiledBy(unit: Unit, ability: Abilities): Unit | undefined {
  if (!unit.types.has(Types.Grass)) {
    return undefined;
  }

  for (const mate of unit.team.units) {
    if (mate.alive && mate.hasAbility(ability)) {
      return mate;
    }
  }

  return undefined;
}

/**
 * What a claw built like a gun fires: the pulses and the aura moves,
 * which the mainline counts as one family
 * https://bulbapedia.bulbagarden.net/wiki/Mega_Launcher_(Ability)
 */
const PULSE_MOVES = new Set<Moves>([
  Moves.AuraSphere,
  Moves.DarkPulse,
  Moves.DragonPulse,
  Moves.HealPulse,
  Moves.OriginPulse,
  Moves.WaterPulse,
]);

/** What a launcher is worth to a pulse, thrown or given */
const MEGA_LAUNCHER_SCALE = 1.5;

/** What the cold is worth to a move it froze on the way out */
const REFRIGERATE_SCALE = 1.2;

/** What the ribbon is worth to a move it wrapped on the way out */
const PIXILATE_SCALE = 1.2;

/**
 * What an aura is worth to the type it carries, and what it is worth
 * once something on the field is breaking auras rather than casting
 * them
 * https://bulbapedia.bulbagarden.net/wiki/Fairy_Aura_(Ability)
 */
const AURA_SCALE = 4 / 3;
const BROKEN_AURA_SCALE = 3 / 4;

/** How much of itself a Zygarde has to lose before the rest gathers */
const POWER_CONSTRUCT_THRESHOLD = 1 / 2;

/** What Triage moves a heal ahead by, which here is cast time */
const TRIAGE_PRIORITY = 3;

/** The teammate keeping this one awake, if one is standing */
function sweetenedBy(unit: Unit): Unit | undefined {
  for (const mate of unit.team.units) {
    if (mate.alive && mate.hasAbility(Abilities.SweetVeil)) {
      return mate;
    }
  }

  return undefined;
}

/**
 * What a shell thick enough to stop a shot turns away: everything
 * thrown rather than swung, which the mainline calls ballistic
 * https://bulbapedia.bulbagarden.net/wiki/Bulletproof_(Ability)
 */
const BALLISTIC_MOVES = new Set<Moves>([
  Moves.AcidSpray,
  Moves.AuraSphere,
  Moves.Barrage,
  Moves.BulletSeed,
  Moves.EggBomb,
  Moves.ElectroBall,
  Moves.EnergyBall,
  Moves.FocusBlast,
  Moves.GyroBall,
  Moves.IceBall,
  Moves.MagnetBomb,
  Moves.MistBall,
  Moves.MudBomb,
  Moves.Octazooka,
  Moves.RockBlast,
  Moves.RockWrecker,
  Moves.SearingShot,
  Moves.SeedBomb,
  Moves.ShadowBall,
  Moves.SludgeBomb,
  Moves.WeatherBall,
  Moves.ZapCannon,
]);

/**
 * One aura over the whole field, its own side included. A break on
 * the field turns every aura round rather than switching it off,
 * which is what the mainline does with it
 */
function createAuraAbility(ability: Abilities, type: Types): (battle: Battle) => void {
  return createAbility(ability, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      if (event.parent.type !== type || fieldHolder(battle, ability) == null) {
        return;
      }

      event.value *=
        fieldHolder(battle, Abilities.AuraBreak) == null ? AURA_SCALE : BROKEN_AURA_SCALE;
    }),
  );
}

/** Kalos's abilities, which are the same list its starters need */
const setupAbilities = [
  // Chespin: the burr that shrugs off anything thrown at it
  createAbility(Abilities.Bulletproof, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
      if (
        !event.immune &&
        BALLISTIC_MOVES.has(event.move) &&
        event.target.type === MoveTargetType.Unit &&
        event.target.unit.hasAbility(Abilities.Bulletproof)
      ) {
        event.immune = true;
        event.target.unit.triggerAbility(Abilities.Bulletproof);
      }
    }),
  ),

  // Fennekin: Pickpocket the other way round, and without the touch.
  // The trick is worked on whatever it lands a move on, so long as its
  // own hands are empty
  createAbility(Abilities.Magician, (battle) =>
    battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
      if (
        !event.success ||
        (event.flags & DamageFlags.Indirect) !== 0 ||
        event.cause.type !== EffectType.Move ||
        event.cause.unit === event.target ||
        !event.cause.unit.hasAbility(Abilities.Magician)
      ) {
        return;
      }

      const thief = event.cause.unit;
      const item = stealableItem(event.target);

      if (item == null || !hasFreeItemSlot(thief)) {
        return;
      }

      thief.triggerAbility(Abilities.Magician);
      event.target.removeItem(item, {
        type: EffectType.Ability,
        ability: Abilities.Magician,
        unit: thief,
      });
      thief.addItem(item);
    }),
  ),

  // Flabebe: the flower keeps the bed, so the veil is over every
  // grass on its own team rather than over itself alone
  createAbility(
    Abilities.FlowerVeil,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Post, (event) => {
          if (!event.immune && veiledBy(event.source, Abilities.FlowerVeil) != null) {
            event.immune = true;
          }
        }),
        battle.on(BattleEvents.UnitAddStatusFailed, EventPriority.Post, (event) => {
          veiledBy(event.source, Abilities.FlowerVeil)?.triggerAbility(Abilities.FlowerVeil);
        }),
        // A drop it puts on itself still lands, the way Clear Body's does
        battle.on(BattleEvents.CheckUnitCanAddStage, EventPriority.Post, (event) => {
          const keeper = veiledBy(event.source, Abilities.FlowerVeil);

          if (
            event.success &&
            event.value < 0 &&
            keeper != null &&
            event.cause.type !== EffectType.None &&
            event.cause.unit !== event.source
          ) {
            event.success = false;

            if (!event.simulated) {
              keeper.triggerAbility(Abilities.FlowerVeil);
            }
          }
        }),
      ]),
  ),

  // Flabebe: what a teammate eats is replaced out of its own hands.
  // Only an item the holder spent itself counts, so one knocked off
  // is nobody's cue
  createAbility(Abilities.Symbiosis, (battle) =>
    battle.on(BattleEvents.UnitRemoveItem, EventPriority.Post, (event) => {
      const eater = event.source;

      if (event.cause.type !== EffectType.Item || !eater.alive || !hasFreeItemSlot(eater)) {
        return;
      }

      for (const mate of eater.team.units) {
        if (mate === eater || !mate.alive || !mate.hasAbility(Abilities.Symbiosis)) {
          continue;
        }

        const item = stealableItem(mate);

        if (item == null) {
          continue;
        }

        mate.triggerAbility(Abilities.Symbiosis);
        mate.removeItem(item, {
          type: EffectType.Ability,
          ability: Abilities.Symbiosis,
          unit: mate,
        });
        eater.addItem(item);
        return;
      }
    }),
  ),

  // Skiddo: the pelt is worth something only where there is grass
  // under it
  createAbility(Abilities.GrassPelt, (battle) =>
    battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
      if (
        event.stat === Stats.Defense &&
        event.source.hasAbility(Abilities.GrassPelt) &&
        event.source.checkTerrain() === Terrains.Grassy
      ) {
        event.value *= GRASS_PELT_SCALE;
      }
    }),
  ),

  // Florges: the mist comes up with it, cast as the move rather than
  // laid by hand, so the terrain's own clock runs it
  createAbility(
    Abilities.MistySurge,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (event.source.hasAbility(Abilities.MistySurge)) {
            event.source.triggerAbility(Abilities.MistySurge);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.MistySurge) {
            event.source.triggerMove(Moves.MistyTerrain, { type: MoveTargetType.None }, 0);
          }
        }),
      ]),
  ),

  // Clauncher: the claw is a barrel, so anything fired down it lands
  // harder, and the one pulse that mends rather than hurts mends more
  createAbility(
    Abilities.MegaLauncher,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
          if (
            PULSE_MOVES.has(event.parent.move) &&
            event.parent.source.hasAbility(Abilities.MegaLauncher)
          ) {
            event.value *= MEGA_LAUNCHER_SCALE;
          }
        }),
        battle.on(BattleEvents.UnitHeal, EventPriority.Post, (event) => {
          if (
            event.cause.type === EffectType.Move &&
            event.cause.move === Moves.HealPulse &&
            event.cause.unit.hasAbility(Abilities.MegaLauncher)
          ) {
            event.value *= MEGA_LAUNCHER_SCALE;
          }
        }),
      ]),
  ),

  // Amaura: what it throws freezes on the way out, which is worth a
  // fifth again on top of landing as Ice
  createTypeShiftAbility(Abilities.Refrigerate, Types.Normal, Types.Ice, REFRIGERATE_SCALE),

  // Swirlix: the cream is a bed, so nothing on its team goes to sleep
  createAbility(
    Abilities.SweetVeil,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Post, (event) => {
          if (
            !event.immune &&
            event.status === Statuses.Sleeping &&
            sweetenedBy(event.source) != null
          ) {
            event.immune = true;
          }
        }),
        battle.on(BattleEvents.UnitAddStatusFailed, EventPriority.Post, (event) => {
          if (event.status === Statuses.Sleeping) {
            sweetenedBy(event.source)?.triggerAbility(Abilities.SweetVeil);
          }
        }),
      ]),
  ),

  // Sylveon: what it throws goes out as ribbon rather than as noise
  createTypeShiftAbility(Abilities.Pixilate, Types.Normal, Types.Fairy, PIXILATE_SCALE),

  // Xerneas and Yveltal: each lays its own type over the whole field
  createAuraAbility(Abilities.FairyAura, Types.Fairy),
  createAuraAbility(Abilities.DarkAura, Types.Dark),

  // Zygarde: it casts no aura of its own and turns the ones that are
  // cast, which the two aura abilities read for themselves
  createAbility(Abilities.AuraBreak, (battle) =>
    battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
      if (event.source.hasAbility(Abilities.AuraBreak)) {
        event.source.triggerAbility(Abilities.AuraBreak);
      }
    }),
  ),

  // Zygarde: the rest of the cells come when half of what is here is
  // gone. The shape it gathers into carries its own stats, so the
  // health it is on stays where it is
  createAbility(Abilities.PowerConstruct, (battle) =>
    battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
      const unit = event.target;

      if (
        !unit.alive ||
        !unit.hasAbility(Abilities.PowerConstruct) ||
        unit.species === Species.ZygardeComplete ||
        getBaseFormSpecies(unit.species) !== Species.Zygarde ||
        unit.health > unit.checkStat(Stats.HP, 0) * POWER_CONSTRUCT_THRESHOLD
      ) {
        return;
      }

      unit.triggerAbility(Abilities.PowerConstruct);
      unit.setSpecies(Species.ZygardeComplete);
    }),
  ),

  // Xerneas: a heal it reaches for is already on its way
  createAbility(Abilities.Triage, (battle) =>
    battle.on(BattleEvents.CheckUnitMovePriority, EventPriority.Post, (event) => {
      if (HEALING_MOVES.has(event.move) && event.source.hasAbility(Abilities.Triage)) {
        event.priority += TRIAGE_PRIORITY;
      }
    }),
  ),

  // Zygarde: the ground it is made of is something it can take back
  createWaterAbsorbAbility(Abilities.EarthEater, Types.Ground),

  // Goomy: the slime comes off on whatever touches it, and a foot
  // in it is a foot that is slower afterwards
  createAbility(
    Abilities.Gooey,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
          if (
            !event.success ||
            (event.flags & DamageFlags.Indirect) !== 0 ||
            event.cause.type !== EffectType.Move ||
            event.cause.unit === event.target ||
            !event.target.hasAbility(Abilities.Gooey) ||
            !event.cause.unit.checkMoveContact(event.cause.move, unitTarget(event.target))
          ) {
            return;
          }

          event.target.triggerAbility(Abilities.Gooey);
          event.cause.unit.addStage(Stages.Speed, -1, {
            type: EffectType.Ability,
            ability: Abilities.Gooey,
            unit: event.target,
          });
        }),
        // Touching it costs something, so the AI is told before it
        // decides to
        createContactHazard(battle, Abilities.Gooey),
      ]),
  ),

  // Honedge: the sword is a shield until it swings. Both shapes carry
  // their own stats and share an HP stat, so turning over moves
  // nothing underneath it
  createAbility(Abilities.StanceChange, (battle) => {
    function stand(unit: Unit, shape: Species): void {
      if (
        !unit.alive ||
        !unit.hasAbility(Abilities.StanceChange) ||
        getBaseFormSpecies(unit.species) !== Species.Aegislash ||
        unit.species === shape
      ) {
        return;
      }
      unit.triggerAbility(Abilities.StanceChange);
      unit.setSpecies(shape);
    }

    return new MergedLifecycle([
      // Drawn before the blow resolves, so the edge is what the
      // damage is worked out from
      battle.on(BattleEvents.UnitAttack, AttackPriority.Pre, (event) => {
        if (
          event.category !== MoveCategories.Status &&
          (event.flags & MoveAttackFlags.Simulated) === 0
        ) {
          stand(event.source, Species.AegislashBlade);
        }
      }),
      battle.on(BattleEvents.UnitCast, EventPriority.Post, (event) => {
        if (event.move === Moves.KingsShield) {
          stand(event.source, Species.Aegislash);
        }
      }),
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        stand(event.source, Species.Aegislash);
      }),
    ]);
  }),
];

export default function setupGen6Abilities(battle: Battle): void {
  for (const setup of setupAbilities) {
    setup(battle);
  }
}
