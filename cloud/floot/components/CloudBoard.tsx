import { useMemo, useRef, useState } from "react";
import type { GameView, Hex, ChessMove, PieceName } from "../endpoints/game_POST.schema";
import { ChessPiece } from "./ChessPiece";
import { boardLayout } from "../helpers/boardLayout";
import { chessVariants } from "../helpers/chessVariants";
import styles from "./CloudBoard.module.css";

const key = (hex: Hex) => `${hex.q},${hex.r}`;
type VisualPiece = Hex & { id: number; type: PieceName; player: number; armyOrigin?:number };
export function CloudBoard({
  game,
  selected,
  onCell,
  flipped,
  rotation,
  coordinates,
  theme,
  lastMove,
  disabled,
  className,
  preview = false,
}: {
  game: GameView;
  selected: Hex | null;
  onCell: (hex: Hex) => void;
  flipped: boolean;
  rotation?: number;
  coordinates: boolean;
  theme: string;
  lastMove?: ChessMove;
  disabled?: boolean;
  className?: string;
  preview?: boolean;
}) {
  const [focused, setFocused] = useState(() => game.board.cells.find(cell => cell.q === 0 && cell.r === 0)?.notation ?? game.board.cells[0]?.notation);
  const layout = useMemo(() => boardLayout(game.board.cells,game.board.orientation), [game.board.cells,game.board.orientation]);
  const previous = useRef(new Map<string, VisualPiece>());
  const sequence = useRef(0);
  const visuals = useMemo(() => {
    const next = new Map<string, VisualPiece>();
    const used = new Set<number>();
    const occupied = game.board.cells.filter((cell) => cell.piece);
    for (const cell of occupied) {
      const old = previous.current.get(key(cell));
      if (old && (old.player === cell.piece!.player || old.armyOrigin!==undefined&&old.armyOrigin===cell.piece!.armyOrigin) && old.type === cell.piece!.type) {
        next.set(key(cell), { ...old, q: cell.q, r: cell.r,player:cell.piece!.player,armyOrigin:cell.piece!.armyOrigin });
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
        armyOrigin: cell.piece!.armyOrigin,
        id: old?.id ?? ++sequence.current,
      };
      next.set(key(cell), piece);
      used.add(piece.id);
    }
    const captured = [...previous.current.values()].filter((piece) => !used.has(piece.id));
    previous.current = next;
    return { pieces: [...next.values()], captured };
  }, [game.stateId, game.board.cells, lastMove]);
  const colours = ["var(--board-light)", "var(--board-medium)", "var(--board-dark)"];
  const selectedPiece = game.board.cells.find(
    (cell) => selected && key(cell) === key(selected),
  )?.piece;
  const destinations = new Set(
    game.legalMoves
      .filter((move) => selected && key(move.from) === key(selected))
      .map((move) => key(move.to)),
  );
  const sign = flipped ? -1 : 1;
  const angle=rotation??(flipped?180:0);
  return (
    <svg
      viewBox={layout.viewBox}
      className={`${styles.board} ${className || ""}`}
      role={preview ? "img" : "group"}
      aria-hidden={preview || undefined}
      aria-label={`${chessVariants.name(game.variant)} hexagonal chessboard`}
    >
      <title>Select a piece to see its moves. Swipe horizontally for history. Swipe vertically or press F to flip the board; against an engine, this switches your side before the first move and rotates the view afterward.</title>
      <g
        className={styles.canvas}
        style={{ transform: `rotate(${angle}deg)` }}
      >
        {game.board.cells.map((cell) => {
          const { x, y } = layout.position(cell);
          const hexPoints = (radius: number) =>
            Array.from({ length: 6 }, (_, index) => {
              const angle = (index * Math.PI) / 3+layout.vertexAngle;
              return `${x + radius * Math.cos(angle)},${y + radius * Math.sin(angle)}`;
            }).join(" ");
          const points = hexPoints(27.55);
          const inset = hexPoints(23.2);
          const active = selected && key(cell) === key(selected),
            target = destinations.has(key(cell));
          const last =
            lastMove && !lastMove.pass && (key(cell) === key(lastMove.from) || key(cell) === key(lastMove.to));
          const checked =
            cell.piece?.type === "king" && (game.checkedPlayers?.includes(cell.piece.player) ?? (cell.piece.player === game.activePlayer && game.check));
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
            ? `${cell.piece.player === 0 ? "White" : cell.piece.player === 2 ? "Gold" : "Black"} ${cell.piece.type}${cell.piece.type==='pawn'&&cell.piece.armyOrigin!==undefined?`, originally ${['White','Black','Gold'][cell.piece.armyOrigin]}`:''}`
            : "Empty cell";
          return (
            <g
              key={cell.notation}
              data-cell={cell.notation}
              role={preview ? undefined : "button"}
              tabIndex={preview ? undefined : focused === cell.notation ? 0 : -1}
              aria-label={`${name} on ${cell.notation}${target ? (capture ? ", legal destination, capture" : ", legal destination") : ""}${givesCheck ? ", gives check" : ""}${checked ? ", king in danger" : ""}${last ? ", last move" : ""}`}
              aria-pressed={!!active}
              aria-disabled={disabled}
              className={styles.cell}
              onFocus={() => setFocused(cell.notation)}
              onPointerDown={preview ? undefined : (event) => event.preventDefault()}
              onClick={preview ? undefined : () => {
                setFocused(cell.notation);
                if (!disabled) onCell(cell);
              }}
              onKeyDown={preview ? undefined : (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  if (!disabled) onCell(cell);
                }
                const direction = {
                  ArrowUp: [0, game.board.orientation==="pointy"?-1:1],
                  ArrowDown: [0, game.board.orientation==="pointy"?1:-1],
                  ArrowLeft: [-1, 0],
                  ArrowRight: [1, 0],
                }[event.key];
                if (direction) {
                  event.preventDefault();
                  let neighbour = game.board.cells.find(
                    (next) =>
                      next.q === cell.q + direction[0] * sign &&
                      next.r === cell.r + direction[1] * sign,
                  );
                  if(rotation!==undefined){
                    const wanted={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[event.key]!;
                    const here=layout.position(cell),radians=angle*Math.PI/180;
                    const scored=game.board.cells.filter(next=>Math.max(Math.abs(next.q-cell.q),Math.abs(next.r-cell.r),Math.abs(next.q+next.r-cell.q-cell.r))===1).map(next=>{const p=layout.position(next),dx=p.x-here.x,dy=p.y-here.y,x=dx*Math.cos(radians)-dy*Math.sin(radians),y=dx*Math.sin(radians)+dy*Math.cos(radians);return {next,score:(x*wanted[0]+y*wanted[1])/Math.hypot(x,y)};}).filter(item=>item.score>.4).sort((a,b)=>b.score-a.score);neighbour=scored[0]?.next;
                  }
                  const node =
                    neighbour &&
                    event.currentTarget.parentElement?.querySelector<SVGGElement>(
                      `[data-cell="${neighbour.notation}"]`,
                    );
                  node?.focus();
                }
              }}
            >
              <polygon points={hexPoints(28)} fill="transparent" className={styles.hitbox} data-hitbox="full-cell"/>
              <polygon
                pointerEvents="none"
                className={styles.hex}
                points={points}
                fill={colours[cell.colour]}
                stroke="#060e1b"
                strokeWidth={0.7}
              />
              {indicator && (
                <g className={styles.indicator} data-indicator={indicator} pointerEvents="none">
                  <polygon
                    points={inset}
                    fill="none"
                    stroke="#000000"
                    strokeWidth={5}
                    opacity={1}
                  />
                  <polygon
                    className={styles.indicatorColour}
                    points={inset}
                    fill="none"
                    strokeWidth={3}
                  />
                  {indicator === "capture-check" && (
                    <polygon
                      points={inset}
                      fill="none"
                      stroke="#ffc566"
                      strokeWidth={3}
                      strokeDasharray="4 7"
                    />
                  )}
                </g>
              )}
              <g className={styles.keyboardRing} pointerEvents="none">
                <polygon points={inset} fill="none" stroke="#000000" strokeWidth={5} />
                <polygon points={inset} fill="none" stroke="var(--primary)" strokeWidth={3} />
              </g>
              {coordinates && (
                <text
                  x={x}
                  y={y + 21}
                  textAnchor="middle"
                  className={styles.coordinate}
                  transform={angle ? `rotate(${-angle} ${x} ${y})` : undefined}
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
              transform: `translate(${layout.position(piece).x}px, ${layout.position(piece).y}px)`,
            }}
            pointerEvents="none"
            aria-hidden="true"
          >
            <g
              className={styles.pieceFacing}
              style={{ transform: `rotate(${-angle}deg)` }}
            >
              <ChessPiece
                type={piece.type}
                player={piece.player}
                direction={piece.armyOrigin!==undefined?piece.armyOrigin*120+angle:undefined}
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
              transform: `translate(${layout.position(piece).x}px, ${layout.position(piece).y}px)`,
            }}
            pointerEvents="none"
            aria-hidden="true"
          >
            <g
              className={styles.pieceFacing}
              style={{ transform: `rotate(${-angle}deg)` }}
            >
              <ChessPiece
                type={piece.type}
                player={piece.player}
                direction={piece.armyOrigin!==undefined?piece.armyOrigin*120+angle:undefined}
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
