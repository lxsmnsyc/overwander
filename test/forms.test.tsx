import { afterEach, describe, expect, it } from 'vitest';
import { converse } from '../src/components/forms/conversation';
import { type FormProps, defineForm } from '../src/components/forms/form';
import { dropFrame, frames, openForm, topFrame } from '../src/components/forms/stack';

/**
 * Forms are promises over a stack of frames. Nothing here draws a
 * dialog: a frame's body is called the way the host would, and the
 * test form hands its controls back instead of rendering buttons
 */

/** The last test form drawn, with the controls its view was handed */
let drawn: FormProps<string, string> | undefined;

const EchoForm = defineForm<string, string>({
  title: () => 'Echo',
  prompt: (input) => input,
  view: (props) => {
    drawn = props;
    return null;
  },
});

/** Let a script's chain of awaits run up to its next step */
async function tick(): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/** Draw the frame on top, as the host does */
function drawTop(): void {
  topFrame(frames())?.body();
}

afterEach(() => {
  for (const frame of frames()) {
    dropFrame(frame.id);
  }
  drawn = undefined;
});

describe('action forms', () => {
  it('opens over whatever is up and settles with the answer', async () => {
    const answer = openForm(EchoForm, 'first');

    drawTop();
    expect(drawn?.input).toBe('first');
    drawn?.submit('yes');

    await expect(answer).resolves.toBe('yes');
  });

  it('settles with null when the player walks away', async () => {
    const answer = openForm(EchoForm, 'leaving');

    topFrame(frames())?.onDismiss();

    await expect(answer).resolves.toBeNull();
  });

  it('shows only the top frame, and the one under it once that is answered', async () => {
    const under = openForm(EchoForm, 'under');
    const over = openForm(EchoForm, 'over');

    drawTop();
    expect(drawn?.input).toBe('over');
    drawn?.cancel();
    await expect(over).resolves.toBeNull();

    drawTop();
    expect(drawn?.input).toBe('under');
    drawn?.submit('done');
    await expect(under).resolves.toBe('done');
  });

  it('drops a frame answered while hidden, since nothing will see it fade', () => {
    void openForm(EchoForm, 'under');
    drawTop();

    const hidden = drawn;

    void openForm(EchoForm, 'over');
    hidden?.submit('early');

    expect(frames().length).toBe(1);
  });
});

describe('conversations', () => {
  it('runs a script through its forms, in one frame', async () => {
    const said: string[] = [];
    const { done } = converse({ name: 'Somebody', greeting: 'Hello.' }, async (talk) => {
      said.push((await talk.form(EchoForm, 'name?')) ?? 'nobody');
      said.push((await talk.form(EchoForm, 'again?')) ?? 'nobody');
    });

    expect(frames().length).toBe(1);
    await tick();
    drawTop();
    drawn?.submit('Red');
    await tick();
    drawTop();
    expect(drawn?.input).toBe('again?');
    drawn?.cancel();
    await done;

    expect(said).toEqual(['Red', 'nobody']);
    expect(topFrame(frames())).toBeUndefined();
  });

  it('ends the script where it stands when the player walks away', async () => {
    let reached = false;
    const { done } = converse({ name: 'Somebody', greeting: 'Hello.' }, async (talk) => {
      await talk.say('Wait for me.');
      reached = true;
    });

    topFrame(frames())?.onDismiss();
    await done;

    expect(reached).toBe(false);
  });

  it('can be ended from outside', async () => {
    let reached = false;
    const conversation = converse({ name: 'Somebody', greeting: 'Hello.' }, async (talk) => {
      await talk.form(EchoForm, 'still there?');
      reached = true;
    });

    conversation.end();
    await conversation.done;

    expect(reached).toBe(false);
  });

  it('hands a script’s failure to whoever started it', async () => {
    const { done } = converse({ name: 'Somebody', greeting: 'Hello.' }, async () => {
      throw new Error('The counter is shut.');
    });

    await expect(done).rejects.toThrow('The counter is shut.');
    expect(topFrame(frames())).toBeUndefined();
  });
});
