import { hexKey, hexToPixel, points, type BoardGeometry, type Hex } from "../chess/geometry";

export function HexBoard({
  board,
  selected,
  onSelect,
  flipped,
  coordinates,
  theme,
}: {
  board: BoardGeometry | null;
  selected: Hex | null;
  onSelect: (hex: Hex) => void;
  flipped: boolean;
  coordinates: boolean;
  theme: string;
}) {
  if (!board) return <div className="board-loading">Loading board geometry…</div>;
  const size = 27;
  const colours =
    theme === "forest"
      ? ["#cad1ad", "#a0ac85", "#6c8063"]
      : theme === "slate"
        ? ["#d5dce1", "#a5b4c0", "#748b9b"]
        : ["#ead9b7", "#c9ac80", "#9d7b55"];
  return (
    <svg
      viewBox="0 0 580 520"
      className="board"
      role="group"
      aria-label="91-cell Gliński hexagonal chessboard. Select a cell to inspect its axial coordinates."
    >
      <title>Gliński’s 91-cell board · geometry preview</title>
      <defs>
        <filter id="board-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="8" floodOpacity=".18" />
        </filter>
      </defs>
      <g filter="url(#board-shadow)">
        {board.cells.map((hex) => {
          const pixel = hexToPixel(hex, size);
          const cx = 290 + pixel.x * (flipped ? -1 : 1);
          const cy = 260 + pixel.y * (flipped ? -1 : 1);
          const active = selected && hexKey(hex) === hexKey(selected);
          return (
            <g
              key={hexKey(hex)}
              role="button"
              tabIndex={0}
              aria-label={`Cell q ${hex.q}, r ${hex.r}`}
              aria-pressed={Boolean(active)}
              onClick={() => onSelect(hex)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(hex);
                }
              }}
              className={`hex-cell${active ? " selected" : ""}`}
            >
              <title>{`Axial coordinates (${hex.q}, ${hex.r}) · ${["Light", "Medium", "Dark"][hex.colour]} cell`}</title>
              <polygon
                points={points(cx, cy, size - 0.35)}
                fill={colours[hex.colour]}
                stroke={active ? "#fff5d4" : "#7f674a"}
                strokeWidth={active ? 3 : 0.6}
              />
              {active && <circle cx={cx} cy={cy} r="5" fill="#fff5d4" />}
              {coordinates && (
                <text x={cx} y={cy + 3} textAnchor="middle" className="cell-coordinate">
                  {hex.q},{hex.r}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
