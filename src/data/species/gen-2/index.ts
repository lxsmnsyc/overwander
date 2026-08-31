import registerChikoritaSpecies from './chikorita';
import registerCyndaquilSpecies from './cyndaquil';
import registerHoothootSpecies from './hoothoot';
import registerLedybaSpecies from './ledyba';
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
}
