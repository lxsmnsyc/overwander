import { type JSX, createSignal } from 'solid-js';
import { LearnRefusal, type LearnResult } from '../../../../auth/learn-refusal';
import { tutorMove } from '../../../../auth/npcs';
import type { Moves } from '../../../../data/ids/moves';
import { TUTOR_FEE } from '../../../../data/overworld/npc';
import ItemSprite from '../../../items/ItemSprite';
import { Badge, Button, DialogActions, Status } from '../../../styled';
import { type CounterProps, optionsOf, scalesIn } from '../shared';
import { TutorCounter } from './moves';

/**
 * The Move Tutor: the same conversation the reminder has, for a move
 * nothing grows into. The fee moves in the transaction the move list
 * is written in, so a refusal costs nothing
 */
export default function Tutor(props: CounterProps): JSX.Element {
  const [status, setStatus] = createSignal<string | null>(null);
  const [picked, setPicked] = createSignal<string | null>(null);
  const [chosen, setChosen] = createSignal<Moves | null>(null);

  const tutor = async (catchId: string, move: Moves, replaces: number): Promise<LearnResult> => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    if (snapshot == null || standing == null) {
      return { refused: LearnRefusal.Gone };
    }
    return tutorMove(snapshot, standing[0], catchId, move, replaces);
  };

  /** The fee is gone and the lesson took */
  const tutored = (): void => {
    setPicked(null);
    setChosen(null);
    setStatus('One lesson, well spent. (−1 Heart Scale)');
    props.onTraded();
    props.onServed();
    props.onChange?.();
  };

  return (
    <>
      <TutorCounter
        options={optionsOf(props)}
        scales={scalesIn(props)}
        fee={TUTOR_FEE}
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
          label="Teach, 1 Heart Scale"
          onClick={() => {
            const id = picked();
            const move = chosen();

            if (id != null && move != null) {
              props.ask({
                catchId: id,
                move,
                cost: 'The Heart Scale',
                teach: tutor,
                onTaught: tutored,
              });
            }
          }}
        >
          Teach{' '}
          <Badge tone="gold">
            <ItemSprite item={TUTOR_FEE} size={16} label="" />1
          </Badge>
        </Button>
        {props.walkOn()}
      </DialogActions>
    </>
  );
}
