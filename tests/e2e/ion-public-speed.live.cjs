const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),{randomUUID,randomBytes}=require('node:crypto');
(async()=>{
 const root=process.env.ION_TEST_ORIGIN||'https://ion.floot.app',checks=[],cleanup={},timings={};
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-gpu'],proxy:{server:process.env.HTTPS_PROXY||'http://proxy:8080'}}),context=await browser.newContext({viewport:{width:393,height:852}}),page=await context.newPage();
 const ok=s=>{checks.push(s);console.log('PASS',s);};
 try{
  const signup=await context.request.post(root+'/_api/auth/register_with_password',{data:{json:{email:'ion-public-speed-qa-'+randomUUID()+'@example.invalid',password:randomBytes(24).toString('hex'),displayName:'Temporary public QA'}}});assert.equal(signup.status(),200);cleanup.userId=(await signup.json()).json.user.id;
  await page.goto(root+'/?cloud=public');await page.getByRole('slider',{name:'Word color'}).focus();await page.keyboard.press('End');
  const name='Public color QA '+randomUUID(),input=page.getByRole('textbox',{name:'Add a word or a picture name',exact:true});await input.fill(name);
  const response=page.waitForResponse(r=>r.url().endsWith('/_api/cloud')&&r.request().postDataJSON().action==='add');await page.getByRole('button',{name:'Add',exact:true}).click();const saved=await(await response).json(),node=saved.nodes.find(n=>n.name===name);cleanup.publicId=node.id;assert.match(node.color,/^#[0-9a-f]{6}$/);const rgb=color=>'rgb('+[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)).join(', ')+')';
  const second=await browser.newContext({viewport:{width:390,height:844}}),other=await second.newPage();await other.goto(root+'/?cloud=public');await other.locator(`[data-node-id="${node.id}"]`).waitFor();assert.equal(await other.locator(`[data-node-id="${node.id}"]`).evaluate(el=>getComputedStyle(el).color),rgb(node.color));
  ok('The Public color wheel saves a colored word visible from a signed-out device');
  await page.locator(`[data-node-id="${node.id}"]`).click({button:'right'});await page.getByRole('menuitem',{name:'Edit',exact:true}).click();await page.getByRole('dialog').getByRole('slider',{name:'Word color'}).focus();await page.keyboard.press('Home');const edited=(await page.getByRole('dialog').getByRole('slider').getAttribute('aria-valuetext')).toLowerCase();
  await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
  await other.waitForFunction(({id,color})=>getComputedStyle(document.querySelector(`[data-node-id="${id}"]`)).color===color,{id:node.id,color:rgb(edited)});
  ok('Permitted Public color edits update another device in real time');await second.close();
  await page.locator(`[data-node-id="${node.id}"]`).click();await page.getByRole('link',{name:'Open Public',exact:true}).click();await page.getByRole('link',{name:'Open ION',exact:true}).click();await page.waitForURL(root+'/');
  await page.locator('[data-node-id=hexagonal-chess]').click();await page.locator('[data-node-id=rules]').click();await page.getByRole('link',{name:'Open Hexagonal Chess',exact:true}).click();await page.getByRole('link',{name:'Open ION',exact:true}).click();await page.waitForURL(root+'/');
  ok('Home first returns to the owning space, then a second press opens ION');
  let game;page.on('response',async response=>{try{if(response.url().endsWith('/_api/game')&&response.request().postDataJSON().action==='new'&&response.ok()){const data=(await response.json()).json;cleanup.gameId=data.gameId;}}catch{}});
  await page.goto(root+'/shafran?mode=friend');await page.locator('[data-cell=e2][aria-disabled=false]').waitFor();
  await page.route('**/_api/game',async route=>{const body=route.request().postDataJSON().json;if(body.action==='move'){await new Promise(r=>setTimeout(r,1000));}await route.continue();});
  await page.locator('[data-cell=e2]').click();const clicked=performance.now();await page.locator('[data-cell=e5]').click();await page.locator('[data-pending-move=true]').waitFor();
  timings.clickToPreviewMs=Math.round(performance.now()-clicked);assert.ok(timings.clickToPreviewMs<400);assert.match(await page.locator('[data-cell=e5]').getAttribute('aria-label'),/White pawn/);assert.equal(await page.locator('[data-ply]').getAttribute('data-ply'),'0');
  ok('A legal piece moves immediately while its slow cloud save is still pending');
  await page.locator('[data-ply="1"]').waitFor();const confirmed=performance.now();await page.locator('[data-cell=e9][aria-disabled=false]').waitFor();timings.confirmedToReadyMs=Math.round(performance.now()-confirmed);assert.ok(timings.confirmedToReadyMs<900);
  ok('Confirmed pass-and-play turns unlock after the shorter smooth rotation');
  await page.unroute('**/_api/game');await page.route('**/_api/game',async route=>{const body=route.request().postDataJSON().json;if(body.action==='move'){await new Promise(r=>setTimeout(r,500));await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({json:{error:'Temporary QA failure'}})});}else await route.continue();});
  await page.locator('[data-cell=e9]').click();await page.locator('[data-cell=e6]').click();await page.locator('[data-pending-move=true]').waitFor();await page.getByRole('alert').waitFor();
  assert.match(await page.locator('[data-cell=e9]').getAttribute('aria-label'),/Black pawn/);assert.match(await page.locator('[data-cell=e6]').getAttribute('aria-label'),/Empty cell/);assert.equal(await page.locator('[data-ply]').getAttribute('data-ply'),'1');
  await page.unroute('**/_api/game');await page.getByRole('button',{name:'Retry',exact:true}).click();await page.locator('[data-cell=e9][aria-disabled=false]').waitFor();
  ok('A failed save rolls back the preview, preserves the real position and recovers with Retry');
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('[data-piece]').first().evaluate(el=>getComputedStyle(el).transitionDuration),'0s');ok('Immediate movement still respects reduced motion');
  await page.screenshot({path:'docs/screenshots/ion-move-latency-phone.png'});
  fs.writeFileSync('docs/screenshots/ion-public-speed-qa.json',JSON.stringify({date:new Date().toISOString(),checks,timings},null,2));console.log('TIMINGS',JSON.stringify(timings));
 }finally{fs.writeFileSync('/tmp/ion-public-speed-cleanup.json',JSON.stringify(cleanup));await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
