import { beforeAll, describe, expect, it } from 'vitest';
import { MoveRole, ROLE_BASE, getMoveRoles, hasMoveRole } from '../../src/battle/ai/roles';
import { MoveCategories, Moves } from '../../src/data/ids/moves';
import { getMoveData, getRegisteredMoves, registerMoves } from '../../src/data/moves';

describe('move roles', () => {
  beforeAll(() => {
    registerMoves();
  });

  it('gives every registered move a role', () => {
    const missing: Moves[] = [];

    for (const move of getRegisteredMoves()) {
      if (getMoveRoles(move).size === 0) {
        missing.push(move);
      }
    }
    expect(missing).toEqual([]);
  });

  it('marks every damaging move as damage and no status move as damage', () => {
    for (const move of getRegisteredMoves()) {
      const damaging = getMoveData(move).category !== MoveCategories.Status;

      expect(hasMoveRole(move, MoveRole.Damage)).toBe(damaging);
    }
  });

  it('ranks avoiding damage above team setup, afflicting, boosting and dropping', () => {
    expect(ROLE_BASE[MoveRole.Shield]).toBeGreaterThan(ROLE_BASE[MoveRole.TeamSetup]);
    expect(ROLE_BASE[MoveRole.TeamSetup]).toBeGreaterThan(ROLE_BASE[MoveRole.Status]);
    expect(ROLE_BASE[MoveRole.Status]).toBeGreaterThan(ROLE_BASE[MoveRole.SelfBoost]);
    expect(ROLE_BASE[MoveRole.SelfBoost]).toBeGreaterThan(ROLE_BASE[MoveRole.FoeDrop]);
    expect(ROLE_BASE[MoveRole.FoeDrop]).toBeGreaterThan(ROLE_BASE[MoveRole.Damage]);
  });

  it.each([
    [Moves.Protect, MoveRole.Shield],
    [Moves.Substitute, MoveRole.Shield],
    [Moves.WideGuard, MoveRole.Shield],
    [Moves.Fly, MoveRole.Shield],
    [Moves.Reflect, MoveRole.TeamSetup],
    [Moves.Tailwind, MoveRole.TeamSetup],
    [Moves.Spikes, MoveRole.Hazard],
    [Moves.SunnyDay, MoveRole.Field],
    [Moves.TrickRoom, MoveRole.Field],
    [Moves.Toxic, MoveRole.Status],
    [Moves.LeechSeed, MoveRole.Status],
    [Moves.Taunt, MoveRole.Disruption],
    [Moves.Roar, MoveRole.Disruption],
    [Moves.SwordsDance, MoveRole.SelfBoost],
    [Moves.Growl, MoveRole.FoeDrop],
    [Moves.Recover, MoveRole.Heal],
    [Moves.HelpingHand, MoveRole.Support],
    [Moves.FollowMe, MoveRole.Support],
    [Moves.BatonPass, MoveRole.Pivot],
    [Moves.Metronome, MoveRole.Utility],
    [Moves.Earthquake, MoveRole.Spread],
    [Moves.QuickAttack, MoveRole.Priority],
    [Moves.BulletSeed, MoveRole.MultiHit],
    [Moves.SolarBeam, MoveRole.Charge],
    [Moves.HyperBeam, MoveRole.Recharge],
    [Moves.DoubleEdge, MoveRole.Recoil],
    [Moves.GigaDrain, MoveRole.Drain],
    [Moves.Explosion, MoveRole.Sacrifice],
    [Moves.Fissure, MoveRole.OneHitKO],
    [Moves.SeismicToss, MoveRole.FixedDamage],
    [Moves.Outrage, MoveRole.LockIn],
    [Moves.FutureSight, MoveRole.Delayed],
    [Moves.BodySlam, MoveRole.Afflicts],
    [Moves.Psychic, MoveRole.Weakens],
    [Moves.Wrap, MoveRole.Trapping],
    [Moves.UTurn, MoveRole.Pivot],
  ])('gives move %i the role %i', (move, role) => {
    expect(hasMoveRole(move, role)).toBe(true);
  });
});
