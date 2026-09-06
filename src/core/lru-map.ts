/**
 * A `Map` that forgets what it has not used lately.
 *
 * It is a `Map` for the lookups and a doubly linked list for the
 * order: the map holds a node per key so a key can be found without
 * walking anything, and the list keeps those nodes newest-first so the
 * one to drop is always the tail. Every operation is constant time,
 * and nothing is scanned to decide what goes.
 *
 * Two things differ from a plain `Map` and both are the point:
 *
 * - **Iteration is newest first**, where a `Map` iterates in insertion
 *   order. What was touched a moment ago comes out before what was
 *   touched an hour ago.
 * - **`get` counts as a use** and moves the key to the front, so it
 *   mutates the order. `has` does not: asking whether something is
 *   held is not using it.
 *
 * `onEvict` is called for a key the limit pushed out, and never for
 * one `delete` or `clear` took: those are the caller's own doing and
 * it already knows.
 */

/**
 * What a `Map`'s own walkers hand back, read off `Map` rather than
 * named: the global the lib calls them is not in scope here
 */
type Walk<T> = ReturnType<Map<T, T>['keys']>;

interface Node<K, V> {
  key: K;
  value: V;
  /** Toward the front, which is the most recently used end */
  prev: Node<K, V> | null;
  next: Node<K, V> | null;
}

export default class LRUMap<K, V> implements Map<K, V> {
  private readonly nodes = new Map<K, Node<K, V>>();

  /** The most recently used entry, and the first one iteration yields */
  private head: Node<K, V> | null = null;
  /** The least recently used entry, which is the next one to go */
  private tail: Node<K, V> | null = null;

  /** How many entries are kept before the tail starts dropping off */
  readonly limit: number;

  constructor(
    limit: number,
    private readonly onEvict?: (key: K, value: V) => void,
  ) {
    // A limit under one is a map that cannot hold what was just put in
    // it, which is a cache nobody meant to build
    this.limit = Math.max(1, Math.floor(limit));
  }

  get size(): number {
    return this.nodes.size;
  }

  readonly [Symbol.toStringTag] = 'LRUMap';

  /** Take a node out of the list, leaving it in nobody's chain */
  private unlink(node: Node<K, V>): void {
    if (node.prev == null) {
      this.head = node.next;
    } else {
      node.prev.next = node.next;
    }
    if (node.next == null) {
      this.tail = node.prev;
    } else {
      node.next.prev = node.prev;
    }
    node.prev = null;
    node.next = null;
  }

  /** Put a node at the front, where the most recently used one lives */
  private pushFront(node: Node<K, V>): void {
    node.prev = null;
    node.next = this.head;
    if (this.head != null) {
      this.head.prev = node;
    }
    this.head = node;
    this.tail ??= node;
  }

  /**
   * Count a node as used. Pointer work rather than a re-insert, since
   * this is the hot path: a drawn sprite is touched every frame
   */
  private touch(node: Node<K, V>): void {
    if (node !== this.head) {
      this.unlink(node);
      this.pushFront(node);
    }
  }

  /** What is held under the key. Reading it counts as using it */
  get(key: K): V | undefined {
    const node = this.nodes.get(key);

    if (node == null) {
      return undefined;
    }
    this.touch(node);
    return node.value;
  }

  /** Whether the key is held, without counting as having used it */
  has(key: K): boolean {
    return this.nodes.has(key);
  }

  set(key: K, value: V): this {
    const node = this.nodes.get(key);

    if (node != null) {
      node.value = value;
      this.touch(node);
      return this;
    }

    const fresh: Node<K, V> = { key, value, prev: null, next: null };

    this.pushFront(fresh);
    this.nodes.set(key, fresh);

    // One in, one out. A loop rather than a single drop, since the
    // limit is read once at construction and a map built over one is
    // brought back down to it here
    while (this.nodes.size > this.limit && this.tail != null) {
      const dropped = this.tail;

      this.unlink(dropped);
      this.nodes.delete(dropped.key);
      this.onEvict?.(dropped.key, dropped.value);
    }
    return this;
  }

  /**
   * What is held under the key, putting `value` there first if nothing
   * is. Either way it counts as a use
   */
  getOrInsert(key: K, value: V): V {
    const node = this.nodes.get(key);

    if (node != null) {
      this.touch(node);
      return node.value;
    }
    this.set(key, value);
    return value;
  }

  /** The same, for a value only worth building when it is missing */
  getOrInsertComputed(key: K, build: (key: K) => V): V {
    const node = this.nodes.get(key);

    if (node != null) {
      this.touch(node);
      return node.value;
    }

    const made = build(key);

    this.set(key, made);
    return made;
  }

  delete(key: K): boolean {
    const node = this.nodes.get(key);

    if (node == null) {
      return false;
    }
    this.unlink(node);
    this.nodes.delete(key);
    return true;
  }

  clear(): void {
    this.nodes.clear();
    this.head = null;
    this.tail = null;
  }

  /**
   * Newest first. The next node is read before the current one is
   * yielded, so a caller deleting as it goes walks the whole chain the
   * way it would with a `Map`
   */
  *entries(): Walk<[K, V]> {
    let node = this.head;

    while (node != null) {
      const next = node.next;

      yield [node.key, node.value];
      node = next;
    }
  }

  *keys(): Walk<K> {
    for (const [key] of this.entries()) {
      yield key;
    }
  }

  *values(): Walk<V> {
    for (const [, value] of this.entries()) {
      yield value;
    }
  }

  [Symbol.iterator](): Walk<[K, V]> {
    return this.entries();
  }

  forEach(run: (value: V, key: K, map: Map<K, V>) => void, thisArg?: unknown): void {
    for (const [key, value] of this.entries()) {
      run.call(thisArg, value, key, this);
    }
  }
}
