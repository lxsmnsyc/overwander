import registerChikoritaSpecies from './chikorita';
import registerChinchouSpecies from './chinchou';
import registerCyndaquilSpecies from './cyndaquil';
import registerHoothootSpecies from './hoothoot';
import registerHoppipSpecies from './hoppip';
import registerLedybaSpecies from './ledyba';
import registerMareepSpecies from './mareep';
import registerNatuSpecies from './natu';
import registerSentretSpecies from './sentret';
import registerSpinarakSpecies from './spinarak';
import registerTotodileSpecies from './totodile';

export default function registerGen2Species(): void {
  registerChikoritaSpecies();
  registerCyndaquilSpecies();
  registerTotodileSpecies();
  registerSentretSpecies();
  registerHoothootSpecies();
  registerLedybaSpecies();
  registerSpinarakSpecies();
  registerChinchouSpecies();
  registerNatuSpecies();
  registerMareepSpecies();
  registerHoppipSpecies();
}
