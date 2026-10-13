import { useMemo, useRef, useState } from "react";
import type { GameView, Hex, ChessMove, PieceName } from "../endpoints/game_POST.schema";
import styles from "./CloudBoard.module.css";

const glyphs: Record<PieceName, string[]> = {
  king: ["♔", "♚"],
  queen: ["♕", "♛"],
  rook: ["♖", "♜"],
  bishop: ["♗", "♝"],
  knight: ["♘", "♞"],
  pawn: ["♙", "♟"],
};
const key = (hex: Hex) => `${hex.q},${hex.r}`;
type VisualPiece = Hex & { id: number; type: PieceName; player: number };
export function CloudBoard({
  game,
  selected,
  onCell,
  flipped,
  coordinates,
  theme,
  lastMove,
  disabled,
  className,
}: {
  game: GameView;
  selected: Hex | null;
  onCell: (hex: Hex) => void;
  flipped: boolean;
  coordinates: boolean;
  theme: string;
  lastMove?: ChessMove;
  disabled?: boolean;
  className?: string;
}) {
  const [focused, setFocused] = useState("f6");
  const previous = useRef(new Map<string, VisualPiece>());
  const sequence = useRef(0);
  const visuals = useMemo(() => {
    const next = new Map<string, VisualPiece>();
    const used = new Set<number>();
    const occupied = game.board.cells.filter((cell) => cell.piece);
    for (const cell of occupied) {
      const old = previous.current.get(key(cell));
      if (old && old.player === cell.piece!.player && old.type === cell.piece!.type) {
        next.set(key(cell), { ...old, q: cell.q, r: cell.r });
        used.add(old.id);
      }
    }
    for (const cell of occupied) {
      if (next.has(key(cell))) continue;
      const moving =
        lastMove && key(lastMove.to) === key(cell)
          ? previous.current.get(key(lastMove.from))
          : undefined;
      const old =
        moving && !used.has(moving.id) && moving.player === cell.piece!.player
          ? moving
          : [...previous.current.values()].find(
              (piece) =>
                !used.has(piece.id) &&
                piece.player === cell.piece!.player &&
                piece.type === cell.piece!.type &&
                !next.has(key(piece)),
            );
      const piece = {
        q: cell.q,
        r: cell.r,
        type: cell.piece!.type,
        player: cell.piece!.player,
        id: old?.id ?? ++sequence.current,
      };
      next.set(key(cell), piece);
      used.add(piece.id);
    }
    const captured = [...previous.current.values()].filter((piece) => !used.has(piece.id));
    previous.current = next;
    return { pieces: [...next.values()], captured };
  }, [game.stateId, game.board.cells, lastMove]);
  const colours =
    theme === "adobe"
      ? ["#f2e8df", "#ddc3b3", "#b48f7c"]
      : theme === "hearth"
        ? ["#efefeb", "#d7d8cf", "#aaaea3"]
        : ["#eef1f5", "#ced7e3", "#98abc3"];
  const destinations = new Set(
    game.legalMoves
      .filter((move) => selected && key(move.from) === key(selected))
      .map((move) => key(move.to)),
  );
  const sign = flipped ? -1 : 1;
  return (
    <svg
      viewBox="0 0 600 600"
      className={`${styles.board} ${className || ""}`}
      role="group"
      aria-label="Gliński hexagonal chessboard"
    >
      <title>Your hexagonal chessboard. Select a piece to see where it can move.</title>
      <g
        className={styles.canvas}
        style={{ transform: flipped ? "rotate(180deg)" : "rotate(0deg)" }}
      >
        {game.board.cells.map((cell) => {
          const x = 300 + 42 * cell.q,
            y = 300 - 28 * Math.sqrt(3) * (cell.r + cell.q / 2);
          const points = Array.from({ length: 6 }, (_, index) => {
            const angle = (index * Math.PI) / 3;
            return `${x + 27.55 * Math.cos(angle)},${y + 27.55 * Math.sin(angle)}`;
          }).join(" ");
          const active = selected && key(cell) === key(selected),
            target = destinations.has(key(cell));
          const last =
            lastMove && (key(cell) === key(lastMove.from) || key(cell) === key(lastMove.to));
          const checked =
            cell.piece?.type === "king" && cell.piece.player === game.activePlayer && game.check;
          const name = cell.piece
            ? `${cell.piece.player === 0 ? "White" : "Black"} ${cell.piece.type}`
            : "Empty cell";
          return (
            <g
              key={cell.notation}
              data-cell={cell.notation}
              role="button"
              tabIndex={focused === cell.notation ? 0 : -1}
              aria-label={`${name} on ${cell.notation}${target ? ", legal destination" : ""}${checked ? ", king in danger" : ""}`}
              aria-pressed={!!active}
              aria-disabled={disabled}
              className={styles.cell}
              onFocus={() => setFocused(cell.notation)}
              onClick={(event) => {
                event.currentTarget.focus();
                if (!disabled) onCell(cell);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  if (!disabled) onCell(cell);
                }
                const direction = {
                  ArrowUp: [0, 1],
                  ArrowDown: [0, -1],
                  ArrowLeft: [-1, 0],
                  ArrowRight: [1, 0],
                }[event.key];
                if (direction) {
                  event.preventDefault();
                  const neighbour = game.board.cells.find(
                    (next) =>
                      next.q === cell.q + direction[0] * sign &&
                      next.r === cell.r + direction[1] * sign,
                  );
                  const node =
                    neighbour &&
                    event.currentTarget.parentElement?.querySelector<SVGGElement>(
                      `[data-cell="${neighbour.notation}"]`,
                    );
                  node?.focus();
                }
              }}
            >
              <polygon
                className={styles.hex}
                points={points}
                fill={colours[cell.colour]}
                stroke={checked ? "#bb5551" : active ? "#4776a9" : "#ffffffa0"}
                strokeWidth={active || checked ? 2.4 : 0.7}
              />
              <polygon
                className={styles.lastMove}
                points={points}
                fill="#6788b4"
                opacity={last ? 0.14 : 0}
                pointerEvents="none"
              />
              <polygon
                className={styles.selection}
                points={points}
                fill="#658bc0"
                opacity={active ? 0.2 : 0}
                pointerEvents="none"
              />
              {target && (
                <circle
                  className={styles.destination}
                  cx={x}
                  cy={y}
                  r={cell.piece ? 22 : 5}
                  fill={cell.piece ? "none" : "#365d88"}
                  stroke={cell.piece ? "#365d88" : "none"}
                  strokeWidth={2.5}
                  opacity={0.7}
                  pointerEvents="none"
                />
              )}
              {coordinates && (
                <text
                  x={x}
                  y={y + 21}
                  textAnchor="middle"
                  className={styles.coordinate}
                  transform={flipped ? `rotate(-180 ${x} ${y})` : undefined}
                  pointerEvents="none"
                >
                  {cell.notation}
                </text>
              )}
            </g>
          );
        })}
        {visuals.captured.map((piece) => (
          <g
            key={`captured-${piece.id}`}
            className={styles.captured}
            style={{
              transform: `translate(${300 + 42 * piece.q}px, ${300 - 28 * Math.sqrt(3) * (piece.r + piece.q / 2)}px)`,
            }}
            pointerEvents="none"
            aria-hidden="true"
          >
            <text
              x={0}
              y={11}
              textAnchor="middle"
              className={`${styles.piece} ${piece.player === 0 ? styles.white : styles.black}`}
              style={{ transform: flipped ? "rotate(-180deg)" : "rotate(0deg)" }}
            >
              {glyphs[piece.type][piece.player]}
            </text>
          </g>
        ))}
        {visuals.pieces.map((piece) => (
          <g
            key={piece.id}
            data-piece={piece.type}
            data-player={piece.player}
            className={styles.piecePosition}
            style={{
              transform: `translate(${300 + 42 * piece.q}px, ${300 - 28 * Math.sqrt(3) * (piece.r + piece.q / 2)}px)`,
            }}
            pointerEvents="none"
            aria-hidden="true"
          >
            <g
              className={styles.pieceFacing}
              style={{ transform: flipped ? "rotate(-180deg)" : "rotate(0deg)" }}
            >
              <text
                x={0}
                y={11}
                textAnchor="middle"
                className={`${styles.piece} ${piece.player === 0 ? styles.white : styles.black}`}
              >
                {glyphs[piece.type][piece.player]}
              </text>
            </g>
          </g>
        ))}
      </g>
    </svg>
  );
}
