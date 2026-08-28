import { type ComponentProps, For, type JSX, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import type { Types } from '../../data/constants/types';
import Weather, {
  WEATHER_DESCRIPTIONS,
  WEATHER_NAMES,
  WEATHER_TYPES,
} from '../../data/overworld/weather';
import TypeBadge from '../sprites/TypeBadge';
import { Detail, TooltipHost } from '../styled';
import {
  AshIcon,
  AuroraIcon,
  CloudDrizzleIcon,
  CloudFogIcon,
  CloudHailIcon,
  CloudIcon,
  CloudLightningIcon,
  CloudRainIcon,
  CloudRainWindIcon,
  CloudSnowIcon,
  CloudsIcon,
  DustIcon,
  HeatWaveIcon,
  MeteorIcon,
  MistIcon,
  PollenIcon,
  RainbowIcon,
  SandstormIcon,
  SnowWindIcon,
  SnowflakeIcon,
  SunBrightIcon,
  SunIcon,
  WindIcon,
} from '../icons/weather';

/**
 * The sky, as a picture rather than as its name.
 *
 * The bar it sits in is a strip along the bottom of the world, and a
 * word there is a word competing with the place name beside it. What
 * the drawing costs is said on a card instead: a drawing of hail and a
 * drawing of snow are two grey clouds at this size, and neither says
 * what standing in one is worth.
 */

type WeatherIconComponent = (props: ComponentProps<'svg'>) => JSX.Element;

const WEATHER_ICONS: Record<Weather, WeatherIconComponent> = {
  [Weather.Clear]: SunIcon,
  [Weather.Cloudy]: CloudIcon,
  [Weather.Overcast]: CloudsIcon,
  [Weather.Breezy]: WindIcon,
  [Weather.Drizzle]: CloudDrizzleIcon,
  [Weather.Rain]: CloudRainIcon,
  [Weather.Downpour]: CloudRainWindIcon,
  [Weather.Thunderstorm]: CloudLightningIcon,
  [Weather.Mist]: MistIcon,
  [Weather.Fog]: CloudFogIcon,
  [Weather.Haze]: HeatWaveIcon,
  [Weather.Frost]: SnowflakeIcon,
  [Weather.Snow]: CloudSnowIcon,
  [Weather.Blizzard]: SnowWindIcon,
  [Weather.Hail]: CloudHailIcon,
  [Weather.Sandstorm]: SandstormIcon,
  [Weather.DustHaze]: DustIcon,
  [Weather.Heatwave]: SunBrightIcon,
  [Weather.FallingAsh]: AshIcon,
  [Weather.Aurora]: AuroraIcon,
  [Weather.Rainbow]: RainbowIcon,
  [Weather.PollenDrift]: PollenIcon,
  [Weather.MeteorShower]: MeteorIcon,
};

export function getWeatherIcon(weather: Weather): WeatherIconComponent {
  return WEATHER_ICONS[weather];
}

export interface WeatherIconProps {
  weather: Weather;
  /** How big, as a Tailwind size */
  size?: string;
  class?: string;
}

/** What the sky is kind to, drawn rather than named */
function Favored(props: { weather: Weather }): JSX.Element {
  const favored = (): Types[] => WEATHER_TYPES[props.weather];

  return (
    <Show when={favored().length > 0}>
      <Detail label="Favors">
        <span class="flex flex-wrap gap-1">
          <For each={favored()}>{(type) => <TypeBadge type={type} />}</For>
        </span>
      </Detail>
    </Show>
  );
}

export default function WeatherIcon(props: WeatherIconProps): JSX.Element {
  return (
    <TooltipHost
      class="inline-flex items-center"
      name={WEATHER_NAMES[props.weather]}
      description={WEATHER_DESCRIPTIONS[props.weather]}
      extra={() => <Favored weather={props.weather} />}
    >
      <span
        class={`inline-flex items-center ${props.class ?? ''}`}
        aria-label={WEATHER_NAMES[props.weather]}
        role="img"
      >
        <Dynamic
          component={getWeatherIcon(props.weather)}
          class={props.size ?? 'size-5'}
          aria-hidden="true"
        />
      </span>
    </TooltipHost>
  );
}
