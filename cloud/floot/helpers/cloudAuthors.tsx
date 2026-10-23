import { z } from 'zod';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
export function cloudAuthorName(value:string|undefined){const name=value?.trim();return name&&!z.string().email().safeParse(name).success?name:'Member';}
export function attachCloudAuthors(nodes:CloudNode[],names:Map<number,string>):CloudNode[]{return nodes.map(n=>({...n,...(n.createdBy?{author:{name:cloudAuthorName(names.get(n.createdBy))}}:n.system?{author:{name:'ION'}}:{})}));}
