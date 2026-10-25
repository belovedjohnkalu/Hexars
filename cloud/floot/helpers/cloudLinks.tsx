import { z } from 'zod';
import {validIL,normalizeIL,ilURL} from './cloudIL';
export const redirectSchema=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('il'),il:z.string().max(4096).transform(normalizeIL).refine(validIL,'Enter a valid IL.')}).strict(),
 z.object({kind:z.literal('cloud'),id:z.string().min(1).max(120),scope:z.enum(['home','public','private','chess','accounts','schedule'])}).strict(),
 z.object({kind:z.literal('url'),url:z.string().trim().url().max(4096).refine(value=>{try{return ['https:','http:'].includes(new URL(value).protocol);}catch{return false;}},'Use an http or https address.')}).strict()
]);
export type CloudRedirect=z.infer<typeof redirectSchema>;
export function redirectURL(target:CloudRedirect){return target.kind==='il'?ilURL(target.il):target.kind==='url'?target.url:'/?'+new URLSearchParams({cloud:target.id,space:target.scope});}
export function linkedLabelParts(node:{name:string;wordRedirect?:{words:number[];target:CloudRedirect}}){const selected=new Set(node.wordRedirect?.words||[]);let ordinal=0;return node.name.split(/(\s+)/).filter(Boolean).map(text=>({text,linked:/\S/.test(text)&&selected.has(ordinal++),word:/\S/.test(text)}));}
