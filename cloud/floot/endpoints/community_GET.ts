import { schema } from './community_GET.schema';
import { communityStore } from '../helpers/communityStore';

export async function handle(request:Request) {
  try {
    const url=new URL(request.url);
    if(url.search.length>1200)throw Object.assign(new Error('Open the first page again.'),{status:400});
    const input=schema.parse(Object.fromEntries(url.searchParams));
    const result=input.topicId?await communityStore.thread(input.topicId,input.cursor,input.replyId):await communityStore.feed(input.roomId!,input.cursor);
    // Only identity-free public summaries are shared-cacheable. Open discussions
    // reconcile current moderation on every read and never enter a shared cache.
    return new Response(JSON.stringify(result),{headers:{'Content-Type':'application/json','Cache-Control':input.topicId?'no-store':'public, max-age=3, s-maxage=15, stale-while-revalidate=15'}});
  }catch(e){
    const status=e&&typeof e==='object'&&'status'in e?Number(e.status):e&&typeof e==='object'&&'issues'in e?400:503;
    return new Response(JSON.stringify({error:status===503?'Community is busy. Try again shortly.':e instanceof Error?e.message:'Open Community again.'}),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...(status===503?{'Retry-After':'2'}:{})}});
  }
}
