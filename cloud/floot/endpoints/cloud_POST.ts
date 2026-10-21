import { featureClouds } from '../helpers/featureClouds';
import { functionClouds } from '../helpers/functionClouds';
import { functionIdentifiers } from '../helpers/functionIdentifiers';
import { assertCloudWordLimits } from '../helpers/cloudWordLimits';
import { timeLedger } from '../helpers/timeLedger';
import { accountDeviceNodes } from '../helpers/accountDeviceNodes';
import { namespaceIdentifier } from '../helpers/cloudIdentifiers';
import { accountClouds } from "../helpers/accountClouds";
import { validateCloudPhoto } from "../helpers/validateCloudPhoto";
import { mapPhotos } from "../helpers/cloudPhotos";
import { cloudIdentifierStore } from "../helpers/cloudIdentifierStore";
import { publish } from "@floot/realtime";
import { assertCloudCapacity } from "../helpers/cloudCapacity";
import { cloudContext } from "../helpers/cloudContext";
import { cloudPolicy } from "../helpers/cloudPolicy";
import { cloudTransfer } from "../helpers/cloudTransfer";
import { channels } from "../helpers/realtimeChannels";
import { upload, getUrl } from "@floot/storage";
import { db } from "../helpers/db";
import { cloudTree } from "../helpers/cloudTree";
import { unusedColor } from "../helpers/cloudColors";
import { cloudChanges } from "../helpers/cloudChanges";
import { schema, type CloudNode, type OutputType } from "./cloud_POST.schema";
import type { Json } from "../helpers/schema";
const headers = { "Content-Type": "application/json", "Cache-Control": "private, no-store" };
const extensions: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };
class CloudError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}
export async function handle(request: Request) {
  try {
    const body = await request.text();
    if (body.length > 1024 * 1024) throw new CloudError("Request too large.", 413);
    const input = schema.parse(JSON.parse(body));
    let context=await cloudContext(request,input);
    if(input.action==='transfer'){
      const transfer=await cloudTransfer(request,input);
      if(transfer){await Promise.allSettled([publish(channels.cloud(input.scope,transfer.userId),{changed:true}),publish(channels.cloud(input.targetScope,transfer.userId),{changed:true})]);}
      context=await cloudContext(request,{...input,action:'load'});
    }
    if(!context.row)return new Response(JSON.stringify({nodes:context.seeds.map(n=>({...n,canEdit:false,canCopy:false})),version:0,scope:input.scope,canAdd:false,dev:false,owner:false} satisfies OutputType),{headers});
    const row=context.row;
    let nodes = (Array.isArray(row.nodes) ? row.nodes : []) as unknown as CloudNode[];
    let version = row.version;
    const combine=(stored:CloudNode[])=>input.scope==='accounts'?accountDeviceNodes(context.seeds,stored):[...new Map([...context.seeds,...stored].map(n=>[n.id,n])).values()];
    const all=combine(nodes).filter(n=>!n.removedBy);
    if (input.action === "upload") {
      if(!cloudPolicy.writable(input.scope,context.userId,context.owner))cloudPolicy.fail("Sign in to add a picture.",401);
      const filename = "ion/" + row.id + "/" + context.userId + "/" + input.id + (input.fileId?"/"+input.fileId:"") + "." + extensions[input.contentType];
      const result = await upload({ visibility: "private", filename, contentType: input.contentType, sizeBytes: input.sizeBytes });
      if (!result.ok) throw new CloudError("Couldn’t prepare the picture. Try again.", 400);
      return new Response(JSON.stringify({ nodes: [], version, upload: { url: result.presignedUrl, headers: result.headers } } satisfies OutputType), { headers });
    }
    if (input.action === "add") {
      if(!cloudPolicy.writable(input.scope,context.userId,context.owner))cloudPolicy.fail("You cannot add here.");
      if(!input.parentId)cloudPolicy.fail("Choose a cloud inside this space.",400);
      // A retry of the same creation is safe even after another tab changes the version.
      const existing = nodes.find(n => n.id === input.id);
      if(existing?.removedBy)throw new CloudError("This item was removed. Edit its name to add it again.",409);
      if (!existing) {
        if (input.version !== row.version) throw new CloudError("Your space changed in another tab. Try again.", 409);
          if (input.parentId !== null && !all.some(n => n.id === input.parentId && !n.destination))
          throw new CloudError("Choose an existing cloud.", 400);
        const node: CloudNode = { id: input.id, parentId: input.parentId, name: input.name,createdBy:context.userId!,color:unusedColor(input.color||'white',all.filter(n=>n.parentId===input.parentId).map(n=>n.color)) };
        if (input.imageType) {
          const filename = "ion/" + row.id + "/" + context.userId + "/" + input.id + "." + extensions[input.imageType];
          node.imageKey = await validateCloudPhoto(filename,input.imageType);
        }
        if(input.images?.length){
          const keys=await mapPhotos(input.images,image=>validateCloudPhoto("ion/"+row.id+"/"+context.userId+"/"+input.id+"/"+image.id+"."+extensions[image.contentType],image.contentType));
          node.imageKeys=keys;
        }
        assertCloudWordLimits(all,[...all,node],input.scope);
        assertCloudCapacity([...context.seeds,...nodes],[...context.seeds,...nodes,node]);
        nodes = [...nodes, node];
        const updated = await db.updateTable("ionWorkspaces").set({ nodes: nodes as unknown as Json, version: row.version + 1, updatedAt: new Date() })
          .where("id", "=", row.id).where("version", "=", row.version).returning("version").executeTakeFirst();
        if (!updated) throw new CloudError("Your space changed in another tab. Try again.", 409);
        version = updated.version;
      }
    }
    if(input.action==="link"||input.action==="rename"||input.action==="remove"||input.action==="restore"||input.action==="move"||input.action==="copy"){
      if(input.action==='restore'){
        if(!cloudPolicy.writable(input.scope,context.userId,context.owner)||nodes.filter(n=>n.removedBy===input.operationId).some(n=>!cloudPolicy.edit(input.scope,{...n,removedBy:undefined},context.userId,context.owner)))cloudPolicy.fail('You cannot restore this branch.');
      }else if(input.action!=='copy')cloudPolicy.assert(input.scope,all,input.id,context.userId,context.owner,input.action==='remove'||input.action==='move');
      else if(!cloudPolicy.writable(input.scope,context.userId,context.owner))cloudPolicy.fail('You cannot copy here.');
      if((input.action==='move'||input.action==='copy')&&!input.parentId)cloudPolicy.fail('Choose a cloud inside this space.',400);
      if(input.action==='link'&&input.target?.kind==='cloud'){
        if(input.target.scope===input.scope&&input.target.id===input.id)cloudPolicy.fail('Choose another cloud.',400);
        const target=await cloudContext(request,{action:'load',scope:input.target.scope,workspaceId:input.workspaceId,accessToken:input.accessToken});
        const saved=target.row&&Array.isArray(target.row.nodes)?target.row.nodes as unknown as CloudNode[]:[];
        const available=[...new Map([...target.seeds,...saved].map(n=>[n.id,n])).values()];
        if(!available.some(n=>n.id===(input.target as {id:string}).id&&!n.removedBy))cloudPolicy.fail('Choose an available cloud.',400);
      }
      let next=cloudChanges.apply(nodes,input,row.version,context.seeds);
      if(input.action==='copy')next=next.map(n=>n.copyOperation===input.operationId?{...n,createdBy:context.userId!}:n);
      if(next!==nodes){
        assertCloudWordLimits([...context.seeds,...nodes],[...context.seeds,...next],input.scope);
        assertCloudCapacity([...context.seeds,...nodes],[...context.seeds,...next]);
        const updated=await db.updateTable("ionWorkspaces").set({nodes:next as unknown as Json,version:row.version+1,updatedAt:new Date()}).where("id","=",row.id).where("version","=",row.version).returning("version").executeTakeFirst();
        if(!updated)throw new CloudError("Your space changed. Try again.",409);
        nodes=next;version=updated.version;
      }
    }
    if(version!==row.version){try{await publish(channels.cloud(input.scope,context.userId||0),{version,workspaceId:row.id});}catch{console.error('Cloud refresh delayed');}}
    const merged=combine(nodes);
    // Keep removed rows in the registry. Allocation is serialized across devices;
    // labels are never recycled or exposed in another account's Private space.
    const hubIds=new Set(functionClouds.filter(n=>n.parentId==='time').map(n=>n.id)),functional=context.isDev&&input.scope==='home'?await functionIdentifiers(context.userId!):undefined;
    const identifiers=context.isDev||(['public','chess','home'].includes(input.scope)&&input.action!=='load')
      ?await cloudIdentifierStore(merged.filter(n=>!hubIds.has(n.id)),context.devNumber):undefined;
    // Signed picture URLs are refreshed on every read, and never stored as authority.
    let visible:CloudNode[] = await Promise.all(merged.filter(n=>!n.removedBy&&n.id!=='time-balance'&&(context.isDev||!['time-treasury','time-estimates'].includes(n.id))&&(context.scope!=='accounts'||n.id!=='account-remember'||context.seeds.some(seed=>seed.id==='account-remember'))).map(async node => {
      const visibleNode={...node,...(node.id==='control-link'&&node.name==='Link'?{name:'Redirect'}:{}),identifier:functional?.[node.id]??(context.isDev?namespaceIdentifier(identifiers?.get(node.id)?.label,Number((input.scope==='private'&&node.id==='private'||input.scope==='accounts'&&context.seeds.some(s=>s.id===node.id))?context.devNumber:identifiers?.get(node.id)?.devNumber??context.devNumber)):undefined),createdBy:undefined,canEdit:cloudPolicy.edit(input.scope,node,context.userId,context.owner),canCopy:!!context.userId&&cloudPolicy.writable(input.scope,context.userId,context.owner)&&(context.owner||!cloudTree.roots.some(r=>r.id===node.id))};
      const keys=node.imageKeys?.length?node.imageKeys:node.imageKey?[node.imageKey]:[];
      if(!keys.length)return visibleNode;
      const urls=await Promise.all(keys.map(async filename=>{const result=await getUrl({visibility:'private',filename,expiresInSeconds:3600});return result.ok?result.url:'';}));
      return {...visibleNode,isImage:true,imageKey:undefined,imageKeys:undefined,imageUrl:urls[0],imageUrls:urls};
    }));
    if(input.scope==='chess'){const market=await timeLedger.catalog(context.userId);visible=featureClouds(visible,market.products,market.dev);}
    if(input.scope==='home'){
      const shared=await db.selectFrom('ionSharedSpaces').innerJoin('ionWorkspaces','ionSharedSpaces.workspaceId','ionWorkspaces.id').select(['kind','nodes']).where('kind','in',['public','chess']).execute();
      const personal=context.userId?await db.selectFrom('ionCloudAccounts').innerJoin('ionWorkspaces','ionCloudAccounts.workspaceId','ionWorkspaces.id').select('nodes').where('userId','=',context.userId).executeTakeFirst():undefined;
      const accountSeeds=await accountClouds(request,context.userId);
      const accountSaved=context.userId?await db.selectFrom('ionAccountSpaces').innerJoin('ionWorkspaces','ionAccountSpaces.workspaceId','ionWorkspaces.id').select('nodes').where('userId','=',context.userId).executeTakeFirst():undefined;
      const accountNodes=accountDeviceNodes(accountSeeds,Array.isArray(accountSaved?.nodes)?accountSaved.nodes as unknown as CloudNode[]:[]);
      const weight=(seeds:CloudNode[],stored:unknown,id:string,words=false)=>{const combined=[...new Map([...seeds,...(Array.isArray(stored)?stored as CloudNode[]:[])].map(n=>[n.id,n])).values()];return (words?cloudTree.wordWeights(combined):cloudTree.characterWeights(combined)).get(id)||0;};
      visible=visible.map(n=>({...n,...(n.id==='accounts'?{sizeWords:cloudTree.wordWeights(accountNodes).get('accounts')||0,sizeCharacters:cloudTree.characterWeights(accountNodes).get('accounts')||0}:n.id==='private'?{sizeWords:weight(cloudTree.forScope('private'),personal?.nodes,'private',true),sizeCharacters:weight(cloudTree.forScope('private'),personal?.nodes,'private')}:n.id==='public'?{sizeWords:weight(cloudTree.forScope('public'),shared.find(s=>s.kind==='public')?.nodes,'public',true),sizeCharacters:weight(cloudTree.forScope('public'),shared.find(s=>s.kind==='public')?.nodes,'public')}:n.id==='hexagonal-chess'?{sizeWords:weight(cloudTree.forScope('chess'),shared.find(s=>s.kind==='chess')?.nodes,'hexagonal-chess',true),sizeCharacters:weight(cloudTree.forScope('chess'),shared.find(s=>s.kind==='chess')?.nodes,'hexagonal-chess')}:{})}));
    }
    return new Response(JSON.stringify({ nodes: visible, version, workspaceId:row.id, account:input.scope==='private', scope:input.scope, canAdd:cloudPolicy.writable(input.scope,context.userId,context.owner), dev:context.isDev,owner:context.owner,userId:context.userId||undefined, undo: cloudChanges.undo(nodes.filter(n=>cloudPolicy.edit(input.scope,n,context.userId,context.owner))) } satisfies OutputType), { headers });
  } catch (error) {
    const status = error instanceof Error && "status" in error && typeof error.status === "number" ? error.status : error instanceof SyntaxError || (error && typeof error === "object" && "issues" in error) ? 400 : 503;
    if (status === 503) console.error("ION space request failed", error instanceof Error ? error.message : "Unknown error");
    return new Response(JSON.stringify({ error: status === 503 ? "Couldn’t open your space. Try again." : error instanceof Error && "status" in error ? error.message : "Check your word or picture and try again." }), { status, headers });
  }
}
