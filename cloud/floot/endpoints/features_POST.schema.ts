import { z } from 'zod';
export const schema=z.object({action:z.enum(['hide','restore']),id:z.string().min(1).max(100)});
export async function postFeatures(input:z.infer<typeof schema>){
 const response=await fetch('/_api/features',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(schema.parse(input))});
 const value=await response.json();if(!response.ok)throw new Error(value.error||'Couldn’t update Home. Try again.');if(typeof window!=='undefined')window.dispatchEvent(new Event('ion.home-changed'));return value as {ok:true};
}
