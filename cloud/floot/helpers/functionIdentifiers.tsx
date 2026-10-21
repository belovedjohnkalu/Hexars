import { db } from './db';
import { cloudIdentifierStore } from './cloudIdentifierStore';
import { namespaceIdentifier } from './cloudIdentifiers';
import { cloudTree } from './cloudTree';
import { functionClouds } from './functionClouds';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
export async function functionIdentifiers(userId:number,extra:CloudNode[]=[]):Promise<Record<string,string>|undefined>{
 const dev=await db.selectFrom('ionDevAccounts').select('devNumber').where('userId','=',userId).executeTakeFirst();if(!dev)return undefined;
 const definitions=[...functionClouds,...extra],ids=new Set(definitions.map(n=>n.id)),key=(id:string)=>ids.has(id)?'function-u'+userId+':'+id:id;
 const stored=await cloudIdentifierStore([...cloudTree.forScope('home').filter(n=>!ids.has(n.id)),...cloudTree.forScope('chess'),...definitions.map(n=>({...n,id:key(n.id),parentId:n.parentId?key(n.parentId):null}))],Number(dev.devNumber));
 return Object.fromEntries(definitions.map(n=>[n.id,namespaceIdentifier(stored.get(key(n.id))?.label,Number(dev.devNumber))]).filter((entry):entry is [string,string]=>!!entry[1]));
}
