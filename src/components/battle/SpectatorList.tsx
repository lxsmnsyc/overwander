import { For, type JSX, type Resource, Show, Suspense, createResource } from 'solid-js';
import { type Profile, getProfiles } from '../../auth/profile';
import PlayerPlate from '../profile/PlayerPlate';
import { LIST_PAGE, List, ListRow, Note, type Pager, createPager } from '../styled';
import { useGame } from '../app/game-context';

/**
 * Who is in the room without a party: a raid lobby's onlookers, a
 * duel's audience, and the host of either when they staged the fight
 * for other people
 */
export interface SpectatorListProps {
  /** The reader, who is drawn as "You" rather than by name */
  player: string;
  /** Everybody watching, by uid */
  watching: string[];
}

/**
 * The rows, which is where the names are read. A read in the body that
 * declared the resource throws past every boundary written there and
 * lands on the one around the whole page
 */
function Watchers(
  props: SpectatorListProps & { names: Resource<Map<string, Profile>>; page: Pager<string> },
): JSX.Element {
  const game = useGame();
  const named = (uid: string): string => props.names()?.get(uid)?.nickname ?? uid;

  return (
    <>
      <List>
        <For each={props.page.shown()}>
          {(uid) => (
            <ListRow selected={uid === props.player}>
              <PlayerPlate
                name={uid === props.player ? 'You' : named(uid)}
                avatar={props.names()?.get(uid)?.avatar ?? null}
                onOpen={
                  uid === props.player
                    ? undefined
                    : () => {
                        game.setVisiting(uid);
                      }
                }
              />
            </ListRow>
          )}
        </For>
      </List>
      {props.page.controls()}
    </>
  );
}

export default function SpectatorList(props: SpectatorListProps): JSX.Element {
  // A lobby has no limit on who may watch it, so the list is paged the
  // way every other unbounded one is
  const page = createPager(() => props.watching, LIST_PAGE);
  const [names] = createResource(
    () => [...new Set(props.watching)].sort().join(','),
    async (key): Promise<Map<string, Profile>> => getProfiles(key.split(',').filter(Boolean)),
  );

  return (
    <Show when={props.watching.length > 0} fallback={<Note>Nobody is watching.</Note>}>
      <Suspense fallback={<Note>Reading the room…</Note>}>
        <Watchers {...props} names={names} page={page} />
      </Suspense>
    </Show>
  );
}
