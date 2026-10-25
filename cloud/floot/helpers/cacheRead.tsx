import {deviceData} from './deviceData';
export const transientFailure=(error:unknown)=>error instanceof TypeError||error instanceof SyntaxError||!!error&&typeof error==='object'&&'status'in error&&[502,503,504].includes(Number(error.status));
export async function cacheRead<T>(name:string,load:()=>Promise<T>):Promise<T>{
 const owner=deviceData.identity();try{const value=await load();if(owner&&owner===deviceData.identity())void deviceData.put(owner,name,value);return value;}catch(e){if(owner&&owner===deviceData.identity()&&transientFailure(e)){const cached=await deviceData.get<T>(owner,name);if(owner===deviceData.identity()&&cached!==undefined)return cached&&typeof cached==='object'?{...cached,offline:true}:cached;}throw e;}
}
