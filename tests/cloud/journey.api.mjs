// Run with Floot run_code_in_vm. No emails are sent; fixtures use .invalid.
import assert from 'node:assert/strict';import {randomUUID,randomBytes} from 'node:crypto';
const base='https://9d7c0966-4648-49f3-845c-b4a9296d0358.sandbox.floot.app',users=[],games=new Set(),lobbies=new Set(),checks=[];
const moveOnly=m=>({from:m.from,to:m.to,...(m.promotion?{promotion:m.promotion}:{}),...(m.pass?{pass:true}:{})});
function client(){const cookies={};return async(path,input,wrapped=false)=>{if(input.move)input={...input,move:moveOnly(input.move)};const r=await fetch(base+'/_api/'+path,{method:'POST',headers:{'Content-Type':'application/json',Cookie:Object.values(cookies).join('; ')},body:JSON.stringify(wrapped?{json:input}:input)});for(const value of r.headers.getSetCookie()){const pair=value.split(';')[0];cookies[pair.split('=')[0]]=pair;}let data=await r.json();if(wrapped)data=data.json;return{status:r.status,data};};}
const a=client(),b=client(),c=client(),guest=client(),zero='0'.repeat(64);
const must=(r,status=200)=>{assert.equal(r.status,status,JSON.stringify(r.data));return r.data;};
const game=async(who,id,action='get',extra={})=>must(await who('game',{action,gameId:id,accessToken:zero,...extra},true));
try{
 for(const who of [a,b,c]){const user=must(await who('auth/register_with_password',{email:'ion-journey-qa-'+randomUUID()+'@example.invalid',password:randomBytes(18).toString('hex'),displayName:'Journey QA'},true)).user;users.push(user.id);}
 must(await guest('online',{action:'find',variant:'glinski'}),401);must(await guest('history',{timeZone:'UTC'}),401);checks.push('Email accounts required for online and private History');
 let room=must(await a('online',{action:'create',variant:'wellisch'}));lobbies.add(room.id);assert.match(room.code,/^\d{4}$/);assert.equal(room.players.length,1);
 must(await guest('online',{action:'join',code:room.code}),401);
 const joins=await Promise.all([b('online',{action:'join',code:room.code}),c('online',{action:'join',code:room.code})]);for(const r of joins)must(r);room=must(await a('online',{action:'get',id:room.id}));assert.equal(room.status,'playing');assert.equal(room.players.length,3);games.add(room.gameId);checks.push('Concurrent code joins atomically fill three distinct Wellisch seats');
 let state=await game(a,room.gameId);assert.equal(state.humanPlayer,0);assert.equal((await game(b,room.gameId)).humanPlayer,1);assert.equal((await game(c,room.gameId)).humanPlayer,2);
 must(await guest('game',{action:'get',gameId:room.gameId,accessToken:zero},true),404);
 must(await b('game',{action:'move',gameId:room.gameId,accessToken:zero,version:state.version,move:state.game.legalMoves[0]},true),403);
 must(await a('game',{action:'undo',gameId:room.gameId,accessToken:zero,version:state.version},true),400);
 state=await game(a,room.gameId,'move',{version:state.version,move:state.game.legalMoves[0]});assert.equal(state.game.ply,1);assert.equal((await game(b,room.gameId)).game.ply,1);
 must(await c('game',{action:'move',gameId:room.gameId,accessToken:zero,version:0,move:state.game.legalMoves[0]},true),403);checks.push('Online turns, membership and no-Undo enforced by the server');
 const own=must(await a('history',{timeZone:'UTC'})),other=must(await b('history',{timeZone:'UTC'}));assert.ok(own.games.some(g=>g.id===room.gameId));assert.ok(other.games.some(g=>g.id===room.gameId));
 const local=must(await a('game',{action:'new',variant:'glinski',mode:'two_players',humanPlayer:0},true));games.add(local.gameId);const saved=must(await a('game',{action:'move',gameId:local.gameId,accessToken:local.accessToken,version:0,move:local.game.legalMoves[0]},true));assert.equal(saved.game.ply,1);assert.ok(!must(await b('history',{timeZone:'UTC'})).games.some(g=>g.id===local.gameId));must(await b('game',{action:'get',gameId:local.gameId,accessToken:zero},true),404);checks.push('History is account-private; online participants share only their own match');
 let waiting=must(await a('online',{action:'find',variant:'mccooey'}));lobbies.add(waiting.id);const matched=must(await b('online',{action:'find',variant:'mccooey'}));assert.equal(matched.id,waiting.id);assert.equal(matched.status,'playing');games.add(matched.gameId);checks.push('Random matching pairs accounts for the selected variant');
 const engine=must(await a('game',{action:'new',variant:'glinski',mode:'engine',engineId:'positional',humanPlayer:0,difficulty:0},true));games.add(engine.gameId);assert.match(engine.engine,/Positional/);
 let switched=must(await a('game',{action:'switch_side',gameId:engine.gameId,accessToken:engine.accessToken,version:0,humanPlayer:1},true));assert.equal(switched.humanPlayer,1);switched=must(await a('game',{action:'engine',gameId:engine.gameId,accessToken:engine.accessToken,version:switched.version},true));assert.equal(switched.game.ply,1);assert.match(switched.engine,/Positional/);must(await a('game',{action:'switch_side',gameId:engine.gameId,accessToken:engine.accessToken,version:switched.version,humanPlayer:0},true),400);checks.push('Cloud Positional runs independently; side switching locks after the first move');
 console.log(JSON.stringify({passed:true,checks}));
}finally{console.log(JSON.stringify({fixtureUsers:users,fixtureGames:[...games],fixtureLobbies:[...lobbies]}));}
