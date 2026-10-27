import {publicSnapshotCache} from '../helpers/publicSnapshotCache';
export async function handle(request:Request){try{
 const result=await publicSnapshotCache.read(request.url);
 return new Response(JSON.stringify(result.data),{headers:{'Content-Type':'application/json','Cache-Control':'public, max-age=5, s-maxage=30, stale-while-revalidate=30','X-ION-Snapshot':result.status}});
}catch{return new Response(JSON.stringify({error:'Opening ION. Try again shortly.'}),{status:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store','Retry-After':'2'}});}}
