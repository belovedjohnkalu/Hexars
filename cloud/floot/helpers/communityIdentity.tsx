// Public discussion UUIDs must never share the authoritative cloud namespace.
export const communityIdentity = {
  topic: (id:string) => 'chess-topic:'+id,
  reply: (id:string) => 'chess-reply:'+id,
};
