import { registerBulbasaurSpecies } from './bulbasaur';
import { registerCaterpieSpecies } from './caterpie';
import { registerCharmanderSpecies } from './charmander';
import { registerClefairySpecies } from './clefairy';
import { registerEkansSpecies } from './ekans';
import { registerNidoranFSpecies } from './nidoran-f';
import { registerNidoranMSpecies } from './nidoran-m';
import { registerPidgeySpecies } from './pidgey';
import { registerPikachuSpecies } from './pikachu';
import { registerRattataSpecies } from './rattata';
import { registerSandshrewSpecies } from './sandshrew';
import { registerSpearowSpecies } from './spearow';
import { registerSquirtleSpecies } from './squirtle';
import { registerWeedleSpecies } from './weedle';

export { getSpeciesData } from './__create';

export function registerSpecies() {
  registerBulbasaurSpecies();
  registerCharmanderSpecies();
  registerSquirtleSpecies();
  registerCaterpieSpecies();
  registerWeedleSpecies();
  registerPidgeySpecies();
  registerRattataSpecies();
  registerSpearowSpecies();
  registerEkansSpecies();
  registerPikachuSpecies();
  registerSandshrewSpecies();
  registerNidoranFSpecies();
  registerNidoranMSpecies();
  registerClefairySpecies();
}
