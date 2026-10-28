import type {CloudNode,CloudScope,OutputType} from '../endpoints/cloud_POST.schema';
import type {ILItem} from '../endpoints/il_POST.schema';
import {decodeIL,normalizeIL} from './cloudIL';
import {cloudURL} from './cloudRoutes';
import {chessVariants} from './chessVariants';
import {dynamicTimeId} from './dynamicTimeId';
import {scheduleCalendar} from './scheduleCalendar';
const scopes:CloudScope[]=['public','chess','home','private','accounts','schedule'];
export function cloudILLocation(node:CloudNode,scope:CloudScope):string{
 if(node.lockedItem)return '/?'+new URLSearchParams({cloud:'time-product',space:'home',item:node.lockedItem});
 if(scope==='home'&&(node.id===scheduleCalendar.root||node.calendarDate))return cloudURL(node.id,'schedule');
 if(node.href?.startsWith('/')&&!node.href.startsWith('//'))return node.href;
 if(node.destination==='saved-game'&&node.savedGameId&&node.variant)return '/'+node.variant+'?'+new URLSearchParams({mode:'saved',game:node.savedGameId,...(node.shareId?{shareId:node.shareId}:{})});
 if(node.destination==='space'&&node.space)return cloudURL(node.space==='chess'?'hexagonal-chess':node.space==='home'?'ion':node.space,node.space);
 if(node.id==='hexagonal-chess')return cloudURL(node.id,'chess');
 if(node.id==='public'||node.id==='private')return cloudURL(node.id,node.id);
 if(chessVariants.isId(node.destination))return '/'+node.destination+'?mode=friend';
 return cloudURL(node.id,scope);
}
export async function resolveCloudIL(il:string,deps:{lookup:(label:string,namespace:string)=>Promise<string[]>;load:(scope:CloudScope,id?:string)=>Promise<OutputType|null>;locations?:(ids:string[])=>Promise<CloudScope[]>;homeNamespace:()=>Promise<string|undefined>;viewerNamespace?:()=>Promise<string|undefined>}):Promise<ILItem|null>{
 const decoded=decodeIL(il);if(!decoded)return null;
 if(decoded.label==='IL')return await deps.homeNamespace()===decoded.namespace?{id:'ion',name:'ION',il:normalizeIL(il),scope:'home',url:'/'}:null;
 const ids=new Set(await deps.lookup(decoded.label,decoded.namespace));if(!ids.size)return null;
 // Shared root IDs must not silently alias another dev account’s personal page.
 if(ids.has('private')||ids.has('accounts')){const viewer=await deps.viewerNamespace?.();if(viewer!==decoded.namespace)return null;}
 const primary:CloudScope=decoded.root===0?'chess':decoded.root===1?'public':decoded.root===2?'private':decoded.root===4?'accounts':'home';
 const locationScopes=deps.locations?await deps.locations([...ids]):scopes;
 const dynamic=[...ids].find(id=>/^function-u\d+:/.test(id))?.replace(/^function-u\d+:/,'')||[...ids][0];
 const hint:CloudScope=dynamicTimeId(dynamic)?'accounts':dynamic.startsWith('account-')?'accounts':[...ids].some(id=>/^function-u\d+:/.test(id))?'home':primary;
 const candidates=deps.locations?(locationScopes.length?locationScopes:[hint]):locationScopes;
 const ordered=[primary,...scopes.filter(scope=>scope!==primary)].filter(scope=>candidates.includes(scope));
 for(const scope of ordered){const view=await deps.load(scope,[...ids][0]),node=view?.nodes.find(n=>!n.removedBy&&(ids.has(n.id)||!!view.userId&&ids.has('function-u'+view.userId+':'+n.id)));if(node)return{id:node.id,name:node.name,il:normalizeIL(il),scope,url:cloudILLocation(node,scope)};}
 return null;
}
