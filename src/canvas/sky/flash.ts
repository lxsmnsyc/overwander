import Weather from '../../data/overworld/weather';
import seeded from './seed';

/** Lightning: when the sky goes white, and how hard */
interface Flash {
  /** How long between strikes, in seconds */
  every: number;
  /** How long one lasts */
  hold: number;
  colour: string;
  /** How much of it at the brightest */
  depth: number;
}

export const FLASHES: Partial<Record<Weather, Flash>> = {
  [Weather.Thunderstorm]: { every: 4.5, hold: 0.65, colour: '#e8f0ff', depth: 0.5 },
};

/** How bright the sky is at this moment, if lightning is striking */
export function flashAt(weather: Weather, seconds: number): number {
  const flash = FLASHES[weather];

  if (flash == null) {
    return 0;
  }
  const slot = seconds / flash.every;
  const cycle = Math.floor(slot);
  const through = (slot - cycle - seeded(cycle) * 0.7) / (flash.hold / flash.every);

  if (through < 0 || through > 1) {
    return 0;
  }
  // Two peaks and a dip: one stroke is a lamp being switched on, and
  // lightning is a stroke and its return
  const first = Math.exp(-(((through - 0.06) / 0.05) ** 2));
  const second = 0.6 * Math.exp(-(((through - 0.3) / 0.1) ** 2));

  // Some strikes are further off than others
  return Math.min(1, first + second) * (0.45 + 0.55 * seeded(cycle + 61));
}

/** What is falling, and how it falls. */
