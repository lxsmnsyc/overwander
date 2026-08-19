/**
 * Where each image goes in the sheet.
 *
 * The binary-tree grower from the packer tool, moved here unchanged in
 * behaviour: boxes are fitted into a rectangle that grows right or down
 * as it runs out of room, keeping the result roughly square. It is kept
 * rather than replaced because the sheets already in `public/` were
 * packed by it, and a different packer would repack every existing
 * sheet differently for no gain.
 *
 * Nothing here touches a canvas or a file: it is arithmetic on boxes,
 * which is what makes it testable.
 */

export interface Box {
  w: number;
  h: number;
}

interface Node {
  x: number;
  y: number;
  w: number;
  h: number;
  used?: { down: Node; right: Node };
}

/** One box and where it ended up, or `null` if it did not fit at all. */
export interface Placed<T extends Box> {
  box: T;
  x: number;
  y: number;
}

export interface Packed<T extends Box> {
  width: number;
  height: number;
  placed: Placed<T>[];
}

function findNode(root: Node, w: number, h: number): Node | null {
  if (root.used != null) {
    return findNode(root.used.right, w, h) ?? findNode(root.used.down, w, h);
  }
  return w <= root.w && h <= root.h ? root : null;
}

function splitNode(node: Node, w: number, h: number): Node {
  node.used = {
    down: { x: node.x, y: node.y + h, w: node.w, h: node.h - h },
    right: { x: node.x + w, y: node.y, w: node.w - w, h },
  };
  return node;
}

/**
 * Fits every box, tallest first.
 *
 * Sorting is the packer's own requirement rather than a nicety: it
 * grows the sheet around whatever it is handed first, so feeding it a
 * short box early leaves a sheet that grows in the wrong direction
 */
export default function pack<T extends Box>(boxes: T[]): Packed<T> {
  const order = [...boxes].sort((one, two) => two.h - one.h);
  let root: Node = { x: 0, y: 0, w: order[0]?.w ?? 0, h: order[0]?.h ?? 0 };

  const growRight = (w: number, h: number): Node | null => {
    root = {
      used: { down: root, right: { x: root.w, y: 0, w, h: root.h } },
      x: 0,
      y: 0,
      w: root.w + w,
      h: root.h,
    };
    const node = findNode(root, w, h);

    return node == null ? null : splitNode(node, w, h);
  };

  const growDown = (w: number, h: number): Node | null => {
    root = {
      used: { down: { x: 0, y: root.h, w: root.w, h }, right: root },
      x: 0,
      y: 0,
      w: root.w,
      h: root.h + h,
    };
    const node = findNode(root, w, h);

    return node == null ? null : splitNode(node, w, h);
  };

  const grow = (w: number, h: number): Node | null => {
    const down = w <= root.w;
    const right = h <= root.h;

    // Grown along whichever side is behind, so the sheet stays roughly
    // square instead of running away in one direction
    if (right && root.h >= root.w + w) {
      return growRight(w, h);
    }
    if (down && root.w >= root.h + h) {
      return growDown(w, h);
    }
    if (right) {
      return growRight(w, h);
    }
    return down ? growDown(w, h) : null;
  };

  const placed: Placed<T>[] = [];

  for (const box of order) {
    const found = findNode(root, box.w, box.h);
    const fit = found == null ? grow(box.w, box.h) : splitNode(found, box.w, box.h);

    if (fit != null) {
      placed.push({ box, x: fit.x, y: fit.y });
    }
  }

  return { width: root.w, height: root.h, placed };
}
