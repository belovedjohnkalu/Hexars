import { db } from "./db";
import { getServerUserSession } from "./getServerUserSession";
import { NotAuthenticatedError } from "./getSetServerSession";
import { cloudWorkspace } from "./cloudWorkspace";
import { cloudTree } from "./cloudTree";
import { cloudPolicy } from "./cloudPolicy";
import type { InputType } from "../endpoints/cloud_POST.schema";
export async function cloudContext(request:Request,input:InputType){
 let userId:number|null=null;try{userId=(await getServerUserSession(request)).user.id;}catch(e){if(!(e instanceof NotAuthenticatedError))throw e;}
 const config=await db.selectFrom('ionSharedSpaces').selectAll().execute(),owner=!!userId&&config.some(c=>c.ownerUserId===userId),scope=input.scope||"private";
 if(scope==='home'&&input.action!=='load')cloudPolicy.fail('The home screen has no insert box.');
 if(scope==='home')return {row:null,userId,owner,scope,seeds:cloudTree.roots};
 if(scope==='private'){if(!userId)cloudPolicy.fail('Sign in to open Private.',401);const row=await cloudWorkspace(request,input);return {row,userId,owner,scope,seeds:cloudTree.forScope(scope)};}
 const id=config.find(c=>c.kind===scope)?.workspaceId;if(!id)throw new Error('Space unavailable');
 if(input.action!=='load'&&!cloudPolicy.writable(scope,userId,owner))cloudPolicy.fail(scope==='chess'?'Only the owner can add to Hexagonal Chess.':'Sign in to add to Public.',userId?403:401);
 const row=await db.selectFrom('ionWorkspaces').selectAll().where('id','=',id!).executeTakeFirstOrThrow();return {row,userId,owner,scope,seeds:cloudTree.forScope(scope)};
}
