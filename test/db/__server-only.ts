/**
 * Stand-in for the `server-only` marker. The real package throws on
 * import; in the app SolidStart resolves it to an empty module before
 * Node sees it, and this alias does the same for the rules suite,
 * which imports `src/server/*` to drive real flows against the stack
 */
export {};
