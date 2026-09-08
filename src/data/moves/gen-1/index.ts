import registerStarterMoves from './bulbasaur-to-blastoise';
import registerBugAndBirdMoves from './caterpie-to-fearow';
import registerEkansToNidokingMoves from './ekans-to-nidoking';
import registerClefairyToTentacruelMoves from './clefairy-to-tentacruel';
import registerGeodudeToMewMoves from './geodude-to-mew';
import registerEngineMoves from './engine';

/**
 * Kanto's moves, in the order the dex is walked. The order they are
 * registered in is what Metronome reaches into, so the parts are read
 * in the order they were written
 */
export default function registerGen1Moves(): void {
  registerStarterMoves();
  registerBugAndBirdMoves();
  registerEkansToNidokingMoves();
  registerClefairyToTentacruelMoves();
  registerGeodudeToMewMoves();
  registerEngineMoves();
}
