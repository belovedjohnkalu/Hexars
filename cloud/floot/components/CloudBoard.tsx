import { useState } from "react";
import type { GameView, Hex, ChessMove } from "../endpoints/game_POST.schema";
import styles from "./CloudBoard.module.css";

const glyphs = {
  king: ["♔", "♚"],
  queen: ["♕", "♛"],
  rook: ["♖", "♜"],
  bishop: ["♗", "♝"],
  knight: ["♘", "♞"],
  pawn: ["♙", "♟"],
};
const key = (hex: Hex) => `${hex.q},${hex.r}`;

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
  const colours =
    theme === "forest"
      ? ["#cad1ad", "#a0ac85", "#6c8063"]
      : theme === "slate"
        ? ["#d5dce1", "#a5b4c0", "#748b9b"]
        : ["#ead9b7", "#c9ac80", "#9d7b55"];
  const destinations = new Set(
    game.legalMoves
      .filter((move) => selected && key(move.from) === key(selected))
      .map((move) => key(move.to)),
  );
  return (
    <svg
      viewBox="0 0 600 600"
      className={`${styles.board} ${className || ""}`}
      role="group"
      aria-label="Gliński hexagonal chessboard"
    >
      <title>Gliński’s Chess · White at the bottom unless the board is flipped</title>
      {game.board.cells.map((cell) => {
        const sign = flipped ? -1 : 1;
        const x = 300 + sign * 42 * cell.q;
        const y = 300 - sign * 28 * Math.sqrt(3) * (cell.r + cell.q / 2);
        const points = Array.from({ length: 6 }, (_, index) => {
          const angle = (index * Math.PI) / 3;
          return `${x + 27.65 * Math.cos(angle)},${y + 27.65 * Math.sin(angle)}`;
        }).join(" ");
        const active = selected && key(cell) === key(selected);
        const target = destinations.has(key(cell));
        const previous =
          lastMove && (key(cell) === key(lastMove.from) || key(cell) === key(lastMove.to));
        const checked =
          cell.piece?.type === "king" && cell.piece.player === game.activePlayer && game.check;
        const pieceLabel = cell.piece
          ? `${cell.piece.player === 0 ? "White" : "Black"} ${cell.piece.type}`
          : "Empty cell";
        return (
          <g
            key={cell.notation}
            data-cell={cell.notation}
            role="button"
            tabIndex={focused === cell.notation ? 0 : -1}
            aria-label={`${pieceLabel} on ${cell.notation}${target ? ", legal destination" : ""}${checked ? ", in check" : ""}`}
            aria-pressed={Boolean(active)}
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
              stroke={checked ? "#ab4836" : active ? "#fff2c9" : "#7f674a"}
              strokeWidth={checked || active ? 2.6 : 0.65}
            />
            {previous && (
              <polygon points={points} fill="#fff0a0" opacity=".22" pointerEvents="none" />
            )}
            {active && (
              <polygon points={points} fill="#fff0a0" opacity=".25" pointerEvents="none" />
            )}
            {target &&
              (cell.piece ? (
                <circle
                  cx={x}
                  cy={y}
                  r="22"
                  fill="none"
                  stroke="#f6e3a5"
                  strokeWidth="2.7"
                  pointerEvents="none"
                />
              ) : (
                <circle cx={x} cy={y} r="5.5" fill="#425230" opacity=".7" pointerEvents="none" />
              ))}
            {cell.piece && (
              <text
                x={x}
                y={y + 11}
                textAnchor="middle"
                className={`${styles.piece} ${cell.piece.player === 0 ? styles.white : styles.black}`}
                pointerEvents="none"
              >
                {glyphs[cell.piece.type][cell.piece.player]}
              </text>
            )}
            {coordinates && (
              <text
                x={x}
                y={y + 21}
                textAnchor="middle"
                className={styles.coordinate}
                pointerEvents="none"
              >
                {cell.notation}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
