import {identifierSegment} from './cloudIdentifiers';
export const normalizeIL=(value:string)=>value.trim().toUpperCase();
export const validIL=(value:string)=>/^IL(?:[A-Z]*[0-9])+$/.test(normalizeIL(value));
export const ilURL=(value:string)=>'/?'+new URLSearchParams({il:normalizeIL(value)});
function ordinal(segment:string){let n=0n;for(const c of segment.slice(0,-1))n=n*26n+BigInt(c.charCodeAt(0)-64);return n*10n+BigInt(segment.at(-1)!);}
// Every digit closes a segment; the first identifies the dev account and the
// next identifies its root. The displayed root is one-based, without padding.
export function decodeIL(value:string):{namespace:string;label:string;root?:number}|null{
 const text=normalizeIL(value);if(!validIL(text))return null;const parts=text.slice(2).match(/[A-Z]*[0-9]/g)!;
 const namespace=ordinal(parts[0]);if(namespace>9223372036854775807n)return null;
 if(parts.length===1)return{namespace:String(namespace),label:'IL'};
 const root=ordinal(parts[1]);if(root<1n||root>BigInt(Number.MAX_SAFE_INTEGER))return null;
 return{namespace:String(namespace),label:'IL'+identifierSegment(Number(root-1n))+parts.slice(2).join(''),root:Number(root-1n)};
}
