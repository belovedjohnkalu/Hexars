export interface Hex {
  q: number;
  r: number;
}
export interface Cell extends Hex {
  colour: 0 | 1 | 2;
}
export interface BoardGeometry {
  variant: "glinski";
  stage: "geometry";
  players: number[];
  cells: Cell[];
}

// Rendering only. The valid cells and colours are supplied by the C++ library.
export function hexToPixel(hex: Hex, size: number) {
  return { x: size * Math.sqrt(3) * (hex.q + hex.r / 2), y: size * 1.5 * hex.r };
}
export function hexKey(hex: Hex) {
  return `${hex.q},${hex.r}`;
}
export function points(cx: number, cy: number, size: number) {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 180) * (60 * index - 90);
    return `${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`;
  }).join(" ");
}
export function parseBoard(value: unknown): BoardGeometry {
  if (!value || typeof value !== "object") throw new Error("Invalid board geometry");
  const board = value as Partial<BoardGeometry>;
  if (
    board.variant !== "glinski" ||
    board.stage !== "geometry" ||
    !Array.isArray(board.cells) ||
    board.cells.length !== 91 ||
    !Array.isArray(board.players) ||
    board.players.length !== 2 ||
    board.players.some((player) => !Number.isInteger(player)) ||
    board.cells.some(
      (cell) =>
        !cell ||
        !Number.isInteger(cell.q) ||
        !Number.isInteger(cell.r) ||
        ![0, 1, 2].includes(cell.colour) ||
        Math.max(Math.abs(cell.q), Math.abs(cell.r), Math.abs(cell.q + cell.r)) > 5,
    ) ||
    new Set(board.cells.map(hexKey)).size !== board.cells.length
  ) {
    throw new Error("Invalid Gliński board geometry");
  }
  return board as BoardGeometry;
}
