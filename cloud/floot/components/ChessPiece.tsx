import type { PieceName } from "../endpoints/game_POST.schema";

// Original, flat Staunton silhouettes: the same drawing for each side.
export function ChessPiece({ type, player, onBoard = false, className }: {
  type: PieceName; player: number; onBoard?: boolean; className?: string; theme?: string;
}) {
  const fill = player === 0 ? "#f5f5f7" : "#090909";
  const edge = player === 0 ? "#090909" : "#f5f5f7";
  return (
    <svg viewBox="-24 -27 48 54" x={onBoard ? -24 : undefined} y={onBoard ? -27 : undefined}
      width={onBoard ? 48 : undefined} height={onBoard ? 54 : undefined} className={className}
      aria-hidden="true" focusable="false" data-piece-shape={type}>
      <g fill={fill} stroke={edge} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round">
        {type === "pawn" && <>
          <circle cx={0} cy={-14} r={7} />
          <path d="M-5-6 H5 C4 3 7 10 11 14 L13 19 H-13 L-11 14 C-7 10-4 3-5-6 Z" />
        </>}
        {type === "rook" && <path d="M-14-21 H-7 V-15 H-3 V-21 H3 V-15 H7 V-21 H14 V-8 H9 L8 11 H12 L14 19 H-14 L-12 11 H-8 L-9-8 H-14 Z" />}
        {type === "knight" && <>
          <path d="M-13 19 H14 L12 12 C6 8 8 2 11-3 C15-15 5-20-3-20 L-6-24-9-18-16-8-14-2-7-4-3-9 C0-2-8 4-10 12 Z" />
          <circle cx={-5} cy={-13} r={1.5} fill={edge} stroke="none" />
        </>}
        {type === "bishop" && <>
          <path d="M0-24 C-3-19-11-13-10-7 C-10 0-5 3 0 3 C5 3 10 0 10-7 C11-13 3-19 0-24 Z M-6 5 H6 L9 12 H12 L14 19 H-14 L-12 12 H-9 Z" />
          <path d="M-3-16 4-9" fill="none" strokeWidth={2.4} />
        </>}
        {type === "queen" && <>
          <path d="M-15-17-9-6-5-20 0-7 5-20 9-6 15-17 10 1 H7 L9 12 H12 L14 19 H-14 L-12 12 H-9 L-7 1 H-10 Z" />
          <circle cx={-15} cy={-19} r={2.8} /><circle cx={0} cy={-22} r={2.8} /><circle cx={15} cy={-19} r={2.8} />
        </>}
        {type === "king" && <>
          <path d="M-2.5-25 H2.5 V-20 H8 V-15 H2.5 V-10 H-2.5 V-15 H-8 V-20 H-2.5 Z" />
          <path d="M0-9 C-7-13-13-8-11-2 L-7 5 H7 L11-2 C13-8 7-13 0-9 Z M-6 6 H6 L9 12 H12 L14 19 H-14 L-12 12 H-9 Z" />
        </>}
      </g>
    </svg>
  );
}
