import { type JSX, Show } from 'solid-js';
import { useAuth } from '../../auth/context';
import BattleData from '../app/BattleData';
import GameProvider from '../app/game-context';
import GiftsTab from '../gifts/GiftsTab';
import { Dialog, Note } from '../styled';
import { m } from '../../i18n/paraglide/messages.js';

/**
 * The gifts shelf as the game draws it, without the game around it.
 *
 * The provider is mounted `managing`, as the staff dashboard mounts it,
 * so nothing is walked or written for the player: no position, no
 * start town. The panel has no way out, since there is no world to go
 * back to
 */
export default function GiftsDemo(): JSX.Element {
  const auth = useAuth();

  return (
    <Show when={auth.user()} fallback={<Note>Sign in on the home page first.</Note>}>
      <GameProvider managing>
        <Dialog
          isOpen
          onClose={() => undefined}
          width="wide"
          terse
          title={m.panel_gifts()}
          description={m.panel_gifts_description()}
        >
          <BattleData>
            <GiftsTab />
          </BattleData>
        </Dialog>
      </GameProvider>
    </Show>
  );
}
