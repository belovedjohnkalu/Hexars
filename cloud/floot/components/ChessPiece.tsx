import { useId } from "react";
import type { PieceName } from "../endpoints/game_POST.schema";

// One vector silhouette per piece, shared by both sides and every screen.
export function ChessPiece({
  type,
  player,
  theme = "xenon",
  onBoard = false,
  className,
}: {
  type: PieceName;
  player: number;
  theme?: string;
  onBoard?: boolean;
  className?: string;
}) {
  const finishId = useId();
  const palette =
    theme === "adobe"
      ? ["#fff0dc", "#2c1d17", "#18100d", "#ffe3bc"]
      : theme === "hearth"
        ? ["#f4f4e7", "#1b221e", "#0d1510", "#e7efdb"]
        : ["#f1f6ff", "#142236", "#0a1525", "#dceaff"];
  const fill = palette[player === 0 ? 0 : 1];
  const edge = palette[player === 0 ? 2 : 3];
  return (
    <svg
      viewBox="-24 -27 48 54"
      x={onBoard ? -24 : undefined}
      y={onBoard ? -27 : undefined}
      width={onBoard ? 48 : undefined}
      height={onBoard ? 54 : undefined}
      className={className}
      aria-hidden="true"
      focusable="false"
      data-piece-shape={type}
    >
      <defs>
        <linearGradient id={finishId} x1="0" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor={player === 0 ? "#ffffff" : theme === "adobe" ? "#654d3f" : theme === "hearth" ? "#45534a" : "#3c536e"} />
          <stop offset="0.32" stopColor={fill} />
          <stop offset="1" stopColor={player === 0 ? palette[3] : palette[2]} />
        </linearGradient>
      </defs>
      <g data-piece-finish="satin" data-base-colour={fill} fill={`url(#${finishId})`} stroke={edge} strokeWidth={1.7} strokeLinejoin="round" strokeLinecap="round">
        {type === "pawn" && (
          <>
            <circle cx={0} cy={-13} r={6.6} />
            <path d="M-5-6 H5 L7-1 H-7 Z M-6-1 C-6 5-8 9-12 14 H12 C8 9 6 5 6-1 Z" />
          </>
        )}
        {type === "rook" && (
          <>
            <path d="M-14-20 H-6 V-14 H-2 V-20 H2 V-14 H6 V-20 H14 V-7 L9-3 L10 14 H-10 L-9-3 L-14-7 Z" />
            <path d="M-8 8 H8" fill="none" />
          </>
        )}
        {type === "knight" && (
          <>
            <path d="M-12 14 C-11 8-7 3-4-1 L-11 1-16-4-13-13-5-22-1-17 C8-15 13-9 11-1 L8 7 12 14 Z" />
            <path d="M-13-5-7-7 M1-14 4-11" fill="none" />
            <circle cx={-5} cy={-11} r={1.3} fill={edge} stroke="none" />
          </>
        )}
        {type === "bishop" && (
          <>
            <path d="M0-23 C-3-18-10-13-9-7 C-8-1-4 2 0 2 C4 2 8-1 9-7 C10-13 3-18 0-23 Z M-6 3 H6 L10 14 H-10 Z" />
            <path d="M-3-15 4-8" fill="none" />
          </>
        )}
        {type === "queen" && (
          <>
            <path d="M-14-15-8-7-5-19 0-8 5-19 8-7 14-15 10-1 H-10 Z M-7 1 H7 L10 14 H-10 Z" />
            <circle cx={-14} cy={-18} r={2.7} />
            <circle cx={0} cy={-20} r={2.7} />
            <circle cx={14} cy={-18} r={2.7} />
          </>
        )}
        {type === "king" && (
          <>
            <path d="M-3-23 H3 V-19 H8 V-15 H3 V-11 H-3 V-15 H-8 V-19 H-3 Z" />
            <path d="M0-11 C-6-15-13-9-10-3 L-7 2 H7 L10-3 C13-9 6-15 0-11 Z M-6 3 H6 L10 14 H-10 Z" />
          </>
        )}
        <path d="M-12 13 H12 L14 18 H-14 Z" />
      </g>
    </svg>
  );
}
