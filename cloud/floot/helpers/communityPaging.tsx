import type { CommunityTopic, CommunityReply } from '../endpoints/community_POST.schema';
type Cursor = { date: string; id: string; pinned?: boolean };
function encode(value: Cursor) { return encodeURIComponent(JSON.stringify(value)); }
function decode(value?: string): Cursor | undefined {
  if (!value) return;
  try {
    const raw = JSON.parse(decodeURIComponent(value));
    if (!raw || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(raw.id) || !Number.isFinite(Date.parse(raw.date)) || raw.pinned !== undefined && typeof raw.pinned !== 'boolean') throw Error();
    return { id: raw.id, date: raw.date, ...(typeof raw.pinned === 'boolean' ? { pinned: raw.pinned } : {}) };
  } catch { throw Object.assign(new Error('Open the first page again.'), { status: 400 }); }
}
function patchTopics(topics: CommunityTopic[], event: { kind?: 'topic'|'reply'; topic?: CommunityTopic; removed?: string }, limit = 5) {
  if(event.kind==='reply')return topics;
  const next = topics.filter(t => t.id !== event.removed && t.id !== event.topic?.id);
  if (event.topic && event.topic.visibility === 'visible') next.push(event.topic);
  return next.sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)).slice(0, limit);
}
function patchReplies(replies: CommunityReply[], event: { reply?: CommunityReply; removed?: string }, limit = 4) {
  const next = replies.filter(r => r.id !== event.removed && r.id !== event.reply?.id);
  if (event.reply && event.reply.visibility === 'visible') next.push(event.reply);
  return next.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)).slice(0, limit);
}
export const communityPaging = { encode, decode, patchTopics, patchReplies };
