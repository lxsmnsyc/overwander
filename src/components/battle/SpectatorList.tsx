import { type Accessor, For, Loading, Show, createMemo } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { type Profile, getProfiles } from '../../auth/profile';
import PlayerPlate from '../profile/PlayerPlate';
import { LIST_PAGE, List, Note, type Pager, RowCard, createPager } from '../styled';
import { useGame } from '../app/game-context';
import { m } from '../../i18n/paraglide/messages.js';

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
  props: SpectatorListProps & { names: Accessor<Map<string, Profile>>; page: Pager<string> },
): JSX.Element {
  const game = useGame();
  // The boundary keeps the names already shown while somebody walking
  // in is looked up, rather than blanking the list to "Reading the room…"
  const named = (uid: string): string => props.names().get(uid)?.nickname ?? uid;

  return (
    <>
      <List>
        <For each={props.page.shown()}>
          {(uid) => (
            <RowCard tone={uid === props.player ? 'leaf' : 'plain'} class="min-h-0 py-1.5">
              <PlayerPlate
                name={uid === props.player ? m.battle_you() : named(uid)}
                sprite={props.names().get(uid)?.sprite ?? null}
                onOpen={
                  uid === props.player
                    ? undefined
                    : () => {
                        game.setVisiting(uid);
                      }
                }
              />
            </RowCard>
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
  // Keyed on who is watching, so a list rebuilt with the same people
  // in it does not ask again
  const asked = createMemo(() => [...new Set(props.watching)].sort().join(','));
  const names = createMemo(async (): Promise<Map<string, Profile>> => {
    const uids: string[] = [];

    for (const uid of asked().split(',')) {
      if (uid !== '') {
        uids.push(uid);
      }
    }
    return getProfiles(uids);
  });

  return (
    <Show when={props.watching.length > 0} fallback={<Note>{m.spectators_none()}</Note>}>
      <Loading fallback={<Note>{m.spectators_reading()}</Note>}>
        <Watchers {...props} names={names} page={page} />
      </Loading>
    </Show>
  );
}
