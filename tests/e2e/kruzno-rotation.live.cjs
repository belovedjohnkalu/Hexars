// Browser-level pass-and-play check. Networked game, account and wallet calls
// are mocked so this test never creates a real account or changes a saved game.
// Run: node -r tsx/cjs tests/e2e/kruzno-rotation.live.cjs
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const superjson=require('superjson').default;
const {createCheckers,checkersView,applyCheckersMove}=require('../../cloud/floot/helpers/checkersRules.tsx');

async function verify(viewport,reducedMotion){
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-gpu'],proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined});
 const mobile=viewport.width<600;
 const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,reducedMotion,serviceWorkers:'block'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',token='a'.repeat(64),userId=987654;
 let states=[createCheckers('kruzno')],moves=[],version=0;
 const payload=(position=states.length-1)=>({gameId:id,accessToken:token,version,mode:'two_players',difficulty:3,humanPlayer:1,engine:'Computer',engineId:'universal',execution:'cloud',game:checkersView(states[position]),moves:moves.slice(0,position),lastSearch:null});
 const respond=(route,data)=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 await page.route('**/_api/**',async route=>{
  const request=route.request(),path=new URL(request.url()).pathname;
  if(path==='/_api/auth/session')return route.fulfill({status:200,contentType:'application/json',body:superjson.stringify({user:{id:userId,email:'fixture@example.invalid',role:'user'}})});
  if(path==='/_api/time'){
   const input=JSON.parse(request.postData()||'{}');
   return respond(route,input.action==='snapshot'?{snapshot:{userId,dev:true,owner:false,balanceUs:'0',earnedUs:'0',buyers:1,readyAt:null,pricingReady:true,products:[],labels:{},identifiers:{}}}:{earning:{active:false,elsewhere:false,creditedUs:'0'}});
  }
  if(path==='/_api/game'){
   const input=superjson.parse(request.postData()||'{}');
   if(input.action==='new'){states=[createCheckers('kruzno')];moves=[];version++;}
   if(input.action==='move'){
    const player=states.at(-1).activePlayer,{state,move}=applyCheckersMove(states.at(-1),input.move);
    states.push(state);moves.push({...move,ply:state.ply,player,notation:'move',engine:false});version++;
   }
   if(input.action==='undo'&&states.length>1){states.pop();moves.pop();version++;}
   const result=payload(input.action==='review'?input.ply:states.length-1);
   return route.fulfill({status:200,contentType:'application/json',body:superjson.stringify(result)});
  }
  if(request.method()==='GET'&&path==='/_api/public_bootstrap')return route.continue();
  return respond(route,{});
 });
 try{
  await page.goto('https://ion.floot.app/kruzno?mode=friend',{waitUntil:'domcontentloaded'});
  const board=page.locator('svg[aria-label="Kruzno’s Checkers board"]');
  const canvas=board.locator(':scope > g').first();
  await board.waitFor({timeout:45000});
  const angle=async expected=>page.waitForFunction(value=>document.querySelector('svg[aria-label="Kruzno’s Checkers board"] > g')?.style.transform===`rotate(${value}deg)`,expected,{timeout:10000});
  const ready=async ply=>{await page.locator(`[data-ply="${ply}"]`).waitFor({timeout:10000});await page.waitForTimeout(reducedMotion==='reduce'?80:600);};
  const quadrant=async color=>{
   const result=await board.evaluate((svg,side)=>{const rect=svg.getBoundingClientRect(),pieces=[...svg.querySelectorAll(`g[data-cell][aria-label^="${side} "]`)];return {count:pieces.length,dx:pieces.reduce((n,p)=>n+p.getBoundingClientRect().x+p.getBoundingClientRect().width/2-(rect.x+rect.width/2),0)/pieces.length,dy:pieces.reduce((n,p)=>n+p.getBoundingClientRect().y+p.getBoundingClientRect().height/2-(rect.y+rect.height/2),0)/pieces.length};},color);
   assert.ok(result.count>0&&result.dx<0&&result.dy>0,`${color} should be at the bottom left: ${JSON.stringify(result)}`);
  };
  const play=async()=>{
   const move=checkersView(states.at(-1)).legalMoves[0];
   assert.ok(move&&move.path,'A legal move must be available');
   for(const hex of move.path){const cell=checkersView(states.at(-1)).board.cells.find(c=>c.q===hex.q&&c.r===hex.r),target=board.locator(`[data-cell="${cell.notation}"]`);if(mobile)await target.tap();else await target.click();}
  };
  await ready(0);await angle(0);await quadrant('Black');
  await play();await ready(1);await angle(180);await quadrant('White');
  await play();await ready(2);await angle(0);
  await page.getByRole('button',{name:/^Undo/}).click();await ready(1);await angle(180);
  await page.getByRole('button',{name:/^Board Reset/}).click();
  await page.getByRole('button',{name:'Reset board',exact:true}).click();await ready(0);await angle(0);await quadrant('Black');
  await board.locator('g[data-cell]').first().focus();await page.keyboard.press('f');await angle(180);
  await page.keyboard.press('f');await angle(0);
  assert.equal(errors.length,0,errors.join('\n'));
  return {viewport,reducedMotion,initial:'Black at bottom left',afterBlack:'White at bottom left',afterWhite:'Black at bottom left',undo:true,reset:true,manualFlip:true};
 }finally{await context.close();await browser.close();}
}

(async()=>{
 const results=[];
 for(const [viewport,motion] of [[{width:390,height:844},'no-preference'],[{width:1280,height:900},'reduce']])results.push(await verify(viewport,motion));
 console.log(JSON.stringify({passed:true,results},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
