import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {once} from 'node:events';
import {engines} from '../../manager/engines.mjs';
const variants=['glinski','mccooey','shafran','brusky','devasa','wellisch'];
export function registerEngineTests(test,engineId,name){
 for(const variant of variants)test(`${name}: protocol, legal moves and deadlines — ${variant}`,{timeout:20000},async t=>{
  const child=spawn(engines[engineId].path),lines=createInterface({input:child.stdout});let seq=0;
  t.after(()=>{child.kill();lines.close();});
  async function request(input){const id=String(++seq),line=once(lines,'line',{signal:AbortSignal.timeout(6000)});child.stdin.write(JSON.stringify({protocolVersion:1,requestId:id,...input})+'\n');const out=JSON.parse((await line)[0]);assert.equal(out.requestId,id);return out;}
  const hello=await request({type:'hello'});assert.equal(hello.engine,`${name} 1.0.0`);assert.ok(hello.capabilities.includes(variant));assert.ok(hello.capabilities.includes(name==='Defensive'?'paranoid':'maxn'));
  let state=await request({type:'new_game',variant});assert.equal(state.type,'game');
  assert.equal((await request({type:'position',state:{variant}})).type,'error');
  assert.equal((await request({type:'go',stateId:'stale',limits:{timeMs:1}})).type,'error');
  for(let i=0;i<24&&state.game.result.status==='ongoing';++i){
   const chosen=await request({type:'go',stateId:state.game.stateId,limits:{timeMs:40,depth:2,nodeLimit:500}});assert.equal(chosen.type,'bestmove');assert.ok(chosen.move);assert.ok(chosen.diagnostics.timeMs<700);assert.ok(chosen.diagnostics.nodes<=500);
   const signature=m=>JSON.stringify([m.from,m.to,m.promotion,m.pass]);assert.ok(state.game.legalMoves.some(m=>signature(m)===signature(chosen.move)));
   state=await request({type:'play_move',stateId:state.game.stateId,move:chosen.move});assert.equal(state.type,'game');
  }
  const end=once(child,'close');child.stdin.end('quit\n');assert.equal((await end)[0],0);
 });
 test(`${name}: a running search can be cancelled by its owner`,{timeout:10000},async t=>{
  const child=spawn(engines[engineId].path),lines=createInterface({input:child.stdout});t.after(()=>{child.kill();lines.close();});
  const response=once(lines,'line',{signal:AbortSignal.timeout(6000)});child.stdin.write(JSON.stringify({protocolVersion:1,type:'new_game',requestId:'new',variant:'wellisch'})+'\n');const state=JSON.parse((await response)[0]);
  child.stdin.write(JSON.stringify({protocolVersion:1,type:'go',requestId:'go',stateId:state.game.stateId,limits:{timeMs:4000,depth:5,nodeLimit:1000000}})+'\n');
  const before=Date.now(),closed=once(child,'close');child.kill('SIGKILL');await closed;assert.ok(Date.now()-before<1000);
 });
}
