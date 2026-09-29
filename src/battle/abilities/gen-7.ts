import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { hashString } from '../../core/hash';
import { Stages, Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import Abilities from '../../data/ids/abilities';
import { DamageFlags, MoveCategories, MoveFlags, Moves } from '../../data/ids/moves';
import { MINIOR_FORMS, Species, getBaseFormSpecies } from '../../data/ids/species';
import { NON_VOLATILE_STATUSES, Statuses, Terrains } from '../../data/ids/status';
import { getMoveData } from '../../data/moves';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType, type UnitAttackEvent } from '../events';
import { MergedLifecycle } from '../lifecycle';
import type Unit from '../unit';
import { isOwnBerry, isPrimalWeather, onUnitActs } from '../utils';
import {
  createAbility,
  createClearBodyAbility,
  createFilterAbility,
  createGooeyAbility,
  createLimberAbility,
  createMultiscaleAbility,
  createNoContactAbility,
  createQueenlyMajestyAbility,
  createReceiverAbility,
  createRetreatAbility,
  createSandRushAbility,
  createSurgeAbility,
  createThickFatAbility,
  createTypeShiftAbility,
} from './__create';

/** What Neuroforce makes a super-effective blow worth */
export const NEUROFORCE_SCALE = 1.25;

/** What a blow on something that has not yet acted is worth */
export const STAKEOUT_SCALE = 2;

/** The level a Wishiwashi can first call a school at */
export const SCHOOLING_LEVEL = 20;

/** The share of its HP a school holds together above */
export const SCHOOLING_THRESHOLD = 1 / 4;

/** What the bubble does for its own Water moves */
export const WATER_BUBBLE_SCALE = 2;

/** What a Water move packs onto the sand's Defense */
export const WATER_COMPACTION_STAGES = 2;

/** What breaking the rag costs the Mimikyu under it */
export const DISGUISE_CHIP = 1 / 8;

/** What the charge is worth to a Normal move it turned Electric */
export const GALVANIZE_SCALE = 1.2;

/** What a berry does for a Ripen holder that eats it */
export const RIPEN_SCALE = 2;

/** The share of its HP a Minior keeps its shell above */
export const SHIELDS_DOWN_THRESHOLD = 1 / 2;

/** What the fur makes of a touching blow, and of a Fire one */
export const FLUFFY_CONTACT_SCALE = 0.5;
export const FLUFFY_FIRE_SCALE = 2;

const FIRE = new Set([Types.Fire]);

const POISONS = new Set([Statuses.Poisoned, Statuses.BadlyPoisoned]);

/** What a Minior's shell keeps out: the major statuses, and Yawn's drowsiness */
const SHELL_PROOF = new Set([...NON_VOLATILE_STATUSES, Statuses.Drowsy]);

/**
 * The core under an individual Minior's shell. Read off its catch id,
 * or off its own measurements when it stands for no record
 */
export function getMiniorCore(unit: Unit): Species {
  const key = unit.caught === '' ? `${unit.height}:${unit.weight}` : unit.caught;

  return MINIOR_FORMS[1 + (hashString(key) % (MINIOR_FORMS.length - 1))];
}

/** Whether a move is carried on sound, which is what a voice can wet */
function isSound(move: Moves): boolean {
  return (getMoveData(move).flags & MoveFlags.Sound) !== 0;
}

