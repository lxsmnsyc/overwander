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

/**
 * How far from square a sheet may be.
 *
 * Rows at every width will happily find a strip one picture wide, which
 * is the tightest fit and the worst sheet: a texture that is 40 pixels
 * across and 4000 down wastes more in memory than it saves on paper
 */
const MAX_ASPECT = 2.5;

/**
 * Every box laid in rows of a given width, tallest first, or nothing
 * where one box is wider than the row
 */
function shelve<T extends Box>(boxes: T[], width: number): Packed<T> | null {
  const order = [...boxes].sort((one, two) => two.h - one.h);
  const placed: Placed<T>[] = [];
  let x = 0;
  let y = 0;
  let tallest = 0;

  for (const box of order) {
    if (box.w > width) {
      return null;
    }
    if (x + box.w > width) {
      x = 0;
      y += tallest;
      tallest = 0;
    }
    placed.push({ box, x, y });
    x += box.w;
    tallest = Math.max(tallest, box.h);
  }
  return { width, height: y + tallest, placed };
}

/**
 * The smallest sheet these boxes fit on: the tree above, and rows at
 * every width worth trying, whichever comes out smallest.
 *
 * The tree grows the sheet around whatever it is handed and keeps the
 * result roughly square, which is the right instinct for boxes of every
 * size and the wrong one for a sprite sheet: a pokemon's frames are all
 * about one size, and boxes of one size want rows. Trying both is
 * cheaper than choosing wrong, and the widths are few enough to
 * enumerate
 */
export function packSmallest<T extends Box>(boxes: T[]): Packed<T> {
  let best = pack(boxes);

  if (boxes.length === 0) {
    return best;
  }
  const widest = Math.max(...boxes.map((box) => box.w));
  const across = boxes.reduce((sum, box) => sum + box.w, 0);

  for (let width = widest; width <= across; width += 1) {
    const rows = shelve(boxes, width);

    if (rows == null) {
      continue;
    }
    const long = Math.max(rows.width, rows.height);
    const short = Math.min(rows.width, rows.height);

    if (long > short * MAX_ASPECT || rows.width * rows.height >= best.width * best.height) {
      continue;
    }
    best = rows;
  }
  return best;
}
