import { Title } from '@solidjs/meta';
import type { JSX } from 'solid-js';
import { clientOnly } from '@solidjs/start';

/**
 * The weather demo, and nothing of it on the server.
 *
 * The page is a canvas and a frame timer, neither of which exists
 * until a browser is here, so it is loaded on the client outright and
 * the server sends the title and a space for it
 */
const WeatherDemo = clientOnly(async () => import('../../components/demo/WeatherDemo'));

export default function WeatherDemoPage(): JSX.Element {
  return (
    <>
      <Title>Weather demo · Overwander</Title>
      <WeatherDemo />
    </>
  );
}
