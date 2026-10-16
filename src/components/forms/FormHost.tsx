import { For, type JSX } from 'solid-js';
import { Dialog } from '../styled';
import { type Frame, dropFrame, frames, topFrame } from './stack';

/**
 * Where every open form and conversation is drawn, once for the whole
 * app. Only the top frame shows; the ones under it come back when it
 * is answered
 */
export default function FormHost(): JSX.Element {
  const top = (): Frame | undefined => topFrame(frames());

  return (
    <For each={frames()}>
      {(frame) => (
        <Dialog
          isOpen={frame.live() && top()?.id === frame.id}
          onClose={frame.onDismiss}
          afterLeave={() => {
            if (!frame.live()) {
              dropFrame(frame.id);
            }
          }}
          title={frame.title()}
          description={frame.line()}
          lead={frame.lead?.()}
          width={frame.width?.()}
          insistent={frame.insistent?.()}
        >
          {frame.body()}
        </Dialog>
      )}
    </For>
  );
}
