import type { Hex } from "../endpoints/game_POST.schema";

// Fit the coordinates provided by the native rules, including boards whose
// center lies between cells. Keeping the visual center at 300,300 makes the
// existing rotation and piece animations work for every shape.
export function boardLayout(cells: readonly Hex[]) {
  const projected = cells.map(cell => ({ x: 42 * cell.q, y: -28 * Math.sqrt(3) * (cell.r + cell.q / 2) }));
  const xs = projected.map(cell => cell.x), ys = projected.map(cell => cell.y);
  const minX = xs.length ? Math.min(...xs) : -210, maxX = xs.length ? Math.max(...xs) : 210;
  const minY = ys.length ? Math.min(...ys) : -243, maxY = ys.length ? Math.max(...ys) : 243;
  const centerX = (minX + maxX) / 2, centerY = (minY + maxY) / 2;
  const width = Math.ceil(maxX - minX + 64);
  const height = Math.ceil(maxY - minY + 28 * Math.sqrt(3) + 14);
  return {
    width, height, viewBox: `${300 - width / 2} ${300 - height / 2} ${width} ${height}`,
    position(cell: Hex) {
      return { x: 300 + 42 * cell.q - centerX, y: 300 - 28 * Math.sqrt(3) * (cell.r + cell.q / 2) - centerY };
    },
  };
}
