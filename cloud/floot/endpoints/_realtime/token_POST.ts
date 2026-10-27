import { timeLedger } from '../../helpers/timeLedger';
import { randomUUID } from "node:crypto";
import { createToken } from "@floot/realtime";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { channels } from "../../helpers/realtimeChannels";
import superjson from "superjson";
export async function handle(request:Request){
 const headers={"Content-Type":"application/json","Cache-Control":"no-store"};
 try{let id:number|null=null;try{id=(await getServerUserSession(request)).user.id;}catch(e){if(!(e instanceof NotAuthenticatedError))throw e;}
 const role=await timeLedger.roles(id);
 const grants=['chess-room:*','chess-topic:*',channels.timeCatalog,...(id?[channels.time(id)]:[]),...(role.dev?[channels.timeTreasury]:[]),channels.cloud('public',0),channels.cloud('chess',0),channels.cloud('home',0),...(id?[channels.cloud('private',id),channels.cloud('accounts',id),channels.player(id)]:[])];
 const userId=id?String(id):'visitor-'+randomUUID();const result=await createToken({userId,channels:grants,ttlSeconds:3600});if(!result.ok)throw new Error('Unavailable');return new Response(superjson.stringify({token:result.token,wssEndpoint:result.wssEndpoint,userId}),{headers});
 }catch{return new Response(superjson.stringify({error:'Couldn’t connect live updates.'}),{status:503,headers});}
}
