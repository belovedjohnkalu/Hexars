import type { CommunityUndo } from '../endpoints/community_POST.schema';
const values=new Map<number,CommunityUndo>(),timers=new Map<number,ReturnType<typeof setTimeout>>(),listeners=new Set<()=>void>();
const announce=()=>listeners.forEach(listener=>listener());
function clear(userId:number){clearTimeout(timers.get(userId));timers.delete(userId);values.delete(userId);announce();}
// Short-lived, account-bound undo proof stays in memory, never persistent storage.
function put(userId:number,undo:CommunityUndo){clearTimeout(timers.get(userId));values.set(userId,undo);timers.set(userId,setTimeout(()=>clear(userId),Math.max(0,undo.expiresAt-Date.now())));announce();}
export const communityUndo={put,clear,get:(userId:number|null)=>{const value=userId?values.get(userId):undefined;return value&&value.expiresAt>Date.now()?value:undefined;},subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};}};
