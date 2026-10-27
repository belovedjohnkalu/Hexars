import {schema} from './puzzles_POST.schema';
import {optionalGameUser} from '../helpers/gameAccess';
import {dailyPuzzleStore} from '../helpers/dailyPuzzleStore';
import {publish} from '@floot/realtime';
import {channels} from '../helpers/realtimeChannels';
export async function handle(request:Request){
 const headers={'Content-Type':'application/json','Cache-Control':'private, no-store'};
 try{
  const raw=await request.text();if(raw.length>4096)return Response.json({error:'The request is too large.'},{status:413,headers});
  const input=schema.parse(JSON.parse(raw)),user=await optionalGameUser(request),expected=request.headers.get('X-ION-Account');
  if(expected&&expected!==String(user?.id??'guest'))return Response.json({error:'Your account changed. Open the puzzle again.'},{status:401,headers});
  const result=await dailyPuzzleStore(input,user?.id??null);
  if(user&&input.action!=='load')await Promise.allSettled([publish(channels.player(user.id),{puzzleId:input.puzzleId,version:result.progress?.version})]);
  return Response.json(result,{headers});
 }catch(e){
  const status=e&&typeof e==='object'&&'status'in e?Number(e.status):e instanceof SyntaxError||e&&typeof e==='object'&&'issues'in e?400:503;
  if(status>=500)console.error('Daily puzzle unavailable',e instanceof Error?e.message:'Unknown error');
  return Response.json({error:status===503?'Couldn’t open the puzzle. Try again.':e instanceof Error?e.message:'Check your move.',...(e&&typeof e==='object'&&'code'in e?{code:e.code}:{})},{status,headers:{...headers,...(status===429?{'Retry-After':'60'}:{})}});
 }
}
