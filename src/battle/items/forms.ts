import { EventPriority } from '../../core/event-emitter';
import Abilities from '../../data/ids/abilities';
import { Items } from '../../data/ids/items';
import { Moves } from '../../data/ids/moves';
import { FORM_ITEMS } from '../../data/items/form-items';
import { Species, getBaseFormSpecies } from '../../data/ids/species';
import type Battle from '../core';
import type Unit from '../unit';
import { BattleEvents } from '../events';
import { MergedLifecycle } from '../lifecycle';
import { createHeldItem, holds } from './__create';

/**
 * The ability a shape brings on top of what the catch carries. Worn
 * rather than rolled: the base species' pool never holds a form's own
 * ability, so this is the only way it reaches a fight
 */
const SHAPE_ABILITIES = new Map<Species, Abilities>([
  [Species.DialgaOrigin, Abilities.Unaware],
  [Species.PalkiaOrigin, Abilities.ShadowTag],
  [Species.GiratinaOrigin, Abilities.Levitate],
  [Species.ShayminSky, Abilities.SereneGrace],
  [Species.KyogrePrimal, Abilities.PrimordialSea],
  [Species.GroudonPrimal, Abilities.DesolateLand],
  [Species.TornadusTherian, Abilities.Regenerator],
  [Species.ThundurusTherian, Abilities.VoltAbsorb],
  [Species.LandorusTherian, Abilities.Intimidate],
  [Species.EnamorusTherian, Abilities.Overcoat],
]);

/**
 * The move a shape swaps for its own: a crowned hero's Iron Head
 * becomes the blow its relic gives it
 */
const SHAPE_MOVES = new Map<Species, [from: Moves, to: Moves]>([
  [Species.ZacianCrowned, [Moves.IronHead, Moves.BehemothBlade]],
  [Species.ZamazentaCrowned, [Moves.IronHead, Moves.BehemothBash]],
]);

/**
 * Trade the move a shape swaps for its own. Once swapped there is no
 * Iron Head left, so entering again changes nothing
 */
function swapShapeMove(unit: Unit, shape: Species): void {
  const swap = SHAPE_MOVES.get(shape);

  if (swap == null) {
    return;
  }
  const [from, to] = swap;
  const known = unit.moves[from];

  if (known == null || unit.moves[to] != null) {
    return;
  }
  unit.removeMove(from);
  unit.addMove(to);
  // PP Ups bought for Iron Head carry over to the blow it became
  unit.setMovePoints(to, known.points);
}

/**
 * The pokemon that only answer their form item through an ability of
 * their own. An Arceus or a Silvally born with a filler keeps its
 * Normal type
 */
const SHAPE_NEEDS = new Map<Species, Abilities>([
  [Species.Arceus, Abilities.Multitype],
  [Species.Silvally, Abilities.RksSystem],
]);

/** The shapes of Necrozma that can let their light out */
const ULTRA_BURST_FROM = new Set<Species>([Species.NecrozmaDuskMane, Species.NecrozmaDawnWings]);

/**
 * Ultra Burst: a fused Necrozma holding its crystal takes the field as
 * Ultra Necrozma. Only a fused shape bursts, so a Necrozma alone keeps
 * its own shape whatever it holds
 */
const ultraBurst = createHeldItem(Items.UltranecroziumZ, (battle) =>
  battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
    const unit = event.source;

    if (ULTRA_BURST_FROM.has(unit.species) && holds(unit, Items.UltranecroziumZ)) {
      unit.setSpecies(Species.NecrozmaUltra);
      unit.wearAbility(Abilities.Neuroforce);
    }
  }),
);

/**
 * The form items: a held thing that decides which shape its holder
 * fights in.
 *
 * The shape is rolled as the holder reaches the field rather than
 * chosen, so an item naming several shapes of one pokemon is a gamble
 * every fight rather than a switch a player sets once. An item naming
 * one shape per pokemon is that switch. Which shapes each offers is
 * [`FORM_ITEMS`](../../data/items/form-items.ts)
 */
export default function setupFormItems(battle: Battle): void {
  const setups: ((battle: Battle) => void)[] = [];

  for (const [item, forms] of FORM_ITEMS) {
    setups.push(
      createHeldItem(
        item,
        (inner) =>
          new MergedLifecycle([
            inner.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
              const unit = event.source;
              const base = getBaseFormSpecies(unit.species);
              const needs = SHAPE_NEEDS.get(base);

              if (!holds(unit, item) || (needs != null && !unit.hasAbility(needs))) {
                return;
              }

              // One item may serve several pokemon, so only the
              // holder's own shapes are in the draw
              const own: Species[] = [];

              for (const form of forms) {
                if (getBaseFormSpecies(form) === base) {
                  own.push(form);
                }
              }
              if (own.length === 0) {
                return;
              }

              const shape = own[Math.floor(inner.random() * own.length)];

              if (unit.species !== shape) {
                unit.setSpecies(shape);
              }

              swapShapeMove(unit, shape);

              const bonus = SHAPE_ABILITIES.get(shape);

              if (bonus != null) {
                unit.wearAbility(bonus);
              }
            }),
          ]),
      ),
    );
  }

  setups.push(ultraBurst);

  for (const setup of setups) {
    setup(battle);
  }
}
