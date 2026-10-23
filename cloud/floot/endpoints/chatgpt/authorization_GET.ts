import { ionPluginOAuth,pluginError } from '../../helpers/ionPluginOAuth';
export async function handle(request:Request){try{const auth=await ionPluginOAuth.authorization(new URL(request.url).searchParams);return Response.json({name:auth.clientName,scopes:auth.scope.split(' ')},{headers:{'Cache-Control':'no-store'}});}catch(error){return pluginError(error);}}
