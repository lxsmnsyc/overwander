import type { RouteSectionProps } from '@solidjs/router';
import type { JSX } from '@solidjs/web';
import NotFound from './[...404]';

/** The demo pages are development tools, so a production build answers every one with a 404 */
export default function DemoLayout(props: RouteSectionProps): JSX.Element {
  return import.meta.env.DEV ? props.children : <NotFound />;
}
