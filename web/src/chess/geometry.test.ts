import { describe, expect, it } from "vitest";
import snapshot from "../../public/foundation-board.json";
import { hexKey, hexToPixel, parseBoard, points } from "./geometry";

describe("Geometry provided by C++", () => {
  it("loads 91 unique, bounded cells and three colours", () => {
    const board = parseBoard(snapshot);
    expect(board.cells).toHaveLength(91);
    expect(new Set(board.cells.map(hexKey)).size).toBe(91);
    expect(new Set(board.cells.map((cell) => cell.colour)).size).toBe(3);
    expect(board.cells.filter((cell) => cell.colour === 0)).toHaveLength(31);
    expect(board.players).toEqual([0, 1]);
  });
  it("rejects duplicate, missing, out-of-bounds cells and wrong variants", () => {
    expect(() => parseBoard(null)).toThrow();
    expect(() => parseBoard({ ...snapshot, variant: "wellisch" })).toThrow();
    expect(() => parseBoard({ ...snapshot, cells: snapshot.cells.slice(1) })).toThrow();
    expect(() =>
      parseBoard({
        ...snapshot,
        cells: snapshot.cells.map((cell, index) => (index === 0 ? snapshot.cells[1] : cell)),
      }),
    ).toThrow();
    expect(() =>
      parseBoard({
        ...snapshot,
        cells: snapshot.cells.map((cell, index) => (index === 0 ? { ...cell, q: 6 } : cell)),
      }),
    ).toThrow();
  });
  it("renders shared-edge cells at the expected spacing", () => {
    const centre = hexToPixel({ q: 0, r: 0 }, 30);
    const edge = hexToPixel({ q: 1, r: 0 }, 30);
    expect(centre).toEqual({ x: 0, y: 0 });
    expect(Math.hypot(edge.x, edge.y)).toBeCloseTo(30 * Math.sqrt(3));
    expect(points(0, 0, 30).split(" ")).toHaveLength(6);
  });
});
