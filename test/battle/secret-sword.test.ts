import { describe, expect, it } from 'vitest';
import { Moves } from '../../src/data/ids/moves';
import { Species } from '../../src/data/ids/species';
import { createBattle, createUnit } from './harness';

describe('Secret Sword', () => {
  it('puts a Keldeo that knows it in its Resolute form', () => {
    const { battle, teamA } = createBattle();
    const colt = createUnit(battle, teamA);
    colt.setSpecies(Species.Keldeo);
    colt.addMove(Moves.SecretSword);

    colt.enter();

    expect(colt.species).toBe(Species.KeldeoResolute);
  });

  it('leaves a Keldeo without it as it is', () => {
    const { battle, teamA } = createBattle();
    const colt = createUnit(battle, teamA);
    colt.setSpecies(Species.Keldeo);
    colt.addMove(Moves.AquaJet);

    colt.enter();

    expect(colt.species).toBe(Species.Keldeo);
  });
});
