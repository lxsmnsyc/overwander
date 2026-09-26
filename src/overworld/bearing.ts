/** The eight ways a place can lie from the player, clockwise from north */
const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

/** How far a chunk is from the player and which way, or its coordinates while their position is unknown */
export default function describeWhere(
  chunk: { x: number; y: number },
  standing: { chunkX: number; chunkY: number } | null,
): string {
  if (standing == null) {
    return `chunk ${chunk.x}, ${chunk.y}`;
  }

  const dx = chunk.x - standing.chunkX;
  const dy = chunk.y - standing.chunkY;
  const far = Math.max(Math.abs(dx), Math.abs(dy));

  if (far === 0) {
    return 'Here';
  }
  // North is up the board, which is -y
  const turn = Math.round(Math.atan2(dx, -dy) / (Math.PI / 4));

  return `${far} chunk${far === 1 ? '' : 's'} ${COMPASS[(turn + 8) % 8]}`;
}
