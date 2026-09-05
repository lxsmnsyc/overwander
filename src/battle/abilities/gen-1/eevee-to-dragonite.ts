import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages, Stats } from '../../../data/constants/stats';
import {
  TYPE_EFFECTIVENESS,
  TYPE_EFFECTIVENESS_FACTOR,
  Types,
} from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { MoveCategories, MoveFlags, type Moves } from '../../../data/ids/moves';
import { Statuses, Weathers } from '../../../data/ids/status';
import { getMoveData } from '../../../data/moves';
import { checkUnitRating } from '../../ai/rating';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { OHKO_MOVES } from '../../moves/fixed-damage';
import { PROTECTED_ABILITIES } from '../special';
import { MAJOR_STATUS_CONDITIONS } from '../../status';
import type Unit from '../../unit';
import { hasAnyStatus, isWeatherHail } from '../../utils';
import {
  chipImmunity,
  createAbility,
  createDrizzleAbility,
  createLimberAbility,
  createToughClawsAbility,
  createWaterAbsorbAbility,
} from '../__create';
import { MergedLifecycle } from '../../lifecycle';

/**
 * Eevee to Dragonite: the last stretch, the birds of the trio and
 * what a legendary is fielded with
 */
const eeveeToDragonite = [
  // Eevee
  // https://bulbapedia.bulbagarden.net/wiki/Adaptability_(Ability)
  createAbility(Abilities.Adaptability, (battle) =>
    // Mutates the in-flight STAB resolution, so the effect stays inline
    battle.on(BattleEvents.UnitAttackResolveSTAB, EventPriority.Post, (event) => {
      if (event.value > 1 && event.parent.source.hasAbility(Abilities.Adaptability)) {
        event.value = 2;
      }
    }),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Anticipation_(Ability)
  createAbility(Abilities.Anticipation, (battle) => {
    function effectiveness(attacking: Types, defender: Unit): number {
      let factor = 1;

      for (const defending of defender.types) {
        const entry = TYPE_EFFECTIVENESS[attacking][defending];

        if (entry != null) {
          factor *= TYPE_EFFECTIVENESS_FACTOR[entry];
        }
      }

      return factor;
    }

    function isThreatening(holder: Unit, move: Moves): boolean {
      const data = getMoveData(move);

      if (OHKO_MOVES.has(move)) {
        return true;
      }

      return data.category !== MoveCategories.Status && effectiveness(data.type, holder) > 1;
    }

    // How much the shudder is worth once the blow it was for lands
    const FACTOR = 0.5;

    /** The move each holder braced for, keyed by the holder */
    const braced = new Map<Unit, Moves>();

    /**
     * The worst thing on the other side: an instant knockout first,
     * then whatever hits the holder hardest, weighing how badly the
     * type lands before how hard the move does
     */
    function worst(holder: Unit): Moves | undefined {
      let found: Moves | undefined;
      let rank = 0;

      for (const unit of battle.units(holder.team.alliance)) {
        if (!unit.alive) {
          continue;
        }

        for (const state of Object.values(unit.moves)) {
          // tsgolint narrows the optional record's values to defined;
          // at runtime cleared slots hold undefined
          // oxlint-disable-next-line typescript/no-unnecessary-condition
          if (state == null || !isThreatening(holder, state.move)) {
            continue;
          }

          const data = getMoveData(state.move);
          const scored = OHKO_MOVES.has(state.move)
            ? Number.POSITIVE_INFINITY
            : effectiveness(data.type, holder) * (data.power ?? 0);

          if (scored > rank) {
            rank = scored;
            found = state.move;
          }
        }
      }

      return found;
    }

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        if (braced.has(event.source) || !event.source.hasAbility(Abilities.Anticipation)) {
          return;
        }

        const move = worst(event.source);

        if (move != null) {
          braced.set(event.source, move);
          event.source.triggerAbility(Abilities.Anticipation);
        }
      }),
      // Mutates the in-flight damage resolution, so the effect stays
      // inline
      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        if (braced.get(event.parent.target) === event.parent.move) {
          event.value *= FACTOR;
        }
      }),
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        braced.delete(event.source);
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        braced.delete(event.source);
      }),
    ]);
  }),

  // Jolteon
  createWaterAbsorbAbility(Abilities.VoltAbsorb, Types.Electric),

  // https://bulbapedia.bulbagarden.net/wiki/Quick_Feet_(Ability)
  createAbility(Abilities.QuickFeet, (battle) =>
    battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
      if (
        event.stat === Stats.Speed &&
        event.source.hasAbility(Abilities.QuickFeet) &&
        hasAnyStatus(event.source, MAJOR_STATUS_CONDITIONS)
      ) {
        event.value *= 1.5;
      }
    }),
  ),

  // Porygon
  // https://bulbapedia.bulbagarden.net/wiki/Trace_(Ability)
  createAbility(Abilities.Trace, (battle) => {
    const UNTRACEABLE = new Set<Abilities>([
      Abilities.Trace,
      Abilities.Imposter,
      Abilities.NeutralizingGas,
      ...PROTECTED_ABILITIES,
    ]);

    function firstTraceable(unit: Unit): Abilities | undefined {
      for (const key in unit.abilities) {
        // tsc requires the assertion to index the Abilities-mapped
        // record; tsgolint resolves the const enum to number
        // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
        const ability = Number(key) as Abilities;

        if (unit.abilities[ability] === true && !UNTRACEABLE.has(ability)) {
          return ability;
        }
      }
      return undefined;
    }

    function findTrace(source: Unit): Abilities | undefined {
      let best: Abilities | undefined;
      let bestRating = Number.NEGATIVE_INFINITY;

      for (const enemy of battle.units(source.team.alliance)) {
        if (enemy.alive) {
          const ability = firstTraceable(enemy);
          const rating = checkUnitRating(battle, enemy);

          if (ability != null && rating > bestRating) {
            best = ability;
            bestRating = rating;
          }
        }
      }

      return best;
    }

    return new MergedLifecycle([
      // Detection: entering the field with something to copy
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        if (event.source.hasAbility(Abilities.Trace) && findTrace(event.source) != null) {
          event.source.triggerAbility(Abilities.Trace);
        }
      }),
      // Effect: the copy rides the trigger and replaces Trace itself
      battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
        if (event.ability === Abilities.Trace) {
          const ability = findTrace(event.source);

          if (ability != null) {
            event.source.removeAbility(Abilities.Trace);
            event.source.addAbility(ability);
          }
        }
      }),
    ]);
  }),

  // https://bulbapedia.bulbagarden.net/wiki/Download_(Ability)
  createAbility(
    Abilities.Download,
    (battle) =>
      new MergedLifecycle([
        // Detection: entering the field with enemies to analyze
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (!event.source.hasAbility(Abilities.Download)) {
            return;
          }

          for (const enemy of battle.units(event.source.team.alliance)) {
            if (enemy.alive) {
              event.source.triggerAbility(Abilities.Download);
              return;
            }
          }
        }),
        // Effect: the boost rides the trigger — Attack against the
        // softer physical side, Special Attack otherwise
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== Abilities.Download) {
            return;
          }

          let defense = 0;
          let specialDefense = 0;

          for (const enemy of battle.units(event.source.team.alliance)) {
            if (enemy.alive) {
              defense += enemy.checkStat(Stats.Defense, 0);
              specialDefense += enemy.checkStat(Stats.SpecialDefense, 0);
            }
          }

          event.source.addStage(
            defense < specialDefense ? Stages.Attack : Stages.SpecialAttack,
            1,
            {
              type: EffectType.Ability,
              ability: Abilities.Download,
              unit: event.source,
            },
          );
        }),
      ]),
  ),

  // Kabuto (Kabutops)
  // https://bulbapedia.bulbagarden.net/wiki/Sharpness_(Ability)
  createToughClawsAbility(Abilities.Sharpness, MoveFlags.Slicing, 1.5),

  // Aerodactyl
  // https://bulbapedia.bulbagarden.net/wiki/Pressure_(Ability)
  createAbility(
    Abilities.Pressure,
    (battle) =>
      new MergedLifecycle([
        // Real-time analog of doubled PP usage: moves aimed at the
        // holder resolve with half their PP, doubling their cooldown.
        // A Boss caster is exempt (explicit check, like Run Away vs
        // Arena Trap).
        battle.on(BattleEvents.CheckUnitMovePP, EventPriority.Post, (event) => {
          if (
            event.target.type === MoveTargetType.Unit &&
            event.target.unit !== event.source &&
            event.target.unit.hasAbility(Abilities.Pressure) &&
            !event.source.hasAbility(Abilities.Boss)
          ) {
            event.pp = Math.max(1, event.pp / 2);
          }
        }),
        // For visual cues: the classic entry announcement
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (event.source.hasAbility(Abilities.Pressure)) {
            event.source.triggerAbility(Abilities.Pressure);
          }
        }),
      ]),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Strong_Jaw_(Ability)
  createToughClawsAbility(Abilities.StrongJaw, MoveFlags.Bite, 1.5),

  // Snorlax
  // https://bulbapedia.bulbagarden.net/wiki/Immunity_(Ability)
  createLimberAbility(Abilities.Immunity, [Statuses.Poisoned, Statuses.BadlyPoisoned]),

  // Articuno
  // https://bulbapedia.bulbagarden.net/wiki/Snow_Cloak_(Ability)
  createAbility(
    Abilities.SnowCloak,
    (battle) =>
      new MergedLifecycle([
        // Sand Veil's hail twin: incoming accuracy is taxed
        battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, (event) => {
          if (
            event.accuracy != null &&
            event.target.type === MoveTargetType.Unit &&
            event.target.unit.hasAbility(Abilities.SnowCloak) &&
            isWeatherHail(event.target.unit)
          ) {
            event.accuracy *= 0.8;
          }
        }),
        chipImmunity(battle, Abilities.SnowCloak, Weathers.Hail),
      ]),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Snow_Warning_(Ability)
  createDrizzleAbility(Abilities.SnowWarning, Weathers.Hail),

  // Zapdos
  // https://bulbapedia.bulbagarden.net/wiki/Drizzle_(Ability)
  createDrizzleAbility(Abilities.Drizzle, Weathers.Rain),

  // Dratini
  // https://bulbapedia.bulbagarden.net/wiki/Marvel_Scale_(Ability)
  createAbility(Abilities.MarvelScale, (battle) =>
    battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
      if (
        event.stat === Stats.Defense &&
        event.source.hasAbility(Abilities.MarvelScale) &&
        hasAnyStatus(event.source, MAJOR_STATUS_CONDITIONS)
      ) {
        event.value *= 1.5;
      }
    }),
  ),

  // Dragonite
  // https://bulbapedia.bulbagarden.net/wiki/Multiscale_(Ability)
  createAbility(Abilities.Multiscale, (battle) =>
    // Mutates the in-flight damage resolution, so the effect stays
    // inline
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const target = event.parent.target;

      if (
        target.hasAbility(Abilities.Multiscale) &&
        target.health >= target.checkStat(Stats.HP, 0)
      ) {
        event.value *= 0.5;
      }
    }),
  ),

  /**
   * Protean: the holder takes the type of whatever it is about to use,
   * so everything it casts is same-type.
   *
   * Set before the move resolves, which is what puts the new type in
   * reach of its own STAB
   * https://bulbapedia.bulbagarden.net/wiki/Protean_(Ability)
   */
  createAbility(Abilities.Protean, (battle) =>
    battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Pre, (event) => {
      if (!event.source.hasAbility(Abilities.Protean)) {
        return;
      }

      const type = event.source.checkMoveType(event.move, event.target);

      if (
        type === Types.Unknown ||
        (event.source.types.size === 1 && event.source.types.has(type))
      ) {
        return;
      }

      event.source.triggerAbility(Abilities.Protean);

      for (const worn of [...event.source.types]) {
        event.source.removeType(worn);
      }
      event.source.addType(type);
    }),
  ),
];

export default eeveeToDragonite;
