import type { CaughtPokemon } from '../../../auth/caught-record';
import Abilities from '../../../data/ids/abilities';
import { Items } from '../../../data/ids/items';
import { Moves } from '../../../data/ids/moves';
import DungeonKind, {
  FLOOR_GATE_NAMES,
  FLOOR_GIMMICK_NAMES,
  FLOOR_SIGHT_NAMES,
} from '../../../data/overworld/dungeon';
import { FRONTIER_BRAIN_NAMES } from '../../../data/overworld/experts';
import { SYNDICATE_NAMES } from '../../../data/overworld/syndicate';
import type ChunkSnapshot from '../../../overworld/chunk-snapshot';
import type { DungeonFloor } from '../../../overworld/dungeon/floor';
import type { DungeonLayout } from '../../../overworld/dungeon/layout';

/** What the dialog is titled, by who keeps the place */
export function dungeonTitle(layout: DungeonLayout, snapshot: ChunkSnapshot, cell: number): string {
  if (layout.kind === DungeonKind.Hideout) {
    return `${SYNDICATE_NAMES[snapshot.getSyndicate()]} Hideout`;
  }
  if (layout.kind === DungeonKind.Frontier) {
    const brain = snapshot.getFrontierBrain(cell);

    return brain == null ? 'Battle Frontier' : `${FRONTIER_BRAIN_NAMES[brain]}'s Tower`;
  }
  return 'Dungeon';
}

/** A floor's number as a player reads it: basements going down, storeys going up */
export function floorName(kind: DungeonKind, floor: number): string {
  return kind === DungeonKind.Hideout ? `B${floor + 1}F` : `${floor + 1}F`;
}

/** The floor's rules in one line: its layout, its light and its stairs */
export function floorRules(floor: DungeonFloor): string {
  const parts: string[] = [];

  if (floor.gimmick != null) {
    parts.push(FLOOR_GIMMICK_NAMES[floor.gimmick]);
  }
  if (floor.sight != null) {
    parts.push(FLOOR_SIGHT_NAMES[floor.sight]);
  }
  parts.push(FLOOR_GATE_NAMES[floor.gate]);
  return parts.join(' · ');
}

/**
 * Whether the party carries a light: Illuminate, a known Flash, or an
 * Explorer Kit in hand
 */
export function partyIsLit(party: CaughtPokemon[]): boolean {
  for (const one of party) {
    if (
      one.abilities.includes(Abilities.Illuminate) ||
      one.moves.includes(Moves.Flash) ||
      one.items.includes(Items.ExplorerKit)
    ) {
      return true;
    }
  }
  return false;
}
