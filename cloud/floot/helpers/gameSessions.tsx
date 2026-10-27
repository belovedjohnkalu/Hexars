import {deviceData} from './deviceData';
import {chessVariants} from './chessVariants';
import { engineId as resolveEngineId, type EngineId } from './chessEngines';
import type { OutputType, VariantId } from "../endpoints/game_POST.schema";
type Credentials = { gameId: string; accessToken: string };
const legacyKey = "hexchess.cloud.game.v1";
function valid(value: unknown): value is Credentials {
  if (!value || typeof value !== "object") return false;
  const item = value as Credentials;
  return typeof item.gameId === "string" && /^[a-f0-9-]{36}$/.test(item.gameId) &&
    typeof item.accessToken === "string" && /^[a-f0-9]{64}$/.test(item.accessToken);
}
function stored(key: string): Credentials | null {
  const owner=deviceData.identity()||'guest';
  const scoped='ion.player.'+owner+':'+key;
  try { const value: unknown = JSON.parse(localStorage.getItem(scoped) || "null"); return valid(value) ? value : null; }
  catch { return null; }
}
export const gameSessions = {
  fromHash(hash = window.location.hash): Credentials | null {
    const values = new URLSearchParams(hash.replace(/^#/, ""));
    const value = { gameId: values.get("game"), accessToken: values.get("key") };
    return valid(value) ? value : null;
  },
  stored(variant: VariantId, mode: "engine" | "two_players" = "engine", engine: EngineId = "tactical", difficulty = 3) { return mode === "two_players" ? stored(`ion.game.friend.${variant}`) : stored(`ion.game.engine.${engine}.${difficulty}.${variant}`) || (engine === "tactical" ? stored(`hexars.game.${variant}`) || stored(legacyKey) : null); },
  last(userId:number|null) {
    try{const value=JSON.parse(localStorage.getItem('ion.game.last.'+(userId||'guest'))||'null') as Credentials&{variant:unknown;mode:string;difficulty:number;characters:number;ongoing?:boolean};if(!valid(value)||!chessVariants.isId(value.variant)||!value.ongoing)return null;return value as Credentials&{variant:VariantId;mode:string;difficulty:number;characters:number;ongoing:true};}catch{return null;}
  },
  save(result: OutputType) {
    const owner=deviceData.identity()||'guest',prefix='ion.player.'+owner+':';
    try{localStorage.setItem('ion.game.last.'+owner,JSON.stringify({gameId:result.gameId,accessToken:result.accessToken,variant:result.game.variant,mode:result.mode,difficulty:result.difficulty??3,characters:result.moves.reduce((n,m)=>n+Array.from(m.notation).length,0),ongoing:result.game.result.status==='ongoing'}));window.dispatchEvent(new window.Event('ion.game-saved'));}catch{}
    if(result.mode==='online')return;
    const value = JSON.stringify({ gameId: result.gameId, accessToken: result.accessToken });
    try { if(result.mode === "two_players") localStorage.setItem(prefix+`ion.game.friend.${result.game.variant}`, value); else { localStorage.setItem(prefix+`ion.game.engine.${resolveEngineId(result.engineId)}.${result.difficulty??3}.${result.game.variant}`,value); localStorage.setItem(prefix+`hexars.game.${result.game.variant}`, value); localStorage.setItem(prefix+legacyKey, value); } localStorage.setItem("ion.board.variant", result.game.variant); }
    catch { /* The shared link remains available. */ }
  },
  hash(result: Pick<OutputType, "gameId" | "accessToken">) {
    return new URLSearchParams({ game: result.gameId, key: result.accessToken }).toString();
  },
};
