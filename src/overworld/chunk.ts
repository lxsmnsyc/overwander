import type Biome from '../data/ids/biome';

/**
 * One overworld cell: the biome its climate resolved to, and the
 * seed that deterministically drives everything generated inside it
 */
export default class Chunk {
  constructor(
    public readonly seed: string,
    public readonly biome: Biome,
  ) {}
}