/** Alola's abilities, as far as its lines are written */
const setupAbilities = [
  // The Tapus each lay their own island's terrain as they arrive
  createSurgeAbility(Abilities.ElectricSurge, Moves.ElectricTerrain),
  createSurgeAbility(Abilities.PsychicSurge, Moves.PsychicTerrain),
  createSurgeAbility(Abilities.GrassySurge, Moves.GrassyTerrain),

  // The light trio's armour: older abilities that nothing which
  // ignores abilities sees past (see MOLD_PROOF_ABILITIES)
  createClearBodyAbility(Abilities.FullMetalBody),
  createMultiscaleAbility(Abilities.ShadowShield),
  createFilterAbility(Abilities.PrismArmor),

  // Ultra Necrozma: the light it let out lands hardest where it
  // already lands well
  createAbility(Abilities.Neuroforce, (battle) => {
    const totals = new WeakMap<UnitAttackEvent, number>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitAttackResolveEffectiveness, EventPriority.Post, (event) => {
        if (event.parent.source.hasAbility(Abilities.Neuroforce)) {
          totals.set(event.parent, (totals.get(event.parent) ?? 1) * event.multiplier);
        }
      }),
      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        const total = totals.get(event.parent);

        if (total != null && total > 1) {
          event.value *= NEUROFORCE_SCALE;
        }
      }),
    ]);
  }),

  // Rowlet: it shoots its quills from where it stands
  createNoContactAbility(Abilities.LongReach),

  // Popplio: its songs go out as water rather than as air, and cost
  // nothing extra for it
  createTypeShiftAbility(Abilities.LiquidVoice, isSound, Types.Water),

  // Yungoos: the mainline's "switched in this turn" has no turn to
  // hang on, so the window is from an entrance to that unit's first
  // move. An entrance before a holder stood on the field goes unseen
  createAbility(Abilities.Stakeout, (battle) => {
    const fresh = new Set<Unit>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        if (!event.reactivation) {
          fresh.add(event.source);
        }
      }),
      ...onUnitActs(battle, (unit) => {
        fresh.delete(unit);
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        fresh.delete(event.source);
      }),
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        fresh.delete(event.source);
      }),
      battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
        const target = event.target;

        if (
          event.power != null &&
          target.type === MoveTargetType.Unit &&
          target.unit.team.alliance !== event.source.team.alliance &&
          fresh.has(target.unit) &&
          event.source.hasAbility(Abilities.Stakeout)
        ) {
          event.power *= STAKEOUT_SCALE;
        }
      }),
    ]);
  }),

  /**
   * Wishiwashi: the school forms while it holds above a quarter of its
   * HP and scatters below, the way Zen Mode sits a Darmanitan down. Only
   * a Wishiwashi has the shapes
   * https://bulbapedia.bulbagarden.net/wiki/Schooling_(Ability)
   */
  createAbility(Abilities.Schooling, (battle) => {
    function settle(unit: Unit): void {
      if (
        !unit.alive ||
        !unit.hasAbility(Abilities.Schooling) ||
        getBaseFormSpecies(unit.species) !== Species.Wishiwashi
      ) {
        return;
      }

      const schooled =
        unit.level >= SCHOOLING_LEVEL &&
        unit.health > unit.checkStat(Stats.HP, 0) * SCHOOLING_THRESHOLD;
      const shape = schooled ? Species.WishiwashiSchool : Species.Wishiwashi;

      if (unit.species === shape) {
        return;
      }
      unit.triggerAbility(Abilities.Schooling);
      // Both shapes share an HP stat, so its health stands where it was
      unit.setSpecies(shape);
    }

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        settle(event.target);
      }),
      battle.on(BattleEvents.UnitHeal, EventPriority.Post, (event) => {
        settle(event.source);
      }),
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        settle(event.source);
      }),
    ]);
  }),

  // Dewpider: the bubble it carries keeps fire off and a burn out, and
  // puts its own weight behind the water it throws
  // https://bulbapedia.bulbagarden.net/wiki/Water_Bubble_(Ability)
  createThickFatAbility(Abilities.WaterBubble, FIRE),
  createLimberAbility(Abilities.WaterBubble, [Statuses.Burned]),
  createAbility(Abilities.WaterBubble, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
      const parent = event.parent;

      if (
        parent.type === Types.Water &&
        event.unit === parent.source &&
        (event.stat === Stats.Attack || event.stat === Stats.SpecialAttack) &&
        parent.source.hasAbility(Abilities.WaterBubble)
      ) {
        event.value *= WATER_BUBBLE_SCALE;
      }
    }),
  ),

  // Salandit: its poison eats through what a Poison or Steel type
  // would shrug off. Only the type is set aside, never a status it holds
  // https://bulbapedia.bulbagarden.net/wiki/Corrosion_(Ability)
  createAbility(Abilities.Corrosion, (battle) =>
    battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Exact, (event) => {
      const cause = event.cause;
      const target = event.source;

      if (
        event.immune &&
        POISONS.has(event.status) &&
        cause.type !== EffectType.None &&
        cause.type !== EffectType.Weather &&
        cause.unit !== target &&
        cause.unit.hasAbility(Abilities.Corrosion) &&
        !target.status[event.status] &&
        (target.types.has(Types.Poison) || target.types.has(Types.Steel))
      ) {
        event.immune = false;
      }
    }),
  ),

  // Stufful: the fur softens a blow that touches it and catches fire
  // from one that burns. A touching Fire move is both, so it lands as usual
  // https://bulbapedia.bulbagarden.net/wiki/Fluffy_(Ability)
  createAbility(Abilities.Fluffy, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const { move, source, target, type } = event.parent;

      if (!target.hasAbility(Abilities.Fluffy)) {
        return;
      }
      if (source.checkMoveContact(move, { type: MoveTargetType.Unit, unit: target })) {
        event.value *= FLUFFY_CONTACT_SCALE;
      }
      if (type === Types.Fire) {
        event.value *= FLUFFY_FIRE_SCALE;
      }
    }),
  ),

  // Passimian, and Alolan Grimer under another name: a fallen teammate's
  // ability is picked up in its place
  createReceiverAbility(Abilities.Receiver),
  createReceiverAbility(Abilities.PowerOfAlchemy),

  // Wimpod and Golisopod: one bolt under two names. A trap holds it,
  // and what it spent on purpose does not count
  createRetreatAbility(Abilities.WimpOut),
  createRetreatAbility(Abilities.EmergencyExit),

  // Sandygast: water packs the sand harder
  // https://bulbapedia.bulbagarden.net/wiki/Water_Compaction_(Ability)
  createAbility(Abilities.WaterCompaction, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      const { source, target } = event;

      if (
        event.success &&
        event.type === Types.Water &&
        source !== target &&
        target.alive &&
        target.hasAbility(Abilities.WaterCompaction)
      ) {
        target.triggerAbility(Abilities.WaterCompaction);
        target.addStage(Stages.Defense, WATER_COMPACTION_STAGES, {
          type: EffectType.Ability,
          ability: Abilities.WaterCompaction,
          unit: target,
        });
      }
    }),
  ),

  // Palossand: a blow that lands on it throws its sand into the air. The
  // sky is called up by casting Sandstorm, the way Sand Stream does
  // https://bulbapedia.bulbagarden.net/wiki/Sand_Spit_(Ability)
  createAbility(Abilities.SandSpit, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      const { source, target } = event;

      if (
        event.success &&
        event.category !== MoveCategories.Status &&
        source !== target &&
        target.alive &&
        target.hasAbility(Abilities.SandSpit) &&
        !isPrimalWeather(battle.weather.current)
      ) {
        target.triggerAbility(Abilities.SandSpit);
        target.triggerMove(Moves.Sandstorm, { type: MoveTargetType.None }, 0);
      }
    }),
  ),

  // Pyukumuku: whoever finishes it takes the HP it had left before the blow
  // https://bulbapedia.bulbagarden.net/wiki/Innards_Out_(Ability)
  createAbility(Abilities.InnardsOut, (battle) => {
    const before = new Map<Unit, number>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
        before.set(event.target, event.target.health);
      }),
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const { cause, target } = event;
        const left = before.get(target) ?? 0;

        before.delete(target);
        if (
          !event.success ||
          target.alive ||
          cause.type !== EffectType.Move ||
          cause.unit === target ||
          !cause.unit.alive ||
          !target.hasAbility(Abilities.InnardsOut)
        ) {
          return;
        }
        target.triggerAbility(Abilities.InnardsOut);
        target.damage(
          { type: EffectType.Ability, ability: Abilities.InnardsOut, unit: target },
          cause.unit,
          left,
          DamageFlags.Indirect,
        );
      }),
    ]);
  }),

  /**
   * Minior: above 1/2 HP it keeps its shell, which no major status gets
   * through, and at or below it the shell cracks open on its core. Which
   * core is fixed per individual, read off its record
   * https://bulbapedia.bulbagarden.net/wiki/Shields_Down_(Ability)
   */
  createAbility(Abilities.ShieldsDown, (battle) => {
    function shelled(unit: Unit): boolean {
      return unit.species === Species.Minior && unit.hasAbility(Abilities.ShieldsDown);
    }

    function settle(unit: Unit): void {
      if (
        !unit.alive ||
        !unit.hasAbility(Abilities.ShieldsDown) ||
        getBaseFormSpecies(unit.species) !== Species.Minior
      ) {
        return;
      }

      const shell = unit.health > unit.checkStat(Stats.HP, 0) * SHIELDS_DOWN_THRESHOLD;
      const shape = shell ? Species.Minior : getMiniorCore(unit);

      if (unit.species === shape) {
        return;
      }
      unit.triggerAbility(Abilities.ShieldsDown);
      // The shell and the core share an HP stat, so its health stands
      unit.setSpecies(shape);
    }

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        settle(event.target);
      }),
      battle.on(BattleEvents.UnitHeal, EventPriority.Post, (event) => {
        settle(event.source);
      }),
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        settle(event.source);
      }),
      battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Post, (event) => {
        if (!event.immune && SHELL_PROOF.has(event.status) && shelled(event.source)) {
          event.immune = true;
        }
      }),
    ]);
  }),

  // Alolan Raichu: it rides the current the way a surfer rides a wave
  // https://bulbapedia.bulbagarden.net/wiki/Surge_Surfer_(Ability)
  createSandRushAbility(Abilities.SurgeSurfer, (unit) => unit.checkTerrain() === Terrains.Electric),

  // Alolan Diglett: its metal hair slows whatever touches it, as Gooey does
  createGooeyAbility(Abilities.TanglingHair),

  // Alolan Raticate: a berry it eats itself does twice the good, both
  // the HP it gives back and the stages it raises
  // https://bulbapedia.bulbagarden.net/wiki/Ripen_(Ability)
  createAbility(
    Abilities.Ripen,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitHeal, EventPriority.Pre, (event) => {
          const eater = event.target;

          if (
            event.value > 0 &&
            isOwnBerry(event.cause, eater) &&
            eater.hasAbility(Abilities.Ripen)
          ) {
            eater.triggerAbility(Abilities.Ripen);
            event.value *= RIPEN_SCALE;
          }
        }),
        battle.on(BattleEvents.UnitAddStage, EventPriority.Pre, (event) => {
          const eater = event.source;

          if (
            event.value > 0 &&
            isOwnBerry(event.cause, eater) &&
            eater.hasAbility(Abilities.Ripen)
          ) {
            eater.triggerAbility(Abilities.Ripen);
            event.value *= RIPEN_SCALE;
          }
        }),
      ]),
  ),

  // Alolan Geodude: what it throws goes out charged
  // https://bulbapedia.bulbagarden.net/wiki/Galvanize_(Ability)
  createTypeShiftAbility(Abilities.Galvanize, Types.Normal, Types.Electric, GALVANIZE_SCALE),

  /**
   * Mimikyu: the rag takes the first blow and gives way, costing the one
   * under it 1/8 of its HP, as it does from Sword and Shield on. It stays
   * broken for the rest of the fight
   * https://bulbapedia.bulbagarden.net/wiki/Disguise_(Ability)
   */
  createAbility(
    Abilities.Disguise,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitCanDamage, EventPriority.Post, (event) => {
          const { cause, target } = event;

          if (
            !event.success ||
            event.flags & DamageFlags.Indirect ||
            cause.type !== EffectType.Move ||
            cause.unit === target ||
            target.species !== Species.Mimikyu ||
            !target.hasAbility(Abilities.Disguise)
          ) {
            return;
          }
          event.success = false;
          target.triggerAbility(Abilities.Disguise);
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          const unit = event.source;

          if (event.ability !== Abilities.Disguise || unit.species !== Species.Mimikyu) {
            return;
          }
          unit.setSpecies(Species.MimikyuBusted);
          unit.damage(
            { type: EffectType.Ability, ability: Abilities.Disguise, unit },
            unit,
            unit.checkStat(Stats.HP, 0) * DISGUISE_CHIP,
            DamageFlags.Indirect,
          );
        }),
      ]),
  ),

  // Bruxish: its glare turns away whatever tries to cut in ahead, the way
  // Queenly Majesty does
  createQueenlyMajestyAbility(Abilities.Dazzling),
];

export default function setupGen7Abilities(battle: Battle): void {
  for (const setup of setupAbilities) {
    setup(battle);
  }
}
