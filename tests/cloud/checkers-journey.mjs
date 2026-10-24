// Reusable acceptance journey. Run against a preview with two isolated QA
// sessions; no credentials are stored in this repository.
export async function verifyCheckers({base,cookies,superjson}){
 const checks=[],games=[];
 const assert=(condition,label)=>{if(!condition)throw new Error(label);checks.push(label);};
 async function call(input,user=0,status=200){
  await new Promise(resolve=>setTimeout(resolve,300)); // Respect preview API test limits.
  const r=await fetch(base+'/_api/game',{method:'POST',headers:{'Content-Type':'application/json',cookie:cookies[user]},body:superjson.stringify(input)});
  const out=superjson.parse(await r.text());
  assert(r.status===status,input.action+' '+(input.variant||'')+': '+r.status+' expected '+status+(out.error?' ('+out.error+')':''));return out;
 }
 for(const variant of ['hexdame','kruzno']){
  let g=await call({action:'new',variant,mode:'two_players',humanPlayer:0});games.push(g.gameId);const auth={gameId:g.gameId,accessToken:g.accessToken};
  assert(g.game.board.cells.length===(variant==='hexdame'?61:91),'board '+variant);
  const m=g.game.legalMoves[0],move={from:m.from,to:m.to,path:m.path};
  await call({action:'move',...auth,version:0,move:{from:m.from,to:m.from,path:[m.from,m.from]}},0,400);
  g=await call({action:'move',...auth,version:0,move});assert(g.game.ply===1&&g.moves[0].path.length===m.path.length,'whole move '+variant);
  await call({action:'move',...auth,version:0,move},0,409);
  await call({action:'get',gameId:g.gameId,accessToken:'f'.repeat(64)},1,404);
  const review=await call({action:'review',...auth,ply:0});assert(review.game.ply===0,'review '+variant);
  g=await call({action:'undo',...auth,version:g.version});assert(g.game.ply===0,'undo '+variant);
  g=await call({action:'draw',...auth,version:g.version});assert(g.game.result.reason==='agreed','offline agreed draw '+variant);
  await call({action:'move',...auth,version:g.version,move},0,400);
  let e=await call({action:'new',variant,mode:'engine',engineId:'universal',difficulty:1,humanPlayer:variant==='hexdame'?1:0});games.push(e.gameId);
  e=await call({action:'engine',gameId:e.gameId,accessToken:e.accessToken,version:0});assert(e.game.ply===1&&e.lastSearch.nodes>0,'computer '+variant);
  e=await call({action:'forfeit',gameId:e.gameId,accessToken:e.accessToken,version:e.version});assert(e.game.result.winner!==e.humanPlayer,'forfeit '+variant);
  await call({action:'new',variant,mode:'engine',engineId:'tactical',humanPlayer:0},0,400);
 }
 return {checks:checks.length,details:checks,games};
}
