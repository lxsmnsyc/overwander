import { For, type JSX } from 'solid-js';
import { Card, Note } from '../styled';

/**
 * A section of the dashboard that has its place but nothing behind it
 * yet. It says what is meant to live here rather than drawing an
 * empty table, so the shell can be walked through before any of it
 * reads or writes a thing
 */
export default function Pending(props: { plans: string[] }): JSX.Element {
  return (
    <Card title="Not wired up yet">
      <Note>This section is a place in the shell. Nothing here reads or writes the game.</Note>
      <ul class="m-0 list-disc pl-5 text-sm text-muted">
        <For each={props.plans}>{(plan) => <li class="marker:text-line">{plan}</li>}</For>
      </ul>
    </Card>
  );
}
