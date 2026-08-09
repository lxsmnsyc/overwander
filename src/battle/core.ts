import AleaRNG from '../core/alea';
import { EventEngine } from '../core/event-engine';
import { Weathers } from '../data/ids/status';
import type Alliance from './alliance';
import type { BattleEventMap } from './events';
import { BattleEvents } from './events';
import type Team from './team';
import type Unit from './unit';

export interface BattleLimits {
  /**
   * Maximum holdable items a unit can carry at once
   */
  items: number;
  /**
   * Maximum abilities a unit can have at once
   */
  abilities: number;
}

export const enum BattleModes {
  PvP = 0,
  /**
   * Raid battles: weather changes only affect the changing unit's
   * own team, unless a Boss unit triggers them
   */
  Raid = 1,
}

export default class Battle extends EventEngine<BattleEventMap> {
  rng: AleaRNG;

  limits: BattleLimits;

  mode: BattleModes;

  constructor(seed: string, limits?: Partial<BattleLimits>, mode = BattleModes.PvP) {
    super();
    this.rng = new AleaRNG(seed);
    this.limits = {
      items: limits?.items ?? 1,
      abilities: limits?.abilities ?? 1,
    };
    this.mode = mode;
  }

  random(): number {
    return this.rng.random();
  }

  randomRange(min: number, max: number): number {
    return min + this.random() * (max - min);
  }

  initialize(): void {
    this.emit(BattleEvents.Initialize, {
      id: 'Initialize',
      disabled: false,
    });
  }

  start(): void {
    this.emit(BattleEvents.Start, {
      id: 'Start',
      disabled: false,
    });
  }

  end(): void {
    this.emit(BattleEvents.End, {
      id: 'End',
      disabled: false,
    });
  }

  tick(duration: number): void {
    this.emit(BattleEvents.Tick, {
      id: 'Tick',
      disabled: false,
      duration,
    });
  }

  // Battle state
  weather = {
    current: Weathers.None,
    disabled: false,
  };

  setWeather(weather: Weathers): void {
    this.emit(BattleEvents.SetWeather, {
      id: 'Weather',
      disabled: false,
      weather,
    });
  }

  alliances = new Set<Alliance>();

  addAlliance(alliance: Alliance): void {
    this.emit(BattleEvents.AddAlliance, {
      id: 'AddAlliance',
      disabled: false,
      alliance,
    });
  }

  removeAlliance(alliance: Alliance): void {
    this.emit(BattleEvents.RemoveAlliance, {
      id: 'RemoveAlliance',
      disabled: false,
      alliance,
    });
  }

  /**
   * Every team across all alliances, optionally excluding one
   * alliance (e.g. the unit's own, to reach only enemy teams)
   */
  *teams(exclude?: Alliance): IterableIterator<Team> {
    for (const alliance of this.alliances) {
      if (alliance !== exclude) {
        yield* alliance.teams;
      }
    }
  }

  /**
   * Every unit across all teams, optionally excluding one alliance
   */
  *units(exclude?: Alliance): IterableIterator<Unit> {
    for (const team of this.teams(exclude)) {
      yield* team.units;
    }
  }
}
