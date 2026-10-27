import {createHash} from 'node:crypto';
import {db} from './db';
import type {Json} from './schema';
import {dailyPuzzleBank} from './dailyPuzzleBank';
import {puzzleCalendar,dailyPuzzleIndex} from './puzzleCalendar';
import {accountTimeZone} from './accountTimeZone';
import {timeAccess} from './timeAccess';
import {isFreeVariant} from './computerPolicy';
import {requestGate} from './requestGate';
import {expandPuzzleView,samePuzzleMove,type PuzzleProgress} from './dailyPuzzleTypes';
import type {PuzzleInput,PuzzleResult} from '../endpoints/puzzles_POST.schema';
import type {ChessMove} from '../endpoints/game_POST.schema';
const empty:PuzzleProgress={version:0,attempts:0,solved:false,hintUsed:false};
const fail=(message:string,status=400,code?:string):never=>{throw Object.assign(new Error(message),{status,code});};
export async function dailyPuzzleStore(input:PuzzleInput,userId:number|null):Promise<PuzzleResult>{
 if(!isFreeVariant(input.variant))await timeAccess.assert(userId,input.variant);
 const timeZone=await accountTimeZone(userId,input.timeZone),calendar=puzzleCalendar(timeZone),bank=await dailyPuzzleBank(input.variant),problem=bank.puzzles[dailyPuzzleIndex(calendar.ordinal,bank.puzzles.length,input.variant)],id='ion070:'+input.variant+':'+calendar.day+':'+problem.key;
 const read=()=>userId?db.selectFrom('ionDailyPuzzleProgress').selectAll().where('userId','=',userId).where('puzzleId','=',id).executeTakeFirst():Promise.resolve(undefined);
 if(input.action==='load'){
  const saved=await read(),progress=saved?{version:saved.version,attempts:saved.attempts,solved:saved.solved,hintUsed:saved.hintUsed}:{...empty},answer=saved?.solvedMove?problem.answers.find(a=>samePuzzleMove(a.move,saved.solvedMove as unknown as ChessMove)):undefined;
  return{puzzle:{id,variant:input.variant,day:calendar.day,timeZone,expiresAt:calendar.expiresAt,goal:problem.goal,game:expandPuzzleView(bank,problem.position),progress,...(answer?{after:expandPuzzleView(bank,answer.after),move:answer.move}:{})}};
 }
 if(input.puzzleId!==id)fail('A new puzzle is ready.',409,'STALE_PUZZLE');
 const answer=input.action==='attempt'?problem.answers.find(a=>samePuzzleMove(a.move,input.move)):undefined;
 if(input.action==='attempt'&&!problem.position.legalMoves.some(m=>samePuzzleMove(m,input.move)))fail('Choose a marked move.');
 const correct=input.action==='attempt'?!!answer:undefined,hint=input.action==='hint'?problem.answers[0].move.from:undefined;
 const result=(progress:PuzzleProgress):PuzzleResult=>({progress,...(correct!==undefined?{correct}:{}),...(answer?{after:expandPuzzleView(bank,answer.after),move:answer.move}:{}),...(hint?{hint}:{})});
 if(!userId)return result({...empty,version:input.version+1,attempts:input.action==='attempt'?1:0,solved:!!correct,hintUsed:input.action==='hint'});
 const hash=createHash('sha256').update(JSON.stringify({action:input.action,...(input.action==='attempt'?{move:input.move}:{})})).digest('hex');
 return db.transaction().execute(async tx=>{
  await tx.insertInto('ionDailyPuzzleProgress').values({userId,puzzleId:id,variant:input.variant,day:calendar.day}).onConflict(oc=>oc.columns(['userId','puzzleId']).doNothing()).execute();
  const old=await tx.selectFrom('ionDailyPuzzleProgress').selectAll().where('userId','=',userId).where('puzzleId','=',id).forUpdate().executeTakeFirstOrThrow(),progress={version:old.version,attempts:old.attempts,solved:old.solved,hintUsed:old.hintUsed};
  if(old.lastRequestId===input.requestId){if(old.lastRequestHash!==hash)fail('This attempt changed. Try again.',409);return result(progress);}
  if(old.version!==input.version)fail('This puzzle changed on another device. Open it again.',409,'PUZZLE_CONFLICT');
  // Practising an already completed puzzle does not rewrite the first solve.
  if(old.solved)return result(progress);
  await requestGate('puzzle:'+userId,90,60,tx);
  const next={version:old.version+1,attempts:old.attempts+(input.action==='attempt'?1:0),solved:!!correct,hintUsed:old.hintUsed||input.action==='hint'};
  await tx.updateTable('ionDailyPuzzleProgress').set({...next,lastRequestId:input.requestId,lastRequestHash:hash,...(answer?{solvedMove:answer.move as unknown as Json}:{}),updatedAt:new Date()}).where('userId','=',userId).where('puzzleId','=',id).execute();
  return result(next);
 });
}
