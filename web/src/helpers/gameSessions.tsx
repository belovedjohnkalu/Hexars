import type { OutputType, VariantId } from "../api/game";
type Credentials = { gameId: string; accessToken: string };
const legacyKey = "hexchess.cloud.game.v1";
function valid(value: unknown): value is Credentials {
  if (!value || typeof value !== "object") return false;
  const item = value as Credentials;
  return typeof item.gameId === "string" && /^[a-f0-9-]{36}$/.test(item.gameId) &&
    typeof item.accessToken === "string" && /^[a-f0-9]{64}$/.test(item.accessToken);
}
function stored(key: string): Credentials | null {
  try { const value: unknown = JSON.parse(localStorage.getItem(key) || "null"); return valid(value) ? value : null; }
  catch { return null; }
}
export const gameSessions = {
  fromHash(hash = window.location.hash): Credentials | null {
    const values = new URLSearchParams(hash.replace(/^#/, ""));
    const value = { gameId: values.get("game"), accessToken: values.get("key") };
    return valid(value) ? value : null;
  },
  stored(variant: VariantId) { return stored(`hexars.game.${variant}`) || stored(legacyKey); },
  save(result: OutputType) {
    const value = JSON.stringify({ gameId: result.gameId, accessToken: result.accessToken });
    try { localStorage.setItem(`hexars.game.${result.game.variant}`, value); localStorage.setItem(legacyKey, value); }
    catch { /* The shared link remains available. */ }
  },
  hash(result: Pick<OutputType, "gameId" | "accessToken">) {
    return new URLSearchParams({ game: result.gameId, key: result.accessToken }).toString();
  },
};
