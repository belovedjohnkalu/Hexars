import type { SupabaseClient } from "@supabase/supabase-js";
import type { GameRow, GameStore, GameUpdate } from "./store";

const columns = "id,owner_id,access_token_hash,mode,human_player,state,timeline,moves,version,last_search";
function values(row: GameUpdate) {
  return { state: row.state, timeline: row.timeline, moves: row.moves, version: row.version, last_search: row.lastSearch };
}
export class SupabaseGameStore implements GameStore {
  constructor(private readonly client: SupabaseClient) {}
  async create(row: GameRow) {
    const { error } = await this.client.from("hexars_games").insert({
      ...values(row), id: row.id, owner_id: row.ownerId, access_token_hash: row.accessTokenHash,
      mode: row.mode, human_player: row.humanPlayer,
    });
    if (error) throw new Error("Unable to save the game");
  }
  async find(id: string, tokenHash: string): Promise<GameRow | null> {
    const { data, error } = await this.client.from("hexars_games").select(columns)
      .eq("id", id).eq("access_token_hash", tokenHash).maybeSingle();
    if (error) throw new Error("Unable to load the game");
    return data ? {
      id: data.id, ownerId: data.owner_id, accessTokenHash: data.access_token_hash,
      mode: data.mode, humanPlayer: data.human_player, state: data.state,
      timeline: data.timeline, moves: data.moves, version: data.version, lastSearch: data.last_search,
    } as GameRow : null;
  }
  async update(id: string, expectedVersion: number, row: GameUpdate) {
    // One atomic write; a simultaneous request cannot overwrite the winning move.
    const { data, error } = await this.client.from("hexars_games")
      .update({ ...values(row), updated_at: new Date().toISOString() })
      .eq("id", id).eq("version", expectedVersion).select("version");
    if (error) throw new Error("Unable to save the move");
    return data?.length === 1;
  }
}
