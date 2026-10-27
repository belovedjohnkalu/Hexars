import { z } from 'zod';
import type { CommunityResult } from './community_POST.schema';
export const schema = z.object({ roomId: z.string().min(1).max(120).optional(), topicId: z.string().uuid().optional(), replyId: z.string().uuid().optional(), cursor: z.string().max(400).optional() }).refine(value => (!!value.roomId !== !!value.topicId)&&(!value.replyId||!!value.topicId));
export type CommunityQuery = z.infer<typeof schema>;
export async function getCommunity(input: CommunityQuery, signal?: AbortSignal): Promise<CommunityResult> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(schema.parse(input))) if (value) query.set(key, value);
  // The public read route never uses identity or returns private follow/report data.
  const response = await fetch('/_api/community?' + query, { signal, credentials: 'omit' });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error || 'Couldn’t open Community.'), { status: response.status });
  return data;
}
