const {chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
 const qa=JSON.parse(fs.readFileSync(process.env.ION_QA_FILE||'/tmp/ion059-qa.json')),fixtures=JSON.parse(fs.readFileSync(process.env.ION_CHECKERS_FIXTURES||'/tmp/ion059-capture.json'));
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-gpu'],proxy:{server:process.env.HTTPS_PROXY}}),reports=[];
 try{
 for(const width of [390,320,1280]){const mobile=width<600;
 const context=await browser.newContext({viewport:mobile?{width,height:844}:{width,height:900},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
 const [name,value]=qa[0].cookie.split('=');await context.addCookies([{name,value,domain:'ion.floot.app',path:'/',secure:true,httpOnly:true}]);
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('https://ion.floot.app/?cloud=e28bff47-f4b4-45f3-abef-8c8d2e63cd4e&space=chess');
 await page.locator('[data-node-id="hexdame-board"]').waitFor({timeout:45000});await page.locator('[data-board-preview="kruzno"]').waitFor();
 const roots=await page.locator('[data-node-id]').evaluateAll(ns=>ns.map(n=>({id:n.dataset.nodeId,rect:n.getBoundingClientRect().toJSON()})));
 assert.equal(roots.length,2);for(const n of roots){assert.ok(n.rect.x>=0&&n.rect.right<= width);}
 await page.screenshot({path:'/tmp/ion059-root-'+String(width)+'.png'});
 for(const variant of ['hexdame','kruzno']){
  const f=fixtures.find(f=>f.variant===variant);const hash=mobile?'#game='+f.gameId+'&key='+f.accessToken:'';
  await page.goto('https://ion.floot.app/'+variant+'?mode=friend'+hash);await page.locator('[data-game-id]').waitFor({timeout:45000});await page.locator('[data-ply="0"]').waitFor();
  const actions=await page.locator('[role=status] button').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().toJSON()));for(const r of actions)assert.ok(r.x>=0&&r.right<=width,'Status actions fit '+width);
  assert.equal(await page.locator('[data-hitbox="full-cell"]').count(),variant==='hexdame'?61:91);
  assert.equal(await page.locator('[data-border="true"]').count(),variant==='hexdame'?0:30);
  await page.screenshot({path:'/tmp/ion059-'+variant+'-'+String(width)+'.png'});
  if(mobile){
   const route=variant==='hexdame'?['e5','g5','e7','e5']:['f6','f8','h8'];
   await page.locator('[data-cell="'+route[0]+'"]').click();assert.ok(await page.locator('[data-indicator="capture"]').count()>0);
   await page.locator('[data-cell="'+route[0]+'"]').click();assert.equal(await page.locator('[data-indicator="selected"]').count(),0);
   await page.locator('[data-cell="'+route[0]+'"]').click();
   for(let i=1;i<route.length;i++){await page.locator('[data-cell="'+route[i]+'"]:has([data-indicator="capture"])').click();if(i<route.length-1){assert.equal(await page.locator('[data-ply]').getAttribute('data-ply'),'0');await page.getByRole('status').filter({hasText:'Continue capture'}).waitFor();}}
   await page.getByRole('heading',{name:'White Wins',exact:true}).waitFor({timeout:30000});assert.equal(await page.locator('[data-ply]').getAttribute('data-ply'),'1');
   await page.getByRole('button',{name:'View board',exact:true}).click();await page.getByRole('button',{name:/^Undo/}).click();await page.locator('[data-ply="0"]').waitFor();
   await page.reload();await page.locator('[data-game-id="'+f.gameId+'"]').waitFor({timeout:30000});await page.locator('[data-ply="0"]').waitFor();
  }
  reports.push({mobile,variant,cells:variant==='hexdame'?61:91,capture:mobile,undo:mobile,persistence:mobile});
 }
 await page.goto('https://ion.floot.app/?cloud=hexdame-rule-3&space=chess&return=hexdame');await page.getByRole('heading',{name:'Kings',exact:true}).waitFor({timeout:30000});await page.locator('[data-piece-shape="draughts-king"]').waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight),false);
 assert.equal(errors.length,0,errors.join('\n'));await context.close();
 }
 console.log(JSON.stringify({passed:true,reports,consoleErrors:0}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
