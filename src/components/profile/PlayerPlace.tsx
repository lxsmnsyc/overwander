import { type JSX, type Resource, Show, Suspense, createResource } from 'solid-js';
import type { PositionRecord } from '../../auth/position-record';
import { Badge, Card, Meta, Note, Row } from '../styled';
import { getPlayerPosition } from '../../auth/positions';
import namePlace from '../../overworld/place';

/**
 * Where a trainer is standing.
 *
 * The position is the one thing about the overworld that is stored
 * rather than derived, and it is read through the server: the rules
 * let a player read their own document and nobody else's, while a
 * profile is opened on somebody else nearly every time it is opened
 * at all.
 *
 * What the place is *called* is derived here from the coordinates the
 * same way the overworld names it, so the two never drift apart.
 */

/** When they were last heard from, said the way a date is said locally */
function walked(at: number): string {
  return Number.isNaN(at) || at === 0 ? 'unknown' : new Date(at).toLocaleString();
}

/**
 * The line itself, which is where the position is read. A read in the
 * body that declared it throws past every boundary written there
 */
function PlaceLine(props: { place: Resource<PositionRecord | null> }): JSX.Element {
  return (
    <Show
      when={props.place()}
      fallback={<Note>They have not walked anywhere yet.</Note>}
    >
      {(at) => (
        <Row>
          <Badge tone="leaf">{namePlace(at().chunkX, at().chunkY)}</Badge>
          <Meta>
            cell {at().cellX}, {at().cellY}
          </Meta>
          <Meta class="ml-auto">last moved {walked(at().movedAt)}</Meta>
        </Row>
      )}
    </Show>
  );
}

export default function PlayerPlace(props: { player: string }): JSX.Element {
  const [place] = createResource(() => props.player, getPlayerPosition);

  return (
    <Card title="Standing">
      <Suspense fallback={<Note>Looking for them…</Note>}>
        <PlaceLine place={place} />
      </Suspense>
    </Card>
  );
}
