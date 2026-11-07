import { describe, expect, it } from 'vitest';
import { MoveTargetType } from '../../src/battle/events';
import type Unit from '../../src/battle/unit';
import { Items } from '../../src/data/ids/items';
import { Moves } from '../../src/data/ids/moves';
import { readUnit } from '../../src/components/battle/battle-view/unit-reading';
import { createBattle, createUnit } from './harness';

function unitTarget(unit: Unit): { readonly type: MoveTargetType.Unit; readonly unit: Unit } {
  return { type: MoveTargetType.Unit, unit };
}

/** Each item the reading lists, with where it stands and what took it */
function readTray(unit: Unit): { item: Items; state: string; by: string | null }[] {
  const tray: { item: Items; state: string; by: string | null }[] = [];

  for (const reading of readUnit(unit).items) {
    tray.push({ item: reading.item, state: reading.state, by: reading.by });
  }
  return tray;
}

describe('the item tray a battle reads', () => {
  it('keeps a held item as held', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);

    holder.addItem(Items.Leftovers);

    expect(readTray(holder)).toEqual([{ item: Items.Leftovers, state: 'held', by: null }]);
  });

  it('keeps an eaten berry in its place as used up', () => {
    const { battle, teamA } = createBattle();
    const holder = createUnit(battle, teamA);

    holder.addItem(Items.SitrusBerry);
    holder.setHealth(80);

    expect(holder.items[Items.SitrusBerry]).toBeUndefined();
    expect(readTray(holder)).toEqual([{ item: Items.SitrusBerry, state: 'used', by: null }]);
  });

  it('names the move that knocked an item off', () => {
    const { battle, teamA, teamB } = createBattle();
    const striker = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);

    holder.addItem(Items.Leftovers);
    striker.triggerMoveTarget(Moves.KnockOff, unitTarget(holder), 0);

    expect(readTray(holder)).toEqual([{ item: Items.Leftovers, state: 'lost', by: 'Knock Off' }]);
  });

  it('shows a Trick as one item lost and another picked up', () => {
    const { battle, teamA, teamB } = createBattle();
    const trickster = createUnit(battle, teamA);
    const holder = createUnit(battle, teamB);

    trickster.addItem(Items.ChoiceBand);
    holder.addItem(Items.Leftovers);
    trickster.triggerMoveEffect(Moves.Trick, unitTarget(holder), 0);

    expect(readTray(trickster)).toEqual([
      { item: Items.ChoiceBand, state: 'lost', by: 'Trick' },
      { item: Items.Leftovers, state: 'held', by: null },
    ]);
  });
});
