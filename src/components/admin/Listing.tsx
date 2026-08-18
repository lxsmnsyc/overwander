import { type JSX, type ParentProps, Show } from 'solid-js';
import { Button, Card, Note, Row, Search } from '../styled';

/**
 * A long collection, read a page at a time with a box to narrow it.
 *
 * Both listings the dashboard has are the same shape — search across
 * the top, rows in the middle, the pager under them — and the server
 * answers both with the same envelope, so the frame is written once
 * and the pages supply only their rows.
 */

/**
 * How long the box here waits before asking.
 *
 * Longer than the game's own searches, which narrow a list already in
 * hand: this one is answered by the server, and every settled
 * keystroke reads every account there is. Long enough that a name
 * typed at speed asks once, short enough that it still reads as the
 * list answering
 */
const LISTING_DEBOUNCE = 500;
export interface ListingProps extends ParentProps {
  search: string;
  onSearch: (value: string) => void;
  placeholder: string;
  /** The page being shown, counted from zero */
  page: number;
  pages: number;
  total: number;
  /**
   * Whether the server stopped scanning before the end. It is said out
   * loud: a listing that quietly shows less than everything reads as
   * everything
   */
  capped?: boolean;
  onPage: (page: number) => void;
  /** What the rows are called, for the count: "players", "raids" */
  noun: string;
}

export default function Listing(props: ListingProps): JSX.Element {
  return (
    <Card>
      <Row class="justify-between">
        <Search
          value={props.search}
          placeholder={props.placeholder}
          wait={LISTING_DEBOUNCE}
          onChange={(value) => {
            // A narrower list has fewer pages, and page nine of it may
            // not exist: every search starts at the top
            props.onSearch(value);
            props.onPage(0);
          }}
        />
        <Note>
          {props.total} {props.noun}
          {props.capped === true ? ' (as far as the scan reached)' : ''}
        </Note>
      </Row>

      <Show
        when={props.total > 0}
        fallback={<Note class="py-6 text-center">Nothing matches that.</Note>}
      >
        {props.children}
      </Show>

      <Show when={props.pages > 1}>
        <Row class="justify-end">
          <Button
            disabled={props.page <= 0}
            onClick={() => {
              props.onPage(props.page - 1);
            }}
          >
            Back
          </Button>
          <Note>
            Page {props.page + 1} of {props.pages}
          </Note>
          <Button
            disabled={props.page >= props.pages - 1}
            onClick={() => {
              props.onPage(props.page + 1);
            }}
          >
            Next
          </Button>
        </Row>
      </Show>
    </Card>
  );
}
