// Runs headlessly against the sandbox API. No emails, credentials or user data are printed.
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
const base='https://9d7c0966-4648-49f3-845c-b4a9296d0358.sandbox.floot.app';
const credentials={workspaceId:randomUUID(),accessToken:randomBytes(32).toString('hex')};
let assertions=0;const check=(value,message)=>{assert.ok(value,message);assertions++;};
async function request(actor,path,data,superjson=false){await new Promise(r=>setTimeout(r,300));const r=await fetch(base+'/_api/'+path,{method:'POST',headers:{'Content-Type':'application/json',...(actor.cookie?{Cookie:actor.cookie}:{})},body:JSON.stringify(superjson?{json:data}:data)});for(const c of r.headers.getSetCookie()){const pair=c.split(';')[0],name=pair.split('=')[0];actor.cookies[name]=pair;actor.cookie=Object.values(actor.cookies).join('; ');}const raw=await r.json();return {status:r.status,data:superjson?raw.json:raw};}
const actor=()=>({cookies:{},cookie:''}),guest=actor(),a=actor(),b=actor();
const cloud=(who,scope,data={})=>request(who,'cloud',{...credentials,scope,action:'load',...data});
let publicIds=[];
try{
 for(const who of [a,b]){const r=await request(who,'auth/register_with_password',{email:'ion-scopes-qa-'+randomUUID()+'@example.invalid',displayName:'Temporary QA',password:randomBytes(24).toString('hex')},true);check(r.status===200,'QA registration');who.id=r.data.user.id;}
 if(typeof _floot!=='undefined'){
 const legacy=randomUUID(),leaf=randomUUID();
 await _floot.runSQLQuery({query:`WITH inserted AS (INSERT INTO ion_workspaces(id,access_token_hash,nodes,owner_id) VALUES ('${legacy}',repeat('0',64),'${JSON.stringify([{id:'boards',parentId:'hexagonal-chess',name:'Preserved legacy cloud'},{id:leaf,parentId:'boards',name:'Preserved child'}])}'::jsonb,${a.id}) RETURNING id) INSERT INTO ion_cloud_accounts(user_id,workspace_id) SELECT ${a.id},id FROM inserted`,reasonAndExplanationForNotReadOnly:'Create isolated legacy data under this temporary QA account to verify preservation during migration.'});
 const migrated=await cloud(a,'private');const parent=migrated.data.nodes.find(n=>n.name==='Preserved legacy cloud');check(parent&&parent.id!=='boards'&&migrated.data.nodes.find(n=>n.id===leaf)?.parentId===parent.id,'Legacy named clouds and their descendants remain private');
 }
 let r=await cloud(guest,'home');check(r.status===200&&r.data.nodes.length===3,'Home has exactly three entries');check(!r.data.canAdd,'Home is read-only');
 check((await cloud(guest,'private')).status===401,'Guest cannot read Private');
 r=await cloud(guest,'public');check(r.status===200&&!r.data.canAdd,'Public is readable without sign-in');
 check((await cloud(guest,'public',{action:'add',id:randomUUID(),parentId:'public',name:'Denied',version:r.data.version})).status===401,'Guest cannot post');
 check((await cloud(a,'chess',{action:'add',id:randomUUID(),parentId:'hexagonal-chess',name:'Denied',version:0})).status===403,'Nonowner cannot change chess');
 check((await cloud(a,'home',{action:'add',id:randomUUID(),parentId:null,name:'Denied',version:0})).status===403,'Home writes rejected');
 const id=randomUUID(),child=randomUUID(),secret='Private '+randomUUID();
 r=await cloud(a,'private');r=await cloud(a,'private',{action:'add',id,parentId:'private',name:secret,version:r.data.version});check(r.status===200,'Private add');
 r=await cloud(a,'private',{action:'add',id:child,parentId:id,name:'Nested child',version:r.data.version});check(r.status===200,'Nested private add');
 const aPrivate=r.data;
 check(!(await cloud(b,'private')).data.nodes.some(n=>n.id===id),'Other account cannot read private word');
 check(!(await cloud(guest,'public')).data.nodes.some(n=>n.id===id),'Private does not leak to public');
 const op=randomUUID(),target=(await cloud(a,'public')).data;
 let transfer={action:'transfer',id,targetScope:'public',targetParent:'public',targetVersion:target.version,operationId:op,mode:'copy',version:aPrivate.version};
 r=await cloud(a,'private',transfer);check(r.status===200,'Copy private to public');
 r=await cloud(a,'private',transfer);check(r.status===200,'Transfer retries are idempotent');
 let pub=(await cloud(guest,'public')).data;let copied=pub.nodes.filter(n=>n.id===op||n.parentId===op);publicIds.push(...copied.map(n=>n.id));check(copied.length===2&&copied[0].name===secret,'Entire copied branch is public');
 check((await cloud(a,'private')).data.nodes.some(n=>n.id===id),'Copy keeps private source');
 check((await cloud(b,'public',{action:'rename',id:op,name:'Stolen',version:pub.version})).status===403,'Other author cannot rename');
 const outsider=randomUUID();r=await cloud(b,'public',{action:'add',id:outsider,parentId:op,name:'Other author',version:pub.version});publicIds.push(outsider);check(r.status===200,'Public allows another author to add droplets');
 check((await cloud(a,'public',{action:'remove',id:op,expectedCount:2,operationId:randomUUID(),version:r.data.version})).status===403,'Cannot delete another author inside own branch');
 r=await cloud(b,'public',{action:'remove',id:outsider,expectedCount:0,operationId:randomUUID(),version:r.data.version});check(r.status===200,'Author can delete own droplet');
 const moveOp=randomUUID(),privateTarget=(await cloud(a,'private')).data;
 r=await cloud(a,'public',{action:'transfer',id:op,targetScope:'private',targetParent:'private',targetVersion:privateTarget.version,operationId:moveOp,mode:'move',version:r.data.version});check(r.status===200,'Move public branch to private');
 check(!(await cloud(guest,'public')).data.nodes.some(n=>n.id===op),'Move removes public source');
 check((await cloud(a,'private')).data.nodes.filter(n=>n.id===moveOp||n.parentId===moveOp).length===2,'Move keeps subtree in private');
 check(!(await cloud(b,'private')).data.nodes.some(n=>n.id===moveOp),'Moved content is private');
 const remember=await request(a,'auth/accounts',{action:'remember'});check(remember.status===200&&remember.data.accounts.some(x=>x.id===a.id),'Remember signed-in account');
 const device=a.cookies.ion_device;check(!!device,'Trusted device cookie issued');
 b.cookies.ion_device=device;b.cookie=Object.values(b.cookies).join('; ');
 r=await request(b,'auth/accounts',{action:'remember'});check(r.status===200&&r.data.accounts.length===2,'Two accounts remembered on same device');
 const stranger=actor();check((await request(stranger,'auth/accounts',{action:'switch',userId:a.id})).status===401,'Unrelated device cannot switch accounts');
 r=await request(b,'auth/accounts',{action:'switch',userId:a.id});check(r.status===200,'Switch to remembered account');check((await cloud(b,'private')).data.nodes.some(n=>n.id===id),'Switch changes private workspace');
 r=await request(b,'auth/accounts',{action:'forget',userId:a.id});check(r.status===200&&!r.data.accounts.some(x=>x.id===a.id),'Forget removes quick access');check((await request(b,'auth/accounts',{action:'switch',userId:a.id})).status===401,'Forgotten account cannot quick-switch');
 for(const level of [1,5]){r=await request(a,'game',{action:'new',variant:'glinski',mode:'engine',humanPlayer:1,difficulty:level},true);check(r.status===200&&r.data.difficulty===level,'Game persists selected difficulty '+level);const game=r.data;r=await request(a,'game',{action:'engine',gameId:game.gameId,accessToken:game.accessToken,version:game.version},true);check(r.status===200&&r.data.lastSearch.depth<=level&&r.data.moves.length===1,'Native search respects level '+level);}
 console.log(JSON.stringify({passed:true,assertions}));
}catch(error){console.log(JSON.stringify({passed:false,assertions,error:error.message}));throw error;}finally{console.log(JSON.stringify({qaPublicIds:publicIds,qaUserIds:[a.id,b.id].filter(Boolean)}));}
