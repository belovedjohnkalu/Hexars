import {communitySizing} from './communitySizing';
import {invalidatePublicBootstrap} from './invalidatePublicBootstrap';
import {isRetiredGameCloud} from './retiredGameClouds';
import {saveSharedRootName} from './saveSharedRootName';
import { attachCloudAuthors } from './cloudAuthors';
import { drainCloudRefresh } from './drainCloudRefresh';
import { homeFeatures } from './homeFeatures';
import { scheduleCalendar } from './scheduleCalendar';
import { accountTimeZone } from './accountTimeZone';
import { ensureScheduleCalendar } from './ensureScheduleCalendar';
import { signedInUserCount,signedInUserExpiry } from './signedInUsers';
import { visibleDevClouds } from './devPromptWorkflow';
import { featureClouds } from './featureClouds';
import { functionClouds } from './functionClouds';
import { functionIdentifiers } from './functionIdentifiers';
import { assertCloudWordLimits } from './cloudWordLimits';
import {uniqueCloudNames} from './uniqueCloudNames';
import {inversionCloudId} from './appearanceSettings';
import {tiledUICloudId} from './interfaceSettingsClouds';
import { timeLedger } from './timeLedger';
import { accountDeviceNodes } from './accountDeviceNodes';
import { namespaceIdentifier } from './cloudIdentifiers';
import { accountClouds } from "./accountClouds";
import { validateCloudPhoto } from "./validateCloudPhoto";
import { mapPhotos } from "./cloudPhotos";
import { cloudIdentifierStore } from "./cloudIdentifierStore";
import { publish } from "@floot/realtime";
import { assertCloudCapacity } from "./cloudCapacity";
import { cloudContext } from "./cloudContext";
import { cloudPolicy } from "./cloudPolicy";
import { cloudTransfer } from "./cloudTransfer";
import { channels } from "./realtimeChannels";
import { upload, getUrl } from "@floot/storage";
import { db } from "./db";
import { cloudTree } from "./cloudTree";
import { unusedColor } from "./cloudColors";
import { cloudChanges } from "./cloudChanges";
import { schema, type CloudNode, type OutputType } from "../endpoints/cloud_POST.schema";
import type { Json } from "./schema";
const headers = { "Content-Type": "application/json", "Cache-Control": "private, no-store" };
const extensions: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "video/mp4":"mp4","video/quicktime":"mov","video/webm":"webm","audio/mpeg":"mp3","audio/mp4":"m4a","audio/x-m4a":"m4a","audio/ogg":"ogg","audio/wav":"wav","audio/x-wav":"wav","audio/webm":"webm" };
class CloudError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}
export async function cloudService(request: Request,guestCatalog?:Pick<Awaited<ReturnType<typeof timeLedger.catalog>>,'products'|'dev'>) {
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
    const timeZone=(input.scope==='home'||input.scope==='schedule')?await accountTimeZone(context.userId,input.action==='load'?input.timeZone:undefined):undefined;
    if(input.scope==='home'&&input.action==='load')context={...context,row:await ensureScheduleCalendar(context.row.id,timeZone!,context.devNumber)};
    const row=context.row!;
    let nodes = (Array.isArray(row.nodes) ? row.nodes : []) as unknown as CloudNode[];
    let version = row.version;
    const combine=(stored:CloudNode[])=>input.scope==='accounts'?accountDeviceNodes(context.seeds,stored):[...new Map([...context.seeds,...stored].map(n=>[n.id,n])).values()];
    const all=combine(nodes).filter(n=>!n.removedBy);
    if(input.scope==='home'&&input.action!=='load'&&input.action!=='upload'){
      const dates=new Set(all.filter(n=>n.id===scheduleCalendar.root||n.calendarDate).map(n=>n.id));
      if(('parentId' in input&&input.parentId&&dates.has(input.parentId))||('id' in input&&dates.has(input.id)&&input.action!=='rename'))cloudPolicy.fail('Open your private Schedule to add or change entries.',403);
    }

    if(input.scope==='schedule'&&!context.isDev&&input.action==='copy'&&context.seeds.some(n=>n.id===input.id))cloudPolicy.fail('Duplicate your own schedule entries, not the calendar.',403);
    if (input.action === "upload") {
      if(!cloudPolicy.writable(input.scope,context.userId,context.owner))cloudPolicy.fail("Sign in to add a picture.",401);
      const filename = "ion/" + row.id + "/" + context.userId + "/" + input.id + (input.fileId?"/"+input.fileId:"") + "." + extensions[input.contentType];
      const result = await upload({ visibility: "private", filename, contentType: input.contentType, sizeBytes: input.sizeBytes });
      if (!result.ok) throw new CloudError("Couldn’t prepare the picture. Try again.", 400);
      return new Response(JSON.stringify({ nodes: [], version, upload: { url: result.presignedUrl, headers: result.headers } } satisfies OutputType), { headers });
    }
    if (input.action === "add") {
      if(!cloudPolicy.writable(input.scope,context.userId,context.owner))cloudPolicy.fail("You cannot add here.");
      if(!input.parentId)cloudPolicy.fail("Choose a cloud inside this cloud.",400);
      // A retry of the same creation is safe even after another tab changes the version.
      const existing = nodes.find(n => n.id === input.id);
      if(existing?.removedBy)throw new CloudError("This item was removed. Edit its name to add it again.",409);
      if (!existing) {
        if (input.version !== row.version) throw new CloudError("Your cloud changed in another tab. Try again.", 409);
          if (input.parentId !== null && !all.some(n => n.id === input.parentId && !n.destination))
          throw new CloudError("Choose an existing cloud.", 400);
        const node: CloudNode = { id: input.id, parentId: input.parentId, name: input.name,createdBy:context.userId!,color:unusedColor(input.color||'white',all.filter(n=>n.parentId===input.parentId).map(n=>n.color)) };
        if (input.imageType) {
          const filename = "ion/" + row.id + "/" + context.userId + "/" + input.id + "." + extensions[input.imageType];
          node.imageKey = await validateCloudPhoto(filename,input.imageType);node.mediaTypes=[input.imageType];
        }
        if(input.images?.length){
          const keys=await mapPhotos(input.images,image=>validateCloudPhoto("ion/"+row.id+"/"+context.userId+"/"+input.id+"/"+image.id+"."+extensions[image.contentType],image.contentType));
          node.imageKeys=keys;node.mediaTypes=input.images.map(i=>i.contentType);node.mediaDimensions=input.images.map(i=>i.dimensions||null);node.isImage=true;
        }
        uniqueCloudNames(all,[...all,node]);assertCloudWordLimits(all,[...all,node],input.scope);
        assertCloudCapacity([...context.seeds,...nodes],[...context.seeds,...nodes,node]);
        nodes = [...nodes, node];
        const updated = await db.updateTable("ionWorkspaces").set({ nodes: nodes as unknown as Json, version: row.version + 1, updatedAt: new Date() })
          .where("id", "=", row.id).where("version", "=", row.version).returning("version").executeTakeFirst();
        if (!updated) throw new CloudError("Your cloud changed in another tab. Try again.", 409);
        version = updated.version;
      }
    }
    if(input.action==='update'||input.action==="link"||input.action==="rename"||input.action==="remove"||input.action==="restore"||input.action==="move"||input.action==="copy"){
      if(input.action==='restore'){
        if(!cloudPolicy.writable(input.scope,context.userId,context.owner)||nodes.filter(n=>n.removedBy===input.operationId).some(n=>!cloudPolicy.edit(input.scope,{...n,removedBy:undefined},context.userId,context.owner)))cloudPolicy.fail('You cannot restore this branch.');
      }else if(input.action!=='copy')cloudPolicy.assert(input.scope,all,input.id,context.userId,context.owner,input.action==='remove'||input.action==='move');
      else if(!cloudPolicy.writable(input.scope,context.userId,context.owner))cloudPolicy.fail('You cannot copy here.');
      if((input.action==='move'||input.action==='copy')&&!input.parentId)cloudPolicy.fail('Choose a cloud inside this cloud.',400);
      if(input.action==='link'&&input.target?.kind==='cloud'){
        if(input.target.scope===input.scope&&input.target.id===input.id)cloudPolicy.fail('Choose another cloud.',400);
        const target=await cloudContext(request,{action:'load',scope:input.target.scope,workspaceId:input.workspaceId,accessToken:input.accessToken});
        const saved=target.row&&Array.isArray(target.row.nodes)?target.row.nodes as unknown as CloudNode[]:[];
        const available=[...new Map([...target.seeds,...saved].map(n=>[n.id,n])).values()];
        if(!visibleDevClouds(available,target.isDev).some(n=>n.id===(input.target as {id:string}).id&&!n.removedBy))cloudPolicy.fail('Choose an available cloud.',400);
      }
      let verifiedImages:string[]=[];
      if(input.action==='update'){
        if(input.note!==undefined&&!context.isDev)cloudPolicy.fail('Only dev accounts can change page text.');
        if(input.photoMode==='replace'){
          if(!input.assetId||!input.images?.length)cloudPolicy.fail('Choose a picture.',400);
          verifiedImages=await mapPhotos(input.images!,image=>validateCloudPhoto('ion/'+row.id+'/'+context.userId+'/'+input.assetId+'/'+image.id+'.'+extensions[image.contentType],image.contentType));
        }
      }
      let next=cloudChanges.apply(nodes,input,row.version,context.seeds,verifiedImages);
      if(input.action==='copy')next=next.map(n=>n.copyOperation===input.operationId?{...n,createdBy:context.userId!}:n);
      if(next!==nodes){
        uniqueCloudNames([...context.seeds,...nodes],[...context.seeds,...next]);assertCloudWordLimits([...context.seeds,...nodes],[...context.seeds,...next],input.scope);
        assertCloudCapacity([...context.seeds,...nodes],[...context.seeds,...next]);
        const updated=(input.action==='rename'||input.action==='update')&&(input.scope==='home'||input.scope==='chess')&&input.id==='hexagonal-chess'?await saveSharedRootName(row.id,row.version,next):await db.updateTable("ionWorkspaces").set({nodes:next as unknown as Json,version:row.version+1,updatedAt:new Date()}).where("id","=",row.id).where("version","=",row.version).returning("version").executeTakeFirst();
        if(!updated)throw new CloudError("Your cloud changed. Try again.",409);
        nodes=next;version=updated.version;
      }
    }
    if(version!==row.version&&['home','chess','public'].includes(input.scope))await invalidatePublicBootstrap().catch(()=>console.error('Public cache invalidation delayed'));
    if(version!==row.version){try{await publish(channels.cloud(input.scope,context.userId||0),{version,workspaceId:row.id});}catch{console.error('Cloud refresh delayed');}}
    const merged=combine(nodes);
    // Keep removed rows in the registry. Allocation is serialized across devices;
    // labels are never recycled or exposed in another account's Private space.
    const hubIds=new Set(functionClouds.filter(n=>n.parentId==='time').map(n=>n.id)),functional=context.isDev&&(input.scope==='home'||!!input.functionalId)?await functionIdentifiers(context.userId!,input.functionalId?context.seeds.filter(n=>n.id.startsWith('time-tx-')||n.id.startsWith('work-session-')):[]):undefined;
    const identifiers=context.isDev||input.scope==='public'||(['chess','home'].includes(input.scope)&&input.action!=='load')
      ?await cloudIdentifierStore(merged.filter(n=>!hubIds.has(n.id)),context.devNumber):undefined;
    const readable=visibleDevClouds(merged,context.isDev),authorIds=[...new Set(readable.filter(n=>!n.removedBy&&n.createdBy).map(n=>n.createdBy!))];
    const authors=authorIds.length?await db.selectFrom('users').select(['id','displayName']).where('id','in',authorIds).execute():[];
    const withAuthors=attachCloudAuthors(readable,new Map(authors.map(u=>[u.id,u.displayName])));
    // Signed picture URLs are refreshed on every read, and never stored as authority.
    let visible:CloudNode[] = await Promise.all(withAuthors.filter(n=>!isRetiredGameCloud(n.id)&&!n.removedBy&&n.id!==inversionCloudId&&n.id!==tiledUICloudId&&n.id!=='time-balance'&&(context.isDev||!['time-treasury','time-estimates'].includes(n.id))&&(context.scope!=='accounts'||n.id!=='account-remember'||context.seeds.some(seed=>seed.id==='account-remember'))).map(async node => {
      const visibleNode={...node,...(['time-added','time-spent','time-remaining'].includes(node.id)?{parentId:'time-activity'}:{}),...(node.id==='control-link'&&node.name==='Link'?{name:'Redirect'}:{}),identifier:functional?.[node.id]??(context.isDev||input.scope==='public'?namespaceIdentifier(identifiers?.get(node.id)?.label,Number((input.scope==='private'&&node.id==='private'||input.scope==='accounts'&&context.seeds.some(s=>s.id===node.id))?context.devNumber:identifiers?.get(node.id)?.devNumber??context.devNumber)):undefined),createdBy:undefined,canEdit:cloudPolicy.edit(input.scope,node,context.userId,context.owner),canCopy:!(input.scope==='schedule'&&context.seeds.some(seed=>seed.id===node.id))&&!!context.userId&&cloudPolicy.writable(input.scope,context.userId,context.owner)&&(context.owner||!cloudTree.roots.some(r=>r.id===node.id))};
      const keys=node.imageKeys?.length?node.imageKeys:node.imageKey?[node.imageKey]:[];
      if(!keys.length)return node.imageStaticUrls?.length?{...visibleNode,imageStaticUrls:undefined,imageUrl:node.imageStaticUrls[0],imageUrls:node.imageStaticUrls}:visibleNode;
      const urls=await Promise.all(keys.map(async filename=>{const result=await getUrl({visibility:'private',filename,expiresInSeconds:3600});return result.ok?result.url:'';}));
      const allUrls=[...(node.imageStaticUrls||[]),...urls];return {...visibleNode,isImage:true,imageKey:undefined,imageKeys:undefined,imageStaticUrls:undefined,imageUrl:allUrls[0],imageUrls:allUrls};
    }));
    const roomSizes=input.scope==='chess'||input.scope==='home'?await communitySizing.read(context.userId):new Map<string,number>();
    if(input.scope==='chess')visible=communitySizing.apply(visible,roomSizes);
    if(input.scope==='chess'||input.scope==='home'){const market=context.userId===null&&guestCatalog?guestCatalog:await timeLedger.catalog(context.userId);visible=featureClouds(visible,market.products,market.dev);}
    if(input.scope==='home'){
      const shared=await db.selectFrom('ionSharedSpaces').innerJoin('ionWorkspaces','ionSharedSpaces.workspaceId','ionWorkspaces.id').select(['kind','nodes']).where('kind','in',['public','chess']).execute();
      const personal=context.userId?await db.selectFrom('ionCloudAccounts').innerJoin('ionWorkspaces','ionCloudAccounts.workspaceId','ionWorkspaces.id').select('nodes').where('userId','=',context.userId).executeTakeFirst():undefined;
      const accountSeeds=await accountClouds(request,context.userId,context.isDev);
      const accountSaved=context.userId?await db.selectFrom('ionAccountSpaces').innerJoin('ionWorkspaces','ionAccountSpaces.workspaceId','ionWorkspaces.id').select('nodes').where('userId','=',context.userId).executeTakeFirst():undefined;
      const accountNodes=accountDeviceNodes(accountSeeds,Array.isArray(accountSaved?.nodes)?accountSaved.nodes as unknown as CloudNode[]:[]);
      const weight=(seeds:CloudNode[],stored:unknown,id:string)=>{const combined=[...new Map([...seeds,...(Array.isArray(stored)?stored as CloudNode[]:[])].map(n=>[n.id,n])).values()];return cloudTree.descendantCharacterWeights(id==='hexagonal-chess'?communitySizing.apply(combined,roomSizes):combined).get(id)||0;};
      visible=visible.map(n=>({...n,...(n.id==='accounts'?{sizeCharacters:cloudTree.descendantCharacterWeights(accountNodes).get('accounts')||0}:n.id==='private'?{sizeCharacters:weight(cloudTree.forScope('private'),personal?.nodes,'private')}:n.id==='public'?{sizeCharacters:weight(cloudTree.forScope('public'),shared.find(s=>s.kind==='public')?.nodes,'public')}:n.id==='hexagonal-chess'?{sizeCharacters:weight(cloudTree.forScope('chess'),shared.find(s=>s.kind==='chess')?.nodes,'hexagonal-chess')}:{})}));
    }
    if(input.scope==='home'){
      const own=context.userId?await db.selectFrom('ionScheduleAccounts').innerJoin('ionWorkspaces','ionScheduleAccounts.workspaceId','ionWorkspaces.id').select('nodes').where('userId','=',context.userId).executeTakeFirst():undefined;
      const template=merged.filter(n=>!n.removedBy&&(n.id===scheduleCalendar.root||n.calendarDate));
      const personal=scheduleCalendar.paint([...template,...(Array.isArray(own?.nodes)?own.nodes as unknown as CloudNode[]:[])],scheduleCalendar.today(new Date(),timeZone!));
      const weight=cloudTree.descendantCharacterWeights(personal).get(scheduleCalendar.root)||0;
      visible=visible.map(n=>n.id===scheduleCalendar.root?{...n,sizeCharacters:weight}:n);
    }
    if(input.scope==='home'){const prefs=context.userId?await db.selectFrom('ionHomePreferences').select('hiddenIds').where('userId','=',context.userId).executeTakeFirst():undefined;visible=homeFeatures(visible,Array.isArray(prefs?.hiddenIds)?prefs.hiddenIds.filter((s):s is string=>typeof s==='string'):[],!!context.userId);}
    if(input.action==='load')await drainCloudRefresh(row.id,version,input.scope,context.userId||0);
    return new Response(JSON.stringify({ nodes: visible, version, ...(timeZone?{timeZone}:{}), ...(context.isDev&&input.scope==='accounts'?{signedInUsers:await signedInUserCount(),signedInUsersExpireAt:await signedInUserExpiry()}:{}), workspaceId:row.id, account:input.scope==='private', scope:input.scope, canAdd:cloudPolicy.writable(input.scope,context.userId,context.owner), dev:context.isDev,owner:context.owner,userId:context.userId||undefined, undo: cloudChanges.undo(nodes.filter(n=>cloudPolicy.edit(input.scope,n,context.userId,context.owner))) } satisfies OutputType), { headers });
  } catch (error) {
    const status = error instanceof Error && "status" in error && typeof error.status === "number" ? error.status : error instanceof SyntaxError || (error && typeof error === "object" && "issues" in error) ? 400 : 503;
    if (status === 503) console.error("ION space request failed", error instanceof Error ? error.message : "Unknown error");
    return new Response(JSON.stringify({ error: status === 503 ? "Couldn’t open your cloud. Try again." : error instanceof Error && "status" in error ? error.message : "Check your word or picture and try again." }), { status, headers });
  }
}
