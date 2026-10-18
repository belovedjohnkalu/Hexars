const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),{randomUUID,randomBytes}=require('node:crypto');
(async()=>{
 const root=process.env.ION_TEST_ORIGIN||'https://ion.floot.app',checks=[],cleanup={publicIds:[]};
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-gpu'],proxy:{server:process.env.HTTPS_PROXY||'http://proxy:8080'}});
 const context=await browser.newContext({viewport:{width:393,height:852}}),page=await context.newPage();
 const ok=s=>{checks.push(s);console.log('PASS',s);},email='ion-gradient-qa-'+randomUUID()+'@example.invalid',password=randomBytes(24).toString('hex');
 const credentials={workspaceId:randomUUID(),accessToken:randomBytes(32).toString('hex')};
 const cloud=async(scope,body={},client=context)=>{const response=await client.request.post(root+'/_api/cloud',{data:{...credentials,scope,action:'load',...body}});return {status:response.status(),value:await response.json()};};
 const rgb=color=>{const h=color.replace('#','');return 'rgb('+[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)).join(', ')+')';};
 try{
  const signup=await context.request.post(root+'/_api/auth/register_with_password',{data:{json:{email,password,displayName:'Temporary gradient QA'}}});assert.equal(signup.status(),200);cleanup.userId=(await signup.json()).json.user.id;
  await page.goto(root+'/?cloud=private');const slider=page.getByRole('slider',{name:'Word color'});await slider.waitFor();
  assert.equal(await page.getByRole('radio').count(),0);assert.equal(await page.locator('[data-color-wheel]').evaluate(e=>e.getBoundingClientRect().height),44);
  await slider.focus();const original=await slider.getAttribute('aria-valuetext');await page.keyboard.press('ArrowRight');await page.waitForFunction(old=>document.querySelector('[role=slider]')?.getAttribute('aria-valuetext')!==old,original);
  assert.match(await slider.getAttribute('aria-valuetext'),/^#[0-9A-F]{6}$/);ok('Compact gradient has keyboard selection and no preset swatches');
  const input=page.getByRole('textbox',{name:'Add a word or a picture name',exact:true}),name='Gradient '+randomUUID();await input.fill(name);
  let response=page.waitForResponse(r=>r.url().endsWith('/_api/cloud')&&r.request().postDataJSON().action==='add');await page.getByRole('button',{name:'Add',exact:true}).click();const saved=await(await response).json(),privateNode=saved.nodes.find(n=>n.name===name);cleanup.workspaceId=saved.workspaceId;
  assert.match(privateNode.color,/^#[0-9a-f]{6}$/);await page.locator(`[data-node-id="${privateNode.id}"]`).waitFor();
  const second=await browser.newContext({viewport:{width:390,height:844}});const login=await second.request.post(root+'/_api/auth/login_with_password',{data:{json:{email,password}}});assert.equal(login.status(),200);const other=await second.newPage();await other.goto(root+'/?cloud=private');await other.locator(`[data-node-id="${privateNode.id}"]`).waitFor();assert.equal(await other.locator(`[data-node-id="${privateNode.id}"]`).evaluate(e=>getComputedStyle(e).color),rgb(privateNode.color));
  ok('Private gradient color is saved and restored on another signed-in device');
  // A stale, concurrent selection is rejected, then allocated against latest siblings.
  const before=await cloud('private'),ids=[randomUUID(),randomUUID()];
  const adds=await Promise.all(ids.map((id,i)=>cloud('private',{action:'add',id,parentId:'private',name:'Concurrent '+i,color:'#aabbcc',version:before.value.version})));
  assert.deepEqual(adds.map(r=>r.status).sort(),[200,409]);let current=await cloud('private');const failed=adds.findIndex(r=>r.status===409);const retried=await cloud('private',{action:'add',id:ids[failed],parentId:'private',name:'Concurrent '+failed,color:'#aabbcc',version:current.value.version});assert.equal(retried.status,200);
  const pair=retried.value.nodes.filter(n=>ids.includes(n.id));assert.equal(pair.length,2);assert.notEqual(pair[0].color,pair[1].color);ok('Two concurrent choices of one color become distinct after safe retry');
  await page.goto(root+'/?cloud=public');await slider.waitFor();await slider.focus();await page.keyboard.press('End');await input.fill('Public gradient '+randomUUID());
  response=page.waitForResponse(r=>r.url().endsWith('/_api/cloud')&&r.request().postDataJSON().action==='add');await page.getByRole('button',{name:'Add',exact:true}).click();const publicSaved=await(await response).json(),publicNode=publicSaved.nodes.find(n=>n.createdBy===cleanup.userId)||publicSaved.nodes.find(n=>n.name.startsWith('Public gradient '));assert.ok(publicNode);cleanup.publicIds.push(publicNode.id);assert.match(publicNode.color,/^#[0-9a-f]{6}$/);
  const guest=await browser.newContext({viewport:{width:390,height:844}}),reader=await guest.newPage();await reader.goto(root+'/?cloud=public');await reader.locator(`[data-node-id="${publicNode.id}"]`).waitFor();assert.equal(await reader.locator(`[data-node-id="${publicNode.id}"]`).evaluate(e=>getComputedStyle(e).color),rgb(publicNode.color));
  await page.screenshot({path:'docs/screenshots/ion-gradient-public-phone.png'});
  await page.locator(`[data-node-id="${publicNode.id}"]`).click({button:'right'});await page.getByRole('menuitem',{name:'Edit',exact:true}).click();const edit=page.getByRole('dialog').getByRole('slider',{name:'Word color'});await edit.focus();await page.keyboard.press('Home');const editedHex=(await edit.getAttribute('aria-valuetext')).toLowerCase();assert.match(editedHex,/^#[0-9a-f]{6}$/);
  await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});await reader.waitForFunction(({id,color})=>getComputedStyle(document.querySelector(`[data-node-id="${id}"]`)).color===color,{id:publicNode.id,color:rgb(editedHex)});
  ok('Public gradient edits appear on another device in real time');
  await page.goto(root+'/?cloud=hexagonal-chess');await page.locator('[data-node-id=boards]').waitFor();assert.equal(await page.getByRole('slider').count(),0);
  let chess=await cloud('chess');assert.equal(chess.value.canAdd,false);const forbidden=await cloud('chess',{action:'add',id:randomUUID(),parentId:'hexagonal-chess',name:'Forbidden QA',color:'#aabbcc',version:chess.value.version});assert.equal(forbidden.status,403);await reader.goto(root+'/?cloud=hexagonal-chess');await reader.locator('[data-node-id=boards]').waitFor();assert.equal(await reader.getByRole('slider').count(),0);
  ok('Real server denies Chess color writes by non-owners and hides their picker');
  // Owner UI fixture only: no production owner login or Chess mutation.
  const owner=await browser.newContext({viewport:{width:393,height:852}}),admin=await owner.newPage();let ownerEdit;
  const ownerView={...chess.value,userId:900001,owner:true,canAdd:true,canManage:true,nodes:chess.value.nodes.map(n=>({...n,canEdit:n.id!=='hexagonal-chess',canCopy:n.id!=='hexagonal-chess'}))};
  await admin.route('**/_api/auth/session',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({json:{user:{id:900001,email:'fixture@example.invalid',displayName:'Owner fixture',role:'admin',avatarUrl:null}}})}));
  await admin.route('**/_api/cloud',route=>{const b=route.request().postDataJSON();if(b.action==='rename'){ownerEdit=b;ownerView.nodes=ownerView.nodes.map(n=>n.id===b.id?{...n,name:b.name,color:b.color}:n);ownerView.version++;}return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(ownerView)});});
  await admin.goto(root+'/?cloud=hexagonal-chess');await admin.getByRole('slider',{name:'Word color'}).waitFor();await admin.screenshot({path:'docs/screenshots/ion-gradient-chess-owner-fixture.png'});
  await admin.locator('[data-node-id=engines]').click({button:'right'});await admin.getByRole('menuitem',{name:'Edit',exact:true}).click();await admin.getByRole('dialog').getByRole('slider').focus();await admin.keyboard.press('ArrowRight');await admin.getByRole('button',{name:'Save',exact:true}).click();await admin.getByRole('dialog').waitFor({state:'hidden'});assert.equal(ownerEdit.scope,'chess');assert.match(ownerEdit.color,/^#[0-9a-f]{6}$/);
  ok('Owner UI fixture includes gradient creation and Chess color editing');
  for(const size of [{width:320,height:568},{width:1280,height:800}]){await admin.setViewportSize(size);assert.equal(await admin.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight),true);const bounds=await admin.locator('[data-color-wheel]').boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=size.width&&bounds.y+bounds.height<=size.height);}
  await admin.emulateMedia({reducedMotion:'reduce'});assert.equal(await admin.getByRole('slider').evaluate(e=>getComputedStyle(e).transitionDuration),'0s');ok('Gradient fits narrow and desktop screens without page scrolling');
  await second.close();await guest.close();await owner.close();
  fs.writeFileSync('docs/screenshots/ion-gradient-qa.json',JSON.stringify({date:new Date().toISOString(),checks,ownerTest:'UI response fixture; real non-owner denial and pure owner policy tested separately'},null,2));
 }finally{fs.writeFileSync('/tmp/ion-gradient-cleanup.json',JSON.stringify(cleanup));await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
