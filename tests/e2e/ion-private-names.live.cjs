const {chromium}=require('playwright'), assert=require('node:assert/strict'),fs=require('node:fs'),{randomUUID,randomBytes}=require('node:crypto');
(async()=>{
 const root=process.env.ION_TEST_ORIGIN||'https://ion.floot.app',checks=[],cleanup={};
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-gpu'],proxy:{server:process.env.HTTPS_PROXY||'http://proxy:8080'}});
 const context=await browser.newContext({viewport:{width:393,height:852}}),page=await context.newPage();
 const ok=s=>{checks.push(s);console.log('PASS',s);};
 try{
  const email='ion-names-qa-'+randomUUID()+'@example.invalid';
  const signup=await context.request.post(root+'/_api/auth/register_with_password',{data:{json:{email,password:randomBytes(24).toString('hex'),displayName:'Temporary names QA'}}});
  assert.equal(signup.status(),200);cleanup.userId=(await signup.json()).json.user.id;
  await page.goto(root+'/?cloud=private');const input=page.getByRole('textbox',{name:'Add a word or a picture name',exact:true});await input.waitFor();
  assert.equal(await input.getAttribute('maxlength'),null);
  const long=Array.from({length:160},(_,i)=>'thought'+i).join(' ');
  await input.fill(long);await page.reload();await input.waitFor();assert.equal(await input.inputValue(),long);
  ok('Private accepts more than 80 words and restores the complete draft after reload');
  const response=page.waitForResponse(r=>r.url().endsWith('/_api/cloud')&&r.request().postDataJSON().action==='add');
  await page.getByRole('button',{name:'Add',exact:true}).click();const save=await response;assert.equal(save.status(),200);
  const saved=await save.json(),node=saved.nodes.find(n=>n.name===long);assert.ok(node);cleanup.workspaceId=saved.workspaceId;cleanup.nodeId=node.id;
  await page.locator(`[data-node-id="${node.id}"]`).waitFor();
  assert.ok((await page.locator(`[data-node-id="${node.id}"]`).textContent()).length<161);
  const second=await browser.newContext({viewport:{width:390,height:844}});await second.addCookies(await context.cookies());const other=await second.newPage();
  await other.goto(root+'/?cloud=private');await other.locator(`[data-node-id="${node.id}"]`).waitFor();
  assert.equal(await other.locator(`[data-node-id="${node.id}"]`).getAttribute('aria-label'),long);await second.close();
  ok('The full private name is saved in the cloud and available in another device context');
  await page.locator(`[data-node-id="${node.id}"]`).click({button:'right'});await page.getByRole('menuitem',{name:'Edit',exact:true}).click();
  const edit=page.getByRole('textbox',{name:'Cloud name',exact:true});await edit.waitFor();assert.equal(await edit.getAttribute('maxlength'),null);
  const unbroken='A'.repeat(6000);await edit.fill(unbroken);
  const rename=page.waitForResponse(r=>r.url().endsWith('/_api/cloud')&&r.request().postDataJSON().action==='rename');
  await page.getByRole('button',{name:'Save',exact:true}).click();assert.equal((await rename).status(),200);
  await page.getByRole('dialog').waitFor({state:'hidden'});
  await page.locator(`[data-node-id="${node.id}"]`).click();await page.waitForURL('**cloud='+node.id+'&space=private');
  await page.locator('[data-reading-page]').waitFor();await page.waitForTimeout(500);
  assert.equal((await page.locator('h1').textContent()).length,6000);
  let complete='';for(let i=0;i<150;i++){
   const text=await page.locator('[data-reading-page]').textContent();complete+=text;
   assert.equal(await page.locator('[data-reading-page]').evaluate(el=>el.getBoundingClientRect().height<=el.parentElement.getBoundingClientRect().height+1),true);
   const next=page.getByRole('button',{name:'Next paragraph page',exact:true});if(await next.isDisabled())break;await next.click();
  }
  assert.equal(complete,unbroken);
  ok('Editing saves a 6,000-character name; fitted pages expose every character without scrolling');
  await page.waitForTimeout(250);await page.screenshot({path:'docs/screenshots/ion-private-long-name-phone.png'});
  await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});const violations=await page.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));
  assert.deepEqual(violations,[]);assert.equal(await page.evaluate(()=>scrollX+scrollY),0);ok('Long private names preserve accessibility and the no-scroll layout');
  await page.getByRole('link',{name:'Open Private',exact:true}).click();await input.waitFor();
  await page.locator(`[data-node-id="${node.id}"]`).click({button:'right'});await page.getByRole('menuitem',{name:'Delete',exact:true}).click();
  const dialog=page.getByRole('dialog');await dialog.waitFor();assert.ok((await dialog.textContent()).length<500);
  const box=await dialog.boundingBox();assert.ok(box.y>=0&&box.y+box.height<=852);
  await page.getByRole('button',{name:'Keep cloud',exact:true}).click();ok('Long-name confirmation stays compact and keeps all actions visible');
  const anonymous=await browser.newContext();const denied=await anonymous.request.post(root+'/_api/cloud',{data:{action:'load',scope:'private',workspaceId:cleanup.workspaceId,accessToken:'a'.repeat(64)}});assert.equal(denied.status(),401);await anonymous.close();
  ok('Removing the name restriction does not change Private authorization');
  fs.writeFileSync('docs/screenshots/ion-private-names-qa.json',JSON.stringify({date:new Date().toISOString(),checks,violations},null,2));
 }finally{fs.writeFileSync('/tmp/ion-private-names-cleanup.json',JSON.stringify(cleanup));await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
