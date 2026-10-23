import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker,{ISSUER,WEBSITE} from './worker.mjs';
test('OAuth discovery advertises the exact resource, S256 and public-client registration',async()=>{
 const resource=await (await worker.fetch(new Request(ISSUER+'/.well-known/oauth-protected-resource/mcp'))).json();assert.equal(resource.resource,ISSUER+'/mcp');assert.deepEqual(resource.authorization_servers,[ISSUER]);
 const auth=await (await worker.fetch(new Request(ISSUER+'/.well-known/oauth-authorization-server'))).json();assert.equal(auth.issuer,ISSUER);assert.deepEqual(auth.code_challenge_methods_supported,['S256']);assert.equal(auth.authorization_response_iss_parameter_supported,true);assert.equal(auth.token_endpoint,ISSUER+'/token');
});
test('authorization redirects only to the fixed ION consent page and keeps OAuth state',async()=>{const r=await worker.fetch(new Request(ISSUER+'/authorize?state=original&resource='+encodeURIComponent(ISSUER+'/mcp')));assert.equal(r.status,302);const location=new URL(r.headers.get('location'));assert.equal(location.origin,WEBSITE);assert.equal(location.pathname,'/chatgpt-connect');assert.equal(location.searchParams.get('state'),'original');assert.equal(r.headers.get('referrer-policy'),'no-referrer');});
test('unknown routes, foreign hosts and unsupported methods cannot proxy anything',async()=>{assert.equal((await worker.fetch(new Request('https://attacker.invalid/mcp'))).status,404);assert.equal((await worker.fetch(new Request(ISSUER+'/anything'))).status,404);assert.equal((await worker.fetch(new Request(ISSUER+'/mcp'))).status,405);assert.equal((await worker.fetch(new Request(ISSUER+'/token',{method:'DELETE'}))).status,405);});
test('only allowlisted headers and fixed endpoints reach Floot; no cookies or redirects escape',async()=>{
 const previous=globalThis.fetch;let captured;
 globalThis.fetch=async(url,init)=>{captured={url,init};return new Response('{"ok":true}',{headers:{'Content-Type':'application/json','Set-Cookie':'sensitive=1','X-Amzn-Remapped-Www-Authenticate':'Bearer test'}});};
 try{const r=await worker.fetch(new Request(ISSUER+'/mcp?target=https://attacker.invalid',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer fixture',Cookie:'account=secret','X-Forwarded-Host':'attacker.invalid'},body:'{}'}));assert.equal(captured.url,WEBSITE+'/_api/chatgpt/mcp');assert.equal(captured.init.headers.get('authorization'),'Bearer fixture');assert.equal(captured.init.headers.has('cookie'),false);assert.equal(captured.init.headers.has('x-forwarded-host'),false);assert.equal(captured.init.redirect,'manual');assert.equal(r.headers.has('set-cookie'),false);assert.equal(r.headers.get('www-authenticate'),'Bearer test');assert.equal(r.headers.get('cache-control'),'no-store');}
 finally{globalThis.fetch=previous;}
});
test('oversized requests fail before forwarding',async()=>{const r=await worker.fetch(new Request(ISSUER+'/token',{method:'POST',body:'x'.repeat(131073)}));assert.equal(r.status,413);});
