import { AleaRNG } from '../core/alea';
import { EventEngine } from '../core/event-engine';
import { Weathers } from '../data/ids/status';
import type { Alliance } from './alliance';
import type { BattleEventMap } from './events';
import { BattleEvents } from './events';

export class Battle extends EventEngine<BattleEventMap> {
  rng: AleaRNG;

  constructor(seed: string) {
    super();
    this.rng = new AleaRNG(seed);
  }

  random() {
    return this.rng.random();
  }

  randomRange(min: number, max: number) {
    return min + this.random() * (max - min);
  }

  initialize() {
    this.emit(BattleEvents.Initialize, {
      id: 'Initialize',
      disabled: false,
    });
  }

  start() {
    this.emit(BattleEvents.Start, {
      id: 'Start',
      disabled: false,
    });
  }

  end() {
    this.emit(BattleEvents.End, {
      id: 'End',
      disabled: false,
    });
  }

  tick(duration: number) {
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

  setWeather(weather: Weathers) {
    this.emit(BattleEvents.SetWeather, {
      id: 'Weather',
      disabled: false,
      weather,
    });
  }

  alliances = new Set<Alliance>();

  addAlliance(alliance: Alliance) {
    this.emit(BattleEvents.AddAlliance, {
      id: 'AddAlliance',
      disabled: false,
      alliance,
    });
  }

  removeAlliance(alliance: Alliance) {
    this.emit(BattleEvents.RemoveAlliance, {
      id: 'RemoveAlliance',
      disabled: false,
      alliance,
    });
  }
}
