import { nativeEngineAsset } from './nativeEngineAssets';
import { chessVariants } from './chessVariants';
import { isCheckers } from './checkersRules';
import type { EngineId } from './chessEngines';
import type { GameView } from '../endpoints/game_POST.schema';

function code(variant: string, engine?: EngineId) {
  return isCheckers(variant) ? 'checkers-0.69' : nativeEngineAsset(engine).checksum;
}
function read(view: unknown, savedCode: string | null, state: unknown, engine?: EngineId): GameView | null {
  const s = state as { variant?: string; ply?: number } | null;
  const g = view as GameView | null;
  if (!s?.variant || !g || savedCode !== code(s.variant, engine) || g.variant !== s.variant || g.ply !== s.ply || g.board?.variant !== s.variant ||
    !Array.isArray(g.board?.cells) || g.board.cells.length !== chessVariants.all.find(v => v.id === s.variant)?.cells || !Array.isArray(g.legalMoves) || !g.result) return null;
  return g;
}
export const gameViewCache = { code, read };
