import { z } from "zod";
export const schema=z.discriminatedUnion('action',[z.object({action:z.literal('list')}),z.object({action:z.literal('remember')}),z.object({action:z.literal('switch'),userId:z.number().int().positive()}),z.object({action:z.literal('forget'),userId:z.number().int().positive()})]);
export type OutputType={accounts:Array<{id:number;email:string;displayName:string}>;switched?:boolean};
export async function postAccounts(input:z.infer<typeof schema>):Promise<OutputType>{const response=await fetch('/_api/auth/accounts',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(schema.parse(input))});const data=await response.json();if(!response.ok)throw new Error(data.error||'Couldn’t open saved accounts.');return data;}
