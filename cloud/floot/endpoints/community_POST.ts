import { schema } from './community_POST.schema';
import { onlineUser } from '../helpers/gameAccess';
import { communityStore } from '../helpers/communityStore';

export async function handle(request:Request) {
  const headers={'Content-Type':'application/json','Cache-Control':'private, no-store'};
  try {
    const user=await onlineUser(request);
    const expected=request.headers.get('X-ION-Account');if(expected&&expected!==String(user.id))throw Object.assign(new Error('Your account changed. Open Community again.'),{status:401});
    const raw=await request.text();
    if(raw.length>65536)throw Object.assign(new Error('Your post is too long.'),{status:413});
    return new Response(JSON.stringify(await communityStore.write(schema.parse(JSON.parse(raw)),user.id)),{headers});
  }catch(e){
    const status=e&&typeof e==='object'&&'status'in e?Number(e.status):e&&typeof e==='object'&&'issues'in e?400:503;
    return new Response(JSON.stringify({error:status===503?'Couldn’t save. Your words are still here. Try again.':e instanceof Error?e.message:'Check your post.'}),{status,headers:{...headers,...(status===429?{'Retry-After':String('retryAfter'in Object(e)?(e as {retryAfter:number}).retryAfter:5)}:{})}});
  }
}
