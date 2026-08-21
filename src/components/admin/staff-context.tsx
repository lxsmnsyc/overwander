import { type Accessor, type JSX, type ParentProps, createContext, useContext } from 'solid-js';

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
  uid: string;
  role: Accessor<string>;
}

const StaffContext = createContext<Staff>();

export function StaffProvider(props: ParentProps<Staff>): JSX.Element {
  return (
    <StaffContext.Provider value={{ uid: props.uid, role: props.role }}>
      {props.children}
    </StaffContext.Provider>
  );
}

export default function useStaff(): Staff {
  const staff = useContext(StaffContext);

  if (staff == null) {
    throw new Error('useStaff must be used inside the dashboard');
  }
  return staff;
}
