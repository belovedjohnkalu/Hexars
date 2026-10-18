import type { CloudScope,CloudNode } from '../endpoints/cloud_POST.schema';
const scopes:CloudScope[]=['home','public','private','chess','accounts'];
export function cloudScope(params:URLSearchParams):CloudScope{const scope=params.get('space') as CloudScope,id=params.get('cloud');return scopes.includes(scope)?scope:!id?'home':id==='accounts'?'accounts':id==='controls'||id==='ion'?'home':id==='public'?'public':id==='private'||/^[a-f0-9-]{36}$/.test(id)?'private':'chess';}
export function cloudURL(id:string|null,scope:CloudScope){return !id||id==='ion'?'/':'/?'+new URLSearchParams({cloud:id,space:scope});}
export function safeCloudReturn(value:string|null){return value?.startsWith('/?')||value==='/'?value:'/';}
export function controlsURL(node:CloudNode,scope:CloudScope,origin:string){return '/?'+new URLSearchParams({cloud:'controls',space:'home',selected:node.id,source:scope,origin});}
