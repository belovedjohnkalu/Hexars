import type {CloudNode} from '../endpoints/cloud_POST.schema';
export function renamedSharedRoot(nodes:CloudNode[],name:string,fallback?:CloudNode){const source=!nodes.some(n=>n.id==='hexagonal-chess')&&fallback?[...nodes,fallback]:nodes;return source.map(n=>n.id==='hexagonal-chess'?{...n,name,contentEdits:[...new Set([...(n.contentEdits||[]),'name' as const])]}:n);}
