// Live integration test: creates isolated QA accounts/games and prints exact
// IDs for cleanup. It never deletes existing user data. Use ION_TEST_ORIGIN
// for a tokenized preview, or the default production origin.
const {chromium}=require('playwright');const assert=require('node:assert/strict');const {randomUUID,randomBytes}=require('node:crypto');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],...(process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY}}:{})});
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),page=await context.newPage();let surface=page;const fixture={users:[],gameIds:[],workspaceIds:[]},errors=[];
 page.on('pageerror',e=>{if(e.message!=='n')errors.push(e.message);});
 const link=name=>surface.getByRole('link',{name,exact:true});
 try{
 await page.goto(process.env.ION_TEST_ORIGIN||'https://ion.floot.app');
 for(let i=0;i<100;i++){const app=page.frames().find(f=>f.url().includes('.sandbox.floot.app')&&!f.url().includes('TestRunner'));if(app){surface=app;break;}await new Promise(r=>setTimeout(r,200));}
 await link('Hexagonal Chess').waitFor({timeout:30000});
 const password=randomBytes(24).toString('hex'),suffix=randomUUID().slice(0,8);
 const registration=await surface.evaluate(async({password,suffix})=>{const res=await fetch('/_api/auth/register_with_password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({json:{email:'ion-ui-'+suffix+'@example.invalid',password,displayName:'ION UI '+suffix}})});const data=await res.json();if(!res.ok)throw new Error(JSON.stringify(data));return data.json.user.id;},{password,suffix});fixture.users.push(registration);
 await surface.evaluate(()=>window.location.reload());await link('Hexagonal Chess').waitFor({timeout:30000});
 const created=await surface.evaluate(async()=>{
  const games=[],ids=[];const delay=()=>new Promise(r=>setTimeout(r,350));
  async function game(body){await delay();const r=await fetch('/_api/game',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({json:body})});const j=await r.json();if(!r.ok)throw new Error('game '+r.status+' '+JSON.stringify(j));return j.json;}
  for(const variant of ['glinski','mccooey','shafran']){let s=await game({action:'new',variant,mode:'two_players',humanPlayer:0});ids.push(s.gameId);s=await game({action:'move',gameId:s.gameId,accessToken:s.accessToken,version:s.version,move:(({from,to,promotion,pass})=>({from,to,promotion,pass}))(s.game.legalMoves[0])});games.push({id:s.gameId,variant});}
  const base={scope:'private',workspaceId:crypto.randomUUID(),accessToken:'0'.repeat(64)};
  async function cloud(body){await delay();const r=await fetch('/_api/cloud',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...base,...body})});const j=await r.json();if(!r.ok)throw new Error('cloud '+r.status+' '+j.error);return j;}
  let space=await cloud({action:'load'});const workspaceId=space.workspaceId,long=Array.from({length:17},(_,i)=>'Word'+(i+1)).join(' '),id=crypto.randomUUID();
  space=await cloud({action:'add',id,parentId:'private',name:long,version:space.version});
  space=await cloud({action:'add',id:crypto.randomUUID(),parentId:id,name:'Descendant 🫧',version:space.version});
  space=await cloud({action:'add',id:crypto.randomUUID(),parentId:'private',name:'A whole.address@example.com',version:space.version});
  return {games,ids,workspaceId,long,id};
 });fixture.gameIds.push(...created.ids);fixture.workspaceIds.push(created.workspaceId);
 await link('Private').click();const word=surface.locator('[data-node-id="'+created.id+'"]');await word.waitFor();
 const text=await word.locator('span').first().textContent();assert.deepEqual(text.split('\n').map(n=>n.split(' ').length),[8,8,1]);
 assert.equal(Number(await word.getAttribute('data-characters')),Array.from(created.long+'Descendant 🫧').length);
 assert.equal(await surface.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 const frame=await surface.locator('[data-camera-zoom]').getAttribute('data-camera-zoom');assert.ok(Number(frame)>0);
 await page.screenshot({path:'/tmp/ion-eight-word-phone.png'});
 await surface.getByRole('link',{name:'Open ION',exact:true}).click();await link('Controls').click();await surface.getByText('Hold a word or picture',{exact:true}).waitFor();
 await surface.getByRole('link',{name:'Open ION',exact:true}).click();await link('Hexagonal Chess').click();await link('Library').click();await link('History').click();
 const today=new Date();await link(String(today.getUTCFullYear())).click();await link(new Intl.DateTimeFormat('en',{month:'long',timeZone:'UTC'}).format(today)).click();await link(String(today.getUTCDate())).click();
 for(const game of created.games){const preview=surface.locator('[data-saved-preview="'+game.id+'"]');await preview.locator('svg[aria-label$="hexagonal chessboard"]').waitFor({timeout:30000});const fitting=await preview.evaluate(el=>{const svg=el.querySelector('svg[aria-label$="hexagonal chessboard"]'),frame=el.getBoundingClientRect(),r=svg.getBoundingClientRect();const vb=svg.viewBox.baseVal,m=svg.getScreenCTM(),p=svg.createSVGPoint();p.x=vb.x+vb.width;p.y=vb.y+vb.height;const corner=p.matrixTransform(m);return{svgFits:r.left>=frame.left-.5&&r.right<=frame.right+.5&&r.top>=frame.top-.5&&r.bottom<=frame.bottom+.5,viewBoxFits:corner.x<=frame.right+.5&&corner.y<=frame.bottom+.5};});assert.deepEqual(fitting,{svgFits:true,viewBoxFits:true});}
 await page.screenshot({path:'/tmp/ion-history-phone.png'});
 await link('Gliński’s Variant').click();await link('Share').waitFor();assert.equal(await surface.getByText('Share to nickname',{exact:true}).count(),0);await link('Share').click();await surface.getByRole('textbox',{name:'Recipient player name'}).waitFor();assert.equal(await surface.getByRole('textbox',{name:'Recipient nickname'}).count(),0);
 await page.keyboard.press('Escape');assert.deepEqual(errors,[]);
 console.log(JSON.stringify({passed:true,wrapping:'8/8/1',recursiveCharacters:true,savedPreviews:created.games.map(g=>g.variant),share:'Player name',errors}));
 }finally{console.log('QA_FIXTURES '+JSON.stringify(fixture));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
