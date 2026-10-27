import type {GameView,ChessMove,VariantId} from '../endpoints/game_POST.schema';
type Piece=NonNullable<GameView['board']['cells'][number]['piece']>;
export type CompactPuzzleView=Omit<GameView,'board'>&{pieces:Array<[number,Piece]>};
export type DailyPuzzle={key:string;goal:'mate'|'king'|'promote'|'win';position:CompactPuzzleView;answers:Array<{move:ChessMove;after:CompactPuzzleView}>};
export type PuzzleBank={variant:VariantId;geometry:GameView['board'];puzzles:DailyPuzzle[]};
export type PuzzleProgress={version:number;attempts:number;solved:boolean;hintUsed:boolean};
export function expandPuzzleView(bank:PuzzleBank,view:CompactPuzzleView):GameView{
 const {pieces,...rest}=view,byIndex=new Map(pieces);
 return{...rest,board:{...bank.geometry,cells:bank.geometry.cells.map((cell,i)=>({...cell,piece:byIndex.get(i)||null}))}};
}
export function samePuzzleMove(a:ChessMove,b:ChessMove){
 const point=(p:{q:number;r:number},q:{q:number;r:number})=>p.q===q.q&&p.r===q.r;
 return point(a.from,b.from)&&point(a.to,b.to)&&a.promotion===b.promotion&&!!a.pass===!!b.pass&&(!a.path&&!b.path||!!a.path&&!!b.path&&a.path.length===b.path.length&&a.path.every((p,i)=>point(p,b.path![i])));
}
