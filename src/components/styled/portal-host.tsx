import { type JSX, type ParentProps, createContext, useContext } from 'solid-js';
import { isServer } from 'solid-js/web';

/**
 * Where a floating thing is drawn: the nearest dialog's own container,
 * or the document's for anything opened outside one.
 *
 * A card or a panel has to leave the box it was written in, which
 * scrolls and clips, but leaving it for the document put everything on
 * one pile in the order it happened to open. A card belonging to a
 * dialog then stayed over the dialog opened *after* it, and a listbox
 * dropped inside a dialog counted as outside it. A dialog carrying its
 * own container fixes both: what belongs to it is inside it, so it
 * stacks with it and closes with it.
 */
const HostContext = createContext<HTMLElement | undefined>();

/** The document's container, which stands after the app root */
function rootHost(): HTMLElement | undefined {
  if (isServer) {
    return undefined;
  }
  return document.getElementById('portals') ?? undefined;
}

/**
 * The container to portal into, for a component that floats. Outside
 * every dialog it is the document's own
 */
export function usePortalHost(): () => HTMLElement | undefined {
  const held = useContext(HostContext);

  return () => held ?? rootHost();
}

/**
 * A container of its own, standing after whatever it wraps.
 *
 * The element is made up front rather than taken from a `ref`: the
 * children are built before a sibling's ref has run, and a portal
 * among them would have gone to the document instead. It draws no box
 * of its own, so it changes nothing about the layout it stands in
 */
export function PortalHost(props: ParentProps): JSX.Element {
  const host = isServer ? undefined : document.createElement('div');

  if (host != null) {
    host.style.display = 'contents';
    host.dataset.portals = '';
  }

  return (
    <HostContext.Provider value={host}>
      {props.children}
      {host}
    </HostContext.Provider>
  );
}
