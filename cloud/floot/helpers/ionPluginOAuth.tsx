import { createHash,randomBytes,timingSafeEqual } from 'node:crypto';
import { sql } from 'kysely';
import { db } from './db';
import { ionPluginConfig as config } from './ionPluginConfig';
import { getServerUserSession } from './getServerUserSession';
import type { Json } from './schema';
import { NotAuthenticatedError } from './getSetServerSession';
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
const secret=()=>randomBytes(32).toString('base64url');
export class PluginError extends Error{constructor(readonly code:string,message:string,readonly status=400){super(message);}}
function fail(code:string,message:string,status=400):never{throw new PluginError(code,message,status);}
const safe=(a:string,b:string)=>a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
export function pluginRedirect(value:string){
 try{const u=new URL(value);if(u.username||u.password||u.hash)return false;
  if(u.origin==='https://chatgpt.com')return u.pathname==='/connector_platform_oauth_redirect'||/^\/connector\/oauth\/[a-zA-Z0-9_-]+$/.test(u.pathname);
  return u.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(u.hostname)&&['/callback','/auth/callback'].includes(u.pathname);
 }catch{return false;}
}
export function pluginScope(value:string){const scopes=[...new Set(value.split(' ').filter(Boolean))];if(!scopes.length||scopes.some(s=>!config.scopes.includes(s)))fail('invalid_scope','Choose ION read or write access.');return scopes.join(' ');}
export function pluginResource(value:string|null){if(value!==config.resource)fail('invalid_target','Use the ION MCP resource URL.');return config.resource;}
export async function pluginAuthorization(params:URLSearchParams){
 const clientId=params.get('client_id')||'',redirect=params.get('redirect_uri')||'',challenge=params.get('code_challenge')||'',state=params.get('state')||'';
 if(params.get('response_type')!=='code'||params.get('code_challenge_method')!=='S256'||!/^[-_a-zA-Z0-9]{43}$/.test(challenge)||state.length>4096)fail('invalid_request','This connection link is invalid. Start again from ChatGPT.');
 const client=await db.selectFrom('ionPluginClients').selectAll().where('id','=',clientId).executeTakeFirst();
 if(!client||!pluginRedirect(redirect)||!Array.isArray(client.redirectUris)||!client.redirectUris.includes(redirect))fail('invalid_client','This connection link is invalid. Start again from ChatGPT.');
 return{clientId,redirect,challenge,state,clientName:client.name,scope:pluginScope(params.get('scope')||config.scopes.join(' ')),resource:pluginResource(params.get('resource'))};
}
export async function pluginConsent(request:Request){
 // JSON and a same-origin browser Origin protect the explicit account consent.
 if(!['https://ion.floot.app','https://iontech.info','https://www.iontech.info'].includes(request.headers.get('origin')||''))fail('invalid_request','Open this connection from ION.',403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))fail('invalid_request','Use JSON.');
 const {user}=await getServerUserSession(request);const body=await request.json();
 if(body.action==='disconnect'){await db.updateTable('ionPluginTokens').set({revokedAt:new Date()}).where('userId','=',user.id).where('revokedAt','is',null).execute();return{disconnected:true};}
 if(typeof body.query!=='string'||body.query.length>16384||!['allow','deny'].includes(body.decision))fail('invalid_request','Choose Connect or Cancel.');
 const auth=await pluginAuthorization(new URLSearchParams(body.query)),redirect=new URL(auth.redirect);redirect.searchParams.set('iss',config.issuer);if(auth.state)redirect.searchParams.set('state',auth.state);
 if(body.decision==='deny'){redirect.searchParams.set('error','access_denied');return{redirect:redirect.href};}
 const code=secret();await db.insertInto('ionPluginCodes').values({hash:hash(code),clientId:auth.clientId,userId:user.id,redirectUri:auth.redirect,challenge:auth.challenge,scope:auth.scope,resource:auth.resource,expiresAt:new Date(Date.now()+5*60_000),consumedAt:null}).execute();
 redirect.searchParams.set('code',code);return{redirect:redirect.href};
}
async function issue(tx:typeof db,grant:{clientId:string;userId:number;scope:string;resource:string}){
 const access=secret(),refresh=secret();await tx.insertInto('ionPluginTokens').values({...grant,hash:hash(access),refreshHash:hash(refresh),expiresAt:new Date(Date.now()+3600_000),refreshExpiresAt:new Date(Date.now()+30*86400_000),revokedAt:null}).execute();
 return{access_token:access,token_type:'Bearer',expires_in:3600,refresh_token:refresh,scope:grant.scope};
}
export async function pluginRegister(request:Request){
 const body=await request.json();const redirects=body.redirect_uris;
 if(!Array.isArray(redirects)||!redirects.length||redirects.length>5||redirects.some((r:unknown)=>typeof r!=='string'||r.length>2048||!pluginRedirect(r)))fail('invalid_redirect_uri','Use a ChatGPT or loopback OAuth callback.');
 if(body.token_endpoint_auth_method&&body.token_endpoint_auth_method!=='none')fail('invalid_client_metadata','Use a public PKCE client.');
 if(body.grant_types&&(!Array.isArray(body.grant_types)||body.grant_types.some((g:unknown)=>!['authorization_code','refresh_token'].includes(String(g)))))fail('invalid_client_metadata','Unsupported grant type.');
 if(body.response_types&&(!Array.isArray(body.response_types)||body.response_types.some((g:unknown)=>g!=='code')))fail('invalid_client_metadata','Use code responses.');
 const name=typeof body.client_name==='string'?body.client_name.trim().slice(0,100)||'ION connection':'ION connection',clientId='ion_'+secret();
 await db.transaction().execute(async tx=>{await sql`SELECT pg_advisory_xact_lock(74209,11047)`.execute(tx);const count=await tx.selectFrom('ionPluginClients').select(sql<number>`count(*)::int`.as('total')).where('createdAt','>',new Date(Date.now()-3600_000)).executeTakeFirstOrThrow();if(count.total>=500)fail('temporarily_unavailable','Try again later.',429);await tx.insertInto('ionPluginClients').values({id:clientId,name,redirectUris:redirects as Json}).execute();});
 return{client_id:clientId,client_id_issued_at:Math.floor(Date.now()/1000),client_name:name,redirect_uris:redirects,token_endpoint_auth_method:'none',grant_types:['authorization_code','refresh_token'],response_types:['code']};
}
export async function pluginToken(request:Request){
 if(!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded'))fail('invalid_request','Use form encoding.');
 const form=new URLSearchParams(await request.text()),clientId=form.get('client_id')||'';pluginResource(form.get('resource'));
 const client=await db.selectFrom('ionPluginClients').select('id').where('id','=',clientId).executeTakeFirst();if(!client)fail('invalid_client','Unknown client.');
 return db.transaction().execute(async tx=>{
  if(form.get('grant_type')==='authorization_code'){
   const code=form.get('code')||'',verifier=form.get('code_verifier')||'';if(!/^[A-Za-z0-9._~-]{43,128}$/.test(verifier)||code.length>128)fail('invalid_grant','Start a new connection.');
   const row=await tx.selectFrom('ionPluginCodes').selectAll().where('hash','=',hash(code)).forUpdate().executeTakeFirst();
   const challenge=createHash('sha256').update(verifier).digest('base64url');
   if(!row||row.clientId!==clientId||row.redirectUri!==form.get('redirect_uri')||row.resource!==config.resource||row.consumedAt||new Date(row.expiresAt).getTime()<=Date.now()||!safe(row.challenge,challenge))fail('invalid_grant','Start a new connection.');
   await tx.updateTable('ionPluginCodes').set({consumedAt:new Date()}).where('hash','=',row.hash).execute();return issue(tx,{clientId,userId:row.userId,scope:row.scope,resource:row.resource});
  }
  if(form.get('grant_type')==='refresh_token'){
   const refresh=form.get('refresh_token')||'';if(refresh.length>128)fail('invalid_grant','Reconnect ION.');
   const row=await tx.selectFrom('ionPluginTokens').selectAll().where('refreshHash','=',hash(refresh)).forUpdate().executeTakeFirst();
   if(!row||row.clientId!==clientId||row.resource!==config.resource||row.revokedAt||new Date(row.refreshExpiresAt).getTime()<=Date.now())fail('invalid_grant','Reconnect ION.');
   if(form.has('scope')&&form.get('scope')!==row.scope)fail('invalid_scope','Reconnect to change access.');
   await tx.updateTable('ionPluginTokens').set({revokedAt:new Date()}).where('hash','=',row.hash).execute();return issue(tx,{clientId,userId:row.userId,scope:row.scope,resource:row.resource});
  }
  return fail('unsupported_grant_type','Use authorization_code or refresh_token.');
 });
}
export async function pluginBearer(request:Request,scope?:string){
 const match=/^Bearer ([-_a-zA-Z0-9]{43})$/i.exec(request.headers.get('authorization')||'');if(!match)fail('invalid_token','Connect your ION account.',401);
 const row=await db.selectFrom('ionPluginTokens').selectAll().where('hash','=',hash(match![1])).executeTakeFirst();
 if(!row||row.revokedAt||row.resource!==config.resource||new Date(row.expiresAt).getTime()<=Date.now())fail('invalid_token','Reconnect your ION account.',401);
 if(scope&&!row.scope.split(' ').includes(scope))fail('insufficient_scope','Reconnect ION with the requested access.',403);
 return row!;
}
export async function pluginRevoke(request:Request){
 const form=new URLSearchParams(await request.text()),token=form.get('token')||'',clientId=form.get('client_id')||'';if(token.length>256)return{};
 await db.updateTable('ionPluginTokens').set({revokedAt:new Date()}).where('clientId','=',clientId).where(eb=>eb.or([eb('hash','=',hash(token)),eb('refreshHash','=',hash(token))])).execute();return{};
}
export function pluginError(error:unknown){
 const known=error instanceof PluginError,unauth=error instanceof NotAuthenticatedError;
 return Response.json({error:known?error.code:unauth?'login_required':'server_error',error_description:known?error.message:unauth?'Sign in to ION.':'Couldn’t connect. Try again.'},{status:known?error.status:unauth?401:503,headers:{'Cache-Control':'no-store',...(known&&[401,403].includes(error.status)?{'WWW-Authenticate':`Bearer resource_metadata="${config.issuer}/.well-known/oauth-protected-resource", error="${error.code}"`}:{})}});
}
export const ionPluginOAuth={authorization:pluginAuthorization,consent:pluginConsent,register:pluginRegister,token:pluginToken,bearer:pluginBearer,revoke:pluginRevoke};
