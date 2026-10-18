import type { ChessMove, GameView } from "../endpoints/game_POST.schema";

export function previewMove(game: GameView, move: ChessMove | null): GameView {
  if (!move?.changes?.length) return game;
  const changes = new Map(move.changes.map(change => [`${change.q},${change.r}`, change.piece]));
  return {
    ...game,
    stateId: game.stateId + ":pending",
    board: {...game.board, cells:game.board.cells.map(cell => {
      const id = `${cell.q},${cell.r}`;
      return changes.has(id) ? {...cell,piece:changes.get(id)!} : cell;
    })},
  };
}
