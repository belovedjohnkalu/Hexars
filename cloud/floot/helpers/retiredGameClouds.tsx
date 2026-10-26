// These immutable identities were explicitly removed. Keep their registry rows
// reserved, including old per-dev presentation overrides, but never revive them.
export function isRetiredGameCloud(id:string){return /^(?:function-u[0-9]+:)?game-hexdame-(?:forfeit|draw)$/.test(id);}
export const onlineGameAction=(variant:string,action:'forfeit'|'draw')=>variant==='hexdame'||variant==='kruzno'?'online-'+action:action;
