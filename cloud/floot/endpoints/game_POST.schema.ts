import { z } from "zod";
import superjson from "superjson";

const hex = z
  .object({ q: z.number().int().min(-5).max(5), r: z.number().int().min(-5).max(5) })
  .strict();
const move = z
  .object({
    from: hex,
    to: hex,
    promotion: z.enum(["queen", "rook", "bishop", "knight"]).optional(),
  })
  .strict();
const session = { gameId: z.string().uuid(), accessToken: z.string().regex(/^[a-f0-9]{64}$/) };
const mutation = { ...session, version: z.number().int().nonnegative() };
export const schema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("new"),
      mode: z.enum(["engine", "two_players"]),
      humanPlayer: z.union([z.literal(0), z.literal(1)]),
    })
    .strict(),
  z.object({ action: z.literal("get"), ...session }).strict(),
  z.object({ action: z.literal("move"), ...mutation, move }).strict(),
  z.object({ action: z.literal("engine"), ...mutation }).strict(),
  z.object({ action: z.literal("undo"), ...mutation }).strict(),
]);
export type InputType = z.infer<typeof schema>;
export type Hex = { q: number; r: number };
export type PieceName = "pawn" | "knight" | "bishop" | "rook" | "queen" | "king";
export type ChessMove = {
  from: Hex;
  to: Hex;
  promotion?: "queen" | "rook" | "bishop" | "knight";
  fromNotation?: string;
  toNotation?: string;
};
export type GameView = {
  stateId: string;
  variant: string;
  activePlayer: number;
  ply: number;
  check: boolean;
  board: {
    variant: string;
    stage: string;
    players: number[];
    cells: Array<
      Hex & { colour: number; notation: string; piece: { type: PieceName; player: number } | null }
    >;
  };
  legalMoves: ChessMove[];
  result: {
    status: "ongoing" | "checkmate" | "stalemate" | "draw";
    reason: string;
    winner: number;
    scores: number[];
  };
};
export type SearchDiagnostics = { nodes: number; depth: number; timeMs: number; score: number };
export type MoveRecord = {
  ply: number;
  player: number;
  notation: string;
  from: Hex;
  to: Hex;
  promotion?: ChessMove["promotion"];
  engine: boolean;
};
export type OutputType = {
  gameId: string;
  accessToken: string;
  version: number;
  mode: string;
  humanPlayer: number;
  engine: string;
  execution: "cloud";
  game: GameView;
  moves: MoveRecord[];
  lastSearch: SearchDiagnostics | null;
};

export async function postGame(body: InputType, init?: RequestInit): Promise<OutputType> {
  const response = await fetch("/_api/game", {
    ...init,
    method: "POST",
    body: superjson.stringify(schema.parse(body)),
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const value = superjson.parse<OutputType & { error?: string }>(await response.text());
  if (!response.ok)
    throw Object.assign(new Error(value.error || "The game service is unavailable."), {
      status: response.status,
    });
  return value;
}
