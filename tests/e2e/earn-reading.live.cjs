// Read-only public flow; no sign-ins, transfers, purchases or credits.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const context={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../cloud/floot/helpers/timePrinciples.tsx'),'utf8').replace('export const timePrinciples=','globalThis.principles='),context);const expected=context.principles.find(p=>p.id==='time-earning-rule').note.split(/\n\s*\n/).filter(Boolean);
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-gpu'],proxy:{server:process.env.HTTPS_PROXY}});try{for(const config of [{w:320,h:568,invert:false},{w:390,h:844,invert:true},{w:844,h:390,invert:false},{w:1280,h:900,invert:false}]){
const p=await b.newPage({viewport:{width:config.w,height:config.h},isMobile:config.w<900,hasTouch:config.w<900,reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));if(config.invert)await p.addInitScript(()=>localStorage.setItem('ion.appearance.inverted','true'));
await p.goto('https://ion.floot.app/?cloud=time-earning-rule&space=home');await p.getByRole('link',{name:'Earning',exact:true}).waitFor({timeout:45000});await p.waitForTimeout(350);
const bounds=await p.locator('main [data-node-id]').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return {name:n.getAttribute('aria-label'),x:r.x,right:r.right,top:r.top,bottom:r.bottom};}));assert.deepEqual(bounds.map(n=>n.name).sort(),['Earning','Prices','Spending']);for(const r of bounds){assert.ok(r.x>=0&&r.right<=config.w+1&&r.top>=0&&r.bottom<=config.h,'topic outside screen');}
const counts=[];
for(const [i,name] of ['Earning','Spending','Prices'].entries()){
 await p.getByRole('link',{name,exact:true}).click();await p.getByRole('heading',{name,exact:true}).waitFor();await p.locator('[data-reading-page]').waitFor();await p.waitForTimeout(120);assert.equal(await p.locator('[data-reading-page]').getAttribute('data-reading-page'),'0');const texts=[];
 for(let step=0;step<80;step++){
 const reading=p.locator('[data-reading-page]');texts.push(await reading.textContent());const fit=await reading.evaluate(e=>{const box=e.parentElement.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(e);return [...range.getClientRects()].every(r=>r.left>=box.left-1&&r.right<=box.right+1&&r.top>=box.top-1&&r.bottom<=box.bottom+1);});assert.ok(fit,'reading text clipped');
 const next=p.getByRole('button',{name:'Next paragraph page',exact:true});if(!await next.count()||await next.isDisabled())break;await next.click();
 }
 counts.push(texts.length);assert.equal(texts.join('').replace(/\s+/g,' ').trim(),expected[i].replace(/\s+/g,' ').trim());
 const content=await p.locator('[data-reading-page]').boundingBox(),back=await p.getByRole('link',{name:'Back',exact:true}).boundingBox();assert.ok(content.y+content.height<back.y,'reader overlaps Back');
 if(i===2)await p.screenshot({path:'/tmp/ion054-reading-'+config.w+'-'+config.h+'-'+config.invert+'.png',animations:'disabled'});
 await p.getByRole('link',{name:'Back',exact:true}).click();await p.getByRole('link',{name:'Earning',exact:true}).waitFor();
 }
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1||document.documentElement.scrollHeight>innerHeight+1),false);assert.deepEqual(errors,[]);console.log(JSON.stringify({...config,completeText:true,noClipping:true,noScroll:true,backClear:true,pages:counts}));await p.close();
}}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
