import {db} from './db';
import {cloudTree} from './cloudTree';
import {functionClouds} from './functionClouds';
import type {CloudNode} from '../endpoints/cloud_POST.schema';
// Only built-in, publicly readable labels are exported. Custom/private names,
// prompt content and unpurchased variant titles never become a global catalog.
export async function sharedDisplayNames(products:{id:string;owned:boolean}[],dev:boolean){
 const allowedVariants=new Set(['glinski','hexdame',...products.filter(p=>p.owned&&p.id.startsWith('variant:')).map(p=>p.id.slice(8))]),base=new Map([...cloudTree.roots,...cloudTree.seed,...functionClouds].filter(n=>n.parentId==='ion'||['hexagonal-chess','boards','rules','engines','online','chess-history','chess-play','chess-learn'].includes(n.id)||n.id.startsWith('game-')&&[...allowedVariants].some(v=>n.id.startsWith('game-'+v+'-'))).map(n=>[n.id,n.name]));
 const rows=await db.selectFrom('ionSharedSpaces').innerJoin('ionWorkspaces','ionWorkspaces.id','ionSharedSpaces.workspaceId').select(['kind','nodes']).where('kind','in',['home','chess']).execute();
 for(const row of rows.sort((a,b)=>a.kind==='home'?1:b.kind==='home'?-1:0))for(const n of (Array.isArray(row.nodes)?row.nodes:[])as unknown as CloudNode[])if(!n.removedBy&&base.has(n.id))base.set(n.id,n.name);
 return Object.fromEntries(base);
}
