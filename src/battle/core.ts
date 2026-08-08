import AleaRNG from '../core/alea';
import { EventEngine } from '../core/event-engine';
import { Weathers } from '../data/ids/status';
import type Alliance from './alliance';
import type { BattleEventMap } from './events';
import { BattleEvents } from './events';

export default class Battle extends EventEngine<BattleEventMap> {
  rng: AleaRNG;

  constructor(seed: string) {
    super();
    this.rng = new AleaRNG(seed);
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
}
