import { For } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { Dialog, HeroBand } from '../styled';
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
          // Whoever is speaking stands on the band's stage, and their line is
          // its bubble; a frame with nobody speaking keeps the plain line
          hero={
            frame.lead == null ? undefined : (
              <HeroBand tone="tide" size="talk" stage={frame.lead()}>
                {frame.line()}
              </HeroBand>
            )
          }
          width={frame.width?.()}
          insistent={frame.insistent?.()}
        >
          {frame.body()}
        </Dialog>
      )}
    </For>
  );
}
