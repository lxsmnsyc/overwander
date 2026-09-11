import { EventPriority } from '../../../core/event-emitter';
import { Items } from '../../../data/ids/items';
import type { Species } from '../../../data/ids/species';
import type Battle from '../../core';
import { BattleEvents, MoveTargetType } from '../../events';
import { createHeldItem, holds } from '../__create';
import {
  BRIGHT_POWDER_EVASION,
  SCOPE_LENS_CRITICAL_STAGES,
  SPECIES_LENS_CRITICAL_STAGES,
  WIDE_LENS_ACCURACY,
  ZOOM_LENS_ACCURACY,
} from './worths';

/** What lands, what misses, and what comes down critical */
// A Wide Lens steadies its holder's aim
export const setupWideLens = createHeldItem(Items.WideLens, (battle) =>
  battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, (event) => {
    if (event.accuracy != null && holds(event.source, Items.WideLens)) {
      event.accuracy *= WIDE_LENS_ACCURACY;
    }
  }),
);

// A Bright Powder muddles the aim of whoever is pointing at the holder
export const setupBrightPowder = createHeldItem(Items.BrightPowder, (battle) =>
  battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, (event) => {
    if (
      event.accuracy != null &&
      event.target.type === MoveTargetType.Unit &&
      holds(event.target.unit, Items.BrightPowder)
    ) {
      event.accuracy *= BRIGHT_POWDER_EVASION;
    }
  }),
);

// A target in the middle of its own move is a target that is not going
// anywhere
export const setupZoomLens = createHeldItem(Items.ZoomLens, (battle) =>
  battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, (event) => {
    if (
      event.accuracy == null ||
      event.target.type !== MoveTargetType.Unit ||
      !holds(event.source, Items.ZoomLens)
    ) {
      return;
    }

    const target = event.target.unit;

    if (target.casting != null || target.channeling != null) {
      event.accuracy *= ZOOM_LENS_ACCURACY;
    }
  }),
);

export const setupScopeLens = createHeldItem(Items.ScopeLens, (battle) =>
  battle.on(BattleEvents.UnitAttackCheckCriticalRatio, EventPriority.Post, (event) => {
    if (holds(event.parent.source, Items.ScopeLens)) {
      event.value += SCOPE_LENS_CRITICAL_STAGES;
    }
  }),
);

// A species lens is worth twice a Scope Lens to the one pokemon it was
// made for, and nothing to anybody else
export function setupSpeciesLens(item: Items, species: Species): (battle: Battle) => void {
  return createHeldItem(item, (battle) =>
    battle.on(BattleEvents.UnitAttackCheckCriticalRatio, EventPriority.Post, (event) => {
      const source = event.parent.source;

      if (source.species === species && holds(source, item)) {
        event.value += SPECIES_LENS_CRITICAL_STAGES;
      }
    }),
  );
}
