import type { Resource } from 'solid-js';

/**
 * Two ways to read a resource without the loading state being kept by
 * hand, and which one to use is about **where the read is**.
 *
 * A read that finds a promise in the air tells the nearest `Suspense`
 * above the component to put its fallback up. That boundary is found
 * through the owner tree, so a component that reads its own resource
 * reaches whatever wraps the component itself. Which is why the
 * declaring body and the reading body are normally split.
 *
 * `latest` is not a way around it: until the resource has resolved
 * once it is the ordinary read, so a body reading its own resource
 * that way still suspends on the first load and only stops afterwards.
 */

/**
 * Wait once, then hold: suspends while the first answer is in the air
 * and never again, so a refetch leaves the last answer standing.
 *
 * For a **child** under a boundary, which is the shape the split
 * leaves. Without it a refetch takes the panel down and stands the
 * fallback in its place, which on a page that is mostly a canvas is
 * the world reloading.
 */
export function settled<T>(resource: Resource<T>): T | undefined {
  if (resource.state === 'unresolved' || resource.state === 'pending') {
    // An unconstrained `T` includes `void`, which is what the rule is
    // guarding against reading. No resource here holds one
    // oxlint-disable-next-line typescript/no-confusing-void-expression
    return resource();
  }
  return resource.latest;
}

/**
 * Whatever has come back so far, and never a wait: `undefined` until
 * the first answer lands, the last answer through every refetch after.
 *
 * For a body that declares its own resource, or anywhere the caller
 * draws its empty state rather than holding the screen. It never
 * reaches the read, so it can never reach a boundary either.
 */
export function answered<T>(resource: Resource<T>): T | undefined {
  return resource.state === 'ready' || resource.state === 'refreshing'
    ? resource.latest
    : undefined;
}
