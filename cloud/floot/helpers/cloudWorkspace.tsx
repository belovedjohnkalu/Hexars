import { createHash, randomUUID, randomBytes } from "node:crypto";
import { db } from "./db";
import { getServerUserSession } from "./getServerUserSession";
import type { InputType, CloudNode } from "../endpoints/cloud_POST.schema";
import type { Json } from "./schema";
const hash=(s:string)=>createHash("sha256").update(s).digest("hex");
const fail=(s:string,status:number):never=>{throw Object.assign(new Error(s),{status});};
export async function cloudWorkspace(request:Request,input:InputType){
 let userId:number;
 try{userId=(await getServerUserSession(request)).user.id;}catch{return fail("Sign in again to save your words.",401);}
 return db.transaction().execute(async tx=>{
  await tx.selectFrom("users").select("id").where("id","=",userId).forUpdate().executeTakeFirstOrThrow();
  let link=await tx.selectFrom("ionCloudAccounts").selectAll().where("userId","=",userId).executeTakeFirst();
  let source=input.action==="load"&&input.connect?await tx.selectFrom("ionWorkspaces").selectAll().where("id","=",input.workspaceId).where("accessTokenHash","=",hash(input.accessToken)).forUpdate().executeTakeFirst():undefined;
  if(source?.ownerId!==null&&source?.ownerId!==userId)source=undefined;
  if(!link){
   const row=source||await tx.insertInto("ionWorkspaces").values({id:randomUUID(),accessTokenHash:hash(randomBytes(32).toString("hex")),nodes:[],ownerId:userId}).returningAll().executeTakeFirstOrThrow();
   await tx.updateTable("ionWorkspaces").set({ownerId:userId}).where("id","=",row.id).execute();
   link=await tx.insertInto("ionCloudAccounts").values({userId,workspaceId:row.id}).returningAll().executeTakeFirstOrThrow();
  }
  let row=await tx.selectFrom("ionWorkspaces").selectAll().where("id","=",link.workspaceId).forUpdate().executeTakeFirstOrThrow();
  if(source&&source.id!==row.id){
   const existing=(row.nodes as unknown as CloudNode[])||[],ids=new Set(existing.map(n=>n.id));
   const extra=((source.nodes as unknown as CloudNode[])||[]).filter(n=>!ids.has(n.id));
   if(extra.length)row=await tx.updateTable("ionWorkspaces").set({nodes:[...existing,...extra] as unknown as Json,version:row.version+1,updatedAt:new Date()}).where("id","=",row.id).returningAll().executeTakeFirstOrThrow();
   await tx.updateTable("ionWorkspaces").set({ownerId:userId}).where("id","=",source.id).execute();
  }
  // Preserve persisted legacy overrides as personal words instead of dropping them.
  const old=(row.nodes as unknown as CloudNode[])||[],ids=new Map(old.map(n=>[n.id,/^[a-f0-9-]{36}$/.test(n.id)?n.id:randomUUID()]));
  const normalized=old.map(n=>({...n,id:ids.get(n.id)!,parentId:n.parentId&&ids.has(n.parentId)?ids.get(n.parentId)!:'private',...(!/^[a-f0-9-]{36}$/.test(n.id)?{destination:undefined}: {})}));
  if(JSON.stringify(normalized)!==JSON.stringify(row.nodes))row=await tx.updateTable("ionWorkspaces").set({nodes:normalized as unknown as Json,version:row.version+1,updatedAt:new Date()}).where("id","=",row.id).returningAll().executeTakeFirstOrThrow();
  return row;
 });
}
