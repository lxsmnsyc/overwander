import registerSketchToProtect from './sketch-to-protect';
import registerMachPunchToEndure from './mach-punch-to-endure';
import registerCharmToBatonPass from './charm-to-baton-pass';
import registerEncoreToBeatUp from './encore-to-beat-up';

/**
 * Johto's moves, in the order the move list numbers them. That order
 * is what Metronome reaches into, so the parts are read in the order
 * they were written
 */
export default function registerGen2Moves(): void {
  registerSketchToProtect();
  registerMachPunchToEndure();
  registerCharmToBatonPass();
  registerEncoreToBeatUp();
}
