import { AttackPriority } from '../../../core/event-emitter';
import { countsAgainstSlots } from '../../../data/constants/slots';
import type Abilities from '../../../data/ids/abilities';
import type Battle from '../../battle';
import { BattleEvents } from '../../events';
import type Unit from '../../unit';
import { unitTarget } from '../../unit-checks';
import { createAbility } from './create';

/**
 * The abilities a swap may take: what counts against a slot, and never
 * a shape's own, which is worn rather than carried
 */
function swappableAbilities(unit: Unit): Abilities[] {
  const held: Abilities[] = [];

  // The list is keyed by the ability enum, which comes back as a
  // string from Object.entries
  for (const [ability, carried] of Object.entries(unit.abilities)) {
    const id: Abilities = Number(ability);

    if (carried && countsAgainstSlots(id) && unit.worn[id] == null) {
      held.push(id);
    }
  }

  return held;
}

/**
 * Meta ability for the ones that spread themselves (Mummy, Lingering
 * Aroma): whoever touches the holder catches it in place of one of
 * their own abilities, picked the way Worry Seed picks. A worn shape's
 * own is left alone
 * https://bulbapedia.bulbagarden.net/wiki/Mummy_(Ability)
 */
export default function createMummyAbility(
  ability: Abilities,
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      const source = event.source;
      const target = event.target;

      if (
        !event.success ||
        !source.alive ||
        source === target ||
        source.hasAbility(ability) ||
        !target.hasAbility(ability) ||
        !source.checkMoveContact(event.move, unitTarget(target))
      ) {
        return;
      }

      const held = swappableAbilities(source);

      target.triggerAbility(ability);

      if (held.length > 0) {
        source.removeAbility(held[Math.floor(battle.random() * held.length)]);
      }
      source.addAbility(ability);
    }),
  );
}
