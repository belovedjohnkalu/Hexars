import { useMemo, useRef, useState } from "react";
import type { GameView, Hex, ChessMove, PieceName } from "../endpoints/game_POST.schema";
import { ChessPiece } from "./ChessPiece";
import styles from "./CloudBoard.module.css";

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
      ? ["#342923", "#614b40", "#936e58"]
      : theme === "hearth"
        ? ["#2b3030", "#495252", "#737b73"]
        : ["#233045", "#3d506c", "#627c9f"];
  const selectedPiece = game.board.cells.find(
    (cell) => selected && key(cell) === key(selected),
  )?.piece;
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
          const hexPoints = (radius: number) =>
            Array.from({ length: 6 }, (_, index) => {
              const angle = (index * Math.PI) / 3;
              return `${x + radius * Math.cos(angle)},${y + radius * Math.sin(angle)}`;
            }).join(" ");
          const points = hexPoints(27.55);
          const inset = hexPoints(23.2);
          const active = selected && key(cell) === key(selected),
            target = destinations.has(key(cell));
          const last =
            lastMove && (key(cell) === key(lastMove.from) || key(cell) === key(lastMove.to));
          const checked =
            cell.piece?.type === "king" && cell.piece.player === game.activePlayer && game.check;
          const targetMoves = game.legalMoves.filter(
            (move) => selected && key(move.from) === key(selected) && key(move.to) === key(cell),
          );
          const capture =
            target &&
            targetMoves.some(
              (move) =>
                move.capture ??
                (!!cell.piece || (selectedPiece?.type === "pawn" && selected?.q !== cell.q)),
            );
          const givesCheck = target && targetMoves.some((move) => move.givesCheck);
          const indicator = checked
            ? "check"
            : target
              ? givesCheck
                ? capture
                  ? "capture-check"
                  : "check-move"
                : capture
                  ? "capture"
                  : "move"
              : active
                ? "selected"
                : last
                  ? "last-move"
                  : null;
          const name = cell.piece
            ? `${cell.piece.player === 0 ? "White" : "Black"} ${cell.piece.type}`
            : "Empty cell";
          return (
            <g
              key={cell.notation}
              data-cell={cell.notation}
              role="button"
              tabIndex={focused === cell.notation ? 0 : -1}
              aria-label={`${name} on ${cell.notation}${target ? (capture ? ", legal destination, capture" : ", legal destination") : ""}${givesCheck ? ", gives check" : ""}${checked ? ", king in danger" : ""}`}
              aria-pressed={!!active}
              aria-disabled={disabled}
              className={styles.cell}
              onFocus={() => setFocused(cell.notation)}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => {
                setFocused(cell.notation);
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
                stroke="#11182488"
                strokeWidth={0.7}
              />
              {indicator && (
                <g className={styles.indicator} data-indicator={indicator} pointerEvents="none">
                  <polygon
                    points={inset}
                    fill="none"
                    stroke="#0c111b"
                    strokeWidth={4.8}
                    opacity={0.8}
                  />
                  <polygon
                    className={styles.indicatorColour}
                    points={inset}
                    fill="none"
                    strokeWidth={2.2}
                  />
                  {indicator === "capture-check" && (
                    <polygon
                      points={inset}
                      fill="none"
                      stroke="#ffac79"
                      strokeWidth={2.2}
                      strokeDasharray="4 7"
                    />
                  )}
                </g>
              )}
              <g className={styles.keyboardRing} pointerEvents="none">
                <polygon points={inset} fill="none" stroke="#0c111b" strokeWidth={4.8} />
                <polygon points={inset} fill="none" stroke="#9acaff" strokeWidth={2.2} />
              </g>
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
            <g
              className={styles.pieceFacing}
              style={{ transform: flipped ? "rotate(-180deg)" : "rotate(0deg)" }}
            >
              <ChessPiece
                type={piece.type}
                player={piece.player}
                theme={theme}
                onBoard
                className={styles.piece}
              />
            </g>
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
              <ChessPiece
                type={piece.type}
                player={piece.player}
                theme={theme}
                onBoard
                className={styles.piece}
              />
            </g>
          </g>
        ))}
      </g>
    </svg>
  );
}
