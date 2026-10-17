import { createToken } from "@floot/realtime";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import superjson from "superjson";
export async function handle(request:Request){
 const headers={"Content-Type":"application/json","Cache-Control":"no-store"};
 try{const {user}=await getServerUserSession(request);const result=await createToken({userId:String(user.id),channels:["cloud-user:"+user.id],ttlSeconds:3600});
 if(!result.ok)throw new Error("Unavailable");return new Response(superjson.stringify({token:result.token,wssEndpoint:result.wssEndpoint,userId:String(user.id)}),{headers});
 }catch{return new Response(superjson.stringify({error:"Sign in to sync your space."}),{status:401,headers});}
}
