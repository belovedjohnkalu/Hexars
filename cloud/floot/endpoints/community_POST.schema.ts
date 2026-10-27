import { z } from 'zod';

const text = z.string().trim().min(1).max(12000).refine(value=>!value.includes('\0'),'This post contains an unsupported character.');
const target = { topicId: z.string().uuid().toLowerCase(), replyId: z.string().uuid().toLowerCase().optional() };
export const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('topic'), id: z.string().uuid().toLowerCase(), roomId: z.string().min(1).max(120), title: z.string().trim().min(1).max(240).refine(value=>!value.includes('\0'),'This title contains an unsupported character.'), body: text }).strict(),
  z.object({ action: z.literal('reply'), id: z.string().uuid().toLowerCase(), topicId: z.string().uuid().toLowerCase(), body: text }).strict(),
  z.object({ action: z.literal('edit'), ...target, version: z.number().int().nonnegative(), title: z.string().trim().min(1).max(240).refine(value=>!value.includes('\0'),'This title contains an unsupported character.').optional(), body: text }).strict(),
  z.object({ action: z.literal('remove'), ...target, version: z.number().int().nonnegative() }).strict(),
  z.object({ action: z.literal('restore'), ...target, version: z.number().int().nonnegative(), undoToken:z.string().min(1).max(2000) }).strict(),
  z.object({ action: z.literal('moderate'), ...target, version: z.number().int().nonnegative(), visibility: z.enum(['visible','hidden','deleted']).optional(), pinned: z.boolean().optional(), locked: z.boolean().optional(), roomId: z.string().min(1).max(120).optional() }).strict(),
  z.object({ action: z.literal('follow'), topicId: z.string().uuid().toLowerCase(), value: z.boolean() }).strict(),
  z.object({ action: z.literal('watch'), topicId: z.string().uuid().toLowerCase() }).strict(),
  z.object({ action: z.literal('inspect'), topicId: z.string().uuid().toLowerCase(), replyId: z.string().uuid().toLowerCase().optional() }).strict(),
  z.object({ action: z.literal('following'), cursor: z.string().max(400).optional() }).strict(),
  z.object({ action: z.literal('report'), id: z.string().uuid().toLowerCase(), ...target, reason: z.enum(['spam','abuse','unsafe','other']) }).strict(),
  z.object({ action: z.literal('settings') }).strict(),
  z.object({ action: z.literal('configure'), communityEnabled: z.boolean(), slowSeconds: z.number().int().min(2).max(120), searchSlots: z.number().int().min(1).max(128), rulesSlots: z.number().int().min(1).max(256) }).strict(),
  z.object({ action: z.literal('reports') }).strict(),
  z.object({ action: z.literal('insights') }).strict(),
  z.object({ action: z.literal('resolve'), id: z.string().uuid().toLowerCase() }).strict(),
]);
export type CommunityInput = z.infer<typeof schema>;
export type CommunityAuthor = { id: number; name: string };
export type CommunityTopic = { id: string; roomId: string; title: string; body?: string; author: CommunityAuthor; createdAt: string; version: number; replies: number; characters: number; pinned: boolean; locked: boolean; visibility: 'visible'|'hidden'|'deleted'; il?: string };
export type CommunityReply = { id: string; topicId: string; body: string; author: CommunityAuthor; createdAt: string; version: number; visibility: 'visible'|'hidden'|'deleted'; il?: string };
export type CommunitySettings = { communityEnabled: boolean; slowSeconds: number; searchSlots: number; rulesSlots: number };
export type CommunityUndo={topicId:string;replyId?:string;version:number;undoToken:string;expiresAt:number};
export type CommunityResult = { undo?:CommunityUndo; topics?: CommunityTopic[]; topic?: CommunityTopic; reply?:CommunityReply; replies?: CommunityReply[]; next?: string | null; following?: boolean; settings?: CommunitySettings; insights?:{playersToday:number;eligible:number;returned:number;returnRate:number|null}; reports?: Array<{ id: string; topicId: string; replyId: string|null; title: string; reason: string; createdAt: string }>; ok?: boolean };

export async function postCommunity(input: CommunityInput, signal?: AbortSignal, expectedUserId?:number|null): Promise<CommunityResult> {
  const response = await fetch('/_api/community', { method: 'POST', headers: { 'Content-Type': 'application/json',...(expectedUserId?{'X-ION-Account':String(expectedUserId)}:{}) }, body: JSON.stringify(schema.parse(input)), signal });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error || 'Couldn’t update the discussion.'), { status: response.status });
  return data;
}
