import type { Moves } from '../data/ids/moves';
import type { Battle } from './core';
import { BattleEvents, type CastingData, type CooldownData, type MoveTarget } from './events';
import type { Unit } from './unit';

export class Move {
  constructor(
    public battle: Battle,
    public source: Unit,
    public id: Moves,
  ) {}

  casting?: CastingData;

  disabled = false;

  enable() {
    if (this.disabled) {
      this.battle.emit(BattleEvents.EnableMove, {
        id: 'EnableMove',
        disabled: false,
        move: this,
      });
    }
  }

  disable() {
    if (!this.disabled) {
      this.battle.emit(BattleEvents.DisableMove, {
        id: 'DisableMove',
        disabled: false,
        move: this,
      });
    }
  }

  // Casting methods
  startCast(target: MoveTarget) {
    if (this.casting || this.disabled) {
      return;
    }
    this.battle.emit(BattleEvents.MoveStartCast, {
      id: 'MoveStartCast',
      disabled: false,
      move: this,
      target,
    });
  }

  stopCast() {
    if (this.casting) {
      this.battle.emit(BattleEvents.MoveStopCast, {
        id: 'MoveStopCast',
        disabled: false,
        move: this,
        target: this.casting.target,
      });
    }
  }

  endCast() {
    if (this.casting) {
      this.battle.emit(BattleEvents.MoveEndCast, {
        id: 'MoveEndCast',
        disabled: false,
        move: this,
        target: this.casting.target,
      });
    }
  }

  updateCast(data: Partial<CastingData>) {
    if (this.casting) {
      this.battle.emit(BattleEvents.MoveUpdateCast, {
        id: 'MoveUpdateCast',
        disabled: false,
        move: this,
        casting: {
          ...this.casting,
          ...data,
        },
      });
    }
  }

  // Cooldown methods
  cooldown?: CooldownData;

  startCooldown() {
    if (this.cooldown) {
      return;
    }
    this.battle.emit(BattleEvents.MoveStartCooldown, {
      id: 'MoveStartCooldown',
      disabled: false,
      source: this.source,
      move: this,
    });
  }

  endCooldown() {
    if (this.cooldown) {
      this.battle.emit(BattleEvents.MoveEndCooldown, {
        id: 'MoveEndCooldown',
        disabled: false,
        source: this.source,
        move: this,
      });
    }
  }

  updateCooldown(data: Partial<CooldownData>) {
    if (this.cooldown) {
      this.battle.emit(BattleEvents.MoveUpdateCooldown, {
        id: 'MoveUpdateCooldown',
        disabled: false,
        move: this,
        cooldown: {
          ...this.cooldown,
          ...data,
        },
      });
    }
  }
}
