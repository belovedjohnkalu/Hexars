// Ephemeral browser-test adapter. Production continues to use Floot/Postgres.
// Every position, move and search below is validated by the real C++ executable.
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {once} from 'node:events';
import {randomUUID,randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import superjson from 'superjson';
const engine=fileURLToPath(new URL('../../engines/engine-1/engine-one',import.meta.url));
export async function native(commands){
 const child=spawn(engine,[],{stdio:['pipe','pipe','pipe']}),lines=createInterface({input:child.stdout});
 const timeout=setTimeout(()=>child.kill('SIGKILL'),10000);
 let result;
 try{for(const [i,command] of commands.entries()){
  const pending=once(lines,'line');child.stdin.write(JSON.stringify({protocolVersion:1,requestId:'browser-'+i,...command})+'\n');
  result=JSON.parse((await pending)[0]);if(result.type==='error')throw Error(result.message);
 }return result;}finally{clearTimeout(timeout);const stopped=once(child,'close');child.stdin.end('quit\n');await stopped;lines.close();}
}
export async function startNativeApi(){
 const games=new Map();
 const result=row=>({gameId:row.id,accessToken:row.token,version:row.version,mode:row.mode,humanPlayer:row.side,engine:'Tactical 0.7',execution:'cloud',game:row.native.game,moves:row.moves,lastSearch:row.search});
 async function seed(variant,{mode='two_players',side=0,state}={}){
  const packet=state?await native([{type:'position',state}]):await native([{type:'new_game',variant}]);
  const row={id:randomUUID(),token:randomBytes(32).toString('hex'),version:0,mode,side,native:packet,moves:[],history:[],search:null};games.set(row.id,row);return result(row);
 }
 const server=createServer(async(req,res)=>{
  try{
   if(req.url==='/_api/variants'){
    const variants=await Promise.all(['glinski','mccooey','shafran'].map(async id=>({id,board:(await native([{type:'new_game',variant:id}])).game.board})));
    res.setHeader('Content-Type','application/json');res.end(JSON.stringify({variants}));return;
   }
   if(req.url!=='/_api/game'||req.method!=='POST'){res.writeHead(404);res.end();return;}
   let body='';for await(const chunk of req){body+=chunk;if(body.length>4096)throw Error('Request too large');}
   const input=superjson.parse(body);res.setHeader('Content-Type','application/json');
   if(input.action==='new'){res.end(superjson.stringify(await seed(input.variant,{mode:input.mode,side:input.humanPlayer})));return;}
   const row=games.get(input.gameId);if(!row||row.token!==input.accessToken){res.writeHead(404);res.end(superjson.stringify({error:'Game not found'}));return;}
   if(input.action==='get'){res.end(superjson.stringify(result(row)));return;}
   if(input.version!==row.version){res.writeHead(409);res.end(superjson.stringify({error:'Game changed'}));return;}
   if(input.action==='undo'){
    const count=row.mode==='engine'&&row.native.game.activePlayer===row.side&&row.history.length>=2?2:1;
    if(!row.history.length)throw Error('No moves to undo');
    row.native=await native([{type:'position',state:row.history.at(-count)}]);row.history.splice(-count);row.moves.splice(-count);row.search=null;
   }else{
    if(!['move','engine'].includes(input.action))throw Error('Invalid action');
    let move=input.move;
    if(input.action==='engine'){
     if(row.mode!=='engine'||row.native.game.activePlayer===row.side)throw Error('Wrong turn');
     const found=await native([{type:'position',state:row.native.state},{type:'go',stateId:row.native.game.stateId,limits:{timeMs:80,depth:2,nodeLimit:2000}}]);
     move=found.move;row.search={...found.diagnostics,score:found.evaluation.score};
    }else if(row.mode==='engine'&&row.native.game.activePlayer!==row.side)throw Error('Wrong turn');
    const before=row.native,next=await native([{type:'position',state:before.state},{type:'play_move',stateId:before.game.stateId,move}]);
    const selected=before.game.legalMoves.find(m=>m.from.q===move.from.q&&m.from.r===move.from.r&&m.to.q===move.to.q&&m.to.r===move.to.r&&m.promotion===move.promotion);
    row.history.push(before.state);row.moves.push({ply:next.game.ply,player:before.game.activePlayer,from:move.from,to:move.to,fromNotation:selected.fromNotation,toNotation:selected.toNotation,notation:selected.fromNotation+'–'+selected.toNotation,engine:input.action==='engine',...(move.promotion?{promotion:move.promotion}:{})});row.native=next;
   }
   ++row.version;res.end(superjson.stringify(result(row)));
  }catch(e){res.writeHead(400,{'Content-Type':'application/json'});res.end(superjson.stringify({error:e.message}));}
 });
 await new Promise(resolve=>server.listen(9077,'127.0.0.1',resolve));
 return {seed,close:()=>new Promise(resolve=>server.close(resolve))};
}
