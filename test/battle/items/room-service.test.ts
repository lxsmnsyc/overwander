import { describe, expect, it } from 'vitest';
import { MoveTargetType } from '../../../src/battle/events';
import { ROOM_SERVICE_STAGES } from '../../../src/battle/items/room-service';
import { Stages } from '../../../src/data/constants/stats';
import { Items } from '../../../src/data/ids/items';
import { Moves } from '../../../src/data/ids/moves';
import { createBattle, createUnit } from '../harness';

const NONE_TARGET = { type: MoveTargetType.None } as const;

describe('Room Service', () => {
  it('drops its holder one Speed stage and is spent when a Trick Room goes up', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const caster = createUnit(battle, teamB);
    const bystander = createUnit(battle, teamB);

    holder.addItem(Items.RoomService);
    holder.enter();
    caster.enter();
    bystander.enter();

    caster.triggerMoveEffect(Moves.TrickRoom, NONE_TARGET, 0);
    battle.tick(1);

    expect(holder.stages[Stages.Speed]).toBe(-ROOM_SERVICE_STAGES);
    expect(holder.items[Items.RoomService]).toBeUndefined();
    expect(bystander.stages[Stages.Speed]).toBe(0);
  });

  it('waits while no room goes up, and is not spent by a room coming down', () => {
    const { battle, teamA, teamB } = createBattle();
    const holder = createUnit(battle, teamA);
    const caster = createUnit(battle, teamB);

    holder.enter();
    caster.enter();
    caster.triggerMoveEffect(Moves.TrickRoom, NONE_TARGET, 0);
    battle.tick(1);

    // The room is already up, so a holder arriving now sees it come down
    holder.addItem(Items.RoomService);
    caster.triggerMoveEffect(Moves.TrickRoom, NONE_TARGET, 0);
    battle.tick(1);

    expect(holder.stages[Stages.Speed]).toBe(0);
    expect(holder.items[Items.RoomService]).toBeDefined();
  });
});
