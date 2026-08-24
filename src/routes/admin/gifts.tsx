import { For, type JSX, Show, createSignal } from 'solid-js';
import { Button, Card, Note, Row } from '../../components/styled';
import GiftForm from '../../components/admin/GiftForm';
import GiftsTab from '../../components/gifts/GiftsTab';

/**
 * The ledger, and the way to add to it.
 *
 * The list below is every gift ever written, not the reader's own
 * shelf: whose each is, how often it has been taken, and what has run
 * out. There is nothing to press on it; taking happens in the game.
 * The form above writes to whoever is picked in it
 */
export default function AdminGiftsPage(): JSX.Element {
  const [adding, setAdding] = createSignal(false);
  /**
   * Bumped when a gift is written, so the ledger under the form is
   * read again with the new line on it
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

      <Card title="Every gift">
        <Note>Everything that has been put on a shelf, taken or not.</Note>
        {/* Keyed on the count, so a gift just written is read again
            rather than sitting behind the ledger that was already
            drawn */}
        <For each={[given()]}>{() => <GiftsTab everything />}</For>
      </Card>
    </div>
  );
}
