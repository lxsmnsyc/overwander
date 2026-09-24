import { type JSX, Show, createSignal } from 'solid-js';
import type { PlayerIdentity } from '../../../auth/user';
import { beginDungeonRun } from '../../../auth/dungeons';
import { TEAM_SIZE } from '../../../auth/teams';
import {
  FRONTIER_BRAIN_RULES,
  FrontierRule,
  frontierTeamSize,
} from '../../../data/overworld/experts';
import DungeonKind from '../../../data/overworld/dungeon';
import type { DungeonLayout } from '../../../overworld/dungeon/layout';
import { getDungeonLayout } from '../../../overworld/dungeon/stage';
import TeamPickerDialog from '../../battle/TeamPickerDialog';
import { type OpenDungeon, useGame } from '../../app/game-context';
import { Button, Dialog, DialogActions, Meta, Status } from '../../styled';
import { dungeonTitle } from './describe';

/**
 * The way into a dungeon: what it is, and the party locked in for the
 * run. Once a run has started the floors are walked on the board, so
 * this only ever shows at the door
 */
export default function DungeonDialog(props: {
  user: PlayerIdentity;
  open: OpenDungeon | null;
  onClose: () => void;
}): JSX.Element {
  const game = useGame();
  const [picking, setPicking] = createSignal(false);
  const [busy, setBusy] = createSignal(false);
  const [status, setStatus] = createSignal<string | null>(null);

  const layout = (): DungeonLayout | null => {
    const open = props.open;

    return open == null ? null : getDungeonLayout(open.snapshot, open.cell);
  };
  const rules = (): FrontierRule => {
    const open = props.open;
    const brain =
      open != null && layout()?.kind === DungeonKind.Frontier
        ? open.snapshot.getFrontierBrain(open.cell)
        : null;

    return brain == null ? FrontierRule.None : FRONTIER_BRAIN_RULES[brain];
  };
  const most = (): number =>
    rules() === FrontierRule.None ? TEAM_SIZE : frontierTeamSize(rules());

  const begin = (catches: string[]): void => {
    const open = props.open;
    const run = open?.run;

    setPicking(false);
    if (open == null || run == null || busy()) {
      return;
    }
    setBusy(true);
    setStatus(null);
    beginDungeonRun(run.id, catches)
      .then((started) => {
        if (started == null) {
          setStatus('The way in is shut to that party.');
          return;
        }
        game.setDungeon({ ...open, run: started, note: undefined });
      })
      .catch((caught: unknown) => {
        setStatus(caught instanceof Error ? caught.message : String(caught));
      })
      .finally(() => {
        setBusy(false);
      });
  };

  const title = (): string => {
    const open = props.open;
    const held = layout();

    return open == null || held == null ? 'Dungeon' : dungeonTitle(held, open.snapshot, open.cell);
  };

  return (
    <>
      <Dialog
        isOpen={props.open?.run != null && props.open.run.state == null && !picking()}
        onClose={props.onClose}
        title={title()}
        description="Walk it floor by floor with the party you bring in."
      >
        <div class="flex flex-col gap-2 py-2">
          <Show when={props.open?.note}>{(note) => <Meta>{note()}</Meta>}</Show>
          <Meta>
            {layout()?.floors.length} floors. The party you bring is the party you finish with:
            nothing mends it on the way but your own medicine, and losing a fight sends you back to
            the entrance.
          </Meta>
          <DialogActions>
            <Button
              tone="primary"
              disabled={busy()}
              onClick={() => {
                if (rules() === FrontierRule.Rented) {
                  begin([]);
                  return;
                }
                setPicking(true);
              }}
            >
              Go in
            </Button>
            <Button onClick={props.onClose}>Walk away</Button>
          </DialogActions>
        </div>
        <Status message={status()} />
      </Dialog>

      <TeamPickerDialog
        player={props.user.uid}
        max={most()}
        isOpen={picking()}
        onClose={() => {
          setPicking(false);
        }}
        onSubmit={begin}
      />
    </>
  );
}
