import { previewMove } from "./previewMove";
import type { ChessMove,GameView } from "../endpoints/game_POST.schema";
describe("Immediate authoritative move previews",()=>{
 const game:GameView={variant:"shafran",stateId:"saved",activePlayer:0,ply:0,check:false,board:{variant:"shafran",stage:"playable",players:[0,1],cells:[{q:0,r:0,notation:"e6",colour:0,piece:{type:"pawn",player:0}},{q:0,r:1,notation:"e7",colour:1,piece:null}]},legalMoves:[],result:{status:"ongoing",reason:"",winner:-1,scores:[]}};
 it("paints only native changes without advancing the saved game or inventing rights",()=>{
  const move:ChessMove={from:{q:0,r:0},to:{q:0,r:1},changes:[{q:0,r:0,piece:null},{q:0,r:1,piece:{type:"pawn",player:0}}]};
  const shown=previewMove(game,move);expect(shown.board.cells[1].piece?.type).toBe("pawn");expect(shown.ply).toBe(0);expect(shown.activePlayer).toBe(0);expect(game.board.cells[0].piece?.type).toBe("pawn");expect(game.stateId).toBe("saved");
 });
 it("keeps the saved board when no authoritative preview is available",()=>{expect(previewMove(game,{from:{q:0,r:0},to:{q:0,r:1}})).toBe(game);expect(previewMove(game,null)).toBe(game);});
});
