import type { MoveRecord, SearchDiagnostics } from "../../shared/protocol/contracts";

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json | undefined };
export type GameRow = {
  id: string;
  ownerId: string | null;
  accessTokenHash: string;
  mode: "engine" | "two_players";
  humanPlayer: 0 | 1;
  state: Json;
  timeline: Json[];
  moves: MoveRecord[];
  version: number;
  lastSearch: SearchDiagnostics | null;
};
export type GameUpdate = Pick<GameRow, "state" | "timeline" | "moves" | "version" | "lastSearch">;
export interface GameStore {
  create(row: GameRow): Promise<void>;
  find(id: string, tokenHash: string): Promise<GameRow | null>;
  update(id: string, expectedVersion: number, values: GameUpdate): Promise<boolean>;
}
