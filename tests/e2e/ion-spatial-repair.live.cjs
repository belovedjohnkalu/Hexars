const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),{randomUUID,randomBytes}=require('node:crypto');
(async()=>{
 const root=process.env.ION_TEST_ORIGIN||'https://ion.floot.app',checks=[],cleanup={},credentials={workspaceId:randomUUID(),accessToken:randomBytes(32).toString('hex')};
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-gpu'],proxy:{server:process.env.HTTPS_PROXY||'http://proxy:8080'}}),context=await browser.newContext({viewport:{width:393,height:852}}),page=await context.newPage();
 const ok=s=>{checks.push(s);console.log('PASS',s);},cloud=async body=>{const response=await context.request.post(root+'/_api/cloud',{data:{...credentials,scope:'private',action:'load',...body}});assert.equal(response.status(),200);return response.json();};
 const camera=()=>page.locator('[data-camera-zoom]').evaluate(e=>e.style.transform);
 const positions=()=>page.locator('[data-node-id]').evaluateAll(els=>Object.fromEntries(els.map(e=>{const r=e.getBoundingClientRect();return [e.dataset.nodeId,{x:r.x+r.width/2,y:r.y+r.height/2}];})));
 try{
  for(const variant of ['glinski','mccooey','shafran']){
   await page.goto(root+'/?cloud='+variant+'-rules');await page.locator('[data-camera-zoom="1"]').waitFor();await page.locator('[role=group][aria-label=Droplets][aria-busy=false]').waitFor();await page.waitForFunction(()=>document.querySelector('[aria-label=Droplets]')?.style.visibility==='visible');await page.waitForTimeout(450);
   const stats=await page.locator('[data-camera-zoom]').evaluate(e=>{const region=e.parentElement.getBoundingClientRect(),els=[...e.querySelectorAll('[data-node-id]')],rects=els.map(n=>n.getBoundingClientRect());return {width:parseFloat(e.style.width),height:parseFloat(e.style.height),count:els.length,fullyVisible:rects.filter(r=>r.left>=region.left&&r.right<=region.right&&r.top>=region.top&&r.bottom<=region.bottom).length,fonts:els.map(n=>parseFloat(getComputedStyle(n).fontSize)),span:Math.max(...rects.map(r=>r.right))-Math.min(...rects.map(r=>r.left))};});
   assert.ok(stats.width>=760&&stats.height/stats.width<1.2&&stats.span>393);assert.ok(stats.fullyVisible>0&&stats.fullyVisible<stats.count);assert.ok(stats.fonts.every(f=>f>=17&&f<=30));
   const before=await camera();await page.getByRole('region',{name:'Word space'}).focus();await page.keyboard.press('ArrowRight');assert.notEqual(await camera(),before);assert.equal(await page.evaluate(()=>document.scrollingElement.scrollTop),0);
   if(variant==='shafran')await page.screenshot({path:'docs/screenshots/ion-rules-square-phone.png'});
  }
  ok('All three Rules clouds open readable in square worlds with off-screen content reachable by panning');
  for(const query of ['?cloud=boards','?cloud=boards&level=3']){
   await page.goto(root+'/'+query);await page.locator('[data-board-preview=shafran] > svg').waitFor();await page.locator('[role=group][aria-label=Droplets][aria-busy=false]').waitFor();
   for(const width of [320,393,1280]){
    await page.setViewportSize({width,height:852});await page.waitForTimeout(420);
    const boxes=await page.locator('[data-node-id=shafran-board]').evaluate(e=>{const frame=e.querySelector('[data-board-preview]'),svg=frame.querySelector(':scope > svg'),caption=e.querySelector(':scope > span:last-child'),f=frame.getBoundingClientRect(),s=svg.getBoundingClientRect(),c=caption.getBoundingClientRect();return {frame:{x:f.x,y:f.y,right:f.right,bottom:f.bottom},svg:{x:s.x,y:s.y,right:s.right,bottom:s.bottom},captionTop:c.top};});
    assert.ok(boxes.svg.x>=boxes.frame.x-.1&&boxes.svg.right<=boxes.frame.right+.1&&boxes.svg.y>=boxes.frame.y-.1&&boxes.svg.bottom<=boxes.frame.bottom+.1);assert.ok(boxes.captionTop>=boxes.frame.bottom+5);assert.ok(boxes.svg.x>=-.1&&boxes.svg.right<=width+.1);
   }
  }
  await page.setViewportSize({width:393,height:852});await page.waitForTimeout(600);await page.screenshot({path:'docs/screenshots/ion-shafran-preview-contained-phone.png'});ok('Shafran preview stays inside its frame above the caption in normal and Tactical board selection');
  await page.goto(root+'/?cloud=rules');await page.locator('[data-node-id=shafran-rules]').waitFor();assert.equal(await page.locator('[data-node-id=shafran-rules] svg').count(),0);ok('Rules variant choices remain words; diagrams appear inside their paragraphs');
  const signup=await context.request.post(root+'/_api/auth/register_with_password',{data:{json:{email:'ion-spatial-repair-qa-'+randomUUID()+'@example.invalid',password:randomBytes(24).toString('hex'),displayName:'Temporary spatial QA'}}});assert.equal(signup.status(),200);cleanup.userId=(await signup.json()).json.user.id;
  let space=await cloud({});cleanup.workspaceId=space.workspaceId;
  for(let i=0;i<14;i++)space=await cloud({action:'add',id:randomUUID(),parentId:'private',name:'Thought '+(i+1),version:space.version,color:'#aabbcc'});
  await page.goto(root+'/?cloud=private');await page.locator('[data-node-id]').first().waitFor();await page.waitForTimeout(500);
  const region=page.getByRole('region',{name:'Word space'});await region.focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('+');
  const target=await page.locator('[data-node-id]').evaluateAll(els=>{const v=document.querySelector('[role=region][aria-label="Word space"]').getBoundingClientRect();return els.find(e=>{const r=e.getBoundingClientRect();return r.left>v.left+5&&r.right<v.right-5&&r.top>v.top+5&&r.bottom<v.bottom-5;})?.dataset.nodeId;});assert.ok(target);
  await page.locator(`[data-node-id="${target}"]`).click({button:'right'});await page.getByRole('menuitem',{name:'Delete',exact:true}).click();await page.getByRole('dialog').waitFor();const before=await camera(),centers=await positions();
  await page.getByRole('button',{name:'Delete',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});await page.locator(`[data-node-id="${target}"]`).waitFor({state:'detached'});await page.waitForTimeout(450);
  assert.equal(await camera(),before);const after=await positions();for(const [id,center]of Object.entries(after)){assert.ok(Math.abs(center.x-centers[id].x)<1&&Math.abs(center.y-centers[id].y)<1,'Survivor moved: '+id);}
  assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('aria-label')),'Word space');assert.equal(await page.evaluate(()=>document.scrollingElement.scrollTop),0);ok('Deleting a cloud preserves its camera, zoom and every surviving word’s screen position');
  await page.getByRole('button',{name:'Undo deletion',exact:true}).click();await page.locator(`[data-node-id="${target}"]`).waitFor();assert.equal(await camera(),before);ok('Undo restores the deleted cloud without refitting the camera');
  // Explicit keyboard focus reveals the restored word before opening its menu.
  await page.locator(`[data-node-id="${target}"]`).focus();
  // Failure recovery must leave content and camera in place.
  await page.route('**/_api/cloud',async route=>{const b=route.request().postDataJSON();if(b.action==='remove')await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Temporary QA failure'})});else await route.continue();});
  await page.locator(`[data-node-id="${target}"]`).click({button:'right'});await page.getByRole('menuitem',{name:'Delete',exact:true}).click();const failedBefore=await camera();await page.getByRole('button',{name:'Delete',exact:true}).click();await page.getByRole('dialog').getByRole('alert').waitFor();assert.equal(await camera(),failedBefore);assert.equal(await page.locator(`[data-node-id="${target}"]`).count(),1);await page.getByRole('button',{name:'Keep cloud',exact:true}).click();await page.unroute('**/_api/cloud');ok('Failed deletion keeps the word, camera and recovery sheet intact');
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('[data-node-id]').first().evaluate(e=>getComputedStyle(e).transitionDuration),'0s');await page.screenshot({path:'docs/screenshots/ion-delete-position-phone.png'});
  await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});const violations=await page.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));assert.deepEqual(violations,[]);ok('Changed cloud flow passes automated accessibility and reduced-motion checks');
  fs.writeFileSync('docs/screenshots/ion-spatial-repair-qa.json',JSON.stringify({date:new Date().toISOString(),checks},null,2));
 }finally{fs.writeFileSync('/tmp/ion-spatial-repair-cleanup.json',JSON.stringify(cleanup));await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
