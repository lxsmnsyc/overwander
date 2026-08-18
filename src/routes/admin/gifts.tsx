import { For, type JSX, Show, createSignal } from 'solid-js';
import { Button, Card, Note, Row } from '../../components/styled';
import GiftForm from '../../components/admin/GiftForm';
import GiftsTab from '../../components/gifts/GiftsTab';

/**
 * The shelf, and the way to put something on somebody else's.
 *
 * The shelf below is the reader's own, with nothing to press: a gift
 * is taken in the world, where the player is standing and a meeting
 * can be stood in front of them. The form above writes to whoever is
 * picked in it
 */
export default function AdminGiftsPage(): JSX.Element {
  const [adding, setAdding] = createSignal(false);
  /**
   * Bumped when a gift is written, so a gift given to the reader
   * themselves shows up on the shelf under the form
   */
  const [given, setGiven] = createSignal(0);

  return (
    <div class="flex flex-col gap-4">
      <Show
        when={adding()}
        fallback={
          <Row class="justify-end">
            <Button
              tone="primary"
              onClick={() => {
                setAdding(true);
              }}
            >
              Add
            </Button>
          </Row>
        }
      >
        <GiftForm
          onGiven={() => {
            setGiven((count) => count + 1);
          }}
          onClose={() => {
            setAdding(false);
          }}
        />
      </Show>

      <Card title="Your shelf">
        <Note>What is waiting for you. Taking it happens in the game.</Note>
        {/* Keyed on the count, so a gift given to yourself is read
            again rather than sitting behind the shelf that was
            already drawn */}
        <For each={[given()]}>{() => <GiftsTab viewOnly />}</For>
      </Card>
    </div>
  );
}
