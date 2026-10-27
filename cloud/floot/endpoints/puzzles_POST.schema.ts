import {z} from 'zod';
import {variantSchema,chessMoveSchema,type GameView,type VariantId,type ChessMove,type Hex} from './game_POST.schema';
import type {PuzzleProgress,DailyPuzzle} from '../helpers/dailyPuzzleTypes';
const common={variant:variantSchema,timeZone:z.string().max(100).optional()},mutation={...common,puzzleId:z.string().min(1).max(160),version:z.number().int().min(0).max(100000),requestId:z.string().uuid()};
export const schema=z.discriminatedUnion('action',[
 z.object({action:z.literal('load'),...common}).strict(),
 z.object({action:z.literal('attempt'),...mutation,move:chessMoveSchema}).strict(),
 z.object({action:z.literal('hint'),...mutation}).strict(),
]);
export type PuzzleInput=z.infer<typeof schema>;
export type PuzzleView={id:string;variant:VariantId;day:string;timeZone:string;expiresAt:string;goal:DailyPuzzle['goal'];game:GameView;progress:PuzzleProgress;after?:GameView;move?:ChessMove};
export type PuzzleResult={puzzle?:PuzzleView;progress?:PuzzleProgress;correct?:boolean;after?:GameView;move?:ChessMove;hint?:Hex};
export async function postPuzzle(input:PuzzleInput,signal?:AbortSignal,userId:number|null=null):Promise<PuzzleResult>{
 const response=await fetch('/_api/puzzles',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json','X-ION-Account':String(userId??'guest')},body:JSON.stringify(schema.parse(input)),signal});
 const result=await response.json().catch(()=>null);
 if(!response.ok||!result)throw Object.assign(new Error(result?.error||'Couldn’t open the puzzle. Try again.'),{status:response.status,code:result?.code});
 return result;
}
