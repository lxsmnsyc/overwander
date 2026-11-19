import { type Accessor, type ParentProps, createContext, useContext } from 'solid-js';
import type { JSX } from '@solidjs/web';

/**
 * Who is reading the dashboard, and what they are.
 *
 * Every screen behind the gate needs both, and the gate has already
 * read the profile to decide whether to open at all. Passing it down
 * means nothing reads the same row twice, and no screen has to
 * guess.
 *
 * It decides what is **offered** and nothing else: every call behind
 * these screens is checked again on the server, where a browser's
 * opinion of its own role counts for nothing
 */
export interface Staff {
  uid: Accessor<string>;
  role: Accessor<string>;
}

const StaffContext = createContext<Staff>();

/**
 * A provider reads its value once, so both fields are accessors that
 * read the props: the session can change under the dashboard
 */
export function StaffProvider(
  props: ParentProps<{ uid: string; role: Accessor<string> }>,
): JSX.Element {
  return (
    <StaffContext value={{ uid: () => props.uid, role: () => props.role() }}>
      {props.children}
    </StaffContext>
  );
}

/** Who is reading the dashboard. Outside it this throws: a missing provider is a bug */
export default function useStaff(): Staff {
  return useContext(StaffContext);
}
