import { Moves } from '../ids/moves';

/**
 * The moves thrown with a fist. The mainline marks these with a flag
 * of their own, which is what Iron Fist reads; kept as data, the way
 * the dances are, so the engine and the build pricing agree
 */
export const PUNCH_MOVES = new Set<Moves>([
  Moves.BulletPunch,
  Moves.CometPunch,
  Moves.DizzyPunch,
  Moves.DoubleIronBash,
  Moves.DrainPunch,
  Moves.DynamicPunch,
  Moves.FirePunch,
  Moves.FocusPunch,
  Moves.HammerArm,
  Moves.IceHammer,
  Moves.IcePunch,
  Moves.MachPunch,
  Moves.MegaPunch,
  Moves.MeteorMash,
  Moves.PlasmaFists,
  Moves.PowerUpPunch,
  Moves.ShadowPunch,
  Moves.SkyUppercut,
  Moves.ThunderPunch,
]);

export function isPunchMove(move: Moves): boolean {
  return PUNCH_MOVES.has(move);
}
