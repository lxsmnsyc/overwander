import { EventPriority } from '../../../../core/event-emitter';
import { Types, getTypeFactor } from '../../../../data/constants/types';
import Abilities from '../../../../data/ids/abilities';
import { MoveCategories } from '../../../../data/ids/moves';
import { Statuses } from '../../../../data/ids/status';
import { getMoveData } from '../../../../data/moves';
import { TERA_TYPES } from '../../../../data/species/tera-type';
import { BattleEvents, MoveTargetType } from '../../../events';
import { maskTypeOf } from '../../../items/masks';
import { isCentered } from '../../../status/centered';
import { unitTarget } from '../../../utils';
import { createAbility, getAbilityHolders } from '../../__create';
import { createAvengingChainAbility, isSingleTargetMove } from '../__create';

/** What Mask Aura makes of a teammate's move of the mask's type */
export const MASK_AURA_SCALE = 1.2;

const kitakamiLegends: ReturnType<typeof createAbility>[] = [
  // The Loyal Three: Okidogi, Munkidori and Fezandipiti
  createAvengingChainAbility(Abilities.HoundsOath, 'critical'),
  createAvengingChainAbility(Abilities.MonkeysOath, 'quick'),
  createAvengingChainAbility(Abilities.PheasantsOath, 'spread'),

  // Ogerpon: the mask it wears lends its type to the rest of its side.
  // Two Ogerpon in one mask lend it once
  createAbility(Abilities.MaskAura, (battle) =>
    battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      if (event.power == null || event.power <= 0) {
        return;
      }
      const type = event.source.checkMoveType(event.move, event.target);

      for (const holder of getAbilityHolders(battle, Abilities.MaskAura)) {
        if (
          holder !== event.source &&
          holder.alive &&
          holder.team === event.source.team &&
          maskTypeOf(holder.species) === type &&
          holder.hasAbility(Abilities.MaskAura)
        ) {
          event.power *= MASK_AURA_SCALE;
          return;
        }
      }
    }),
  ),

  // Terapagos: its Normal moves take the type the chart likes best
  // against whoever they are aimed at. A tie keeps Normal, and only the
  // chart is asked, not an ability that turns a type away
  createAbility(Abilities.Prismatic, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveType, EventPriority.Post, (event) => {
      if (
        event.type !== Types.Normal ||
        event.target.type !== MoveTargetType.Unit ||
        getMoveData(event.move).category === MoveCategories.Status ||
        !event.source.hasAbility(Abilities.Prismatic)
      ) {
        return;
      }
      const defending = [...event.target.unit.types];
      let best = Types.Normal;
      let bestFactor = getTypeFactor(Types.Normal, defending);

      for (const type of TERA_TYPES) {
        const factor = getTypeFactor(type, defending);

        if (factor > bestFactor) {
          best = type;
          bestFactor = factor;
        }
      }
      event.type = best;
    }),
  ),

  // Pecharunt: a confused enemy aiming at it is pulled onto its own
  // side instead. A Follow Me still holds what it draws
  createAbility(Abilities.PuppetStrings, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveRedirect, EventPriority.Post, (event) => {
      const aimed = event.redirect;
      const source = event.source;

      if (
        aimed.type !== MoveTargetType.Unit ||
        aimed.unit === source ||
        aimed.unit.team.alliance === source.team.alliance ||
        source.status[Statuses.Confused] == null ||
        !isSingleTargetMove(event.move) ||
        isCentered(aimed.unit) ||
        !aimed.unit.hasAbility(Abilities.PuppetStrings)
      ) {
        return;
      }

      for (const mate of source.team.units) {
        if (mate !== source && mate.alive) {
          aimed.unit.triggerAbility(Abilities.PuppetStrings);
          event.redirect = unitTarget(mate);
          return;
        }
      }
    }),
  ),
];

export default kitakamiLegends;
