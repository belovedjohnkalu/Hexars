import { cloudService } from './cloudService';
import { timeLedger } from './timeLedger';
import type { PublicBootstrap } from '../endpoints/public_bootstrap_GET.schema';

export async function buildPublicBootstrap(origin:string):Promise<PublicBootstrap> {
  const time=await timeLedger.snapshot(null);
  const load=async(scope:'home'|'chess')=>{
    const response=await cloudService(new Request(new URL('/_api/cloud',origin),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'load',scope,workspaceId:'00000000-0000-4000-8000-000000000069',accessToken:'0'.repeat(64),timeZone:'UTC'})}),time);
    if(!response.ok)throw new Error('Public view unavailable');
    const value=await response.json();if(value.userId||value.dev||value.canAdd)throw new Error('Public view identity mismatch');return value;
  };
  const [home,chess]=await Promise.all([load('home'),load('chess')]);
  return{home,chess,time};
}
