import type { PublicBootstrap } from '../endpoints/public_bootstrap_GET.schema';
let revision='initial',cached:{revision:string;until:number;value:PublicBootstrap}|undefined,pending:{revision:string;promise:Promise<PublicBootstrap>}|undefined;
async function read(signal?:AbortSignal):Promise<PublicBootstrap> {
  signal?.throwIfAborted();const own=revision;
  if(cached?.revision===own&&cached.until>Date.now())return cached.value;
  if(pending?.revision!==own){
    const promise=fetch('/_api/public_bootstrap?v='+encodeURIComponent(own),{credentials:'omit',signal:AbortSignal.timeout(20000)}).then(async response=>{
      const value=await response.json();if(!response.ok)throw Object.assign(new Error(value.error||'Couldn’t open ION.'),{status:response.status});
      if(value.time?.userId!==null||value.home?.userId||value.chess?.userId||value.home?.dev||value.chess?.dev)throw new Error('Public view mismatch');
      if(revision===own)cached={revision:own,until:Date.now()+15000,value};return value as PublicBootstrap;
    }).finally(()=>{if(pending?.revision===own)pending=undefined;});
    pending={revision:own,promise};
  }
  const value=await pending.promise;signal?.throwIfAborted();return value;
}
function changed(version?:number) { revision=version?'c'+version:'t'+Math.floor(Date.now()/15000);cached=undefined; }
export const publicBootstrap={read,changed};
