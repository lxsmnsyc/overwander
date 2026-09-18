import { AttackPriority } from '../../core/event-emitter';
import { countsAgainstSlots } from '../../data/constants/slots';
import Abilities from '../../data/ids/abilities';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import type Unit from '../unit';

/**
 * The four moves that move abilities about: two copy or trade, two
 * take one away
 */
export const ABILITY_MOVES = new Set<Moves>([
  Moves.RolePlay,
  Moves.SkillSwap,
  Moves.GastroAcid,
  Moves.WorrySeed,
  Moves.Entrainment,
  Moves.SimpleBeam,
]);

/**
 * What these moves can actually take hold of: what the unit is
 * carrying rather than what its species is known for, so an ability
 * that arrived by one of these can leave by the other.
 *
 * The special tier is left out. A Boss, a shadow and the mark left
 * where a shadow was are marks of what a pokemon **is**, so they are
 * not a thing to copy, trade or shut off: a raid whose boss had been
 * talked out of being one would lose its health pool mid-fight. An
 * ability worn with a form is left out for the same reason
 */
function abilitiesOf(unit: Unit): Abilities[] {
  const abilities: Abilities[] = [];

  for (const [ability, carried] of Object.entries(unit.abilities)) {
    if (
      carried &&
      countsAgainstSlots(Number(ability)) &&
      // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
      unit.worn[Number(ability) as Abilities] == null
    ) {
      // The list is keyed by the ability enum, which comes back as a
      // string from Object.entries
      // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
      abilities.push(Number(ability) as Abilities);
    }
  }

  return abilities;
}

/** Whether the move would do anything, which is also when it works */
function works(move: Moves, source: Unit, target: Unit): boolean {
  switch (move) {
    case Moves.RolePlay:
    case Moves.GastroAcid:
      return abilitiesOf(target).length > 0;
    case Moves.Entrainment:
      return abilitiesOf(source).length > 0;
    case Moves.SimpleBeam:
      return !target.hasAbility(Abilities.Simple);
    case Moves.SkillSwap:
      return abilitiesOf(source).length > 0 || abilitiesOf(target).length > 0;
    default:
      return true;
  }
}

export default function setupAbilityMoves(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (!ABILITY_MOVES.has(event.move) || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const target = event.target.unit;

    if (!works(event.move, event.source, target)) {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      return;
    }

    if (event.move === Moves.RolePlay) {
      const copying = abilitiesOf(target);

      for (const ability of abilitiesOf(event.source)) {
        event.source.removeAbility(ability);
      }
      for (const ability of copying) {
        event.source.addAbility(ability);
      }
      return;
    }

    // Entrainment is Role Play the other way round
    if (event.move === Moves.Entrainment) {
      const giving = abilitiesOf(event.source);

      for (const ability of abilitiesOf(target)) {
        target.removeAbility(ability);
      }
      for (const ability of giving) {
        target.addAbility(ability);
      }
      return;
    }

    // Simple Beam is Worry Seed with Simple, and a target that is
    // already Simple has nothing to lose
    if (event.move === Moves.SimpleBeam) {
      const held = abilitiesOf(target);

      if (held.length > 0) {
        target.removeAbility(held[Math.floor(battle.random() * held.length)]);
      }
      target.addAbility(Abilities.Simple);
      return;
    }

    // Gastro Acid takes one of the target's abilities and gives
    // nothing back; Worry Seed puts Insomnia where the one it took
    // was, so a sleeper is worth nothing to whatever was counting on
    // it sleeping.
    //
    // One rather than the lot: a unit here may hold several, and a
    // move that stripped a pokemon bare would be a different move
    if (event.move === Moves.GastroAcid || event.move === Moves.WorrySeed) {
      const held = abilitiesOf(target);

      if (held.length > 0) {
        target.removeAbility(held[Math.floor(battle.random() * held.length)]);
      }
      if (event.move === Moves.WorrySeed) {
        target.addAbility(Abilities.Insomnia);
      }
      return;
    }

    if (event.move !== Moves.SkillSwap) {
      return;
    }

    const mine = abilitiesOf(event.source);
    const theirs = abilitiesOf(target);

    for (const ability of mine) {
      event.source.removeAbility(ability);
    }
    for (const ability of theirs) {
      target.removeAbility(ability);
    }
    for (const ability of theirs) {
      event.source.addAbility(ability);
    }
    for (const ability of mine) {
      target.addAbility(ability);
    }
  });

  // The AI is told before the cast rather than after it fails
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && ABILITY_MOVES.has(event.move)) {
      event.usable =
        event.target.type === MoveTargetType.Unit &&
        works(event.move, event.source, event.target.unit);
    }
  });
}
