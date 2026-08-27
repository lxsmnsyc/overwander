import { For, type JSX, Show, createResource } from 'solid-js';
import { type Profile, getProfiles } from '../../auth/profile';
import PlayerPlate from '../profile/PlayerPlate';
import { List, ListRow, Note } from '../styled';
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

export default function SpectatorList(props: SpectatorListProps): JSX.Element {
  const game = useGame();
  // Read through `latest`: a lobby that suspended every time somebody
  // walked in would blink on its way to saying so
  const [names] = createResource(
    () => [...new Set(props.watching)].sort().join(','),
    async (key): Promise<Map<string, Profile>> => getProfiles(key.split(',').filter(Boolean)),
  );
  const named = (uid: string): string => names.latest?.get(uid)?.nickname ?? uid;

  return (
    <Show when={props.watching.length > 0} fallback={<Note>Nobody is watching.</Note>}>
      <List>
        <For each={props.watching}>
          {(uid) => (
            <ListRow selected={uid === props.player}>
              <PlayerPlate
                name={uid === props.player ? 'You' : named(uid)}
                avatar={names.latest?.get(uid)?.avatar ?? null}
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
    </Show>
  );
}
