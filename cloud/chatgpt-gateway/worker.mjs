// Discovery and fixed routing only. ION remains hosted on Floot/Postgres.
export const ISSUER='https://ion-chatgpt.9khv8m59km.workers.dev';
export const WEBSITE='https://ion.floot.app';
export default {
 async fetch(request){
  const url=new URL(request.url),headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
  const json=(value,status=200)=>Response.json(value,{status,headers});
  if(url.origin!==ISSUER)return json({error:'invalid_host'},404);
  if(request.method==='GET'&&['/.well-known/oauth-protected-resource','/.well-known/oauth-protected-resource/mcp'].includes(url.pathname))return json({resource:ISSUER+'/mcp',resource_name:'ION',authorization_servers:[ISSUER],scopes_supported:['ion.read','ion.write'],bearer_methods_supported:['header'],resource_documentation:WEBSITE+'/chatgpt'});
  if(request.method==='GET'&&['/.well-known/oauth-authorization-server','/.well-known/openid-configuration'].includes(url.pathname))return json({issuer:ISSUER,authorization_endpoint:ISSUER+'/authorize',token_endpoint:ISSUER+'/token',registration_endpoint:ISSUER+'/register',revocation_endpoint:ISSUER+'/revoke',response_types_supported:['code'],grant_types_supported:['authorization_code','refresh_token'],token_endpoint_auth_methods_supported:['none'],code_challenge_methods_supported:['S256'],authorization_response_iss_parameter_supported:true,scopes_supported:['ion.read','ion.write']});
  if(request.method==='GET'&&url.pathname==='/authorize'){if(url.search.length>16384)return json({error:'invalid_request'},400);return new Response(null,{status:302,headers:{...headers,Location:WEBSITE+'/chatgpt-connect'+url.search}});}
  if(request.method==='GET'&&url.pathname==='/')return new Response(null,{status:302,headers:{...headers,Location:WEBSITE+'/chatgpt'}});
  // Stateless Streamable HTTP: no idle SSE, sessions or DELETE endpoint.
  if(url.pathname==='/mcp'&&request.method==='GET')return new Response(null,{status:405,headers:{...headers,Allow:'POST'}});
  const routes={'/mcp':'chatgpt/mcp','/register':'chatgpt/register','/token':'chatgpt/token','/revoke':'chatgpt/revoke'};
  const target=routes[url.pathname];if(!target)return json({error:'not_found'},404);
  if(request.method!=='POST')return new Response(null,{status:405,headers:{...headers,Allow:'POST'}});
  // Never forward cookies, caller-selected hosts, redirects or arbitrary paths.
  if(Number(request.headers.get('content-length'))>131072)return json({error:'request_too_large'},413);
  const body=await request.arrayBuffer();if(body.byteLength>131072)return json({error:'request_too_large'},413);
  const forwarded=new Headers();for(const name of ['authorization','content-type','accept','mcp-protocol-version']){const value=request.headers.get(name);if(value)forwarded.set(name,value);}
  try{const response=await fetch(WEBSITE+'/_api/'+target,{method:'POST',headers:forwarded,body,redirect:'manual'});if(response.status>=300&&response.status<400)return json({error:'unexpected_upstream_redirect'},502);const result=new Headers(headers);for(const name of ['content-type','www-authenticate','retry-after']){const value=response.headers.get(name);if(value)result.set(name,value);}const challenge=response.headers.get('www-authenticate')||response.headers.get('x-amzn-remapped-www-authenticate');if(challenge)result.set('WWW-Authenticate',challenge);return new Response(response.body,{status:response.status,headers:result});}
  catch{return json({error:'temporarily_unavailable'},503);}
 }
};
