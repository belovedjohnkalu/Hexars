// Run on the Floot VM, where the official MCP SDK is installed.
// No account, token, journal entry, estimate or Time transaction is created.
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
const BASE='https://ion-chatgpt.9khv8m59km.workers.dev',WEBSITE='https://ion.floot.app';
function assert(value,message){if(!value)throw new Error(message);}
let clientInfo,verifier,authorization;
const provider={
 get redirectUrl(){return 'https://chatgpt.com/connector_platform_oauth_redirect';},
 get clientMetadata(){return{client_name:'ION release verification',redirect_uris:[this.redirectUrl],grant_types:['authorization_code','refresh_token'],response_types:['code'],token_endpoint_auth_method:'none',scope:'ion.read ion.write'};},
 clientInformation(){return clientInfo;},saveClientInformation(value){clientInfo=value;},tokens(){return undefined;},saveTokens(){throw new Error('No account login is used by this probe.');},saveCodeVerifier(value){verifier=value;},codeVerifier(){return verifier;},redirectToAuthorization(url){authorization=url;},state(){return 'release-verification';},invalidateCredentials(){},
};
const resource=await(await fetch(BASE+'/.well-known/oauth-protected-resource')).json();assert(resource.resource===BASE+'/mcp','resource metadata');
const metadata=await(await fetch(BASE+'/.well-known/oauth-authorization-server')).json();assert(metadata.issuer===BASE&&metadata.code_challenge_methods_supported.includes('S256'),'issuer and PKCE metadata');
const client=new Client({name:'ion-release-verification',version:'0.47'});
try{await client.connect(new StreamableHTTPClientTransport(new URL(BASE+'/mcp'),{authProvider:provider}));throw new Error('Anonymous connection must not succeed.');}catch(error){if(!authorization)throw error;}finally{await client.close();}
assert(clientInfo?.client_id,'automatic dynamic registration');assert(authorization.searchParams.get('resource')===BASE+'/mcp','resource-bound authorization');assert(authorization.searchParams.get('code_challenge_method')==='S256','S256 code challenge');assert(authorization.searchParams.get('state')==='release-verification','state preserved');
let response=await fetch(authorization,{redirect:'manual'});assert(response.status===302,'authorization redirect');const consent=new URL(response.headers.get('location'));assert(consent.origin===WEBSITE&&consent.pathname==='/chatgpt-connect','fixed ION consent origin');
response=await fetch(WEBSITE+'/_api/chatgpt/authorization'+authorization.search);assert(response.status===200,'registered client validation');
response=await fetch(WEBSITE+'/_api/chatgpt/consent',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://attacker.invalid'},body:JSON.stringify({query:authorization.search.slice(1),decision:'allow'})});assert(response.status===403,'cross-origin consent denied');
response=await fetch(WEBSITE+'/_api/chatgpt/consent',{method:'POST',headers:{'Content-Type':'application/json',Origin:WEBSITE},body:JSON.stringify({query:authorization.search.slice(1),decision:'allow'})});assert(response.status===401,'anonymous consent denied');
response=await fetch(BASE+'/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'authorization_code',client_id:clientInfo.client_id,code:'invalid',code_verifier:verifier,resource:BASE+'/mcp',redirect_uri:provider.redirectUrl})});assert(response.status===400,'invalid grant denied');
response=await fetch(WEBSITE+'/_api/cloud',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'load',scope:'schedule',workspaceId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',accessToken:'0'.repeat(64)})});assert(response.status===401,'anonymous Schedule denied');
console.log(JSON.stringify({officialSdkOAuthDiscovery:true,DCR:true,PKCE:true,authorizationRedirect:true,foreignOriginDenied:true,anonymousConsentDenied:true,invalidGrantDenied:true,anonymousScheduleDenied:true,cleanupClientId:clientInfo.client_id}));
