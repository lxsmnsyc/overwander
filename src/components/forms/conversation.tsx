import { type JSX, Match, Switch, createSignal } from 'solid-js';
import { Button, DialogActions, type DialogWidth } from '../styled';
import { type Choice, type ChoiceInput, choiceForm } from './choice';
import { type ActionForm, widthOf } from './form';
import { openFrame } from './stack';

/** Whoever the player is talking to */
export interface Speaker {
  name: string;
  /** Their face on the nameplate */
  portrait?: () => JSX.Element;
  /** What they open with, which stands until they say something else */
  greeting: string;
}

/**
 * What a script is handed: the box it talks through. Every step waits
 * for the player, and a player who walks away mid-step ends the script
 * there, so a script never has to ask whether anyone is still listening
 */
export interface Conversation {
  /** Say a line, and wait for the player to read it */
  say: (line: string) => Promise<void>;
  /**
   * Ask through a form, drawn in the box under the speaker's line. The
   * line stands unless a new one is given. Null is the player
   * declining, and the script decides what that means
   */
  form: <I, R>(form: ActionForm<I, R>, input: I, options?: StepOptions) => Promise<R | null>;
  /** Ask for one of a handful of answers */
  ask: <T>(
    line: string,
    choices: Choice<T>[],
    options?: Omit<ChoiceInput<T>, 'choices'>,
  ) => Promise<T | null>;
}

export interface StepOptions {
  /** What the speaker says over the form; the last line stands otherwise */
  line?: string;
  /** What the way out says, where declining goes back a step rather than away */
  leave?: string;
}

export interface ConversationHandle {
  /** Settles when the script is done or the player walked away; fails with the script */
  done: Promise<void>;
  /** End it from outside, as if the player had walked away */
  end: () => void;
}

/** Thrown into a script whose player has walked away, to unwind it */
class WalkedAway extends Error {}

type Step =
  | { kind: 'say'; next: () => void }
  | { kind: 'form'; view: () => JSX.Element; width?: DialogWidth; insistent: boolean }
  | { kind: 'wait' };

/** The prop-shaped steps, narrowed for `Match` */
function asSay(step: Step): Extract<Step, { kind: 'say' }> | false {
  return step.kind === 'say' && step;
}

function asForm(step: Step): Extract<Step, { kind: 'form' }> | false {
  return step.kind === 'form' && step;
}

/**
 * Talk to somebody: one dialog for the whole exchange, whose line and
 * body move on as the script does
 */
export function converse(
  speaker: Speaker,
  script: (talk: Conversation) => Promise<void>,
): ConversationHandle {
  const [line, setLine] = createSignal(speaker.greeting);
  const [step, setStep] = createSignal<Step>({ kind: 'wait' });

  let walked = false;
  /** How the step being waited on is thrown out of, when the player leaves */
  let abandon: (() => void) | undefined;

  const walk = (close: () => void): void => {
    if (walked) {
      return;
    }
    walked = true;
    close();
    abandon?.();
  };

  /** Wait on one step, unless or until the player walks away */
  const wait = async <T,>(start: (settle: (value: T) => void) => void): Promise<T> => {
    if (walked) {
      throw new WalkedAway();
    }
    return new Promise<T>((resolve, reject) => {
      abandon = () => {
        reject(new WalkedAway());
      };
      start((value) => {
        abandon = undefined;
        // Something to show while the script works out what comes next
        setStep({ kind: 'wait' });
        resolve(value);
      });
    });
  };

  const talk: Conversation = {
    say: async (said) =>
      wait<undefined>((settle) => {
        setLine(said);
        setStep({
          kind: 'say',
          next: () => {
            settle(undefined);
          },
        });
      }),
    form: async (form, input, options) =>
      wait((settle) => {
        if (options?.line != null) {
          setLine(options.line);
        }
        setStep({
          kind: 'form',
          width: widthOf(form, input),
          insistent: form.insistent === true,
          view: () =>
            form.view({
              input,
              submit: settle,
              cancel: () => {
                settle(null);
              },
              leave: options?.leave ?? 'Walk on',
            }),
        });
      }),
    async ask<T>(
      said: string,
      choices: Choice<T>[],
      options?: Omit<ChoiceInput<T>, 'choices'>,
    ): Promise<T | null> {
      return talk.form(choiceForm<T>(), { ...options, choices }, { line: said });
    },
  };

  const frame = openFrame((close) => ({
    title: () => speaker.name,
    line: () => <span class="italic">“{line()}”</span>,
    lead: speaker.portrait,
    width: () => {
      const now = step();

      return now.kind === 'form' ? now.width : undefined;
    },
    insistent: () => {
      const now = step();

      return now.kind === 'form' && now.insistent;
    },
    body: () => (
      <Switch>
        <Match when={asSay(step())} keyed>
          {(now) => (
            <DialogActions>
              <Button tone="primary" onClick={now.next}>
                Next
              </Button>
              <Button
                onClick={() => {
                  walk(close);
                }}
              >
                Walk on
              </Button>
            </DialogActions>
          )}
        </Match>
        {/* Keyed, so a form asked straight after another is drawn afresh */}
        <Match when={asForm(step())} keyed>
          {(now) => now.view()}
        </Match>
        <Match when={step().kind === 'wait'}>
          <p class="text-center text-sm text-muted" aria-busy="true">
            …
          </p>
        </Match>
      </Switch>
    ),
    onDismiss: () => {
      walk(close);
    },
  }));

  const done = script(talk)
    .catch((thrown: unknown) => {
      if (!(thrown instanceof WalkedAway)) {
        throw thrown;
      }
    })
    .finally(() => {
      walked = true;
      frame.close();
    });

  return {
    done,
    end: () => {
      walk(frame.close);
    },
  };
}
