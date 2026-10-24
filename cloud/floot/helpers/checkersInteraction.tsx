import type {GameView,Hex,ChessMove} from '../endpoints/game_POST.schema';
const same=(a:Hex,b:Hex)=>a.q===b.q&&a.r===b.r;
export function pathPrefix(move:ChessMove,path:Hex[]){return !!move.path&&move.path.length>=path.length&&path.every((p,i)=>same(p,move.path![i]));}
export function checkersStepView(game:GameView,path:Hex[]):GameView{
 if(!path.length)return game;const at=path[path.length-1],origin=path[0],moves=game.legalMoves.filter(m=>pathPrefix(m,path)),piece=game.board.cells.find(c=>same(c,origin))?.piece;
 return{...game,stateId:game.stateId+':path:'+path.length,board:{...game.board,cells:game.board.cells.map(c=>same(c,at)?{...c,piece:piece??null}:same(c,origin)?{...c,piece:null}:game.variant==='kruzno'&&moves[0]?.captures?.slice(0,path.length-1).some(p=>same(p,c))?{...c,piece:null}:c)},legalMoves:moves.filter(m=>m.path!.length>path.length).map(m=>({...m,from:at,to:m.path![path.length]}))};
}
