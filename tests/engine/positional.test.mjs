import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {once} from 'node:events';
import test from 'node:test';
for(const variant of ['glinski','mccooey','shafran','brusky','devasa','wellisch'])test('Positional returns legal bounded moves: '+variant,async t=>{
 const child=spawn('engines/engine-2/engine-two'),lines=createInterface({input:child.stdout});let seq=0;
 const request=async input=>{const promise=once(lines,'line');child.stdin.write(JSON.stringify({protocolVersion:1,requestId:String(++seq),...input})+'\n');return JSON.parse((await promise)[0]);};
 t.after(async()=>{const done=once(child,'close');child.stdin.end('quit\n');await done;lines.close();});
 assert.equal((await request({type:'hello'})).engine,'Positional 0.1.0');let state=await request({type:'new_game',variant});
 const malformed=await request({type:'position',state:{variant}});assert.equal(malformed.type,'error');
 for(let i=0;i<24&&state.game.result.status==='ongoing';++i){
  const chosen=await request({type:'go',stateId:state.game.stateId,limits:{timeMs:40,depth:2,nodeLimit:500}});assert.equal(chosen.type,'bestmove');assert.ok(chosen.move);assert.ok(chosen.diagnostics.timeMs<700);
  const move=m=>JSON.stringify([m.from,m.to,m.promotion,m.pass]);assert.ok(state.game.legalMoves.some(m=>move(m)===move(chosen.move)));
  state=await request({type:'play_move',stateId:state.game.stateId,move:chosen.move});assert.equal(state.type,'game');
 }
 assert.ok(state.game.ply>0);
});
