import { type JSX, createSignal } from 'solid-js';
import { LearnRefusal, type LearnResult } from '../../../../auth/learn-refusal';
import { remindMove } from '../../../../auth/npcs';
import type { Moves } from '../../../../data/ids/moves';
import { REMINDER_FEE } from '../../../../data/overworld/npc';
import ItemSprite from '../../../items/ItemSprite';
import { Badge, Button, DialogActions, Status } from '../../../styled';
import { type CounterProps, optionsOf, scalesIn } from '../shared';
import { ReminderCounter } from './moves';

/**
 * The Move Reminder: a Heart Scale, and a move the pokemon grew past.
 *
 * The last step is the teaching itself, which is the same question a
 * machine asks. While it is up this counter's own dialog is closed:
 * one modal over another fights it for the closing click
 */
export default function Reminder(props: CounterProps): JSX.Element {
  const [status, setStatus] = createSignal<string | null>(null);
  const [picked, setPicked] = createSignal<string | null>(null);
  const [chosen, setChosen] = createSignal<Moves | null>(null);

  /**
   * It is the teaching dialog's `teach`, so what a player agreed to
   * there is what is asked for here, and the scale leaves the bag in
   * the same transaction the move list is written in
   */
  const remind = async (catchId: string, move: Moves, replaces: number): Promise<LearnResult> => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    if (snapshot == null || standing == null) {
      return { refused: LearnRefusal.Gone };
    }
    return remindMove(snapshot, standing[0], catchId, move, replaces);
  };

  /** The scale is gone and the move is back */
  const remembered = (): void => {
    setPicked(null);
    setChosen(null);
    setStatus('He hummed, tapped its head, and it remembered. (−1 Heart Scale)');
    props.onTraded();
    props.onServed();
    props.onChange?.();
  };

  return (
    <>
      <ReminderCounter
        options={optionsOf(props)}
        scales={scalesIn(props)}
        fee={REMINDER_FEE}
        picked={picked()}
        chosen={chosen()}
        busy={false}
        onPick={(id) => {
          setStatus(null);
          setChosen(null);
          setPicked(id);
        }}
        onChoose={(move) => {
          setChosen(move);
        }}
      />
      <Status message={status()} />
      <DialogActions>
        <Button
          tone="primary"
          disabled={scalesIn(props) < 1 || picked() == null || chosen() == null}
          // The badge is the price drawn rather than spelled out, so
          // the button says in a picture what the bag says in one
          label="Remind, 1 Heart Scale"
          onClick={() => {
            const id = picked();
            const move = chosen();

            if (id != null && move != null) {
              props.ask({
                catchId: id,
                move,
                cost: 'The Heart Scale',
                teach: remind,
                onTaught: remembered,
              });
            }
          }}
        >
          Remind{' '}
          <Badge tone="gold">
            <ItemSprite item={REMINDER_FEE} size={16} label="" />1
          </Badge>
        </Button>
        {props.walkOn()}
      </DialogActions>
    </>
  );
}
